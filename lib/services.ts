type AIEnvironment=Record<string,string|undefined>;
export function aiConfiguration(e:AIEnvironment=process.env):{provider:'google'|'openai',apiKey:string}|null {
 const value=(key:string)=>e[key]?.trim()||'';
 const requested=value('AI_PROVIDER').toLowerCase();
 const googleKey=value('GEMINI_API_KEY')||value('GOOGLE_GENERATIVE_AI_API_KEY')||value('GOOGLE_API_KEY');
 const openaiKey=value('OPENAI_API_KEY');
 if(requested==='google'||requested==='gemini')return googleKey?{provider:'google',apiKey:googleKey}:null;
 if(requested==='openai')return openaiKey?{provider:'openai',apiKey:openaiKey}:null;
 // Unknown explicit providers must not silently send visitor content elsewhere.
 if(requested)return null;
 return googleKey?{provider:'google',apiKey:googleKey}:openaiKey?{provider:'openai',apiKey:openaiKey}:null;
}
export function aiProvider():'google'|'openai'|null{return aiConfiguration()?.provider||null;}
export function mailProvider(): 'brevo'|'resend'|null {
 const e=process.env;if(!e.MAIL_FROM)return null;
 if(e.MAIL_PROVIDER==='brevo')return e.BREVO_API_KEY?'brevo':null;
 if(e.MAIL_PROVIDER==='resend')return e.RESEND_API_KEY?'resend':null;
 return e.BREVO_API_KEY?'brevo':e.RESEND_API_KEY?'resend':null;
}

