export class Menu{
 constructor(game){
  this.game=game;
  this.main=document.getElementById('mainMenu');
  this.pause=document.getElementById('pauseMenu');
  const q=id=>document.getElementById(id);
  const call=(id,fn)=>{const el=q(id);if(!el)return;el.type='button';el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn(e)});el.addEventListener('touchend',e=>{if(e.cancelable)e.preventDefault();e.stopPropagation();fn(e)},{passive:false})};
  call('playButton',()=>game.start());
  call('newWorldButton',()=>game.newWorld());
  call('resumeButton',()=>game.resume());
  call('saveButton',()=>game.save());
  call('menuButton',()=>game.toMenu());
  call('settingsButton',()=>q('settingsPanel')?.classList.remove('hidden'));
  call('closeSettings',()=>q('settingsPanel')?.classList.add('hidden'));
  call('creditsButton',()=>q('creditsPanel')?.classList.remove('hidden'));
  call('closeCredits',()=>q('creditsPanel')?.classList.add('hidden'));
  call('installButton',()=>game.showInstall?.());
  call('nativeInstallButton',()=>game.installApp?.());
  call('closeInstall',()=>q('installPanel')?.classList.add('hidden'));
  call('fullscreenButton',()=>game.toggleFullscreen?.());
  call('fullscreenPauseButton',()=>game.toggleFullscreen?.());
  call('rotateButton',()=>game.requestLandscape?.());
  call('lanButton',()=>q('lanPanel')?.classList.remove('hidden'));
  call('closeLan',()=>q('lanPanel')?.classList.add('hidden'));
  call('lanHost',()=>game.hostLAN?.());
  call('lanConnect',()=>game.connectLAN?.());
  const rd=q('renderDistance'),rv=q('renderValue'),sen=q('sensitivity'),sv=q('sensitivityValue'),quality=q('qualitySelect');
  if(rd)rd.oninput=()=>{if(rv)rv.textContent=rd.value;if(game.world){game.world.cfg.WORLD.RENDER_DISTANCE=+rd.value;game.world.lastCenter=''}};
  if(sen)sen.oninput=()=>{if(sv)sv.textContent=sen.value;if(game.controls)game.controls.sensitivity=+sen.value*.0003125};
  quality?.addEventListener('change',e=>game.setQuality?.(e.target.value));
  q('reducedMotion')?.addEventListener('change',e=>game.reducedMotion=e.target.checked);
  // iPhone/Safari failsafe: if an invisible canvas/overlay becomes the hit target,
  // resolve the tap by screen coordinates and invoke the real button action.
  const ids=['playButton','newWorldButton','settingsButton','creditsButton','installButton','fullscreenButton','rotateButton','lanButton','resumeButton','saveButton','menuButton','fullscreenPauseButton','closeSettings','closeCredits','closeInstall','closeLan','nativeInstallButton','lanHost','lanConnect'];
  const hit=(x,y)=>{for(const id of ids){const el=q(id);if(!el)continue;const s=getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden')continue;const r=el.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom){el.click();return true}}return false};
  document.addEventListener('pointerdown',e=>{if(hit(e.clientX,e.clientY))e.stopImmediatePropagation()},true);
  document.addEventListener('touchstart',e=>{const t=e.touches?.[0];if(t&&hit(t.clientX,t.clientY)){if(e.cancelable)e.preventDefault();e.stopImmediatePropagation()}},{capture:true,passive:false});
 }
 showPause(){this.pause?.classList.remove('hidden')}
 hidePause(){this.pause?.classList.add('hidden')}
 showMain(){this.main?.classList.remove('hidden')}
 hideMain(){this.main?.classList.add('hidden')}
}
