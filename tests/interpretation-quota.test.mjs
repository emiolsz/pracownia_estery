import {strict as assert} from 'node:assert';
import {reserveInterpretationQuota} from '../lib/interpretation-quota.ts';
function memory(){
 const rows=new Map            ();
 const db=async(path       ,method='GET',body     ,prefer        )=>{
  const p=new URLSearchParams(path.split('?')[1]);
  const filter=(row    )=>{
   const k=p.get('key')||'',count=p.get('count')||'',time=p.get('created_at');
   return (!k||k.startsWith('like.')&&row.key.startsWith(k.slice(5,-1))||k.startsWith('in.')&&k.slice(4,-1).split(',').includes(row.key))&&(!count||count==='lt.0'&&row.count<0||count.startsWith('eq.')&&row.count===Number(count.slice(3)))&&(!time||row.created_at<time.slice(3));
  };
  if(method==='POST'){if(rows.has(body.key))return [];const row={...body,created_at:new Date().toISOString()};rows.set(row.key,row);return [row];}
  const selected=[...rows.values()].filter(filter);
  if(method==='DELETE'){selected.forEach(x=>rows.delete(x.key));return null;}
  if(method==='PATCH'){selected.forEach(x=>Object.assign(x,body));return selected;}
  return selected;
 };
 return {db,rows};
}
const day='2026-10-31',actor='a'.repeat(64);
{
 const {db,rows}=memory();
 for(let i=0;i<6;i++){const q=await reserveInterpretationQuota(db,day,actor,3);await q.release();}
 assert.equal(rows.size,0,'failed requests must not spend quota');
 for(let i=0;i<3;i++){const q=await reserveInterpretationQuota(db,day,actor,3);await q.commit();await q.release();}
 assert.equal([...rows.values()].filter(x=>x.count===1).length,6);
 await assert.rejects(()=>reserveInterpretationQuota(db,day,actor,3),e=>e.status===429);
}
{
 const {db,rows}=memory();
 const results=await Promise.allSettled(Array.from({length:10},()=>reserveInterpretationQuota(db,day,actor,3)));
 const ok=results.filter(x=>x.status==='fulfilled');assert.equal(ok.length,3,'concurrent requests must not oversubscribe');
 await Promise.all(ok.map(x=>x.value.release()));assert.equal(rows.size,0);
}
{
 const {db,rows}=memory();
 const q=await reserveInterpretationQuota(db,day,actor,3);
 for(const row of rows.values())row.created_at='2026-01-01T00:00:00.000Z';
 const newer=await reserveInterpretationQuota(db,day,actor,3);
 await q.release();assert.equal(rows.size,2,'old lease must not delete newer reservation');
 await newer.release();assert.equal(rows.size,0);
}
{
 const {db,rows}=memory();
 for(let i=0;i<200;i++)rows.set(`interpret-v2:${day}:global:${i}`,{key:`interpret-v2:${day}:global:${i}`,count:1,created_at:new Date().toISOString()});
 await assert.rejects(()=>reserveInterpretationQuota(db,day,actor,3));
 assert.equal(rows.size,200,'global rejection must release personal reservation');
}
console.log('PASS: failures, success limit, concurrent reservations, crash recovery, lease ownership, global rejection');
