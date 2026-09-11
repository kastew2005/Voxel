import THREE from "../three.js";
import {Chunk} from "./Chunk.js";
import {Generator} from "./Generator.js";
import {BLOCK,INFO} from "./Block.js";

/*
 * Voxel Survival Universe 43
 * Performance pass:
 * - one draw group per block/material instead of one group per visible face;
 * - deterministic 64x64 nearest-neighbour textures generated once and cached;
 * - texture detail is procedural, so there are no external texture requests;
 * - chunk rebuilds stay inside a small frame budget.
 */
export class World{
  constructor(scene,cfg){
    this.scene=scene;this.cfg=cfg;this.chunks=new Map();this.meshes=new Map();
    this.gen=new Generator(cfg.WORLD.SEED);this.generationBusy=false;this.lastCenter="";
    this.changes=new Map();this._textureCache=new Map();
    this.materials=this.makeMaterials();this.workers=[];this.workerSeq=0;this.workerJobs=new Map();this.workerCursor=0;
    this.meshQueue=[];this.meshQueued=new Set();this.meshBuilding=false;this.workerStarted=false;
  }
  initWorker(){if(this.workerStarted)return;this.workerStarted=true;try{const cores=navigator.hardwareConcurrency||2;const count=Math.max(1,Math.min(2,cores>4?2:1));for(let i=0;i<count;i++){const w=new Worker(new URL("./WorldWorker.js",import.meta.url),{type:"module"});w.onmessage=e=>{const job=this.workerJobs.get(e.data.id);if(!job)return;this.workerJobs.delete(e.data.id);if(e.data.error)job.reject(new Error(e.data.error));else job.resolve(new Uint8Array(e.data.buffer));};w.onerror=e=>{console.warn("World worker:",e.message);for(const [id,job] of this.workerJobs){job.reject(new Error("Worker failed"));this.workerJobs.delete(id)}};this.workers.push(w)}}catch(e){this.workers=[]}}
  key(x,z){return `${x},${z}`}

