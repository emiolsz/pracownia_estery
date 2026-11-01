import {getChatGPTUser} from '@/app/chatgpt-auth';
import {database,json,fail,canExportJournal,mutation,recordId} from '@/lib/server';
import {journalName} from '@/lib/journal-person';
import {journalPDF} from '@/lib/journal-pdf.mjs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(r:Request){return exportJournal(r,[],new URL(r.url).searchParams.get('cover')||'navy');}
export async function POST(r:Request){try{mutation(r);const b=await r.json();if(!Array.isArray(b.excludeIds)||b.excludeIds.length>500)throw Error('Nieprawidłowy wybór snów.');if(b.includeIds!==undefined&&(!Array.isArray(b.includeIds)||b.includeIds.length>500))throw Error('Nieprawidłowy wybór snów.');return exportJournal(r,b.excludeIds.map(recordId),b.coverStyle||'navy',b.fontStyle||'sans',b.includeIds?.map(recordId),b.name===undefined?undefined:journalName(b.name));}catch(e){return fail(e);}}
async function exportJournal(r:Request,excludeIds:string[],coverStyle:string,fontStyle='sans',includeIds?:string[],name?:string){try{
 if(!['sans','lora'].includes(fontStyle))throw Error('Wybierz poprawną czcionkę.');
 if(!['navy','cream'].includes(coverStyle))throw Error('Wybierz poprawny wariant okładki.');
 const u=await getChatGPTUser();if(!u)return json({error:'Zaloguj się, aby pobrać swój dziennik.'},401);
 if(!canExportJournal(u))return json({error:'Zbiorczy dziennik w formie e-booka będzie dostępny w płatnej subskrypcji na 3 miesiące. Cena i sprzedaż zostaną udostępnione wkrótce. Pojedyncze wpisy PDF i kopia danych pozostają bezpłatne.'},402);
 const query=new URL(r.url).searchParams,from=query.get('from')||'',to=query.get('to')||'';const validDate=(v:string)=>!v||(/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v);if(!validDate(from)||!validDate(to)||(from&&to&&from>to))return json({error:'Podaj poprawny zakres dat „Od” i „Do”.'},400);
 const order=query.get('order')||'asc';if(!['asc','desc'].includes(order))return json({error:'Wybierz poprawną kolejność snów.'},400);
 const range=(from?'&dream_date=gte.'+from:'')+(to?'&dream_date=lte.'+to:'');
 const rows=await database('estera_dreams?owner=eq.'+encodeURIComponent(u.userId)+range+'&select=id,title,dream_date,story,feeling,interpretation&order=dream_date.'+order+',created_at.'+order+'&limit=500');
 const entries=rows.filter((entry:{id:string})=>!excludeIds.includes(entry.id)&&(!includeIds||includeIds.includes(entry.id)));
 if(!entries.length)return json({error:from||to?'Brak snów w wybranym okresie. Zmień zakres dat.':'Zapisz pierwszy sen, aby przygotować e-book.'},400);
 const [font,serifFontBytes,logoBytes,coverBytes,signatureFontBytes]=await Promise.all([readFile(path.join(process.cwd(),'public/assets/report-font.ttf')),readFile(path.join(process.cwd(),'public/fonts/lora-latin.ttf')),readFile(path.join(process.cwd(),'public/assets/graphics/logo-gold-v2.png')),readFile(path.join(process.cwd(),'public/assets/graphics/sennik.jpg')),readFile(path.join(process.cwd(),'public/fonts/allura.ttf'))]);
 const bytes=await journalPDF(entries,font,{book:true,name:name??u.journalName,gender:u.journalGender,rangeFrom:from,rangeTo:to,serifFontBytes,logoBytes,coverBytes,signatureFontBytes,coverStyle,fontStyle});
 return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="Moj-dziennik-snow.pdf"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(e){return fail(e);}}
