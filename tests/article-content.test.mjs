import assert from'node:assert/strict';import{packArticle,unpackArticle}from'../lib/article-content.ts';
const body='Pełna treść: Zażółć gęślą jaźń.\n\nDrugi akapit.';
const packed=packArticle(body,'Estera','jung');let article=unpackArticle({id:'test',title:'Cień',subtitle:'Opis',body:packed});assert.equal(article.body,body);assert.equal(article.editor,'Estera');assert.equal(article.topic,'jung');assert.equal(article.subtitle,'Opis');
article=unpackArticle({id:'old',title:'Dawny tekst',body});assert.equal(article.body,body);assert.equal(article.editor,'Redakcja Pracowni Estery');assert.equal(article.topic,'reflections');
assert.equal(unpackArticle({id:'draft',body:packArticle('Zmieniony szkic','Inny podpis','dreams')}).editor,'Inny podpis');assert.equal(unpackArticle({id:'published',body:packed}).editor,'Estera');
assert.throws(()=>packArticle('a'.repeat(30000),'Estera','jung'),/zbyt długi/);
console.log('PASS article metadata, Polish text, legacy content, published snapshot independence and size limit');
