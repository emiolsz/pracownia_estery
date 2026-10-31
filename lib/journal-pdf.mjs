import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
export async function journalPDF(entries,fontBytes,options={}){
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(fontBytes,{subset:true});const chars=new Set(font.getCharacterSet());const clean=s=>Array.from(String(s)).filter(c=>chars.has(c.codePointAt(0))||c==='\n').join('');
 let page,y;const add=()=>{page=pdf.addPage([595.28,841.89]);page.drawRectangle({x:0,y:0,width:596,height:842,color:rgb(.992,.984,.969)});y=780;if(options.book){page.drawLine({start:{x:48,y:795},end:{x:547,y:795},thickness:1,color:rgb(.76,.66,.45)});page.drawCircle({x:535,y:777,size:8,color:rgb(.67,.56,.76)});page.drawCircle({x:539,y:780,size:7,color:rgb(.992,.984,.969)});}page.drawText('PRACOWNIA ESTERY',{x:48,y,size:10,font,color:rgb(.46,.37,.22)});y-=28;};
 function write(value,size=11){const lines=clean(value).split('\n');for(const line of lines){let current='';for(const word of line.split(' ')){const next=current?current+' '+word:word;if(font.widthOfTextAtSize(next,size)>495&&current){if(y<65)add();page.drawText(current,{x:48,y,size,font,color:rgb(.14,.2,.24)});y-=size*1.65;current=word;}else current=next;while(font.widthOfTextAtSize(current,size)>495){let n=current.length;while(n>1&&font.widthOfTextAtSize(current.slice(0,n),size)>495)n--;if(y<65)add();page.drawText(current.slice(0,n),{x:48,y,size,font,color:rgb(.14,.2,.24)});y-=size*1.65;current=current.slice(n);}}if(y<65)add();page.drawText(current,{x:48,y,size,font,color:rgb(.14,.2,.24)});y-=size*1.65;}y-=10;}
 if(options.book){
 pdf.setTitle('Mój dziennik snów');pdf.setAuthor('Pracownia Estery');pdf.setLanguage('pl-PL');
 add();page.drawCircle({x:460,y:600,size:48,color:rgb(.76,.66,.45)});page.drawCircle({x:480,y:617,size:43,color:rgb(.992,.984,.969)});y=620;write('Mój dziennik snów',30);write('Sny, emocje i symboliczne interpretacje',14);y-=35;write('Prywatna opowieść wielu nocy',12);write('Liczba wpisów: '+entries.length,11);write('Okres: '+(entries[0]?.dream_date||entries[0]?.date||'')+' — '+(entries.at(-1)?.dream_date||entries.at(-1)?.date||''),11);
 add();write('Spis snów',22);entries.forEach((e,i)=>write((i+1)+'. '+(e.dream_date||e.date||'')+' · '+(e.title||'Mój sen'),11));
 }
 for(const entry of entries){add();write(entry.title||'Mój dziennik snów',19);write(entry.date||entry.dream_date||'',10);write(entry.story||'');if(entry.feeling)write('Emocje i kontekst: '+entry.feeling);if(entry.interpretation){write('Propozycja interpretacji',14);write(entry.interpretation);}write('Symboliczna refleksja. Interpretacja nie jest diagnozą ani przepowiednią.',9);
 if(options.book){add();write('Moje przemyślenia',22);write(entry.title||'Mój sen',13);
 for(const question of ['Co najmocniej zostało ze mną po przebudzeniu?','Z czym kojarzą mi się obrazy i emocje tego snu?','Do czego chcę wrócić lub co obserwować?']){write(question,11);for(let n=0;n<5;n++){page.drawLine({start:{x:48,y:y-6},end:{x:547,y:y-6},thickness:.4,color:rgb(.83,.8,.87)});y-=23;}y-=16;}
 }
 }
 const pages=pdf.getPages();pages.forEach((p,i)=>p.drawText((i+1)+' / '+pages.length,{x:495,y:35,size:9,font,color:rgb(.46,.37,.22)}));return pdf.save();
}
