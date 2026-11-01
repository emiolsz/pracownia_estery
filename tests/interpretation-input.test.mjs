import assert from 'node:assert/strict';
import {validateInterpretationStory} from '../lib/interpretation-input.ts';
for(const value of ['0','7','34','11','11:11','pióro'])assert.doesNotThrow(()=>validateInterpretationStory('numbers',value));
for(const value of ['','   '])assert.throws(()=>validateInterpretationStory('numbers',value),/Wpisz/);
assert.throws(()=>validateInterpretationStory('dream','ab'),/trzech/);
assert.doesNotThrow(()=>validateInterpretationStory('dream','Sen o moście'));
console.log('PASS krótkie liczby i symbole są przyjmowane; puste wpisy i zbyt krótkie sny są odrzucane');
