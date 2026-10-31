import {getChatGPTUser} from '@/app/chatgpt-auth';
import {json,fail,isOwner,mutation,text,database,runtimeEnv} from '@/lib/server';
import {authAdminRequest} from '@/lib/auth-admin';
import {listEditorAccounts,activeEditors,updateEditor} from '@/lib/editor-admin';
export const dynamic='force-dynamic';export const maxDuration=60;
async function owner(){const u=await getChatGPTUser();if(!u)return null;return isOwner(u)?u:false;}
export async function GET(){try{const u=await owner();if(!u)return json({error:'Tylko administratorka zarządza redaktorami.'},u===null?401:403);return json({editors:activeEditors(await listEditorAccounts(authAdminRequest())),limit:5});}catch(e){return fail(e);}}
export async function POST(r:Request){try{mutation(r);const u=await owner();if(!u)return json({error:'Tylko administratorka zarządza redaktorami.'},u===null?401:403);
 const b=await r.json(),email=text(b.email,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Podaj prawidłowy adres e-mail.');
 if(!['grant','revoke'].includes(b.action))throw new Error('Nieprawidłowa operacja.');
 let until:string|null=null;if(b.action==='grant'){const parsed=typeof b.until==='string'?Date.parse(b.until):NaN;if(!Number.isFinite(parsed)||parsed<=Date.now())throw new Error('Wybierz przyszłą datę i godzinę wygaśnięcia roli.');until=new Date(parsed).toISOString();}
 return json(await updateEditor(database,authAdminRequest(),email,until,u.userId,runtimeEnv().ADMIN_EMAIL!));
 }catch(e){return fail(e);}}
