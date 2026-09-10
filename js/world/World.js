import * as THREE from "https://unpkg.com/three@0.179.1/build/three.module.js";
import {Chunk} from "./Chunk.js?v=19";
import {Generator} from "./Generator.js?v=19";
import {BLOCK,INFO} from "./Block.js?v=19";

/*
 * Voxel Survival Universe 19
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
    this.meshQueue=[];this.meshQueued=new Set();this.meshBuilding=false;this.initWorker();
  }
  initWorker(){try{const cores=navigator.hardwareConcurrency||2;const count=Math.max(1,Math.min(2,cores>4?2:1));for(let i=0;i<count;i++){const w=new Worker(new URL("./WorldWorker.js?v=19",import.meta.url),{type:"module"});w.onmessage=e=>{const job=this.workerJobs.get(e.data.id);if(!job)return;this.workerJobs.delete(e.data.id);if(e.data.error)job.reject(new Error(e.data.error));else job.resolve(new Uint8Array(e.data.buffer));};w.onerror=e=>{console.warn("World worker:",e.message);for(const [id,job] of this.workerJobs){job.reject(new Error("Worker failed"));this.workerJobs.delete(id)}};this.workers.push(w)}}catch(e){this.workers=[]}}
  key(x,z){return `${x},${z}`}

  // High-detail 64x64 pixel texture. Nearest filtering keeps the voxel look sharp.
  makeTexture(base,accent,seed=1,mode="normal"){
    const k=`${base}|${accent}|${seed}|${mode}`;if(this._textureCache.has(k))return this._textureCache.get(k);
    const c=document.createElement("canvas");c.width=c.height=64;const g=c.getContext("2d",{alpha:true});
    g.fillStyle=base;g.fillRect(0,0,64,64);let s=seed>>>0;
    const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
    const rgb=(hex)=>{const n=parseInt(hex.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255]};
    const [ar,ag,ab]=rgb(accent);
    // Pixel-scale noise: varied but restrained so blocks remain readable.
    for(let i=0;i<420;i++){
      const a=.045+rnd()*.15,sz=rnd()<.84?1:2;
      g.fillStyle=`rgba(${ar},${ag},${ab},${a})`;
      g.fillRect((rnd()*64)|0,(rnd()*64)|0,sz,sz);
    }
    // Fine light/dark chips.
    for(let i=0;i<95;i++){
      const light=rnd()>.5, a=.035+rnd()*.08;
      g.fillStyle=light?`rgba(255,255,255,${a})`:`rgba(0,0,0,${a})`;
      g.fillRect((rnd()*64)|0,(rnd()*64)|0,1+(rnd()*2|0),1+(rnd()*2|0));
    }
    if(mode==="grassTop"){
      g.fillStyle="#477f2f";for(let i=0;i<78;i++){const x=(rnd()*64)|0,y=(rnd()*64)|0;g.fillRect(x,y,1,2+(rnd()*4|0));}
      g.fillStyle="#8fbd52";for(let i=0;i<30;i++)g.fillRect((rnd()*64)|0,(rnd()*64)|0,1,1);
    }
    if(mode==="stone"){
      g.fillStyle="#c6c6c6";g.globalAlpha=.22;for(let i=0;i<42;i++)g.fillRect((rnd()*64)|0,(rnd()*64)|0,1+(rnd()*2|0),1+(rnd()*2|0));g.globalAlpha=1;
      g.strokeStyle="#555";g.globalAlpha=.18;g.lineWidth=1;for(let i=0;i<12;i++){const x=(rnd()*60)|0,y=(rnd()*60)|0;g.beginPath();g.moveTo(x,y);g.lineTo(x+2+(rnd()*4|0),y+1);g.lineTo(x+3+(rnd()*3|0),y+3);g.stroke();}g.globalAlpha=1;
    }
    if(mode==="woodTop"){
      g.strokeStyle="#3d2618";g.lineWidth=2;for(let r=7;r<32;r+=7)g.strokeRect(32-r,32-r,r*2,r*2);
      g.fillStyle="#c28a4e";for(let i=0;i<18;i++)g.fillRect((rnd()*64)|0,(rnd()*64)|0,1,1);
    }
    if(mode==="ore"){
      g.fillStyle="#252525";for(let i=0;i<22;i++)g.fillRect((rnd()*64)|0,(rnd()*64)|0,2+(rnd()*2|0),2+(rnd()*2|0));
      g.fillStyle=accent;for(let i=0;i<20;i++)g.fillRect((rnd()*62)|0,(rnd()*62)|0,2,2);
    }
    if(mode==="brick"){
      g.strokeStyle="#572722";g.lineWidth=2;for(let y=8;y<64;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(64,y);g.stroke();}
      for(let y=0;y<64;y+=16){const off=((y/16)&1)*8;for(let x=off;x<64;x+=16){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+16);g.stroke();}}
    }
    if(mode==="planks"){
      g.strokeStyle="#694322";g.globalAlpha=.5;for(let y=6;y<64;y+=10){g.beginPath();g.moveTo(0,y);g.lineTo(64,y);g.stroke();}g.globalAlpha=1;
      g.fillStyle="#d19a5b";for(let i=0;i<18;i++)g.fillRect((rnd()*58)|0,(rnd()*64)|0,4,1);
    }
    const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=1;
    this._textureCache.set(k,t);return t;
  }
  mat(a,b,s,e={},m="normal"){return new THREE.MeshLambertMaterial({map:this.makeTexture(a,b,s,m),...e})}
  makeMaterials(){const M={};const simple=(id,a,b,s,e={},mode="normal")=>{const m=this.mat(a,b,s,e,mode);M[id]=[m,m,m,m,m,m]};
    M[BLOCK.GRASS]=[this.mat("#5b913b","#315f2b",1),this.mat("#5b913b","#315f2b",2),this.mat("#73b84c","#356f2e",3,{},"grassTop"),this.mat("#76502e","#9a693c",4),this.mat("#5b913b","#315f2b",5),this.mat("#5b913b","#315f2b",6)];
    simple(BLOCK.DIRT,"#79502d","#9b693d",10);simple(BLOCK.STONE,"#777777","#4f4f4f",20,{},"stone");simple(BLOCK.SAND,"#d8c17a","#a78c51",30);simple(BLOCK.GRAVEL,"#77736b","#514f4b",40);
    M[BLOCK.LOG]=[this.mat("#7d542f","#4b301d",50),this.mat("#7d542f","#4b301d",51),this.mat("#9a7043","#4d301d",52,{},"woodTop"),this.mat("#9a7043","#4d301d",53,{},"woodTop"),this.mat("#7d542f","#4b301d",54),this.mat("#7d542f","#4b301d",55)];
    simple(BLOCK.LEAVES,"#3f8e3a","#285f2b",60,{transparent:true,opacity:.92,side:THREE.DoubleSide});
    simple(BLOCK.PLANKS,"#a56f3f","#6d4527",90,{},"planks");
    simple(BLOCK.GLASS,"#b9e8f5","#ffffff",100,{transparent:true,opacity:.38,side:THREE.DoubleSide});
    simple(BLOCK.BRICK,"#9c4d40","#70312b",110,{},"brick");
    simple(BLOCK.WATER,"#3973c9","#20498b",120,{transparent:true,opacity:.48,side:THREE.DoubleSide});
    simple(BLOCK.COAL,"#303030","#111111",70,{},"ore");simple(BLOCK.IRON,"#a67558","#6d4633",80,{},"ore");simple(BLOCK.COPPER,"#a66f55","#6d4336",240,{},"ore");
    simple(BLOCK.FURNACE,"#777777","#333333",135,{},"stone");simple(BLOCK.CHEST,"#9a5b28","#4e2912",150);simple(BLOCK.LANTERN,"#d79b35","#6e4217",140,{emissive:0x7a4b12,emissiveIntensity:.8});
    simple(BLOCK.CAMPFIRE,"#d65d24","#542012",160,{emissive:0xff4b12,emissiveIntensity:1.8});simple(BLOCK.MOSS,"#4f8744","#285b2b",170);simple(BLOCK.GLOWSTONE,"#e7c85d","#a86b19",180,{emissive:0xffaa33,emissiveIntensity:1.5});
    simple(BLOCK.COBBLE,"#696969","#454545",190,{},"stone");simple(BLOCK.SNOW,"#e9f2f4","#b9c6ca",200);simple(BLOCK.CLAY,"#aa7667","#704b45",210);simple(BLOCK.FARMLAND,"#6b452c","#382516",220);simple(BLOCK.WHEAT,"#7f9a39","#d2b64a",230,{transparent:true,opacity:.9,side:THREE.DoubleSide});simple(BLOCK.BEDROCK,"#171717","#292929",130);return M;
  }
  applyChanges(c){const s=c.size;for(const [k,b] of this.changes){const [x,y,z]=k.split(",").map(Number);if(Math.floor(x/s)===c.cx&&Math.floor(z/s)===c.cz)c.set(((x%s)+s)%s,y,((z%s)+s)%s,b)}}
  async generateAround(px,pz){const s=this.cfg.WORLD.CHUNK_SIZE,r=this.cfg.WORLD.RENDER_DISTANCE,cx=Math.floor(px/s),cz=Math.floor(pz/s),center=this.key(cx,cz);if(this.generationBusy||this.lastCenter===center)return false;this.lastCenter=center;this.generationBusy=true;
    const jobs=[];for(let x=-r;x<=r;x++)for(let z=-r;z<=r;z++)if(x*x+z*z<=r*r&&!this.chunks.has(this.key(cx+x,cz+z)))jobs.push([cx+x,cz+z]);jobs.sort((a,b)=>(a[0]-cx)**2+(a[1]-cz)**2-(b[0]-cx)**2-(b[1]-cz)**2);this.generationProgress={done:0,total:jobs.length,created:0};
    try{for(const [x,z] of jobs){await this.generateChunk(x,z,true);this.generationProgress.done++;this.generationProgress.created++;await new Promise(requestAnimationFrame)}this.unloadFar(cx,cz,r+1);return true}finally{this.generationBusy=false;this.generationProgress=null}}
  generateChunk(cx,cz,useWorker=true){const s=this.cfg.WORLD.CHUNK_SIZE,h=this.cfg.WORLD.HEIGHT;if(useWorker&&this.workers.length){const id=++this.workerSeq,w=this.workers[this.workerCursor++%this.workers.length];return new Promise((resolve,reject)=>{this.workerJobs.set(id,{resolve:blocks=>{const c=new Chunk(cx,cz,s,h);c.blocks.set(blocks);this.applyChanges(c);this.chunks.set(this.key(cx,cz),c);this.queueRebuild(c);resolve(c)},reject});w.postMessage({id,seed:this.cfg.WORLD.SEED,cx,cz,size:s,height:h,seaLevel:this.cfg.WORLD.SEA_LEVEL})})}
    const c=new Chunk(cx,cz,s,h);for(let x=0;x<s;x++)for(let z=0;z<s;z++){const wx=cx*s+x,wz=cz*s+z,top=this.gen.height(wx,wz);for(let y=0;y<h;y++)c.set(x,y,z,this.gen.getWithHeight(wx,y,wz,top,this.cfg.WORLD.SEA_LEVEL));}this.applyChanges(c);this.chunks.set(this.key(cx,cz),c);this.queueRebuild(c);return c;}
  getBlock(x,y,z){if(y<0||y>=this.cfg.WORLD.HEIGHT)return BLOCK.AIR;const ck=`${x|0},${y|0},${z|0}`;if(this.changes.has(ck))return this.changes.get(ck);const s=this.cfg.WORLD.CHUNK_SIZE,cx=Math.floor(x/s),cz=Math.floor(z/s),c=this.chunks.get(this.key(cx,cz));return c?c.get(((x%s)+s)%s,y,((z%s)+s)%s):BLOCK.AIR}
  setBlock(x,y,z,b){if(y<0||y>=this.cfg.WORLD.HEIGHT)return false;const s=this.cfg.WORLD.CHUNK_SIZE,cx=Math.floor(x/s),cz=Math.floor(z/s),c=this.chunks.get(this.key(cx,cz));if(!c)return false;const lx=((x%s)+s)%s,lz=((z%s)+s)%s;c.set(lx,y,lz,b);this.changes.set(`${x|0},${y|0},${z|0}`,b);this.queueRebuild(c);if(lx===0)this.rebuildAt(cx-1,cz);if(lx===s-1)this.rebuildAt(cx+1,cz);if(lz===0)this.rebuildAt(cx,cz-1);if(lz===s-1)this.rebuildAt(cx,cz+1);return true}
  rebuildAt(cx,cz){const c=this.chunks.get(this.key(cx,cz));if(c)this.queueRebuild(c)}
  processMeshQueue(budgetMs=3){if(this.meshBuilding||!this.meshQueue.length)return;this.meshBuilding=true;const start=performance.now();try{while(this.meshQueue.length&&performance.now()-start<budgetMs){const c=this.meshQueue.shift();this.meshQueued.delete(this.key(c.cx,c.cz));if(this.chunks.get(this.key(c.cx,c.cz))===c)this.rebuildChunk(c)}}finally{this.meshBuilding=false}}

  rebuildChunk(c){
    const key=this.key(c.cx,c.cz),old=this.meshes.get(key);if(old){this.scene.remove(old);old.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
    const group=new THREE.Group(),s=c.size,bx=c.cx*s,bz=c.cz*s;
    const F=[
      {d:[1,0,0],n:[1,0,0],v:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]]},{d:[-1,0,0],n:[-1,0,0],v:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]]},
      {d:[0,1,0],n:[0,1,0],v:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]]},{d:[0,-1,0],n:[0,-1,0],v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]},
      {d:[0,0,1],n:[0,0,1],v:[[1,0,1],[1,1,1],[0,1,1],[0,0,1]]},{d:[0,0,-1],n:[0,0,-1],v:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]}
    ];
    const solid=id=>!!INFO[id]?.solid&&!INFO[id]?.transparent;
    // Each material gets its own contiguous index buffer. This turns thousands of face draw calls into <=6 per block type/chunk.
    const blocks=new Map();
    for(let x=0;x<s;x++)for(let y=0;y<c.height;y++)for(let z=0;z<s;z++){
      const id=c.get(x,y,z),info=INFO[id];if(!info||(!info.solid&&!info.liquid&&!info.emissive&&!info.plant))continue;
      const byMat=blocks.get(id)||[];blocks.set(id,byMat);
      for(let f=0;f<6;f++){
        const q=F[f].d,nx=x+q[0],ny=y+q[1],nz=z+q[2];let neighbor;
        if(nx>=0&&nx<s&&nz>=0&&nz<s&&ny>=0&&ny<c.height)neighbor=c.get(nx,ny,nz);else neighbor=this.getBlock(bx+nx,ny,bz+nz);
        if(solid(neighbor))continue;
        const mi=this.materials[id]?.length===6?f:0;let d=byMat[mi];if(!d){d={p:[],n:[],u:[],i:[]};byMat[mi]=d}
        const base=d.p.length/3;
        for(const v of F[f].v){d.p.push(bx+x+v[0],y+v[1],bz+z+v[2]);d.n.push(...F[f].n)}
        d.u.push(0,0,0,1,1,1,1,0);d.i.push(base,base+1,base+2,base,base+2,base+3);
      }
    }
    for(const [id,byMat] of blocks){const mats=this.materials[id]||this.materials[BLOCK.STONE];for(let mi=0;mi<byMat.length;mi++){const d=byMat[mi];if(!d||!d.i.length)continue;const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(d.p,3));g.setAttribute("normal",new THREE.Float32BufferAttribute(d.n,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(d.u,2));g.setIndex(d.i);g.computeBoundingSphere();const m=new THREE.Mesh(g,mats[mi]||mats[0]);m.userData={blockId:id,chunk:c};group.add(m)}}
    group.userData.chunk=c;this.scene.add(group);this.meshes.set(key,group)
  }
  unloadFar(cx,cz,r){for(const [k,g] of this.meshes){const [x,z]=k.split(",").map(Number);if(Math.max(Math.abs(x-cx),Math.abs(z-cz))>r){this.scene.remove(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose()});this.meshes.delete(k);this.chunks.delete(k)}}}
  loadChanges(list){this.changes.clear();for(const x of list||[]){if(Array.isArray(x)&&x.length>=4)this.changes.set(`${x[0]|0},${x[1]|0},${x[2]|0}`,x[3]|0)}}
  serializeChanges(){const out=[];for(const [k,b] of this.changes){const p=k.split(",").map(Number);out.push([p[0],p[1],p[2],b])}return out}
  tickFalling(player){const r=10,px=Math.floor(player.pos.x),py=Math.floor(player.pos.y),pz=Math.floor(player.pos.z);for(let x=px-r;x<=px+r;x++)for(let z=pz-r;z<=pz+r;z++)for(let y=Math.min(this.cfg.WORLD.HEIGHT-2,py+8);y>=1;y--){const id=this.getBlock(x,y,z);if((id===BLOCK.SAND||id===BLOCK.GRAVEL)&&this.getBlock(x,y-1,z)===BLOCK.AIR){this.setBlock(x,y,z,BLOCK.AIR);this.setBlock(x,y-1,z,id)}}}
}
