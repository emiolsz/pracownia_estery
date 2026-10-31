export function journalAccess(u:{email:string,ebookAccessUntil?:string|null,isVip?:boolean}|null,ownerEmail?:string,now=Date.now()){
 if(!u)return false;
 if(u.isVip===true)return true;
 if(ownerEmail?.trim()&&u.email.toLowerCase()===ownerEmail.trim().toLowerCase())return true;
 const until=u.ebookAccessUntil?Date.parse(u.ebookAccessUntil):NaN;
 return Number.isFinite(until)&&until>now;
}
