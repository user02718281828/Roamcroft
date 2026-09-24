import {env} from 'cloudflare:workers';
import {handleLobby} from '@/lib/server/lobby';
export async function POST(request:Request){
  try{return await handleLobby(request,(env as {DB:D1Database}).DB);}
  catch{return Response.json({error:'Lobiye şu anda ulaşılamıyor.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
