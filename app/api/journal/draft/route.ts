import {cookies} from 'next/headers';
import {authRequest,getChatGPTUser} from '@/app/chatgpt-auth';
import {json,fail,mutation} from '@/lib/server';
import {validateBookDraft} from '@/lib/book-draft';
export const dynamic='force-dynamic';
class DraftAccessError extends Error{}
async function access(){const u=await getChatGPTUser();if(!u)throw new DraftAccessError('Zaloguj się, aby zapisać lub wczytać wersję roboczą.');const token=(await cookies()).get('estera_access')?.value;if(!token)throw new DraftAccessError('Zaloguj się ponownie.');return token;}
export async function GET(){try{const token=await access(),r=await authRequest('user',undefined,token);if(!r.ok)throw Error('Nie udało się wczytać wersji roboczej.');const profile=await r.json(),raw=profile.user_metadata?.estera_book_draft;if(!raw)return json({draft:null});return json({draft:{...validateBookDraft(raw),updatedAt:typeof raw.updatedAt==='string'?raw.updatedAt:undefined}});}catch(e){return fail(e,e instanceof DraftAccessError?401:400);}}
export async function POST(r:Request){try{mutation(r);const token=await access(),body=await r.json(),draft={...validateBookDraft(body.draft),updatedAt:new Date().toISOString()};const result=await authRequest('user',{data:{estera_book_draft:draft}},token,'PUT');if(!result.ok)throw Error('Nie udało się zapisać wersji roboczej. Twoje sny pozostały bez zmian.');return json({draft});}catch(e){return fail(e,e instanceof DraftAccessError?401:400);}}
