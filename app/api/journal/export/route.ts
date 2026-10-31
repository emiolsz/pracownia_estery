import {getChatGPTUser} from '@/app/chatgpt-auth';
import {database,json,fail,canExportJournal} from '@/lib/server';
import {journalPDF} from '@/lib/journal-pdf.mjs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(r:Request){try{
 const u=await getChatGPTUser();if(!u)return json({error:'Zaloguj się, aby pobrać swój dziennik.'},401);
 if(!canExportJournal(u))return json({error:'Zbiorczy dziennik w formie e-booka będzie dostępny w płatnej subskrypcji na 3 miesiące. Cena i sprzedaż zostaną udostępnione wkrótce. Pojedyncze wpisy PDF i kopia danych pozostają bezpłatne.'},402);
 const query=new URL(r.url).searchParams,from=query.get('from')||'',to=query.get('to')||'';const validDate=(v:string)=>!v||(/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v);if(!validDate(from)||!validDate(to)||(from&&to&&from>to))return json({error:'Podaj poprawny zakres dat „Od” i „Do”.'},400);
 const order=query.get('order')||'asc';if(!['asc','desc'].includes(order))return json({error:'Wybierz poprawną kolejność snów.'},400);
 const range=(from?'&dream_date=gte.'+from:'')+(to?'&dream_date=lte.'+to:'');
 const entries=await database('estera_dreams?owner=eq.'+encodeURIComponent(u.userId)+range+'&select=title,dream_date,story,feeling,interpretation&order=dream_date.'+order+',created_at.'+order+'&limit=500');
 if(!entries.length)return json({error:from||to?'Brak snów w wybranym okresie. Zmień zakres dat.':'Zapisz pierwszy sen, aby przygotować e-book.'},400);
 const [font,serifFontBytes,logoBytes,coverBytes]=await Promise.all([readFile(path.join(process.cwd(),'public/assets/report-font.ttf')),readFile(path.join(process.cwd(),'public/fonts/lora-latin.ttf')),readFile(path.join(process.cwd(),'public/assets/graphics/logo-gold-v2.png')),readFile(path.join(process.cwd(),'public/assets/graphics/sennik.jpg'))]);
 const bytes=await journalPDF(entries,font,{book:true,name:u.journalName,gender:u.journalGender,rangeFrom:from,rangeTo:to,serifFontBytes,logoBytes,coverBytes});
 return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="Moj-dziennik-snow.pdf"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(e){return fail(e);}}
