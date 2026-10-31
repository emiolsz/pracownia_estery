import {aiConfiguration} from './services';
export class InterpretationError extends Error {constructor(message:string,public status=502){super(message);}}
export async function interpretText(instructions:string,input:string){
 const e=process.env,config=aiConfiguration();
 if(config?.provider==='google'){
  const model=e.GEMINI_MODEL||'gemini-3.8-flash',started=Date.now();
  let phase='connect';
  try{
   const signal=AbortSignal.timeout(90000);
   let response:Response|undefined;
   for(let attempt=0;attempt<3;attempt++){
   response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':streamGenerateContent?alt=sse',{
    method:'POST',headers:{'x-goog-api-key':config.apiKey,'Content-Type':'application/json'},
    body:JSON.stringify({systemInstruction:{parts:[{text:instructions}]},contents:[{role:'user',parts:[{text:input}]}],generationConfig:{maxOutputTokens:3000,thinkingConfig:{thinkingLevel:'low',includeThoughts:false}}}),
    signal
   });
   if(![502,503,504].includes(response.status)||attempt===2)break;
   console.info('google_api_retry',{status:response.status,attempt:attempt+1});
   await response.body?.cancel();
   await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
   }
   if(!response)throw new InterpretationError('Google AI nie zwróciło odpowiedzi.');
   phase='response';
   console.info('google_api_response',{status:response.status,elapsedMs:Date.now()-started,model});
   if(!response.ok){
    if(response.status===429)throw new InterpretationError('Google AI osiągnęło limit zapytań. Spróbuj ponownie później.',429);
    if(response.status===401||response.status===403)throw new InterpretationError('Połączenie z Google AI wymaga sprawdzenia klucza API i jego uprawnień.',503);
    if(response.status===400)throw new InterpretationError('Google AI odrzuciło konfigurację zapytania. Administratorka musi sprawdzić ustawienia modelu.',503);
    if(response.status===404)throw new InterpretationError('Wybrany model Google AI nie jest dostępny. Administratorka musi sprawdzić konfigurację.',503);
    throw new InterpretationError('Google AI zwróciło błąd usługi. Spróbuj ponownie później.',502);
   }
   phase='body';
   if(!response.body)throw new InterpretationError('Google AI zwróciło pustą odpowiedź.');
   const reader=response.body.getReader(),decoder=new TextDecoder();
   let pending='',answer='',finished=false;
   const consume=(event:string)=>{
    const data=event.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n').trim();
    if(!data||data==='[DONE]')return;
    const result=JSON.parse(data);
    if(result.error)throw new InterpretationError('Google AI przerwało generowanie odpowiedzi.');
    const candidate=result.candidates?.[0];
    if(candidate?.finishReason==='MAX_TOKENS')throw new InterpretationError('Interpretacja okazała się zbyt długa. Spróbuj opisać sen krócej.');
    if(candidate?.finishReason==='STOP')finished=true;
    answer+=(candidate?.content?.parts||[]).filter((part:any)=>typeof part.text==='string'&&!part.thought).map((part:any)=>part.text).join('');
   };
   try{
    while(true){
     const chunk=await reader.read();
     pending+=decoder.decode(chunk.value||new Uint8Array(),{stream:!chunk.done});
     let match:RegExpExecArray|null;
     while((match=/\r?\n\r?\n/.exec(pending))){
      consume(pending.slice(0,match.index));
      pending=pending.slice(match.index+match[0].length);
     }
     if(chunk.done)break;
    }
    if(pending.trim())consume(pending);
   }finally{reader.releaseLock();}
   answer=answer.trim();
   if(!finished&&answer)throw new InterpretationError('Google AI nie zakończyło interpretacji. Spróbuj ponownie.');
   if(!answer)throw new InterpretationError('Nie udało się przygotować interpretacji. Spróbuj opisać sen innymi słowami.');
   return answer;
  }catch(error){
   if(error instanceof InterpretationError)throw error;
   const detail=error as {name?:string,cause?:{name?:string,code?:string}};
   console.error('google_interpretation_failed',{phase,name:detail?.name||'UnknownError',causeCode:detail?.cause?.code||null,elapsedMs:Date.now()-started,model});
   if(detail?.name==='TimeoutError'||detail?.name==='AbortError')throw new InterpretationError('Google AI przekroczyło czas oczekiwania. Spróbuj ponownie za chwilę.',504);
   throw new InterpretationError('Nie udało się połączyć z Google AI. Spróbuj ponownie później.',502);
  }
 }
 if(config?.provider!=='openai')throw new InterpretationError('Interpretacje AI czekają na podłączenie. Możesz pobrać wpisany sen jako PDF.',503);
 const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+config.apiKey,'Content-Type':'application/json'},body:JSON.stringify({model:e.OPENAI_MODEL||'gpt-4.1-mini',store:false,max_output_tokens:1800,instructions,input}),signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw new InterpretationError('AI nie odpowiedziało poprawnie. Spróbuj ponownie później.',response.status===429?429:502);
 const result=await response.json();
 const answer=(result.output||[]).flatMap((x:any)=>x.content||[]).filter((x:any)=>x.type==='output_text').map((x:any)=>x.text).join('\n\n');
 if(!answer)throw new InterpretationError('Nie udało się odczytać interpretacji.');
 return answer;
}