  // Guaranteed local 64x64 voxel textures.  No image/CDN is required for the world.
  // This avoids Safari/GitHub Pages image-decoding failures entirely.
  texture(file,base,accent=null,kind='noise'){
    if(this._textureCache.has(file)) return this._textureCache.get(file);
    const size=64,data=new Uint8Array(size*size*4);let seed=0;
    for(let i=0;i<file.length;i++)seed=(seed*31+file.charCodeAt(i))|0;
    const rnd=()=>{seed|=0;seed=(seed*1664525+1013904223)|0;return (seed>>>0)/4294967296};
    const hex=v=>{v=v.replace('#','');return[parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4,6),16)]};
    const b=hex(base),a=accent?hex(accent):null;
    // Classic voxel texture language: muted palette, hard pixel clusters, almost no gradients.
    const patch=new Int8Array(16*16);for(let py=0;py<16;py++)for(let px=0;px<16;px++)patch[py*16+px]=Math.round((rnd()-.5)*16);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=(y*size+x)*4,px=x>>2,py=y>>2;let v=patch[py*16+px],r=b[0]+v,g=b[1]+v,bl=b[2]+v;
      if(kind==='grass'){if(y<10){r-=4;g+=8;bl-=2}if(rnd()<.035){r+=10;g+=13;bl+=4}}
      if(kind==='dirt'){if(rnd()<.045){r-=14;g-=9;bl-=5}}
      if(kind==='stone'){if(rnd()<.04){r+=12;g+=11;bl+=9}if(rnd()<.02){r-=14;g-=13;bl-=11}}
      if(kind==='sand'&&rnd()<.055){r+=8;g+=7;bl+=3}
      if(kind==='cobble'){const gx=Math.floor(x/8),gy=Math.floor(y/8);const seam=(x%8===0||y%8===0);if(seam){r-=24;g-=23;bl-=21}else{const q=((gx*17+gy*31+seed)>>>0)%4;r+=q*3;g+=q*3;bl+=q*3}}
      if(kind==='wood'){const grain=Math.sin(x*.38+(y%10)*.25);r+=grain*7;g+=grain*5;bl+=grain*3;if(rnd()<.018){r-=24;g-=16;bl-=9}}
      if(kind==='leaves'){if(rnd()<.13){r-=16;g-=14;bl-=8}}
      if(kind==='brick'){const mortar=(x%16<2)||(y%8<2);if(mortar){r-=30;g-=28;bl-=25}}
      if(kind==='ore'&&a&&rnd()<.06){r=a[0];g=a[1];bl=a[2]}
      if(kind==='snow'&&rnd()<.04){r-=18;g-=17;bl-=15}
      if(kind==='glass'){r=Math.max(r,145);g=Math.max(g,180);bl=Math.max(bl,195)}
      r=Math.round(Math.max(0,Math.min(255,r))/8)*8;g=Math.round(Math.max(0,Math.min(255,g))/8)*8;bl=Math.round(Math.max(0,Math.min(255,bl))/8)*8;
      data[i]=r;data[i+1]=g;data[i+2]=bl;data[i+3]=kind==='glass'?150:255;
    }
    const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat,THREE.UnsignedByteType);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.wrapS=THREE.ClampToEdgeWrapping;t.wrapT=THREE.ClampToEdgeWrapping;t.flipY=false;t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;this._textureCache.set(file,t);return t;
  }
  mat(color,file,opts={}){
    const presets={
      grass:['#667c43','#87975a','grass'],dirt:['#76583b',null,'dirt'],stone:['#77756f',null,'stone'],sand:['#c8b78a',null,'sand'],gravel:['#77756f',null,'cobble'],wood_side:['#765b3d',null,'wood'],wood_top:['#9a7a50',null,'wood'],leaves:['#536f3e','#718a52','leaves'],planks:['#92714a',null,'wood'],brick:['#8d5b50',null,'brick'],glass:['#a9c7c7',null,'glass'],water:['#587f91',null,'noise'],coal:['#383a38',null,'ore'],iron:['#77766f','#aaa79b','ore'],copper:['#77746b','#a36f50','ore'],furnace:['#696965',null,'stone'],chest:['#765735',null,'wood'],lantern:['#9b8050','#d0b36d','ore'],campfire:['#875b42','#c18a48','ore'],moss:['#5c7047',null,'grass'],glowstone:['#b4a36a','#d5c78d','ore'],cobble:['#686762',null,'cobble'],snow:['#d7dedb',null,'snow'],clay:['#96786d',null,'dirt'],farmland:['#664c39',null,'dirt'],wheat:['#87905a','#b0a765','grass'],bedrock:['#292a29',null,'cobble']
    };
    const q=presets[file]||[color,null,'noise'];return new THREE.MeshLambertMaterial({color:0xffffff,map:this.texture(file,q[0],q[1],q[2]),...opts,side:THREE.DoubleSide});
  }
  makeMaterials(){
    const M={}, add=(id,color,file,opts={})=>{M[id]=this.mat(color,file,opts)};
    add(BLOCK.GRASS,'#5b913b','grass');add(BLOCK.DIRT,'#79502d','dirt');add(BLOCK.STONE,'#777777','stone');add(BLOCK.SAND,'#d8c17a','sand');add(BLOCK.GRAVEL,'#77736b','gravel');add(BLOCK.LOG,'#7d542f','wood_side');add(BLOCK.LEAVES,'#3f8e3a','leaves',{transparent:true,opacity:.96});add(BLOCK.PLANKS,'#a56f3f','planks');add(BLOCK.GLASS,'#b9e8f5','glass',{transparent:true,opacity:.55});add(BLOCK.BRICK,'#9c4d40','brick');add(BLOCK.WATER,'#3973c9','water',{transparent:true,opacity:.55});add(BLOCK.COAL,'#303030','coal');add(BLOCK.IRON,'#777777','iron');add(BLOCK.COPPER,'#777777','copper');add(BLOCK.FURNACE,'#777777','furnace');add(BLOCK.CHEST,'#9a5b28','chest');add(BLOCK.LANTERN,'#d79b35','lantern');add(BLOCK.CAMPFIRE,'#d65d24','campfire');add(BLOCK.MOSS,'#4f8744','moss');add(BLOCK.GLOWSTONE,'#e7c85d','glowstone');add(BLOCK.COBBLE,'#696969','cobble');add(BLOCK.SNOW,'#e9f2f4','snow');add(BLOCK.CLAY,'#aa7667','clay');add(BLOCK.FARMLAND,'#6b452c','farmland');add(BLOCK.BED,'#c9c1b5','bed');add(BLOCK.WHEAT,'#7f9a39','wheat',{transparent:true,opacity:.95});add(BLOCK.BEDROCK,'#171717','bedrock');
    return M;
  }
  applyChanges(c){const s=c.size;for(const [k,b] of this.changes){const [x,y,z]=k.split(",").map(Number);if(Math.floor(x/s)===c.cx&&Math.floor(z/s)===c.cz)c.set(((x%s)+s)%s,y,((z%s)+s)%s,b)}}
  async generateAround(px,pz){if(!this.workerStarted)this.initWorker();const s=this.cfg.WORLD.CHUNK_SIZE,r=this.cfg.WORLD.RENDER_DISTANCE,cx=Math.floor(px/s),cz=Math.floor(pz/s),center=this.key(cx,cz);if(this.generationBusy||this.lastCenter===center)return false;this.lastCenter=center;this.generationBusy=true;const jobs=[];for(let x=-r;x<=r;x++)for(let z=-r;z<=r;z++)if(x*x+z*z<=r*r&&!this.chunks.has(this.key(cx+x,cz+z)))jobs.push([cx+x,cz+z]);jobs.sort((a,b)=>(a[0]-cx)**2+(a[1]-cz)**2-(b[0]-cx)**2-(b[1]-cz)**2);this.generationProgress={done:0,total:jobs.length,created:0};try{const concurrency=Math.max(1,Math.min(this.workers.length||1,this.cfg.QUALITY?.tier==='low'?1:2));for(let i=0;i<jobs.length;i+=concurrency){const batch=jobs.slice(i,i+concurrency);await Promise.all(batch.map(([x,z])=>Promise.resolve(this.generateChunk(x,z,true)).then(()=>{this.generationProgress.done++;this.generationProgress.created++}).catch(err=>{this.generationProgress.done++;console.error('Chunk generation failed',x,z,err)})));await new Promise(requestAnimationFrame)}this.unloadFar(cx,cz,r+1);return true}finally{this.generationBusy=false;this.generationProgress=null}}
  generateChunk(cx,cz,useWorker=true){const s=this.cfg.WORLD.CHUNK_SIZE,h=this.cfg.WORLD.HEIGHT;if(useWorker&&this.workers.length){const id=++this.workerSeq,w=this.workers[this.workerCursor++%this.workers.length];return new Promise((resolve,reject)=>{let settled=false;const finishFallback=()=>{if(settled)return;settled=true;this.workerJobs.delete(id);try{const c=this.generateChunk(cx,cz,false);resolve(c)}catch(e){reject(e)}};const timer=setTimeout(finishFallback,3500);this.workerJobs.set(id,{resolve:blocks=>{if(settled)return;settled=true;clearTimeout(timer);const c=new Chunk(cx,cz,s,h);c.blocks.set(blocks);this.applyChanges(c);this.chunks.set(this.key(cx,cz),c);this.queueRebuild(c);this.rebuildAt(cx-1,cz);this.rebuildAt(cx+1,cz);this.rebuildAt(cx,cz-1);this.rebuildAt(cx,cz+1);resolve(c)},reject:()=>{clearTimeout(timer);finishFallback()}});try{w.postMessage({id,seed:this.cfg.WORLD.SEED,cx,cz,size:s,height:h,seaLevel:this.cfg.WORLD.SEA_LEVEL})}catch(e){clearTimeout(timer);finishFallback()}})}
    const c=new Chunk(cx,cz,s,h);for(let x=0;x<s;x++)for(let z=0;z<s;z++){const wx=cx*s+x,wz=cz*s+z,top=this.gen.height(wx,wz);for(let y=0;y<h;y++)c.set(x,y,z,this.gen.getWithHeight(wx,y,wz,top,this.cfg.WORLD.SEA_LEVEL));if(top>=this.cfg.WORLD.SEA_LEVEL+2&&this.gen.biome(wx,wz,top)==='forest'&&((wx*73856093^wz*19349663^this.cfg.WORLD.SEED)>>>0)%100<7)this.gen.tree(wx,top+1,wz,{getBlock:(a,b,d)=>{const lx=a-cx*s,lz=d-cz*s;return (lx>=0&&lx<s&&lz>=0&&lz<s&&b>=0&&b<h)?c.get(lx,b,lz):BLOCK.AIR},setBlock:(a,b,d,v)=>{const lx=a-cx*s,lz=d-cz*s;if(lx>=0&&lx<s&&lz>=0&&lz<s&&b>=0&&b<h)c.set(lx,b,lz,v)}}); }this.applyChanges(c);this.chunks.set(this.key(cx,cz),c);this.queueRebuild(c);this.rebuildAt(cx-1,cz);this.rebuildAt(cx+1,cz);this.rebuildAt(cx,cz-1);this.rebuildAt(cx,cz+1);return c;}
  getBlock(x,y,z){if(y<0||y>=this.cfg.WORLD.HEIGHT)return BLOCK.AIR;const ck=`${x|0},${y|0},${z|0}`;if(this.changes.has(ck))return this.changes.get(ck);const s=this.cfg.WORLD.CHUNK_SIZE,cx=Math.floor(x/s),cz=Math.floor(z/s),c=this.chunks.get(this.key(cx,cz));return c?c.get(((x%s)+s)%s,y,((z%s)+s)%s):BLOCK.AIR}
  setBlock(x,y,z,b){if(y<0||y>=this.cfg.WORLD.HEIGHT)return false;const s=this.cfg.WORLD.CHUNK_SIZE,cx=Math.floor(x/s),cz=Math.floor(z/s),c=this.chunks.get(this.key(cx,cz));if(!c)return false;const lx=((x%s)+s)%s,lz=((z%s)+s)%s;c.set(lx,y,lz,b);this.changes.set(`${x|0},${y|0},${z|0}`,b);this.queueRebuild(c);if(lx===0)this.rebuildAt(cx-1,cz);if(lx===s-1)this.rebuildAt(cx+1,cz);if(lz===0)this.rebuildAt(cx,cz-1);if(lz===s-1)this.rebuildAt(cx,cz+1);return true}
  rebuildAt(cx,cz){const c=this.chunks.get(this.key(cx,cz));if(c)this.queueRebuild(c)}
  queueRebuild(c){if(!c)return;const k=this.key(c.cx,c.cz);if(this.meshQueued.has(k))return;this.meshQueued.add(k);this.meshQueue.push(c)}
  processMeshQueue(budgetMs=3){
    if(this.meshBuilding||!this.meshQueue.length)return;
    this.meshBuilding=true;
    const start=performance.now();
    try{
      while(this.meshQueue.length&&performance.now()-start<budgetMs){
        const c=this.meshQueue.shift();
        this.meshQueued.delete(this.key(c.cx,c.cz));
        if(this.chunks.get(this.key(c.cx,c.cz))!==c) continue;
        try{this.rebuildChunk(c)}catch(err){
          console.error('Chunk render failed',c.cx,c.cz,err);
          // Leave the chunk in memory and retry once on the next frame.
          c._renderFailures=(c._renderFailures||0)+1;
          if(c._renderFailures<3)this.queueRebuild(c);
        }
      }
    }finally{this.meshBuilding=false}
  }

  rebuildChunk(c){
    const key=this.key(c.cx,c.cz);
    const old=this.meshes.get(key);
    if(old){
      this.scene.remove(old);
      old.traverse(o=>{
        if(o.geometry && o.userData?.ownedGeometry) o.geometry.dispose();
      });
    }

    const group=new THREE.Group();
    group.name=`chunk:${key}`;
    group.frustumCulled=false;
    group.userData.chunk=c;

    const s=c.size, bx=c.cx*s, bz=c.cz*s;
    const isOpaqueSolid=id=>!!INFO[id]?.solid && !INFO[id]?.transparent;
    const isRenderable=id=>{
      const info=INFO[id];
      return !!info && (info.solid || info.liquid || info.emissive || info.plant);
    };

    // Stable renderer: build one BufferGeometry per block type.
    // This avoids InstancedMesh/material-array edge cases seen on iOS Safari.
    const buckets=new Map();
    const faceDefs=[
      {n:[ 1,0,0], v:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]]},
      {n:[-1,0,0], v:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]]},
      {n:[ 0,1,0], v:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]]},
      {n:[ 0,-1,0],v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]},
      {n:[ 0,0,1], v:[[1,0,1],[1,1,1],[0,1,1],[0,0,1]]},
      {n:[ 0,0,-1],v:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]}
    ];
    const uv=[[0,0],[1,0],[1,1],[0,1]];

    const pushFace=(id,x,y,z,face)=>{
      let b=buckets.get(id);
      if(!b){b={p:[],n:[],u:[],i:[]};buckets.set(id,b)}
      const base=b.p.length/3;
      for(let q=0;q<4;q++){
        const vv=face.v[q];
        b.p.push(x+vv[0],y+vv[1],z+vv[2]);
        b.n.push(face.n[0],face.n[1],face.n[2]);
        b.u.push(uv[q][0],uv[q][1]);
      }
      b.i.push(base,base+1,base+2,base,base+2,base+3);
    };

    for(let x=0;x<s;x++){
      for(let y=0;y<c.height;y++){
        for(let z=0;z<s;z++){
          const id=c.get(x,y,z);
          if(!isRenderable(id)) continue;
          for(const face of faceDefs){
            const nx=x+face.n[0], ny=y+face.n[1], nz=z+face.n[2];
            let neighbor;
            if(nx>=0&&nx<s&&nz>=0&&nz<s&&ny>=0&&ny<c.height) neighbor=c.get(nx,ny,nz);
            else neighbor=this.getBlock(bx+nx,ny,bz+nz);
            // Draw faces against air/liquids/plants and against transparent blocks.
            if(neighbor===BLOCK.AIR || !isOpaqueSolid(neighbor) || (INFO[neighbor]?.transparent && neighbor!==id)){
              pushFace(id,bx+x,y,bz+z,face);
            }
          }
        }
      }
    }

    for(const [id,b] of buckets){
      if(!b.i.length) continue;
      const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));
      g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));
      g.setAttribute('uv',new THREE.Float32BufferAttribute(b.u,2));
      g.setIndex(b.i);
      g.computeBoundingSphere();
      const material=this.materials[id]||this.materials[BLOCK.STONE];
      const mesh=new THREE.Mesh(g,material);
      mesh.frustumCulled=false;
      mesh.castShadow=true;mesh.receiveShadow=true;
      mesh.renderOrder=INFO[id]?.transparent?2:1;
      mesh.userData={blockId:id,chunk:c,ownedGeometry:true};
      group.add(mesh);
    }

    this.scene.add(group);
    c._renderFailures=0;
    this.meshes.set(key,group);
  }

  unloadFar(cx,cz,r){for(const [k,g] of this.meshes){const [x,z]=k.split(",").map(Number);if(Math.max(Math.abs(x-cx),Math.abs(z-cz))>r){this.scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose()});this.meshes.delete(k);this.meshQueued.delete(k);this.chunks.delete(k)}}}
  loadChanges(list){this.changes.clear();for(const x of list||[]){if(Array.isArray(x)&&x.length>=4)this.changes.set(`${x[0]|0},${x[1]|0},${x[2]|0}`,x[3]|0)}}
  serializeChanges(){const out=[];for(const [k,b] of this.changes){const p=k.split(",").map(Number);out.push([p[0],p[1],p[2],b])}return out}
  tickFalling(player){const r=10,px=Math.floor(player.pos.x),py=Math.floor(player.pos.y),pz=Math.floor(player.pos.z);for(let x=px-r;x<=px+r;x++)for(let z=pz-r;z<=pz+r;z++)for(let y=Math.min(this.cfg.WORLD.HEIGHT-2,py+8);y>=1;y--){const id=this.getBlock(x,y,z);if((id===BLOCK.SAND||id===BLOCK.GRAVEL)&&this.getBlock(x,y-1,z)===BLOCK.AIR){this.setBlock(x,y,z,BLOCK.AIR);this.setBlock(x,y-1,z,id)}}}
}
