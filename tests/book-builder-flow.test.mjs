import {createServer} from 'node:http';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';import {PDFDocument} from 'pdf-lib';
const owner='11111111-1111-4111-8111-111111111111',one='22222222-2222-4222-8222-222222222222',two='33333333-3333-4333-8333-333333333333',foreign='44444444-4444-4444-8444-444444444444';
const rows=[one,two].map((id,i)=>({id,title:'Sen '+(i+1),dream_date:'2026-11-01',story:'Zapisany sen.',feeling:'Spokój',interpretation:'Refleksja.'}));let meta={estera_journal_name:'Emilia',estera_journal_gender:'female'},writes=0;
const mock=createServer(async(req,res)=>{res.setHeader('Content-Type','application/json');let body={};if(req.method!=='GET'){let raw='';for await(const part of req)raw+=part;body=JSON.parse(raw||'{}');}
 if(req.url==='/auth/v1/user'){if(req.method==='PUT'){assert.deepEqual(Object.keys(body),['data']);assert.deepEqual(Object.keys(body.data),['estera_book_draft']);meta={...meta,...body.data};writes++;}res.end(JSON.stringify({id:owner,email:'owner@example.test',email_confirmed_at:'2026-01-01',user_metadata:meta,app_metadata:{estera_vip:false}}));}
 else if(req.url.startsWith('/rest/v1/estera_dreams')){assert.equal(new URL('http://local'+req.url).searchParams.get('owner'),'eq.'+owner);res.end(JSON.stringify(rows));}else res.end('[]');});await new Promise(r=>mock.listen(3101,'127.0.0.1',r));
const child=spawn('node',['node_modules/next/dist/bin/next','start','-p','3100','-H','127.0.0.1'],{env:{...process.env,SUPABASE_URL:'http://127.0.0.1:3101',SUPABASE_ANON_KEY:'test',SUPABASE_SERVICE_ROLE_KEY:'test',ADMIN_EMAIL:'owner@example.test'},stdio:'inherit'});
const call=(route,method='GET',body,auth=true,origin='http://localhost:3100')=>fetch('http://127.0.0.1:3100/api/'+route,{method,headers:{origin,'Content-Type':'application/json',...(auth?{cookie:'estera_access=owner'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
try{for(let i=0;i<100;i++){try{await call('me');break;}catch{await new Promise(r=>setTimeout(r,100));}}
 assert.equal((await call('journal/draft','GET',undefined,false)).status,401);assert.equal((await(await call('journal/draft')).json()).draft,null);
 const draft={version:1,name:'Emilia',coverStyle:'cream',fontStyle:'lora',from:'2026-01-01',to:'2026-12-31',order:'desc',includeIds:[two]};
 assert.equal((await call('journal/draft','POST',{draft},false)).status,401);assert.equal((await call('journal/draft','POST',{draft},true,'https://foreign.test')).status,400);
 assert.equal((await call('journal/draft','POST',{draft:{...draft,fontStyle:'unknown'}})).status,400);assert.equal(writes,0);
 assert.equal((await call('journal/draft','POST',{draft,app_metadata:{estera_vip:true}})).status,200);assert.equal(writes,1);
 const restored=(await(await call('journal/draft')).json()).draft;for(const key of Object.keys(draft))assert.deepEqual(restored[key],draft[key]);assert.ok(restored.updatedAt);assert.equal(meta.estera_journal_gender,'female');assert.equal((await(await call('me')).json()).isVip,false);
 const payload={excludeIds:[],includeIds:[two],coverStyle:'cream',fontStyle:'lora',name:'Emilia'};
 const r=await call('journal/export','POST',payload);assert.equal(r.status,200);const pdf=await PDFDocument.load(await r.arrayBuffer());assert.equal(pdf.getPageCount(),5);assert.equal(pdf.getTitle(),'Sennik - Emilia');
 assert.equal((await call('journal/export','POST',{...payload,includeIds:[]})).status,400);assert.equal((await call('journal/export','POST',{...payload,includeIds:[foreign]})).status,400);assert.equal((await call('journal/export','POST',{...payload,fontStyle:'bad'})).status,400);
 assert.equal((await call('journal/draft','POST',{draft:{...draft,from:'2026-02-30'}})).status,400);
 console.log('PASS private draft save/restore, date/font/ID validation, origin and session, roles unchanged, exact selected-own-entry PDF');
}finally{child.kill('SIGTERM');mock.close();}
