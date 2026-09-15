import {env} from 'cloudflare:workers';
import {handleWorld} from '@/lib/server/api';
export async function POST(request:Request){
  try{return await handleWorld(request,(env as unknown as {DB:D1Database}).DB);}
  catch{ return Response.json({error:'Sunucu dünyası şu anda kullanılamıyor.'},{status:503,headers:{'Cache-Control':'no-store'}}); }
}
