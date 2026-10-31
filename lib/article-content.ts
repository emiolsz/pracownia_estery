export const articleTopics={jung:'Jung',dreams:'Sny',synchronicity:'Synchroniczności',reflections:'Refleksje'} as const;
export type ArticleTopic=keyof typeof articleTopics;
export type ReadingArticle={id:string,title:string,subtitle:string,body:string,editor:string,topic:ArticleTopic,published?:boolean};
const prefix='ESTERA_ARTICLE_V1\n';
export function articleTopic(value:unknown):ArticleTopic{return typeof value==='string'&&Object.hasOwn(articleTopics,value)?value as ArticleTopic:'reflections';}
export function packArticle(body:string,editor:string,topic:unknown){
 const encoded=prefix+JSON.stringify({body,editor:editor.trim()||'Redakcja Pracowni Estery',topic:articleTopic(topic)});
 if(encoded.length>30000)throw new Error('Artykuł wraz z podpisem jest zbyt długi. Skróć treść.');return encoded;
}
export function unpackArticle(row:Record<string,any>):ReadingArticle{
 let body=typeof row.body==='string'?row.body:'',editor='Redakcja Pracowni Estery',topic:ArticleTopic='reflections';
 if(body.startsWith(prefix)){try{const parsed=JSON.parse(body.slice(prefix.length));if(typeof parsed.body==='string'&&typeof parsed.editor==='string'){body=parsed.body;editor=parsed.editor;topic=articleTopic(parsed.topic);}}catch{/* Preserve old/plain content verbatim. */}}
 return {...row,id:String(row.id),title:row.title||'',subtitle:row.subtitle||body.replace(/\s+/g,' ').slice(0,220),body,editor,topic};
}
