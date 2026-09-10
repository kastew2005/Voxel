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
      low: { pixelRatio:.68, renderDistance:3, startupDistance:1, maxLights:6, particles:70, rain:50, clouds:7, shadows:false, maxMobs:6, shadowSize:256 },
      medium: { pixelRatio:.86, renderDistance:5, startupDistance:1, maxLights:12, particles:140, rain:100, clouds:11, shadows:true, maxMobs:12, shadowSize:512 },
      high: { pixelRatio:1.05, renderDistance:6, startupDistance:1, maxLights:20, particles:220, rain:160, clouds:16, shadows:true, maxMobs:18, shadowSize:768 }
    };
    this.preset = presets[this.tier] || presets.medium;
    if(this.mobile) this.preset={...this.preset,pixelRatio:Math.min(this.preset.pixelRatio,.92),shadows:this.tier==='high'?false:this.preset.shadows};
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
