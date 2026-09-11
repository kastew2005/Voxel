import THREE from "./three.js";
export class QualityManager {
  constructor() {
    const mem = Number(navigator.deviceMemory || 4);
    const cores = Number(navigator.hardwareConcurrency || 4);
    const mobile = matchMedia('(pointer:coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const veryLow = mem <= 2 || cores <= 2;
    const low = veryLow || mem <= 4 || cores <= 4;
    const saved = localStorage.getItem('vs_quality');
    this.tier = saved || (veryLow ? 'low' : low ? 'medium' : 'high');
    this.mobile = mobile;
    this.applyTier();
  }
  applyTier() {
    const presets = {
      low: { pixelRatio:.62, renderDistance:2, startupDistance:1, maxLights:4, particles:40, rain:35, clouds:5, shadows:false, maxMobs:5, shadowSize:256 },
      medium: { pixelRatio:.78, renderDistance:4, startupDistance:1, maxLights:8, particles:90, rain:70, clouds:8, shadows:true, maxMobs:9, shadowSize:512 },
      high: { pixelRatio:.92, renderDistance:5, startupDistance:1, maxLights:14, particles:140, rain:110, clouds:11, shadows:true, maxMobs:14, shadowSize:512 }
    };
    this.preset = presets[this.tier] || presets.medium;
    if(this.mobile) this.preset={...this.preset,pixelRatio:Math.min(this.preset.pixelRatio,.92),shadows:this.tier!=='low'};
  }
  configureRenderer(renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.preset.pixelRatio));
    renderer.shadowMap.enabled = this.preset.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  choose(tier, persist=true) {
    if(!['low','medium','high'].includes(tier)) return;
    this.tier=tier;if(persist)localStorage.setItem('vs_quality',tier);this.applyTier();
  }
}
