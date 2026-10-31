import {getChatGPTUser} from '@/app/chatgpt-auth';
import {json,fail,mutation,text,isOwner,runtimeEnv} from '@/lib/server';
import {findRegisteredUser,setLoyaltyVip} from '@/lib/vip-admin';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function POST(r:Request){try{
 mutation(r);const admin=await getChatGPTUser();
 if(!admin)return json({error:'Zaloguj się na konto administratorki.'},401);
 if(!isOwner(admin))return json({error:'Tylko administratorka może zarządzać statusem VIP.'},403);
 const body=await r.json(),email=text(body.email,254).toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json({error:'Podaj prawidłowy adres e-mail.'},400);
 if(!['inspect','grant','revoke'].includes(body.action))return json({error:'Nieprawidłowa operacja.'},400);
 const env=runtimeEnv();if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Brak konfiguracji zarządzania kontami.');
 const request=async(path:string,method='GET',data?:unknown)=>{
  const response=await fetch(env.SUPABASE_URL!.replace(/\/$/,'')+'/auth/v1/admin/'+path,{method,cache:'no-store',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY!,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY!,'Content-Type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)}),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('Nie udało się zarządzać kontem w Supabase. Spróbuj ponownie.');
  return response.json();
 };
 const target=await findRegisteredUser(request,email);
 if(!target)return json({error:'Nie ma zarejestrowanego konta z tym adresem. Osoba musi najpierw zalogować się do Pracowni.'},404);
 if(!target.email_confirmed_at)return json({error:'Konto musi najpierw potwierdzić adres e-mail przez logowanie.'},409);
 if(body.action==='inspect')return json({id:target.id,email:target.email,isVip:target.app_metadata?.estera_vip===true});
 if(body.userId!==target.id)return json({error:'Sprawdź konto ponownie przed zmianą statusu VIP.'},409);
 return json(await setLoyaltyVip(request,target,body.action==='grant',admin.userId));
 }catch(e){return fail(e);}}
