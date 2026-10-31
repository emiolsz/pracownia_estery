import {createServer}from'node:http';import{spawn}from'node:child_process';import assert from'node:assert/strict';
const owner={id:'11111111-1111-4111-8111-111111111111',email:'owner@example.test',email_confirmed_at:'2026-01-01',app_metadata:{}};
const editor={id:'22222222-2222-4222-8222-222222222222',email:'editor@example.test',email_confirmed_at:'2026-01-01',app_metadata:{estera_editor_until:new Date(Date.now()+86400000).toISOString(),estera_vip:false,soul_decoder_access:'keep'}};
const ordinary={id:'33333333-3333-4333-8333-333333333333',email:'ordinary@example.test',email_confirmed_at:'2026-01-01',app_metadata:{},user_metadata:{estera_editor_until:'2099-01-01'}};
let lease=null,draftWrites=0,roleWrites=0;
const mock=createServer(async(req,res)=>{res.setHeader('Content-Type','application/json');let body; if(req.method!=='GET'){let raw='';for await(const c of req)raw+=c;body=raw?JSON.parse(raw):{};}
if(req.url==='/auth/v1/user'){res.end(JSON.stringify(req.headers.authorization==='Bearer owner'?owner:req.headers.authorization==='Bearer editor'?editor:ordinary));}
else if(req.url.startsWith('/auth/v1/admin/users?'))res.end(JSON.stringify({users:[owner,editor,ordinary]}));
else if(req.url==='/auth/v1/admin/users/'+editor.id&&req.method==='PUT'){for(const[k,v]of Object.entries(body.app_metadata)){if(v===null)delete editor.app_metadata[k];else editor.app_metadata[k]=v;}roleWrites++;res.end(JSON.stringify(editor));}
else if(req.url.startsWith('/rest/v1/estera_usage')){if(req.method==='DELETE'){const q=new URL('http://local'+req.url).searchParams;if(!q.has('created_at'))lease=null;res.statusCode=204;res.end();}else{const rows=lease?[]:[body];if(!lease)lease=body;res.end(JSON.stringify(rows));}}
else if(req.url.startsWith('/rest/v1/estera_articles'))res.end(JSON.stringify([{id:'44444444-4444-4444-8444-444444444444',title:'Szkic',body:'Treść robocza'}]));
else if(req.url==='/rest/v1/rpc/estera_save_article'){assert.equal(body.publish_now,false);draftWrites++;res.end('null');}
else{res.statusCode=404;res.end('{}');}});await new Promise(r=>mock.listen(3101,'127.0.0.1',r));
const child=spawn('node',['node_modules/next/dist/bin/next','start','-p','3100','-H','127.0.0.1'],{cwd:process.cwd(),env:{...process.env,SUPABASE_URL:'http://127.0.0.1:3101',SUPABASE_ANON_KEY:'test-public',SUPABASE_SERVICE_ROLE_KEY:'test-server',ADMIN_EMAIL:owner.email},stdio:'inherit'});
const base='http://127.0.0.1:3100';const call=(path,token,body)=>fetch(base+'/api/'+path,{method:body?'POST':'GET',headers:{origin:'http://localhost:3100','Content-Type':'application/json',...(token?{cookie:'estera_access='+token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(5000)});
try{for(let i=0;i<100;i++){try{await call('me');break;}catch{await new Promise(r=>setTimeout(r,100));}}
assert.equal((await call('admin/editors')).status,401);
assert.equal((await call('admin/editors','editor')).status,403);
assert.equal((await call('admin/editors','editor',{action:'grant',email:ordinary.email,until:'2099-01-01'})).status,403);
assert.equal((await call('admin/vip','editor',{action:'grant',email:ordinary.email})).status,403);
assert.equal((await call('articles?edit=1','ordinary')).status,403);
assert.equal((await call('articles?edit=1','editor')).status,200);
const article={title:'Szkic redaktora',body:'Pełna treść',published:false};
assert.equal((await call('articles','editor',article)).status,200);assert.equal(draftWrites,1);
assert.equal((await call('articles','editor',{...article,published:true})).status,403);assert.equal(draftWrites,1);
let me=await(await call('me','editor')).json();assert.equal(me.isEditor,true);assert.equal(me.isAdmin,false);assert.equal(me.journalExportAllowed,false);
assert.equal((await call('admin/editors','owner',{action:'revoke',email:editor.email})).status,200);
assert.equal((await call('articles?edit=1','editor')).status,403);assert.equal((await call('articles','editor',article)).status,403);
assert.equal((await call('admin/editors','owner',{action:'grant',email:editor.email,until:'2020-01-01'})).status,400);
assert.equal((await call('admin/editors','owner',{action:'grant',email:editor.email,until:new Date(Date.now()+86400000).toISOString()})).status,200);
assert.equal((await call('articles?edit=1','editor')).status,200);
editor.app_metadata.estera_editor_until='2020-01-01T00:00:00Z';assert.equal((await call('articles','editor',article)).status,403);
assert.equal(editor.app_metadata.soul_decoder_access,'keep');assert.equal(roleWrites,2);
console.log('PASS full editor routes: owner-only appointments, no VIP/roles access, drafts allowed, publishing blocked, revoke and expiry immediate, forged user metadata ignored');
}finally{child.kill('SIGTERM');mock.close();}
