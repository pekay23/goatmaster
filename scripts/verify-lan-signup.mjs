import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {query,runWithDbContext} from '../lib/db.js';
const base=process.env.E2E_BASE_URL||'http://192.168.8.202:3001';
const browser=await chromium.launch({headless:true,executablePath:process.env.E2E_BROWSER_PATH||join(homedir(),'AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe')});
const context=await browser.newContext();const page=await context.newPage();
const name='Sample LAN verification '+randomBytes(4).toString('hex');
const email='lan-'+randomBytes(8).toString('hex')+'@sample.goatmaster.invalid';
let account;
try{
 await page.goto(base+'/signup?plan=basic');
 await page.getByLabel('Farm or account name').fill(name);
 await page.getByLabel('Email',{exact:true}).fill(email);
 await page.getByLabel(/^Password/).fill(randomBytes(20).toString('base64url'));
 const saved=page.waitForResponse(response=>response.url()===base+'/api/auth/signup'&&response.request().method()==='POST');
 await page.getByRole('button',{name:'Create account',exact:true}).click();
 const response=await saved;const result=await response.json();account=result.data;
 assert.equal(response.status(),201,JSON.stringify(result));
 await page.waitForURL(base+'/settings?tab=billing&plan=basic',{timeout:60000});
 await page.getByRole('heading',{name:'Settings',exact:true}).waitFor({timeout:30000});
 const session=await page.evaluate(async()=>{const result=await fetch('/api/auth/me');return {status:result.status,body:await result.json()};});
 assert.equal(session.status,200);assert.equal(session.body.data.email,email);assert.equal(session.body.data.tier,'free');
 for(const origin of ['https://untrusted.example',base.replace(':3001',':3000')]){
  const rejected=await context.request.post(base+'/api/auth/signup',{data:{},headers:{origin}});assert.equal(rejected.status(),403);
 }
 console.log('PASS LAN signup form, session cookie, selected-plan continuation, and cross-origin rejection');
}finally{
 await context.close();await browser.close();
 if(account?.id&&account?.organization_id)await runWithDbContext({role:'service'},async()=>{
  await query('DELETE FROM users WHERE id=$1 AND email=$2',[account.id,email]);
  await query('DELETE FROM organizations WHERE id=$1 AND name=$2',[account.organization_id,name]);
 });
}
process.exit(0);
