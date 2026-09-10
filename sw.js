const VERSION="voxel-survival-shell-v22";
const SHELL=["./","./index.html","./css/main.css","./css/menu.css","./css/hud.css","./css/mobile.css","./manifest.webmanifest","./js/main.js?v=22","./js/config.js?v=22","./js/QualityManager.js?v=22"];
self.addEventListener("install",e=>e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(u.origin!==location.origin)return; if(u.pathname.endsWith(".js")){e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{if(r.ok){const copy=r.clone();caches.open(VERSION).then(c=>c.put(e.request,copy)).catch(()=>{});}return r;}).catch(()=>caches.match(e.request)));return;} e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
