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
      low: { pixelRatio:.72, renderDistance:3, startupDistance:1, maxLights:8, particles:90, rain:70, clouds:9, shadows:false, maxMobs:8, shadowSize:512 },
      medium: { pixelRatio:.92, renderDistance:5, startupDistance:1, maxLights:16, particles:180, rain:140, clouds:13, shadows:true, maxMobs:14, shadowSize:512 },
      high: { pixelRatio:1.18, renderDistance:6, startupDistance:1, maxLights:28, particles:300, rain:220, clouds:18, shadows:true, maxMobs:20, shadowSize:1024 }
    };
    this.preset = presets[this.tier] || presets.medium;
    if(this.mobile && this.tier==='high') this.preset={...this.preset,pixelRatio:1.05};
  }
  configureRenderer(renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.preset.pixelRatio));
    renderer.shadowMap.enabled = this.preset.shadows;
    renderer.shadowMap.type = 1;
  }
  choose(tier, persist=true) {
    if(!['low','medium','high'].includes(tier)) return;
    this.tier=tier;if(persist)localStorage.setItem('vs_quality',tier);this.applyTier();
  }
}
