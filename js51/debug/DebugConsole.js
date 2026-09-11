export class DebugConsole {
  constructor(game){
    this.game=game; this.lines=[]; this.max=300; this.open=false; this.lastFrame=performance.now(); this.frames=0; this.fps=0; this.frameMs=0; this.lastStats=0;
    this.levels={log:'LOG',info:'INFO',warn:'WARN',error:'ERROR'};
    this.panel=document.getElementById('debugPanel'); this.output=document.getElementById('debugOutput'); this.stats=document.getElementById('debugStats');
    this.bind();
    window.__VOXEL_DEBUG__=this;
    this.hookConsole();
    this.log('info','Debug console initialized', {version:'35'});
  }
  bind(){
    const q=id=>document.getElementById(id);
    q('debugButton')?.addEventListener('click',()=>this.toggle());q('debugGameButton')?.addEventListener('click',()=>this.toggle());
    q('debugPauseButton')?.addEventListener('click',()=>this.toggle());
    q('debugClose')?.addEventListener('click',()=>this.close());
    q('debugClear')?.addEventListener('click',()=>this.clear());
    q('debugCopy')?.addEventListener('click',()=>this.copy());
    q('debugReload')?.addEventListener('click',()=>location.reload());
    q('debugQuality')?.addEventListener('click',()=>this.game.setQuality(this.game.quality.tier==='low'?'medium':this.game.quality.tier==='medium'?'high':'low'));
  }
  hookConsole(){
    if(window.__VOXEL_CONSOLE_HOOKED__) return; window.__VOXEL_CONSOLE_HOOKED__=true;
    const original={log:console.log,warn:console.warn,error:console.error,info:console.info};
    for(const type of Object.keys(original)) console[type]=(...args)=>{this.log(type,args.map(this.format).join(' '));original[type].apply(console,args)};
    window.addEventListener('error',e=>this.log('error',`${e.message||'Script error'}${e.filename?` @ ${e.filename.split('/').pop()}:${e.lineno||0}:${e.colno||0}`:''}`));
    window.addEventListener('unhandledrejection',e=>this.log('error',`Unhandled rejection: ${this.format(e.reason)}`));
  }
  format(v){try{return typeof v==='string'?v:JSON.stringify(v)}catch{return String(v)}}
  log(level,message,data){
    const text=data===undefined?String(message):`${message} ${this.format(data)}`;
    this.lines.push({t:new Date().toLocaleTimeString(),level,text}); if(this.lines.length>this.max)this.lines.splice(0,this.lines.length-this.max); this.renderLine(this.lines[this.lines.length-1]);
  }
  renderLine(line){if(!this.output)return;const d=document.createElement('div');d.className=`debugLine ${line.level}`;d.innerHTML=`<span class="debugTime">${line.t}</span><b>${this.levels[line.level]||'LOG'}</b><span>${this.escape(line.text)}</span>`;this.output.appendChild(d);while(this.output.children.length>this.max)this.output.firstChild.remove();this.output.scrollTop=this.output.scrollHeight}
  escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
  clear(){this.lines=[];if(this.output)this.output.innerHTML='';this.log('info','Console cleared')}
  toggle(){this.open?this.close():this.show()}
  show(){this.open=true;this.panel?.classList.remove('hidden');this.updateStats();}
  close(){this.open=false;this.panel?.classList.add('hidden')}
  update(dt){this.frames++;if(this.lastStats===0)this.lastStats=performance.now();const now=performance.now();if(now-this.lastStats>=500){this.fps=this.frames*1000/(now-this.lastStats);this.frameMs=1000/Math.max(1,this.fps);this.frames=0;this.lastStats=now;if(this.open)this.updateStats()}}
  updateStats(){
    if(!this.stats)return; const g=this.game, r=g.renderer, w=g.world;
    const info=r?.info; const mem=info?.memory||{}; const render=info?.render||{};
    this.stats.textContent=`FPS ${this.fps.toFixed(0)} • ${this.frameMs.toFixed(1)}ms | чанки ${w?.chunks?.size||0} | меши ${w?.meshes?.size||0} | draw ${render.calls||0} | tris ${render.triangles||0} | геометрия ${mem.geometries||0} | текстуры ${mem.textures||0} | DPR ${(r?.getPixelRatio?.()||1).toFixed(2)} | качество ${g.quality?.tier||'?'}`;
  }
  snapshot(){const g=this.game;return {version:39,url:location.href,userAgent:navigator.userAgent,screen:`${innerWidth}x${innerHeight}`,dpr:devicePixelRatio,quality:g.quality?.tier,renderer:g.renderer?.capabilities?.renderer||'',fps:this.fps,chunks:g.world?.chunks?.size,meshes:g.world?.meshes?.size,queued:g.world?.meshQueue?.length,workers:g.world?.workers?.length,player:g.player?{x:+g.player.pos.x.toFixed(2),y:+g.player.pos.y.toFixed(2),z:+g.player.pos.z.toFixed(2)}:null,lines:this.lines.slice(-80)} }
  async copy(){const text=JSON.stringify(this.snapshot(),null,2);try{await navigator.clipboard.writeText(text);this.log('info','Диагностика скопирована')}catch{this.log('warn','Не удалось скопировать — выдели текст вручную')}}
}
