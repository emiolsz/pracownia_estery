import {generateText,APICallError} from 'ai';
import {createGoogle} from '@ai-sdk/google';
import {aiConfiguration} from './services';
export class InterpretationError extends Error {constructor(message:string,public status=502){super(message);}}
export async function interpretText(instructions:string,input:string){
 const e=process.env,config=aiConfiguration();
 if(config?.provider==='google'){
  try{
   const google=createGoogle({apiKey:config.apiKey});
   const result=await generateText({model:google(e.GEMINI_MODEL||'gemini-3.8-flash'),instructions,prompt:input,maxOutputTokens:3000,maxRetries:0,abortSignal:AbortSignal.timeout(45000),providerOptions:{google:{thinkingConfig:{thinkingLevel:'low',includeThoughts:false}}}});
   if(result.finishReason==='length')throw new InterpretationError('Interpretacja okazała się zbyt długa. Spróbuj opisać sen krócej.');
   if(!result.text.trim())throw new InterpretationError('Nie udało się przygotować interpretacji. Spróbuj opisać sen innymi słowami.');
   return result.text;
  }catch(error){
   if(error instanceof InterpretationError)throw error;
   const detail=error as {name?:string,statusCode?:number,cause?:{name?:string,code?:string}};
   console.error('google_interpretation_failed',{name:detail?.name||'UnknownError',status:detail?.statusCode||null,causeName:detail?.cause?.name||null,causeCode:detail?.cause?.code||null,model:e.GEMINI_MODEL||'gemini-3.8-flash'});
   if(APICallError.isInstance(error)){
    if(error.statusCode===429)throw new InterpretationError('Google AI osiągnęło limit zapytań. Spróbuj ponownie później.',429);
    if(error.statusCode===401||error.statusCode===403)throw new InterpretationError('Połączenie z Google AI wymaga sprawdzenia konfiguracji przez administratorkę.',503);
    if(error.statusCode===400)throw new InterpretationError('Google AI odrzuciło konfigurację zapytania. Administratorka musi sprawdzić ustawienia modelu.',503);
    if(error.statusCode===404)throw new InterpretationError('Wybrany model Google AI nie jest dostępny. Administratorka musi sprawdzić konfigurację.',503);
   }
   throw new InterpretationError('Google AI nie odpowiedziało. Spróbuj ponownie później.');
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

