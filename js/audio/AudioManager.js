export class AudioManager{
 constructor(){this.ctx=null;this.master=null}
 start(){if(this.ctx)return;this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.045;this.master.connect(this.ctx.destination)}
 tone(freq,d=.07,type="square",gain=.4){if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+d);o.connect(g);g.connect(this.master);o.start();o.stop(this.ctx.currentTime+d)}
 block(){this.tone(120,.05)} break(){this.tone(80,.1)} jump(){this.tone(330,.08,"triangle")} hit(){this.tone(180,.06)} hurt(){this.tone(75,.14,"sawtooth")}
}
