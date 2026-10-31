export function editorAccess(u:{editorUntil?:string|null}|null,now=Date.now()){
 const until=u?.editorUntil?Date.parse(u.editorUntil):NaN;
 return Number.isFinite(until)&&until>now;
}
