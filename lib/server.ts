import {journalAccess} from './journal-access';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export const runtimeEnv=()=>process.env;
export const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
export function mutation(request:Request){if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('content-type')?.split(';')[0]!=='application/json')throw new Error('Nieprawidłowe źródło żądania.');}
export async function user(){const u=await getChatGPTUser();if(!u)throw new Error('Zaloguj się, aby korzystać z dziennika.');return u;}
export function isOwner(u:{email:string}|null){const owner=runtimeEnv().ADMIN_EMAIL;return !!(u&&owner&&u.email.toLowerCase()===owner.trim().toLowerCase());}
export function canExportJournal(u:{email:string,ebookAccessUntil?:string|null}|null){return journalAccess(u,runtimeEnv().ADMIN_EMAIL);}
export async function admin(){const u=await user(),owner=runtimeEnv().ADMIN_EMAIL;if(!owner||u.email.toLowerCase()!==owner.toLowerCase())throw new Error('Panel redakcyjny wymaga dostępu administratorki.');return u;}
export function text(value:unknown,max=10000){if(typeof value!=='string')throw new Error('Uzupełnij wymagane pole.');if(value.length>max)throw new Error('Treść jest zbyt długa. Skróć wpis albo podziel go na części.');return value.trim();}
export const fail=(error:unknown,status=400)=>json({error:error instanceof Error?error.message:'Operacja nie powiodła się.'},status);
export const databaseReady=()=>!!(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY);
export async function database(path:string,method='GET',body?:unknown,prefer?:string){
 if(!databaseReady())throw new Error('Dziennik i czytelnia czekają na konfigurację bazy. Pobieranie PDF jest dostępne.');
 const response=await fetch(process.env.SUPABASE_URL!.replace(/\/$/,'')+'/rest/v1/'+path,{method,cache:'no-store',headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY!,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY!,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Nie udało się wykonać operacji w bazie. Sprawdź konfigurację i migrację Supabase.');
 return response.status===204?null:response.text().then(s=>s?JSON.parse(s):null);
}
export async function takeQuota(key:string,limit:number):Promise<boolean>{const allowed=await database('rpc/estera_take_quota','POST',{quota_key:key,quota_limit:limit});return allowed===true;}
export function recordId(value:unknown){const id=text(value,36);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw new Error('Nieprawidłowy identyfikator wpisu.');return id;}
