import THREE from "../three.js";
export class Particles{
 constructor(scene,quality={}){this.scene=scene;this.items=[];this.maxItems=quality.particles||220;this.cubeGeo=new THREE.BoxGeometry(.045,.045,.045);this.smokeGeo=new THREE.SphereGeometry(.1,5,5);this.materials=new Map();this.smokeMat=new THREE.MeshBasicMaterial({color:0x555555,transparent:true,opacity:.18});}
 material(color){if(this.materials.has(color))return this.materials.get(color);const m=new THREE.MeshBasicMaterial({color,transparent:true});this.materials.set(color,m);return m}
 addMesh(geo,mat,pos,v,life,kind){const m=new THREE.Mesh(geo,mat);m.position.copy(pos);m.userData.v=v;m.userData.life=life;m.userData.kind=kind;this.scene.add(m);this.items.push(m)}
 burst(pos,color=0xffffff,n=10,force=3){n=Math.min(n,Math.max(0,this.maxItems-this.items.length));const mat=this.material(color);for(let i=0;i<n;i++)this.addMesh(this.cubeGeo,mat,pos,new THREE.Vector3((Math.random()-.5)*force,Math.random()*force,(Math.random()-.5)*force),.35+Math.random()*.55,"dust")}
 dust(pos,color=0xaaaaaa,n=5){this.burst(pos,color,n,1.5)}
 smoke(pos,n=3){n=Math.min(n,Math.max(0,this.maxItems-this.items.length));for(let i=0;i<n;i++)this.addMesh(this.smokeGeo,this.smokeMat,pos,new THREE.Vector3((Math.random()-.5)*.25,.45+Math.random()*.35,(Math.random()-.5)*.25),.8+Math.random()*.7,"smoke")}
 update(dt){for(let i=this.items.length-1;i>=0;i--){const p=this.items[i],u=p.userData;u.life-=dt;p.position.addScaledVector(u.v,dt);u.v.y+=(u.kind==="smoke"?0:-8)*dt;if(u.kind==="smoke")u.v.y+=9*dt;p.material.opacity=Math.max(0,u.life*(u.kind==="smoke"?.2:1.5));if(u.life<=0){this.scene.remove(p);this.items.splice(i,1)}}}
}
