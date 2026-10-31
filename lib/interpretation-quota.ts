type Database=(path:string,method?:string,body?:unknown,prefer?:string)=>Promise<any>;
export class InterpretationQuotaError extends Error {status=429;}
// Each unique slot is an atomic reservation in the existing private usage table.
// Negative count identifies its lease; 1 marks a completed interpretation.
export async function reserveInterpretationQuota(db:Database,day:string,actor:string,limit:number){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!/^[a-f0-9]{64}$/.test(actor)||![3,20].includes(limit))throw new Error('Invalid quota identity');
 const token=-(crypto.getRandomValues(new Uint32Array(1))[0]%2147483646+1);
 const keys:string[]=[];
 const selection=()=>`estera_usage?key=in.(${keys.join(',')})&count=eq.${token}`;
 const release=async()=>{if(keys.length)await db(selection(),'DELETE');};
 async function acquire(prefix:string,capacity:number){
  const filter='key=like.'+encodeURIComponent(prefix+'*');
  await db('estera_usage?'+filter+'&count=lt.0&created_at=lt.'+encodeURIComponent(new Date(Date.now()-180000).toISOString()),'DELETE');
  const rows=await db('estera_usage?select=key&'+filter);
  const occupied=new Set(rows.map((row:{key:string})=>row.key));
  for(let slot=0;slot<capacity;slot++){
   const key=prefix+slot;if(occupied.has(key))continue;
   const inserted=await db('estera_usage?on_conflict=key','POST',{key,count:token},'resolution=ignore-duplicates,return=representation');
   if(Array.isArray(inserted)&&inserted.length===1){keys.push(key);return true;}
  }
  return false;
 }
 try{
  if(!await acquire(`interpret-v2:${day}:${actor}:`,limit))throw new InterpretationQuotaError('Dzisiejszy limit udanych interpretacji został wykorzystany. Wróć jutro.');
  if(!await acquire(`interpret-v2:${day}:global:`,200))throw new InterpretationQuotaError('Dzisiejszy limit pracowni został wykorzystany. Wróć jutro.');
 }catch(error){await release();throw error;}
 return {
  release,
  commit:async()=>{
   const rows=await db(selection(),'PATCH',{count:1},'return=representation');
   if(!Array.isArray(rows)||rows.length!==2)throw new Error('Nie udało się potwierdzić limitu interpretacji.');
  }
 };
}
