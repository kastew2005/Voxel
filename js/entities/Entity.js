import * as THREE from "https://unpkg.com/three@0.179.1/build/three.module.js";
export class Entity{constructor(x,y,z){this.pos=new THREE.Vector3(x,y,z);this.vel=new THREE.Vector3();this.alive=true}}
