import {journalName} from './journal-person';
export type BookDraft={version:1;name:string;coverStyle:'navy'|'cream';fontStyle:'sans'|'lora';from:string;to:string;order:'asc'|'desc';includeIds:string[];updatedAt?:string};
export function validateBookDraft(value:unknown):BookDraft{
 if(!value||typeof value!=='object')throw Error('Nieprawidłowe ustawienia Księgi Snów.');
 const b=value as Record<string,unknown>;
 if(!['navy','cream'].includes(String(b.coverStyle))||!['sans','lora'].includes(String(b.fontStyle))||!['asc','desc'].includes(String(b.order)))throw Error('Wybierz okładkę, czcionkę i kolejność snów.');
 const from=String(b.from||''),to=String(b.to||'');
 for(const date of [from,to])if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date))throw Error('Podaj poprawne daty Księgi Snów.');
 if(from&&to&&from>to)throw Error('Data „Od” nie może być późniejsza niż data „Do”.');
 if(!Array.isArray(b.includeIds)||b.includeIds.length>500||b.includeIds.some(id=>typeof id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))throw Error('Nieprawidłowy wybór snów do Księgi.');
 return {version:1,name:journalName(b.name||''),coverStyle:b.coverStyle as BookDraft['coverStyle'],fontStyle:b.fontStyle as BookDraft['fontStyle'],from,to,order:b.order as BookDraft['order'],includeIds:[...new Set(b.includeIds)]};
}
