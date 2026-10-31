import {mailProvider} from './services';
export function contactRecipient(){const email=(process.env.CONTACT_EMAIL||process.env.ADMIN_EMAIL||'').trim();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:'';}
export async function sendContactMessage(input:{name:string,email:string,subject:string,message:string,requestId:string}){
 const e=process.env,provider=mailProvider(),to=contactRecipient();if(!provider||!to)throw new Error('Wysyłka bezpośrednia nie jest jeszcze aktywna. Skorzystaj z programu pocztowego.');
 const subject='[Pracownia Estery] '+input.subject.replace(/[\r\n]/g,' '),name=input.name.replace(/[\r\n]/g,' ');
 const text='Wiadomość z formularza Pracowni Estery\n\nOd: '+name+' <'+input.email+'>\nTemat: '+input.subject+'\n\n'+input.message;
 let response:Response;
 if(provider==='brevo'){
 const from=(e.MAIL_FROM!.match(/<([^<>]+)>/)?.[1]||e.MAIL_FROM!).trim();
 response=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':e.BREVO_API_KEY!,'Content-Type':'application/json'},body:JSON.stringify({sender:{email:from,name:'Pracownia Estery'},to:[{email:to}],replyTo:{email:input.email,name},subject,textContent:text,headers:{IdempotencyKey:'contact:'+input.requestId}}),signal:AbortSignal.timeout(20000)});
 }else{
 response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+e.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'contact:'+input.requestId},body:JSON.stringify({from:e.MAIL_FROM,to:[to],reply_to:input.email,subject,text}),signal:AbortSignal.timeout(20000)});
 }
 if(!response.ok)throw new Error('Nie otrzymano potwierdzenia od usługi pocztowej. Możesz spróbować później lub wysłać wiadomość z programu pocztowego.');
}
