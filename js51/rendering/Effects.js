export class Effects{
 constructor(renderer){this.renderer=renderer;this.flash=0;this.damageFlash=0;this.shake=0;this.el=document.getElementById("fxOverlay")||document.createElement("div");this.el.id="fxOverlay";if(!this.el.parentNode)document.body.appendChild(this.el);this.vignette=0}
 hit(){navigator.vibrate?.(18);this.flash=Math.min(1,this.flash+.28);this.shake=Math.max(this.shake,.045)}
 damage(){navigator.vibrate?.([25,25,25]);this.damageFlash=1;this.shake=Math.max(this.shake,.18);this.vignette=1}
 update(dt){this.flash=Math.max(0,this.flash-dt*4.5);this.damageFlash=Math.max(0,this.damageFlash-dt*2.2);this.shake=Math.max(0,this.shake-dt*.7);this.vignette=Math.max(0,this.vignette-dt*.8);this.el.style.setProperty("--hit",this.flash);this.el.style.setProperty("--damage",this.damageFlash);this.el.style.setProperty("--vignette",this.vignette)}
 consumeShake(){const s=this.shake;if(s>0)this.shake*=.72;return s}
}
