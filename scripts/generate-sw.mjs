import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const assets = [
  ...(await readdir("dist/assets")).map((f) => `/assets/${f}`),
  ...(await readdir("dist/fonts"))
    .filter((f) => f.endsWith(".ttf"))
    .map((f) => `/fonts/${f}`),
  ...(await readdir("dist/library"))
    .filter((f) => f.endsWith(".pdf"))
    .map((f) => `/library/${f}`),
];
const html = await readFile("dist/index.html", "utf8");
const version = createHash("sha256")
  .update(assets.join("|") + html)
  .digest("hex")
  .slice(0, 12);
await writeFile(
  "dist/sw.js",
  `
const CACHE='gatenova-${version}';
const ASSETS=${JSON.stringify(assets)};
const INDEX=${JSON.stringify(html)};
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll(ASSETS);
 // Cache the index from this build, even if a deployment changes the server mid-install.
 await cache.put('/index.html',new Response(INDEX,{headers:{'Content-Type':'text/html; charset=utf-8'}}));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=(await caches.keys()).filter(k=>k.startsWith('gatenova-'));
 // Keep one previous build for lazy chunks still referenced by an already-open tab.
 await Promise.all(keys.filter(k=>k!==CACHE).slice(0,Math.max(0,keys.length-2)).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(event.request.mode==='navigate')event.respondWith(fetch(event.request).catch(async()=>{
   const cache=await caches.open(CACHE);return cache.match('/index.html');
 }));
 else if(/^\\/(assets|fonts|library)\\//.test(url.pathname))event.respondWith((async()=>{
   const cached=await caches.match(event.request);if(cached)return cached;
   const response=await fetch(event.request);
   if(response.ok){const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());}
   return response;
 })());
});
`,
);
