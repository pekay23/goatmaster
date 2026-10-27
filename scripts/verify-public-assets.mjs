import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
const base=process.env.E2E_BASE_URL||'http://localhost:3317';
const artifacts=new URL('../.verification/e2e/',import.meta.url);
await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.E2E_BROWSER_PATH||join(homedir(),'AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe')});
const context=await browser.newContext({baseURL:base,reducedMotion:'reduce'});
const page=await context.newPage();page.setDefaultTimeout(30000);
const errors=[];page.on('pageerror',error=>errors.push(error.message));
let assetCount=0;
try{
 const assets=new Set(['/favicon.ico','/favicon-16x16.svg','/favicon-16x16.png','/apple-touch-icon.png','/apple-touch-icon.svg','/offline.html','/icon-192.png','/icon-512.png','/fonts/dm-sans.woff2','/fonts/fraunces.woff2','/fonts/fraunces-italic.woff2']);
 for(const path of ['/manifest.json','/site.webmanifest']){
  const response=await context.request.get(path);assert.equal(response.status(),200,path);
  const manifest=await response.json();assert.equal(manifest.start_url,'/dashboard');
  for(const icon of [...manifest.icons,...manifest.shortcuts.flatMap(shortcut=>shortcut.icons)])assets.add(icon.src);
  assert.ok(manifest.shortcuts.every(shortcut=>!shortcut.url.startsWith('/app/')));
 }
 for(const path of assets){const response=await context.request.get(path);assert.equal(response.status(),200,path);assetCount++;}
 console.log('PASS '+assetCount+' favicon, manifest, font and offline asset URLs');
 await page.goto(base,{waitUntil:'load',timeout:60000});
 await page.evaluate(async()=>{await document.fonts.load('500 24px "DM Sans"');await document.fonts.load('500 24px "Fraunces"');await document.fonts.load('italic 500 24px "Fraunces"');});
 assert.ok(await page.evaluate(()=>['DM Sans','Fraunces'].every(name=>Array.from(document.fonts).some(font=>font.family.replaceAll('"','')===name&&font.status==='loaded'))));
 await page.locator('img').evaluateAll(async images=>{await Promise.all(images.map(async image=>{image.loading='eager';await image.decode();if(!image.naturalWidth)throw new Error('An image failed to load');}));});
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow at '+width);
  await page.screenshot({path:new URL('marketing-final-'+width+'.png',artifacts).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true});
 }
 await page.evaluate(()=>navigator.serviceWorker.register('/sw.js'));
 await page.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated',{},{timeout:30000});
 const cached=await page.evaluate(async()=>{const name=(await caches.keys()).find(key=>key.startsWith('goatmaster-static-'));if(!name)throw new Error('Service worker static cache is missing');const cache=await caches.open(name);return (await cache.keys()).map(item=>new URL(item.url).pathname);});
 assert.ok(['/','/offline.html','/manifest.json','/icon-192.png','/icon-512.png'].every(path=>cached.includes(path)));
 await context.setOffline(true);await page.goto(base+'/uncached-offline-verification',{waitUntil:'domcontentloaded'});assert.match(await page.locator('body').innerText(),/offline|connection/i);await context.setOffline(false);
 assert.deepEqual(errors,[]);
 await writeFile(new URL('assets-report.json',artifacts),JSON.stringify({status:'passed',assetCount,fonts:'loaded',serviceWorker:'activated',offlineFallback:'passed',viewports:[1440,390],runtimeErrors:errors},null,2));
 console.log('PASS locally hosted fonts, responsive layouts, service-worker installation and offline fallback');
}finally{await context.close();await browser.close();}
