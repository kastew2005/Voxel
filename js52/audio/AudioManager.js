// Original voxel-style procedural audio. No Minecraft audio assets are bundled.
// The sounds are intentionally short, dry and crunchy to fit the block-survival aesthetic.
export class AudioManager{
  constructor(){this.ctx=null;this.master=null;this.enabled=true;this.lastStep=0}
  start(){if(this.ctx)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)throw new Error('Web Audio API unavailable');this.ctx=new C();this.master=this.ctx.createGain();this.master.gain.value=.065;this.master.connect(this.ctx.destination);if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{})}catch(e){this.enabled=false;console.warn('Audio disabled',e)}}
  ensure(){if(!this.ctx)this.start();if(this.ctx?.state==='suspended')this.ctx.resume().catch(()=>{});return !!this.ctx&&this.enabled}
  envelope(g,when,d,peak=.16){g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(peak,when+.008);g.gain.exponentialRampToValueAtTime(.0001,when+d)}
  osc(freq,d=.08,type='triangle',peak=.12,slide=0){if(!this.ensure())return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(35,freq+slide),t+d);this.envelope(g,t,d,peak);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+d+.01)}
  noise(d=.07,peak=.12,filter=900){if(!this.ensure())return;const t=this.ctx.currentTime,n=Math.max(1,Math.floor(this.ctx.sampleRate*d)),b=this.ctx.createBuffer(1,n,this.ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/n,.7);const s=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();s.buffer=b;f.type='lowpass';f.frequency.value=filter;this.envelope(g,t,d,peak);s.connect(f);f.connect(g);g.connect(this.master);s.start(t);s.stop(t+d+.01)}
  step(){const now=performance.now();if(now-this.lastStep<170)return;this.lastStep=now;this.noise(.045,.035,650);this.osc(75,.055,'triangle',.025,-18)}
  block(){this.noise(.055,.065,1800);this.osc(115,.07,'triangle',.045,-25)}
  break(){this.noise(.11,.11,1200);this.osc(78,.10,'sine',.045,-25)}
  jump(){this.osc(250,.13,'triangle',.055,150)}
  hit(){this.noise(.065,.09,1500);this.osc(125,.07,'square',.035,-45)}
  hurt(){this.noise(.14,.10,700);this.osc(62,.15,'sawtooth',.025,-18)}
  pickup(){this.osc(520,.07,'triangle',.04,180);this.osc(740,.10,'triangle',.025,120)}
}
