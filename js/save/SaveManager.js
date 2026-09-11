export class SaveManager{
 static key="voxel-survival-worlds-v1"; static activeKey="voxel-survival-active-world-v1"; static backupKey="voxel-survival-worlds-backup-v1"; static legacyKey="voxel-survival-save-v5";
 static readAll(){try{const raw=localStorage.getItem(this.key);const data=raw?JSON.parse(raw):{};return data&&typeof data==="object"&&data.worlds&&typeof data.worlds==="object"?data:{worlds:{}}}catch{return {worlds:{}}}}
 static writeAll(data){try{localStorage.setItem(this.key,JSON.stringify(data));return true}catch{return false}}
 static id(){return "w_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7)}
 static normalizeSeed(seed){
  if(seed===null||seed===undefined||String(seed).trim()==="")return Math.floor(Math.random()*2147483647);
  const text=String(seed).trim();
  if(/^-?\d+$/.test(text)){const n=Number(text);if(Number.isFinite(n))return Math.abs(Math.trunc(n))%2147483647||1}
  let h=2166136261>>>0;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}
  return (h>>>0)%2147483647||1;
 }
 static listWorlds(){return Object.values(this.readAll().worlds).sort((a,b)=>(b.updated||0)-(a.updated||0))}
 static activeId(){try{return localStorage.getItem(this.activeKey)||null}catch{return null}}
 static setActive(id){if(id)try{localStorage.setItem(this.activeKey,id)}catch{}}
 static sanitize(v){if(!v||typeof v!=="object")return null;if(v.inventory&&!Array.isArray(v.inventory.slots))delete v.inventory;if(v.changes&&!Array.isArray(v.changes))v.changes=[];if(v.player){for(const k of ["x","y","z","health","hunger"])if(v.player[k]!=null&&!Number.isFinite(Number(v.player[k])))delete v.player[k]}return v}
 static loadActive(){const data=this.readAll(),id=this.activeId();if(id&&data.worlds[id]?.save)return this.sanitize(data.worlds[id].save);try{const raw=localStorage.getItem(this.legacyKey);if(raw){const legacy=this.sanitize(JSON.parse(raw));if(legacy){const nid=this.createWorld("Старый мир",String(legacy.seed||""),legacy);return this.loadWorld(nid)}}}catch{}return null}
 static loadWorld(id){const data=this.readAll();return data.worlds[id]?.save?this.sanitize(data.worlds[id].save):null}
 static createWorld(name="Новый мир",seed="",save=null){const data=this.readAll(),id=this.id(),finalSeed=this.normalizeSeed(seed);const clean=save?this.sanitize({...save}):{version:5,seed:finalSeed,time:180,player:{x:0,y:70,z:0,health:20,hunger:20},inventory:null,systems:null,changes:[]};clean.seed=finalSeed;data.worlds[id]={id,name:String(name||"Новый мир").slice(0,28),seed:finalSeed,created:Date.now(),updated:Date.now(),save:clean};if(!this.writeAll(data))throw new Error("Не удалось сохранить список миров");this.setActive(id);return id}
 static save(data){let all=this.readAll(),id=this.activeId();if(!id||!all.worlds[id]){id=this.createWorld("Новый мир",data.seed);all=this.readAll()}const old=all.worlds[id]?.save;if(old)try{localStorage.setItem(this.backupKey,JSON.stringify(old))}catch{}const world=all.worlds[id]||{id,name:"Новый мир",seed:data.seed,created:Date.now()};world.save={...data,version:5,updated:Date.now()};world.seed=data.seed;world.updated=Date.now();all.worlds[id]=world;this.setActive(id);return this.writeAll(all)}
 static deleteWorld(id){const all=this.readAll();if(!all.worlds[id])return false;delete all.worlds[id];const ok=this.writeAll(all);if(this.activeId()===id){const next=Object.values(all.worlds).sort((a,b)=>(b.updated||0)-(a.updated||0))[0];if(next)this.setActive(next.id);else try{localStorage.removeItem(this.activeKey)}catch{}}return ok}
 static clear(){const id=this.activeId();if(id)this.deleteWorld(id);else try{localStorage.removeItem(this.legacyKey)}catch{}}
 static loadBackup(){try{const raw=localStorage.getItem(this.backupKey);return raw?this.sanitize(JSON.parse(raw)):null}catch{return null}}
}
