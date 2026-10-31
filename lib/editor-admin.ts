import type {AuthAdminRequest} from './vip-admin';
type Account={id:string,email?:string,email_confirmed_at?:string|null,app_metadata?:Record<string,unknown>};
type DB=(path:string,method?:string,body?:unknown,prefer?:string)=>Promise<any>;
export async function listEditorAccounts(request:AuthAdminRequest){
 const users:Account[]=[];
 for(let page=1;page<=10;page++){const result=await request('users?page='+page+'&per_page=1000');if(!Array.isArray(result.users))throw new Error('Nie udało się odczytać kont.');users.push(...result.users);if(result.users.length<1000)return users;}
 throw new Error('Baza kont wymaga rozszerzenia wyszukiwania. Zmiana roli nie została wykonana.');
}
export function activeEditors(users:Account[],now=Date.now()){
 return users.filter(u=>u.email_confirmed_at&&typeof u.app_metadata?.estera_editor_until==='string'&&Date.parse(u.app_metadata.estera_editor_until)>now).map(u=>({id:u.id,email:u.email,until:u.app_metadata!.estera_editor_until as string}));
}
export async function updateEditor(db:DB,request:AuthAdminRequest,email:string,until:string|null,adminId:string,ownerEmail:string){
 const key='estera-editor-management-lock',token=crypto.getRandomValues(new Uint32Array(1))[0]%2000000000+1;
 // A shared database lease serializes all grants, preserving the five-seat limit.
 await db('estera_usage?key=eq.'+key+'&created_at=lt.'+encodeURIComponent(new Date(Date.now()-90000).toISOString()),'DELETE');
 const lease=await db('estera_usage?on_conflict=key','POST',{key,count:token},'resolution=ignore-duplicates,return=representation');
 if(!Array.isArray(lease)||lease.length!==1)throw new Error('Trwa inna zmiana ról. Spróbuj ponownie za chwilę.');
 try{
  const users=await listEditorAccounts(request),target=users.find(u=>u.email?.toLowerCase()===email);
  if(!target?.email_confirmed_at)throw new Error('Osoba musi najpierw zarejestrować i potwierdzić konto przez logowanie.');
  if(target.email?.toLowerCase()===ownerEmail.toLowerCase())throw new Error('Konto właścicielki zachowuje rolę administratorki i nie zajmuje miejsca redaktora.');
  const active=activeEditors(users);
  if(until&&!active.some(u=>u.id===target.id)&&active.length>=5)throw new Error('Wykorzystano 5 miejsc redaktorów. Odbierz jedną rolę lub poczekaj na jej wygaśnięcie.');
  const metadata={estera_editor_until:until,estera_editor_updated_at:new Date().toISOString(),estera_editor_updated_by:adminId};
  const response=await request('users/'+encodeURIComponent(target.id),'PUT',{app_metadata:metadata});const updated=response.user||response;
  if(updated.id!==target.id||(updated.app_metadata?.estera_editor_until??null)!==until)throw new Error('Nie potwierdzono zmiany roli. Sprawdź listę redaktorów.');
  return {email:target.email,until};
 }finally{await db('estera_usage?key=eq.'+key+'&count=eq.'+token,'DELETE');}
}
