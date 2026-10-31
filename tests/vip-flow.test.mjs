import {createServer}from'node:http';import{spawn}from'node:child_process';import assert from'node:assert/strict';
const ownerId='11111111-1111-4111-8111-111111111111',loyalId='22222222-2222-4222-8222-222222222222';let changes=0;const loyal={id:loyalId,email:'loyal@example.test',email_confirmed_at:'2026-01-01',app_metadata:{provider:'email',soul_decoder_role:'keep'},user_metadata:{estera_vip:true}};
const mock=createServer(async(req,res)=>{res.setHeader('Content-Type','application/json');if(req.url==='/auth/v1/user'){const token=req.headers.authorization?.split(' ')[1];res.end(JSON.stringify(token==='owner'?{id:ownerId,email:'owner@example.test',email_confirmed_at:'2026-01-01',app_metadata:{}}:loyal));}else if(req.url.startsWith('/auth/v1/admin/users?')){res.end(JSON.stringify({users:[loyal]}));}else if(req.url==='/auth/v1/admin/users/'+loyalId&&req.method==='PUT'){let raw='';for await(const c of req)raw+=c;const body=JSON.parse(raw);assert.deepEqual(Object.keys(body),['app_metadata']);loyal.app_metadata={...loyal.app_metadata,...body.app_metadata};changes++;res.end(JSON.stringify(loyal));}else if(req.url.startsWith('/rest/v1/estera_dreams'))res.end(JSON.stringify([{title:'Test',dream_date:'2026-10-31',story:'Prywatny sen',interpretation:'Refleksja'}]));else{res.statusCode=404;res.end('{}');}});await new Promise(r=>mock.listen(3101,'127.0.0.1',r));
const child=spawn('node',['node_modules/next/dist/bin/next','start','-p','3100','-H','127.0.0.1'],{cwd:process.cwd(),env:{...process.env,SUPABASE_URL:'http://127.0.0.1:3101',SUPABASE_ANON_KEY:'test-public',SUPABASE_SERVICE_ROLE_KEY:'test-server',ADMIN_EMAIL:'owner@example.test'},stdio:'inherit'});
const base='http://127.0.0.1:3100';const call=(token,body,origin='http://localhost:3100')=>fetch(base+'/api/admin/vip',{method:'POST',headers:{origin,'Content-Type':'application/json',...(token?{cookie:'estera_access='+token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(5000)});
try{for(let i=0;i<100;i++){try{await fetch(base+'/api/me',{signal:AbortSignal.timeout(1000)});break;}catch{await new Promise(r=>setTimeout(r,100));}}
let guest=await call(null,{email:loyal.email,action:'grant'});assert.equal(guest.status,401);
assert.equal((await call('loyal',{email:loyal.email,action:'grant'})).status,403);
assert.equal((await call('owner',{email:loyal.email,action:'grant'},'https://evil.example')).status,400);
assert.equal(changes,0);
assert.equal((await call('owner',{email:'missing@example.test',action:'inspect'})).status,404);
let r=await call('owner',{email:loyal.email,action:'inspect'});let target=await r.json();assert.equal(target.isVip,false);assert.equal(target.id,loyalId);
assert.equal((await fetch(base+'/api/journal/export',{headers:{cookie:'estera_access=loyal'}})).status,402);
assert.equal((await call('owner',{email:loyal.email,action:'grant',userId:ownerId})).status,409);
r=await call('owner',{email:loyal.email,action:'grant',userId:loyalId});assert.equal(r.status,200);assert.equal((await r.json()).isVip,true);
r=await fetch(base+'/api/me',{headers:{cookie:'estera_access=loyal'}});let me=await r.json();assert.equal(me.isVip,true);assert.equal(me.isAdmin,false);assert.equal(me.journalExportAllowed,true);
r=await fetch(base+'/api/journal/export',{headers:{cookie:'estera_access=loyal'}});assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'application/pdf');
assert.equal((await call('owner',{email:loyal.email,action:'revoke',userId:loyalId})).status,200);
assert.equal((await fetch(base+'/api/journal/export',{headers:{cookie:'estera_access=loyal'}})).status,402);
assert.equal(loyal.app_metadata.soul_decoder_role,'keep');assert.equal(changes,2);
console.log('PASS full VIP flow: guest401, user403, CSRF400, missing404, stale-target409, grant, fresh VIP access200, no admin elevation, revoke402, other app preserved, forged user metadata ignored');
}finally{child.kill('SIGTERM');mock.close();}
