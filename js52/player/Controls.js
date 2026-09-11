export class Controls{
constructor(camera,dom){this.camera=camera;this.dom=dom;this.keys={};this.yaw=0;this.pitch=0;this.sensitivity=.0025;this.locked=false;
addEventListener("keydown",e=>this.keys[e.code]=true);addEventListener("keyup",e=>this.keys[e.code]=false);
dom.addEventListener("click",()=>dom.requestPointerLock?.());document.addEventListener("pointerlockchange",()=>this.locked=document.pointerLockElement===dom);
document.addEventListener("mousemove",e=>{if(!this.locked)return;this.yaw-=e.movementX*this.sensitivity;this.pitch-=e.movementY*this.sensitivity;this.pitch=Math.max(-1.5,Math.min(1.5,this.pitch))})
}
updateCamera(){this.camera.rotation.order="YXZ";this.camera.rotation.y=this.yaw;this.camera.rotation.x=this.pitch}
forward(){return {x:-Math.sin(this.yaw),z:-Math.cos(this.yaw)}}
right(){return {x:Math.cos(this.yaw),z:-Math.sin(this.yaw)}}
}
