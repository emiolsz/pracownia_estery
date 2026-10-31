import {cookies} from 'next/headers';
import {authRequest,getChatGPTUser} from '@/app/chatgpt-auth';
import {json,fail,mutation} from '@/lib/server';
import {journalName,journalGender} from '@/lib/journal-person';
export async function POST(r:Request){try{mutation(r);const u=await getChatGPTUser();if(!u)return json({error:'Zaloguj się, aby zachować ustawienia sennika.'},401);const b=await r.json(),name=journalName(b.name),gender=journalGender(b.gender);const access=(await cookies()).get('estera_access')?.value;if(!access)return json({error:'Zaloguj się ponownie.'},401);
 const response=await authRequest('user',{data:{estera_journal_name:name,estera_journal_gender:gender}},access,'PUT');if(!response.ok)throw new Error('Nie udało się zapisać ustawień sennika. Spróbuj ponownie.');return json({name,gender});
 }catch(e){return fail(e);}}
