import {json,fail,mutation,text,databaseReady,takeQuota} from '@/lib/server';
import {mailProvider} from '@/lib/services';
import {contactRecipient,sendContactMessage} from '@/lib/contact-mail';
export const dynamic='force-dynamic';export const maxDuration=45;
export async function POST(r:Request){try{mutation(r);
 if(!mailProvider()||!contactRecipient()||!databaseReady())return json({error:'Wysyłka bezpośrednia jest jeszcze nieaktywna. Skorzystaj z opcji otwarcia programu pocztowego.'},503);
 const b=await r.json();if(b.website)throw new Error('Nie udało się przyjąć formularza.');
 const name=text(b.name,100),email=text(b.email,254),subject=text(b.subject,150),message=text(b.message,4000),requestId=text(b.requestId,36);
 if(!name||!subject||message.length<5||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.test(requestId))throw new Error('Uzupełnij poprawnie wszystkie pola formularza.');
 const day=new Date().toISOString().slice(0,10),ip=r.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||'anonymous';
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(day+'|'+ip));const actor=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
 if(!await takeQuota('contact:'+day+':'+actor,3)||!await takeQuota('contact:'+day+':global',50))return json({error:'Limit formularza został osiągnięty. Napisz bezpośrednio z programu pocztowego.'},429);
 await sendContactMessage({name,email,subject,message,requestId});return json({ok:true});
 }catch(e){return fail(e);}}
