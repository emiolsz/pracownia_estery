import {getChatGPTUser} from '@/app/chatgpt-auth';
import {database,json,fail,canExportJournal} from '@/lib/server';
import {journalPDF} from '@/lib/journal-pdf.mjs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(){try{
 const u=await getChatGPTUser();if(!u)return json({error:'Zaloguj się, aby pobrać swój dziennik.'},401);
 if(!canExportJournal(u))return json({error:'Zbiorczy dziennik w formie e-booka będzie dostępny w płatnej subskrypcji na 3 miesiące. Cena i sprzedaż zostaną udostępnione wkrótce. Pojedyncze wpisy PDF i kopia danych pozostają bezpłatne.'},402);
 const entries=await database('estera_dreams?owner=eq.'+encodeURIComponent(u.userId)+'&select=title,dream_date,story,feeling,interpretation&order=dream_date.asc,created_at.asc&limit=500');
 if(!entries.length)return json({error:'Zapisz pierwszy sen, aby przygotować e-book.'},400);
 const font=await readFile(path.join(process.cwd(),'public/assets/report-font.ttf'));
 const bytes=await journalPDF(entries,font,{book:true});
 return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="Moj-dziennik-snow.pdf"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(e){return fail(e);}}
