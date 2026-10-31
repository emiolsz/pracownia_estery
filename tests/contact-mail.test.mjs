import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import ts from'typescript';
const moduleURL=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const services=moduleURL(compile(await readFile(new URL('../lib/services.ts',import.meta.url),'utf8')));
const source=compile(await readFile(new URL('../lib/contact-mail.ts',import.meta.url),'utf8')).replace("'./services'",JSON.stringify(services));const{sendContactMessage}=await import(moduleURL(source));
const savedEnv={...process.env},oldFetch=globalThis.fetch;let called;
try{delete process.env.BREVO_API_KEY;delete process.env.RESEND_API_KEY;delete process.env.MAIL_FROM;await assert.rejects(()=>sendContactMessage({}));
process.env.MAIL_PROVIDER='brevo';process.env.BREVO_API_KEY='test';process.env.MAIL_FROM='Pracownia <sender@example.test>';process.env.CONTACT_EMAIL='owner@example.test';globalThis.fetch=async(url,options)=>{called={url,body:JSON.parse(options.body)};return new Response('{}',{status:201});};
const input={name:'Visitor',email:'visitor@example.test',subject:'Pytanie\nNagłówek',message:'Treść wiadomości',requestId:'test-id'};await sendContactMessage(input);
assert.equal(called.url,'https://api.brevo.com/v3/smtp/email');assert.equal(called.body.to[0].email,'owner@example.test');assert.equal(called.body.replyTo.email,'visitor@example.test');assert.equal(called.body.sender.email,'sender@example.test');assert.equal(called.body.subject.includes('\n'),false);
process.env.MAIL_PROVIDER='resend';process.env.RESEND_API_KEY='test';await sendContactMessage(input);assert.equal(called.body.to[0],'owner@example.test');assert.equal(called.body.reply_to,'visitor@example.test');assert.ok(called.body.text.includes(input.message));
globalThis.fetch=async()=>new Response('{}',{status:503});await assert.rejects(()=>sendContactMessage(input),/Nie otrzymano potwierdzenia/);
console.log('PASS contact recipient fixed, visitor only Reply-To, no send without configuration, Brevo/Resend formats, provider rejection reported');
}finally{globalThis.fetch=oldFetch;for(const key of Object.keys(process.env))if(!(key in savedEnv))delete process.env[key];Object.assign(process.env,savedEnv);}
