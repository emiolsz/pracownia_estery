import {JOURNAL_INTRO,JOURNAL_STEPS,REFLECTION_NOTE} from './journal-copy.mjs';
import {PDFDocument,rgb,degrees} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
export async function journalPDF(entries,fontBytes,options={}){
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
 const sans=await pdf.embedFont(fontBytes,{subset:true}),serif=options.serifFontBytes?await pdf.embedFont(options.serifFontBytes,{subset:true}):sans,body=options.fontStyle==='lora'?serif:sans;
 const signature=options.signatureFontBytes?await pdf.embedFont(options.signatureFontBytes,{subset:false}):serif;
 const name=String(options.name||'').trim().slice(0,60),isNumbers=options.kind==='numbers',title=isNumbers?'Język aniołów':'Sennik';
 pdf.setTitle(title+(name?' - '+name:''));pdf.setAuthor('Pracownia Estery');pdf.setLanguage('pl-PL');
 const paper=rgb(253/255,251/255,247/255),ink=rgb(.13,.18,.23),gold=rgb(183/255,154/255,96/255),muted=rgb(.40,.40,.39),navy=rgb(12/255,20/255,37/255),lightGold=gold;
 const plDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value))?String(value).split('-').reverse().join('.'):String(value||'');
 const dates=entries.map(e=>e.dream_date||e.date||'').filter(Boolean).sort();
 const from=options.rangeFrom||dates[0]||'',to=options.rangeTo||dates.at(-1)||'',rangeLabel=from===to?plDate(from):'od '+plDate(from)+' do '+plDate(to);
 const W=595.28,H=841.89,M=54,CW=W-2*M;let page,y;
 const supported=new Set(body.getCharacterSet()),serifSupported=new Set(serif.getCharacterSet());
 const clean=(value,font=body)=>Array.from(String(value)).filter(c=>(font===serif?serifSupported:supported).has(c.codePointAt(0))||c==='\n').join('');
 const add=(showRange=true)=>{page=pdf.addPage([W,H]);page.drawRectangle({x:0,y:0,width:W,height:H,color:paper});page.drawLine({start:{x:M,y:H-51},end:{x:W-M,y:H-51},thickness:.5,color:gold});page.drawText('SOUL DECODER ESTERA',{x:M,y:H-41,size:8,font:serif,color:gold});const rangeText=showRange?clean(rangeLabel):'';page.drawText(rangeText,{x:W-M-body.widthOfTextAtSize(rangeText,8),y:H-41,size:8,font:body,color:gold});y=H-83;};
 function lines(value,size,font,width=CW){const result=[];for(const paragraph of clean(value,font).split('\n')){let line='';for(const word of paragraph.split(/ +/)){const next=line?line+' '+word:word;if(font.widthOfTextAtSize(next,size)>width&&line){result.push(line);line=word;}else line=next;while(font.widthOfTextAtSize(line,size)>width){let n=line.length;while(n>1&&font.widthOfTextAtSize(line.slice(0,n),size)>width)n--;result.push(line.slice(0,n));line=line.slice(n);}}result.push(line);}return result;}
 function write(value,size=11,font=body,color=ink){const textLines=lines(value,size,font),leading=size*1.65;for(const line of textLines){if(y-leading<76)add();page.drawText(line,{x:M,y,size,font,color});y-=leading;}y-=10;}
 function heading(value,size=20){if(y<160)add();write(value,size,serif);}
 function center(value,size,at,font=serif,color=lightGold){let actual=size;const text=clean(value,font);while(actual>12&&font.widthOfTextAtSize(text,actual)>W-100)actual--;page.drawText(text,{x:(W-font.widthOfTextAtSize(text,actual))/2,y:at,size:actual,font,color});}
 if(options.book||entries.length>1){
 const cover=pdf.addPage([W,H]);page=cover;cover.drawRectangle({x:0,y:0,width:W,height:H,color:options.coverStyle==='cream'?paper:navy});cover.drawRectangle({x:25,y:26,width:W-50,height:H-52,borderColor:gold,borderWidth:.7});
 if(options.logoBytes){const logo=await pdf.embedPng(options.logoBytes),width=265;cover.drawImage(logo,{x:(W-width)/2,y:731,width,height:width*logo.height/logo.width});}else center('SOUL DECODER ESTERA',18,774);
 if(options.coverBytes){const art=await pdf.embedJpg(options.coverBytes),width=315;cover.drawImage(art,{x:(W-width)/2,y:286,width,height:width*art.height/art.width});}else{cover.drawCircle({x:W/2,y:495,size:122,borderColor:gold,borderWidth:.7});cover.drawCircle({x:W/2,y:495,size:82,borderColor:gold,borderWidth:.5});center(title,36,482);}
 // The original brand artwork contains SENNIK; the name completes its cover title.
 if(isNumbers)center(title,30,257);
 if(name)center(name,40,218);else center('Osobisty dziennik',25,218);
 center(isNumbers?'Symbole i osobiste refleksje':'Osobisty dziennik snów',12,178,body);
 if(options.book){center('Sny, emocje i symboliczne interpretacje',10,151,body);}center(rangeLabel,10,120,body);
 }
 const tocSheets=[],chapterPages=[];
 if(options.book){add(false);
 for(const part of JOURNAL_INTRO.split(/(?<=\.) (?=Regularna|W tym procesie|Taka praktyka)/))write(part,11,serif);
 heading('Jak korzystać z sennika',19);JOURNAL_STEPS.forEach((step,i)=>write((i+1)+'. '+step,10.5,serif));
 if(y<125)add(false);const sign='Z miłością, Estera',signSize=29;page.drawText(sign,{x:W-M-signature.widthOfTextAtSize(sign,signSize),y:y-15,size:signSize,font:signature,color:gold,rotate:degrees(-4)});
 add();heading('Spis treści',25);let sheet={page,rows:[]};tocSheets.push(sheet);
 const items=[{index:-1,label:'Wprowadzenie',date:''},...entries.map((e,i)=>({index:i,label:e.title||'Mój sen',date:plDate(e.dream_date||e.date||'')}))];
 function tocHeader(){for(const [label,x] of [['Sen',M],['Tytuł',M+74],['Data',W-M-179],['Strona',W-M-36]])page.drawText(label,{x,y,size:9,font:body,color:gold});y-=32;}
 tocHeader();for(const item of items){const rowLines=lines(item.label,10.5,serif,CW-270),height=Math.max(45,rowLines.length*18+18);if(y-height<86){add();heading('Spis treści',25);sheet={page,rows:[]};tocSheets.push(sheet);tocHeader();}sheet.rows.push({...item,lines:rowLines,y});y-=height;}}


 for(const [entryIndex,entry] of entries.entries()){chapterPages.push(pdf.getPageCount()+1);add();heading((options.book?(entryIndex+1)+'. ':'')+(entry.title||'Mój sen'),23);write(plDate(entry.date||entry.dream_date||''),10,body,gold);heading(isNumbers?'Zapis':'Mój sen',14);write(entry.story||'');if(entry.feeling){heading('Emocje i kontekst',14);write(entry.feeling);}
 if(entry.interpretation){heading('Interpretacja',20);for(const line of String(entry.interpretation).split('\n')){if(!line.trim()){y-=5;continue;}const h=line.match(/^#{1,6}\s+(.+)$/);if(h){heading(h[1].replace(/\*\*/g,''),14);}else{write(line.replace(/\*\*(.+?)\*\*/g,'$1'),11);}}}
 write(REFLECTION_NOTE,8,body,muted);
 if(options.book){add();heading('Moje przemyślenia',24);write(entry.title||'Mój sen',12,serif,gold);for(const question of ['Co najmocniej zostało ze mną po przebudzeniu?','Z czym kojarzą mi się obrazy i emocje tego snu?','Do czego chcę wrócić lub co obserwować?']){write(question,11,serif);for(let n=0;n<5;n++){page.drawLine({start:{x:M,y:y-6},end:{x:W-M,y:y-6},thickness:.35,color:rgb(.82,.79,.84)});y-=23;}y-=16;}}
 }
 for(const sheet of tocSheets){for(const row of sheet.rows){let at=row.y;if(row.index>=0)sheet.page.drawText('Sen '+(row.index+1),{x:M,y:at,size:10,font:body,color:ink});sheet.page.drawText(row.date,{x:W-M-179,y:at,size:10,font:body,color:ink});for(const line of row.lines){sheet.page.drawText(line,{x:M+74,y:at,size:10.5,font:serif,color:ink});at-=18;}const number=String(row.index<0?2:chapterPages[row.index]);sheet.page.drawText(number,{x:W-M-body.widthOfTextAtSize(number,10),y:row.y,size:10,font:body,color:gold});sheet.page.drawLine({start:{x:M,y:at-3},end:{x:W-M,y:at-3},thickness:.25,color:rgb(.86,.82,.75)});}}
 const pages=pdf.getPages(),footer=isNumbers?'Pracownia Estery · Język Aniołów':'Pracownia Estery · Dziennik Snów';
 pages.forEach((p,i)=>{const color=i===0?lightGold:gold,label=clean(footer,serif);p.drawLine({start:{x:M,y:49},end:{x:W-M,y:49},thickness:.35,color});p.drawText(label,{x:(W-serif.widthOfTextAtSize(label,8.5))/2,y:32,size:8.5,font:serif,color});p.drawText((i+1)+' / '+pages.length,{x:W-M-27,y:32,size:8,font:body,color});});return pdf.save();
}
