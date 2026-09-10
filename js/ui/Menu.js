export class Menu{
 constructor(game){this.game=game;this.main=document.getElementById('mainMenu');this.pause=document.getElementById('pauseMenu');const q=id=>document.getElementById(id);
  q('playButton').onclick=()=>game.start();q('newWorldButton').onclick=()=>game.newWorld();q('resumeButton').onclick=()=>game.resume();q('saveButton').onclick=()=>game.save();q('menuButton').onclick=()=>game.toMenu();
  q('settingsButton').onclick=()=>q('settingsPanel').classList.remove('hidden');q('closeSettings').onclick=()=>q('settingsPanel').classList.add('hidden');
  q('creditsButton').onclick=()=>q('creditsPanel').classList.remove('hidden');q('closeCredits').onclick=()=>q('creditsPanel').classList.add('hidden');
  q('installButton').onclick=()=>game.showInstall();q('nativeInstallButton').onclick=()=>game.installApp();q('closeInstall').onclick=()=>q('installPanel').classList.add('hidden');
  q('fullscreenButton').onclick=()=>game.toggleFullscreen();q('fullscreenPauseButton').onclick=()=>game.toggleFullscreen();q('rotateButton')?.addEventListener('click',()=>game.requestLandscape?.());
  q('lanButton')?.addEventListener('click',()=>q('lanPanel')?.classList.remove('hidden'));q('closeLan')?.addEventListener('click',()=>q('lanPanel')?.classList.add('hidden'));q('lanHost')?.addEventListener('click',()=>game.hostLAN());q('lanConnect')?.addEventListener('click',()=>game.connectLAN());
  const rd=q('renderDistance'),rv=q('renderValue'),sen=q('sensitivity'),sv=q('sensitivityValue'),quality=q('qualitySelect');rd.oninput=()=>{rv.textContent=rd.value;game.world.cfg.WORLD.RENDER_DISTANCE=+rd.value;game.world.lastCenter=''};sen.oninput=()=>{sv.textContent=sen.value;game.controls.sensitivity=+sen.value*.0003125};quality?.addEventListener('change',e=>game.setQuality(e.target.value));q('reducedMotion').onchange=e=>game.reducedMotion=e.target.checked;
 }
 showPause(){this.pause.classList.remove('hidden')}hidePause(){this.pause.classList.add('hidden')}showMain(){this.main.classList.remove('hidden')}hideMain(){this.main.classList.add('hidden')}
}
