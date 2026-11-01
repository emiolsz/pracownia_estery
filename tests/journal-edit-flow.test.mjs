import{PDFDocument}from'pdf-lib';import{createServer}from'node:http';import{spawn}from'node:child_process';import assert from'node:assert/strict';
const id='11111111-1111-4111-8111-111111111111',entryId='22222222-2222-4222-8222-222222222222',foreignId='33333333-3333-4333-8333-333333333333';
let entry={id:entryId,owner:id,title:'Pierwszy sen',dream_date:'2026-10-31',story:'Oryginalny opis',feeling:'Spokój',interpretation:'Pierwsza interpretacja'},meta={},writes=0,profileWrites=0,lastQuery='';
const mock=createServer(async(req,res)=>{res.setHeader('Content-Type','application/json');let body;if(req.method!=='GET'){let raw='';for await(const c of req)raw+=c;body=raw?JSON.parse(raw):{};}
if(req.url==='/auth/v1/user'){if(req.method==='PUT'){assert.deepEqual(Object.keys(body),['data']);assert.deepEqual(Object.keys(body.data).sort(),['estera_journal_gender','estera_journal_name']);meta={...meta,...body.data};profileWrites++;}res.end(JSON.stringify({id,email:'owner@example.test',email_confirmed_at:'2026-01-01',user_metadata:meta,app_metadata:{estera_vip:false}}));}
else if(req.url.startsWith('/rest/v1/estera_dreams')&&req.method==='PATCH'){const q=new URL('http://local'+req.url).searchParams;assert.equal(q.get('owner'),'eq.'+id);if(q.get('id')==='eq.'+entryId){entry={...entry,...body};writes++;res.end(JSON.stringify([entry]));}else res.end('[]');}
else if(req.url.startsWith('/rest/v1/estera_dreams')){lastQuery=req.url;res.end(JSON.stringify([entry]));}else if(req.url.startsWith('/rest/v1/estera_articles'))res.end('[]');else{res.statusCode=404;res.end('{}');}});await new Promise(r=>mock.listen(3101,'127.0.0.1',r));
const child=spawn('node',['node_modules/next/dist/bin/next','start','-p','3100','-H','127.0.0.1'],{cwd:process.cwd(),env:{...process.env,SUPABASE_URL:'http://127.0.0.1:3101',SUPABASE_ANON_KEY:'test-public',SUPABASE_SERVICE_ROLE_KEY:'test-server',ADMIN_EMAIL:'owner@example.test'},stdio:'inherit'});
const call=(route,method='GET',body,auth=true)=>fetch('http://127.0.0.1:3100/api/'+route,{method,headers:{origin:'http://localhost:3100','Content-Type':'application/json',...(auth?{cookie:'estera_access=owner'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(5000)});
try{for(let i=0;i<100;i++){try{await call('me');break;}catch{await new Promise(r=>setTimeout(r,100));}}
assert.equal((await call('profile','POST',{name:'Emilia',gender:'female'},false)).status,401);
assert.equal((await call('profile','POST',{name:'Emilia',gender:'female',app_metadata:{estera_vip:true}})).status,200);assert.equal(profileWrites,1);
const me=await(await call('me')).json();assert.equal(me.user.journalName,'Emilia');assert.equal(me.user.gender,'female');assert.equal(me.isVip,false);
const payload={id:entryId,title:'Poprawiony tytuł',date:'2026-10-30',story:'Poprawiona treść',feeling:'Zaciekawienie',interpretation:'Moja redakcja interpretacji'};
assert.equal((await call('dreams','PATCH',payload)).status,200);assert.equal(writes,1);assert.equal(entry.id,entryId);assert.equal(entry.interpretation,payload.interpretation);
assert.equal((await call('dreams','PATCH',{...payload,id:foreignId})).status,404);assert.equal(writes,1);
assert.notEqual((await call('dreams','PATCH',payload,false)).status,200);assert.equal(writes,1);
const exported=await call('journal/export?from=2026-01-01&to=2026-12-31');assert.equal(exported.status,200);assert.ok(lastQuery.includes('dream_date=gte.2026-01-01'));assert.ok(lastQuery.includes('dream_date=lte.2026-12-31'));assert.ok(lastQuery.includes('owner=eq.'+id));const pdf=await PDFDocument.load(await exported.arrayBuffer());assert.equal(pdf.getTitle(),'Sennik - Emilia');assert.equal((await call('journal/export?from=2026-12-31&to=2026-01-01')).status,400);assert.equal((await call('journal/export?from=2026-02-30')).status,400);assert.equal((await call('journal/export?order=desc')).status,200);assert.ok(lastQuery.includes('order=dream_date.desc,created_at.desc'));assert.equal((await call('journal/export?order=invalid')).status,400);
assert.equal((await call('journal/export','POST',{excludeIds:[entryId],coverStyle:'cream'})).status,400);
assert.equal((await call('journal/export','POST',{excludeIds:[],coverStyle:'cream'})).status,200);
assert.equal((await call('journal/export','POST',{excludeIds:[foreignId],coverStyle:'navy'})).status,200);
assert.equal((await call('journal/export','POST',{excludeIds:['invalid'],coverStyle:'navy'})).status,400);
assert.equal((await call('journal/export','POST',{excludeIds:[],coverStyle:'unknown'})).status,400);
assert.equal((await call('journal/export','POST',{excludeIds:[],coverStyle:'cream'},false)).status,401);
console.log('PASS print exclusions, empty selection rejected, foreign IDs never expose data, cover validation, guest export blocked');
console.log('PASS own profile name/gender, privilege fields ignored, edit updates same dream, owner filter mandatory, foreign entry404, guest blocked');
}finally{child.kill('SIGTERM');mock.close();}
