export function validateInterpretationStory(kind:'dream'|'numbers',story:string){
 if(kind==='numbers'){
  if(!story.trim())throw new Error('Wpisz zauważoną liczbę, symbol lub synchroniczność.');
 }else if(story.trim().length<3)throw new Error('Opisz sen w co najmniej trzech znakach.');
}
