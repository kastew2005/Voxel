import THREE from "../three.js";
import {Entity} from "./Entity.js";
import {INFO} from "../world/Block.js";
export class Zombie extends Entity{
 constructor(scene,world,x,y,z){super(x,y,z);this.world=world;this.speed=1.25;this.health=20;this.attackTimer=0;this.groundTimer=0;this.groundYCache=y;this.vel.y=0;this.group=new THREE.Group();
  const skin=new THREE.MeshLambertMaterial({color:0x68a66a}),shirt=new THREE.MeshLambertMaterial({color:0x315b8c}),pants=new THREE.MeshLambertMaterial({color:0x333a64}),eye=new THREE.MeshBasicMaterial({color:0xff3333});
  const head=new THREE.Mesh(new THREE.BoxGeometry(.55,.55,.55),skin);head.position.y=1.55;const body=new THREE.Mesh(new THREE.BoxGeometry(.65,.85,.38),shirt);body.position.y=.95;
  const l=new THREE.Mesh(new THREE.BoxGeometry(.18,.8,.18),pants),r=new THREE.Mesh(new THREE.BoxGeometry(.18,.8,.18),pants);l.position.set(-.18,.38,0);r.position.set(.18,.38,0);
  const e1=new THREE.Mesh(new THREE.BoxGeometry(.07,.07,.03),eye),e2=e1.clone();e1.position.set(-.13,1.62,-.28);e2.position.set(.13,1.62,-.28);this.group.add(head,body,l,r,e1,e2);this.group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});this.group.position.copy(this.pos);scene.add(this.group)}
 solid(x,y,z){return !!INFO[this.world.getBlock(Math.floor(x),Math.floor(y),Math.floor(z))]?.solid}
 groundY(x,z){const top=Math.min(this.world.cfg?.WORLD?.HEIGHT-1||95,Math.floor(this.pos.y)+4);for(let y=top;y>=0;y--)if(this.solid(x,y,z))return y+1;return 1}
 update(dt,player){if(!this.alive)return;const dx=player.pos.x-this.pos.x,dz=player.pos.z-this.pos.z,d=Math.hypot(dx,dz);if(d<22&&d>.9){const nx=this.pos.x+dx/d*this.speed*dt,nz=this.pos.z+dz/d*this.speed*dt;if(!this.solid(nx,this.pos.y+.4,nz))this.pos.x=nx;if(!this.solid(this.pos.x,this.pos.y+.4,nz))this.pos.z=nz;this.group.rotation.y=Math.atan2(dx,dz)}
  this.groundTimer-=dt;if(this.groundTimer<=0){this.groundTimer=.12;this.groundYCache=this.groundY(this.pos.x,this.pos.z)}const gy=this.groundYCache;this.pos.y+=(gy-this.pos.y)*Math.min(1,dt*12);if(d<=1.15){this.attackTimer-=dt;if(this.attackTimer<=0){player.damage(2);this.attackTimer=1.2;return true}}this.group.position.copy(this.pos);return false}
 hit(d){this.health-=d;if(this.health<=0)this.alive=false;return !this.alive}
}
