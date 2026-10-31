type RegisteredUser={id:string,email?:string,email_confirmed_at?:string|null,app_metadata?:Record<string,unknown>};
export type AuthAdminRequest=(path:string,method?:string,body?:unknown)=>Promise<any>;
export async function findRegisteredUser(request:AuthAdminRequest,email:string):Promise<RegisteredUser|null>{
 for(let page=1;page<=10;page++){
  const result=await request('users?page='+page+'&per_page=1000');
  if(!Array.isArray(result.users))throw new Error('Nie udało się odczytać kont użytkowników.');
  const found=result.users.find((u:RegisteredUser)=>u.email?.toLowerCase()===email);
  if(found)return found;
  if(result.users.length<1000)return null;
 }
 throw new Error('Nie znaleziono konta w bieżącym zakresie wyszukiwania. Skontaktuj się z obsługą techniczną.');
}
export async function setLoyaltyVip(request:AuthAdminRequest,target:RegisteredUser,enabled:boolean,adminId:string){
 // Only this Pracownia entitlement is changed. No Auth role, identity or subscription changes.
 const metadata={estera_vip:enabled,estera_vip_updated_at:new Date().toISOString(),estera_vip_updated_by:adminId};
 const updated=await request('users/'+encodeURIComponent(target.id),'PUT',{app_metadata:metadata});
 const user=updated.user||updated;
 if(user.id!==target.id||user.app_metadata?.estera_vip!==enabled)throw new Error('Nie potwierdzono zmiany statusu VIP. Odśwież status konta.');
 return {email:target.email,isVip:enabled};
}
