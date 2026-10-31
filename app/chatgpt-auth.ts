import {cookies} from 'next/headers';
export type ChatGPTUser={userId:string,displayName:string,email:string,fullName:string|null,ebookAccessUntil:string|null};
export const authReady=()=>!!(process.env.SUPABASE_URL&&process.env.SUPABASE_ANON_KEY);
export async function authRequest(path:string,body?:unknown,access?:string){
 if(!authReady())throw new Error('Logowanie czeka na konfigurację Supabase. PDF możesz pobrać bez logowania.');
 return fetch(process.env.SUPABASE_URL!.replace(/\/$/,'')+'/auth/v1/'+path,{method:body===undefined?'GET':'POST',cache:'no-store',headers:{apikey:process.env.SUPABASE_ANON_KEY!,'Content-Type':'application/json',...(access?{Authorization:'Bearer '+access}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
}
export async function saveSession(session:{access_token:string,refresh_token:string,expires_in?:number}){
 const jar=await cookies();const options={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};
 jar.set('estera_access',session.access_token,{...options,maxAge:session.expires_in||3600});jar.set('estera_refresh',session.refresh_token,{...options,maxAge:60*60*24*30});
}
export async function getChatGPTUser():Promise<ChatGPTUser|null>{
 if(!authReady())return null;const jar=await cookies();let access=jar.get('estera_access')?.value;const refresh=jar.get('estera_refresh')?.value;
 if(!access&&!refresh)return null;
 let response=access?await authRequest('user',undefined,access):null;
 if(!response||response.status===401||response.status===403){if(!refresh)return null;const renewed=await authRequest('token?grant_type=refresh_token',{refresh_token:refresh});if(!renewed.ok)return null;const session=await renewed.json();await saveSession(session);access=session.access_token;response=await authRequest('user',undefined,access);}
 if(!response.ok)return null;const u=await response.json();if(!u.id||!u.email||!u.email_confirmed_at)return null;
 return {userId:u.id,email:u.email,displayName:u.user_metadata?.full_name||u.email,fullName:u.user_metadata?.full_name||null,ebookAccessUntil:typeof u.app_metadata?.estera_ebook_until==='string'?u.app_metadata.estera_ebook_until:null};
}
