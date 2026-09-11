import THREE from "../three.js";
export class Entity{constructor(x,y,z){this.pos=new THREE.Vector3(x,y,z);this.vel=new THREE.Vector3();this.alive=true}}
