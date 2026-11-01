import assert from'node:assert/strict';import{journalGender,journalName,genderInstruction,journalGenderCode}from'../lib/journal-person.ts';
assert.equal(journalName(' Emilia '),'Emilia');assert.equal(journalName('Łucja'),'Łucja');assert.throws(()=>journalName('a'.repeat(61)));assert.throws(()=>journalName('Imię\nInny wiersz'));
assert.equal(journalGender('female'),'female');assert.equal(journalGender('male'),'male');assert.equal(journalGender('unknown'),'neutral');assert.match(genderInstruction('female'),/czułaś/);assert.match(genderInstruction('male'),/czułeś/);assert.match(genderInstruction('neutral'),/nie zgaduj/);
console.log('PASS personal name validation, Polish characters, gender choices and neutral fallback');

for(const [code,value] of [["K","female"],["M","male"],["X","neutral"]]){assert.equal(journalGender(code),value);assert.equal(journalGenderCode(value),code);assert.equal(genderInstruction(code),genderInstruction(value));}
console.log("PASS K/M/X map to existing preferences and identical AI instructions");
