/* Voxel Survival emergency runtime loader — fixes the broken js53/main.js before Safari parses it. */
(async()=>{
  const setStatus=(t)=>{const s=document.getElementById('bootStatus');if(s)s.textContent=t};
  try{
    setStatus('Проверяем игровой движок…');
    const res=await fetch('./js53/main.js?v=62.1',{cache:'no-store'});
    if(!res.ok) throw new Error('main.js HTTP '+res.status);
    let src=await res.text();
    src=src.replace(/location\.reload\(\)\s*\n\s*hostLAN\(/, 'location.reload()}\n hostLAN(');
    const oldCatch=`  }catch(err){
    console.error("WORLD START FAILED",err);
    this.running=false;
    this.menu.showMain();
    if(status)status.textContent="Ошибка мира: "+(err?.message||String(err));
    const retry=document.getElementById("engineRetry");
    if(retry)retry.classList.remove("hidden");
  }finally{`;
    const newCatch=`  }catch(err){
    console.error("WORLD START FAILED",err);
    try{
      this.running=false;
      this.world.useWorker=false;
      this.world.cfg.WORLD.RENDER_DISTANCE=0;
      this.world.chunks.clear();
      this.world.meshes.clear();
      this.world.meshQueue.length=0;
      const s=this.world.cfg.WORLD.CHUNK_SIZE;
      const cx=Math.floor(this.player.pos.x/s),cz=Math.floor(this.player.pos.z/s);
      this.world.generateChunk(cx,cz,false);
      this.world.processMeshQueue(200);
      this.player.pos.y=Math.max(2,this.findGround(this.player.pos.x,this.player.pos.z)+0.02);
      this.camera.position.set(this.player.pos.x,this.player.pos.y+1.62,this.player.pos.z);
      this.running=true;
      this.setGameUI(true);
      if(status)status.textContent="Мир восстановлен";
    }catch(recoveryError){
      console.error("WORLD RECOVERY FAILED",recoveryError);
      this.running=false;
      this.menu.showMain();
      if(status)status.textContent="Ошибка мира: "+(recoveryError?.message||String(recoveryError));
      const retry=document.getElementById("engineRetry");
      if(retry)retry.classList.remove("hidden");
    }
  }finally{`;
    if(src.includes(oldCatch)) src=src.replace(oldCatch,newCatch);
    src=`window.addEventListener("error",e=>{console.error("VOXEL RUNTIME",e.error||e.message);const s=document.getElementById("bootStatus");if(s)s.textContent="Ошибка: "+(e.message||"неизвестная");});\n`+src;
    const blob=new Blob([src],{type:'text/javascript'});
    const blobUrl=URL.createObjectURL(blob);
    await import(blobUrl);
    URL.revokeObjectURL(blobUrl);
  }catch(e){
    console.error('Voxel emergency loader failed',e);
    setStatus('Не удалось запустить игру: '+(e?.message||e));
  }
})();
