const CACHE_NAME = 'zhakori-offline-v11';
const BASE = self.registration.scope;
const APP_FILES = [new URL('./',BASE).href,new URL('./index.html',BASE).href,new URL('./zhakori-teacher.html',BASE).href,new URL('./manifest.json',BASE).href];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE_NAME).then(cache=>cache.put(e.request,copy));}return r;}).catch(()=>caches.match(new URL('./index.html',BASE).href))))});