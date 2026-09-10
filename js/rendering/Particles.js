import * as THREE from "https://unpkg.com/three@0.179.1/build/three.module.js";
export class Particles{
 constructor(scene,quality={}){this.scene=scene;this.items=[];this.maxItems=quality.particles||220;this.cubeGeo=new THREE.BoxGeometry(.045,.045,.045)}
 burst(pos,color=0xffffff,n=10,force=3){n=Math.min(n,Math.max(0,this.maxItems-this.items.length));for(let i=0;i<n;i++){const m=new THREE.Mesh(this.cubeGeo,new THREE.MeshBasicMaterial({color,transparent:true}));m.position.copy(pos);m.userData.v=new THREE.Vector3((Math.random()-.5)*force,Math.random()*force,(Math.random()-.5)*force);m.userData.life=.35+Math.random()*.55;this.scene.add(m);this.items.push(m)}}
 dust(pos,color=0xaaaaaa,n=5){this.burst(pos,color,n,1.5)}
 smoke(pos,n=3){for(let i=0;i<n;i++){const g=new THREE.SphereGeometry(.08+Math.random()*.08,6,6),m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x555555,transparent:true,opacity:.18}));m.position.copy(pos);m.userData.v=new THREE.Vector3((Math.random()-.5)*.25,.45+Math.random()*.35,(Math.random()-.5)*.25);m.userData.life=.8+Math.random()*.7;this.scene.add(m);this.items.push(m)}}
 update(dt){for(let i=this.items.length-1;i>=0;i--){const p=this.items[i];p.userData.life-=dt;p.position.addScaledVector(p.userData.v,dt);p.userData.v.y-=8*dt;if(p.geometry.type==='SphereGeometry')p.userData.v.y+=9*dt;p.material.opacity=Math.max(0,p.userData.life*(p.geometry.type === 'SphereGeometry' ? 0.2 : 1.5));if(p.userData.life<=0){this.scene.remove(p);if(p.geometry!==this.cubeGeo)p.geometry.dispose();p.material.dispose();this.items.splice(i,1)}}}
}
