import THREE from "../three.js";
import {INFO} from "../world/Block.js";
export class Lighting{
 constructor(scene,world,cfg){
  this.scene=scene;this.world=world;this.cfg=cfg;this.sun=new THREE.DirectionalLight(0xfff1d0,1.5);this.moon=new THREE.DirectionalLight(0x8ab8ff,.2);this.hemi=new THREE.HemisphereLight(0xbfe8ff,0x25301d,1);this.scene.add(this.sun,this.moon,this.hemi);
  this.fog=new THREE.FogExp2(0x87c9ef,.006);this.dynamic=new Map();this.lastScan="";this.maxLights=cfg.QUALITY?.maxLights||34;this.clock=0;this.glows=new Map();this.scanTimer=0;this.handLight=new THREE.PointLight(0xffb34d,0,10,2);this.handLight.position.set(.25,1.5,.35);scene.add(this.handLight);
  this.sun.castShadow=cfg.QUALITY?.shadows!==false;this.sun.shadow.mapSize.set(cfg.QUALITY?.shadowSize||1024,cfg.QUALITY?.shadowSize||1024);this.sun.shadow.camera.near=1;this.sun.shadow.camera.far=280;this.sun.shadow.camera.left=-70;this.sun.shadow.camera.right=70;this.sun.shadow.camera.top=70;this.sun.shadow.camera.bottom=-70;this.sun.shadow.bias=-0.00045;this.sun.shadow.normalBias=0.035;this.sun.shadow.radius=2;
  this.starField=this.makeStars();scene.add(this.starField);
 }
 makeStars(){const g=new THREE.BufferGeometry(),a=[];for(let i=0;i<420;i++){const r=190+Math.random()*40,theta=Math.random()*Math.PI*2,phi=Math.acos(2*Math.random()-1);a.push(Math.sin(phi)*Math.cos(theta)*r,Math.cos(phi)*r,Math.sin(phi)*Math.sin(theta)*r)}g.setAttribute("position",new THREE.Float32BufferAttribute(a,3));return new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:.8,transparent:true,opacity:.0,sizeAttenuation:false}))}
 update(time,player,dt=.016){
  this.clock+=dt;this.scanTimer+=dt;const a=time%(Math.PI*2),day=Math.max(0,Math.sin(a)),night=1-day;
  const selected=player.inventory?.selectedItem?.();this.handLight.intensity=(selected?.id===109 ? 0.95 : selected?.id===110 ? 0.65 : 0);this.handLight.position.set(player.pos.x+.3,player.pos.y+1.25,player.pos.z+.25);
  this.sun.position.set(Math.cos(a)*170,Math.sin(a)*170,80);this.moon.position.set(-Math.cos(a)*130,-Math.sin(a)*130,40);this.sun.intensity=.06+day*1.55;this.moon.intensity=.02+night*.42;this.hemi.intensity=.28+day*.72;
  const sky=new THREE.Color().setHSL(.57,.68,.10+.38*day);this.scene.background=sky;this.fog.color.copy(sky);this.fog.density=.0035+night*.008;this.scene.fog=this.fog;
  this.starField.material.opacity=Math.max(0,night-.08)*.9;this.sun.shadow.camera.updateProjectionMatrix();this.sun.target.position.copy(player.pos);this.scene.add(this.sun.target);
  const key=`${Math.floor(player.pos.x/8)},${Math.floor(player.pos.y/4)},${Math.floor(player.pos.z/8)}`;if(key!==this.lastScan && this.scanTimer>=0.65){this.lastScan=key;this.scanTimer=0;this.scan(player)}
  for(const [k,l] of this.dynamic){const base=l.userData.base||1;l.intensity=base*(.88+.12*Math.sin(this.clock*7+l.userData.phase));const s=this.glows.get(k);if(s)s.material.opacity=.12+.08*Math.sin(this.clock*6+l.userData.phase)}
 }
 scan(player){for(const l of this.dynamic.values())this.scene.remove(l);for(const s of this.glows.values())this.scene.remove(s);this.dynamic.clear();this.glows.clear();const r=this.cfg.QUALITY?.tier==='low'?8:this.cfg.QUALITY?.tier==='medium'?10:12,px=Math.floor(player.pos.x),py=Math.floor(player.pos.y),pz=Math.floor(player.pos.z),found=[];
  for(let x=px-r;x<=px+r;x++)for(let y=Math.max(0,py-10);y<=Math.min(this.cfg.WORLD.HEIGHT-1,py+10);y++)for(let z=pz-r;z<=pz+r;z++){const info=INFO[this.world.getBlock(x,y,z)];if(info?.light)found.push({x,y,z,p:info.light})}
  found.sort((a,b)=>(a.x-px)**2+(a.y-py)**2+(a.z-pz)**2-(b.x-px)**2-(b.y-py)**2-(b.z-pz)**2);
  for(const q of found.slice(0,this.maxLights)){const k=`${q.x},${q.y},${q.z}`,c=q.p>=15?0xff9b35:0xffd070,l=new THREE.PointLight(c,q.p*.085,q.p*1.65,2);l.position.set(q.x+.5,q.y+.65,q.z+.5);l.userData={base:q.p*.085,phase:Math.random()*6.28};this.scene.add(l);this.dynamic.set(k,l);const mat=new THREE.SpriteMaterial({color:c,transparent:true,opacity:.16,depthWrite:false,blending:THREE.AdditiveBlending});const sp=new THREE.Sprite(mat);sp.position.copy(l.position);sp.scale.set(1.2,1.2,1.2);this.scene.add(sp);this.glows.set(k,sp)}
 }
}
