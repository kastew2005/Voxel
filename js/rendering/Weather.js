import * as THREE from "https://unpkg.com/three@0.179.1/build/three.module.js";

export class Weather {
  constructor(scene, quality) {
    this.scene = scene;
    this.quality = quality || {};
    this.rain = new THREE.Group();
    this.lines = [];
    this.rainCount = this.quality.rain || 160;

    for (let i = 0; i < this.rainCount; i++) {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.07, -1.3, 0)
      ]);
      const m = new THREE.LineBasicMaterial({
        color: 0x9fc8ff,
        transparent: true,
        opacity: 0.35
      });
      const line = new THREE.Line(g, m);
      this.rain.add(line);
      this.lines.push(line);
    }

    scene.add(this.rain);
    this.flash = 0;
    this.clouds = this.makeClouds();
    scene.add(this.clouds);
  }

  makeClouds() {
    const g = new THREE.Group();
    const count = this.quality.clouds || 18;

    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(7 + Math.random() * 9, 1 + Math.random() * 1.5, 4 + Math.random() * 6),
        new THREE.MeshLambertMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.08
        })
      );
      m.position.set(
        (Math.random() - 0.5) * 180,
        75 + Math.random() * 18,
        (Math.random() - 0.5) * 180
      );
      g.add(m);
    }
    return g;
  }

  update(dt, player, time) {
    const phase = (time % 720) / 720;
    const storm = Math.sin(time * 0.11) > 0.78 || Math.sin(time * 0.037 + 2) > 0.92;
    this.rain.visible = storm;

    if (storm) {
      this.rain.position.set(player.pos.x, player.pos.y + 12, player.pos.z);
      for (const line of this.lines) {
        line.position.y -= dt * 22;
        if (line.position.y < 0) {
          line.position.y = 20;
          line.position.x = (Math.random() - 0.5) * 42;
          line.position.z = (Math.random() - 0.5) * 42;
        }
      }
    }

    this.clouds.position.x = player.pos.x * 0.02 + (time * 0.35 % 120) - 60;
    this.clouds.position.z = player.pos.z * 0.01;

    if (storm && Math.random() < dt * 0.02) {
      this.flash = 1;
      document.body.style.setProperty("--lightning", "0.95");
    }
    this.flash = Math.max(0, this.flash - dt * 4);
    document.body.style.setProperty("--lightning", String(this.flash));
  }
}
