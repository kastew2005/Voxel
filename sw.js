const VERSION="voxel-survival-shell-v24";
const SHELL=["./","./index.html","./css/main.css","./css/menu.css","./css/hud.css","./css/mobile.css","./manifest.webmanifest"];
self.addEventListener("install",e=>e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
 const u=new URL(e.request.url);
 if(u.origin!==location.origin||e.request.method!=="GET")return;
 if(u.pathname.endsWith(".js")||u.pathname.endsWith(".html")||u.pathname==="/"||u.pathname.endsWith("/")){
   e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{if(r.ok&&u.pathname.endsWith(".html")){const c=r.clone();caches.open(VERSION).then(x=>x.put(e.request,c)).catch(()=>{});}return r}).catch(()=>caches.match(e.request)));
   return;
 }
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
