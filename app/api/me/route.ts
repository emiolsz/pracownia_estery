import {editorAccess} from '@/lib/editor-access';
import {aiProvider,mailProvider} from '@/lib/services';
import {getChatGPTUser,authReady} from '@/app/chatgpt-auth';
import {json,runtimeEnv,databaseReady,isOwner,canExportJournal} from '@/lib/server';
export const dynamic='force-dynamic';
export async function GET(){const u=await getChatGPTUser(),e=runtimeEnv();return json({user:u?{name:u.displayName,email:u.email,journalName:u.journalName,gender:u.journalGender}:null,authReady:authReady(),databaseReady:databaseReady(),aiProvider:aiProvider(),aiReady:!!(aiProvider()&&databaseReady()),emailReady:!!(mailProvider()&&databaseReady()),isAdmin:isOwner(u),isEditor:editorAccess(u),editorUntil:editorAccess(u)?u?.editorUntil:null,isVip:u?.isVip===true,journalExportAllowed:canExportJournal(u),journalExportSalesOpen:false});}
