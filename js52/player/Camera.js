export class CameraRig{
constructor(camera){this.camera=camera}
shake(amount=.06){this.camera.position.x+=(Math.random()-.5)*amount;this.camera.position.y+=(Math.random()-.5)*amount}
}
