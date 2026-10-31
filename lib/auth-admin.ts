export function authAdminRequest(){
 const env=process.env;if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Brak konfiguracji zarządzania kontami.');
 const signal=AbortSignal.timeout(45000);
 return async(path:string,method='GET',data?:unknown)=>{
  const response=await fetch(env.SUPABASE_URL!.replace(/\/$/,'')+'/auth/v1/admin/'+path,{method,cache:'no-store',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY!,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY!,'Content-Type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)}),signal});
  if(!response.ok)throw new Error('Nie udało się zarządzać kontem w Supabase. Spróbuj ponownie.');
  return response.json();
 };
}
