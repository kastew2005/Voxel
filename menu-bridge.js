/* Voxel Survival menu touch bridge v62 */
(function(){
  function q(id){return document.getElementById(id)}
  function visible(el){if(!el)return false;const s=getComputedStyle(el);return s.display!=="none"&&s.visibility!=="hidden"&&s.pointerEvents!=="none"}
  function activateAt(x,y){
    const ids=["playButton","newWorldButton","settingsButton","creditsButton","installButton","fullscreenButton","rotateButton","lanButton","closeSettings","closeCredits","closeInstall","closeLan","nativeInstallButton","lanHost","lanConnect","menuButton","resumeButton","saveButton","fullscreenPauseButton"];
    for(const id of ids){const el=q(id);if(!visible(el))continue;const r=el.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom){el.click();return true}}
    return false;
  }
  function setVersion(){
    const el=document.querySelector("#mainMenu .menuVersion");
    if(el){
      const span=el.querySelector("span"), b=el.querySelector("b");
      if(span)span.textContent="UNIVERSE 62";
      if(b)b.textContent="v62.0";
    }
  }
  setVersion();
  window.addEventListener("DOMContentLoaded",setVersion);
  window.addEventListener("pageshow",()=>{setVersion();document.documentElement.dataset.menuBridge="v62"});
  document.addEventListener("pointerdown",e=>{if(activateAt(e.clientX,e.clientY))e.stopImmediatePropagation()},true);
  document.addEventListener("touchstart",e=>{const t=e.touches&&e.touches[0];if(t&&activateAt(t.clientX,t.clientY)){if(e.cancelable)e.preventDefault();e.stopImmediatePropagation()}},{capture:true,passive:false});
})();
