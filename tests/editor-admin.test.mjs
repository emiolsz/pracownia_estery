import assert from 'node:assert/strict';
import{editorAccess}from'../lib/editor-access.ts';
// Node's native TS loader requires explicit file extensions for this helper's type-only import, which erases at runtime.
import{activeEditors,updateEditor}from'../lib/editor-admin.ts';
const future=new Date(Date.now()+86400000).toISOString(),expired=new Date(Date.now()-86400000).toISOString();
assert.equal(editorAccess({editorUntil:future}),true);assert.equal(editorAccess({editorUntil:expired}),false);assert.equal(editorAccess({editorUntil:'invalid'}),false);
const users=Array.from({length:7},(_,i)=>({id:'id-'+i,email:'user'+i+'@example.test',email_confirmed_at:'2026-01-01',app_metadata:{estera_vip:true,soul_decoder_access:'keep',estera_editor_until:i<5?future:expired}}));
let lease=null,updates=0;
const db=async(path,method,body)=>{if(method==='DELETE'){const params=new URL('http://local/'+path).searchParams;if(params.has('created_at')){if(lease&&Date.parse(lease.created_at)<Date.parse(params.get('created_at').slice(3)))lease=null;}else if(lease&&'eq.'+lease.count===params.get('count'))lease=null;return null;}
if(lease)return[];lease={...body,created_at:new Date().toISOString()};return[lease];};
const request=async(path,method='GET',body)=>{if(method==='GET')return{users:structuredClone(users)};const target=users.find(u=>'users/'+u.id===path);for(const[k,v]of Object.entries(body.app_metadata)){if(v===null)delete target.app_metadata[k];else target.app_metadata[k]=v;}updates++;return structuredClone(target);};
assert.equal(activeEditors(users).length,5);
await assert.rejects(()=>updateEditor(db,request,users[5].email,future,'admin','owner@example.test'),/5 miejsc/);assert.equal(updates,0);assert.equal(lease,null);
await updateEditor(db,request,users[0].email,null,'admin','owner@example.test');assert.equal(activeEditors(users).length,4);assert.equal(users[0].app_metadata.estera_editor_until,undefined);
const results=await Promise.allSettled([5,6].map(i=>updateEditor(db,request,users[i].email,future,'admin','owner@example.test')));assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(activeEditors(users).length,5);
await updateEditor(db,request,users[1].email,future,'admin','owner@example.test');assert.equal(activeEditors(users).length,5);
assert.equal(users[5].app_metadata.estera_vip,true);assert.equal(users[5].app_metadata.soul_decoder_access,'keep');assert.equal(lease,null);
console.log('PASS five-seat cap, concurrent grants, renewal, revoke/deleted metadata, expired roles, unrelated permissions retained');
