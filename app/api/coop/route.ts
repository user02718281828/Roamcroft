import {env} from 'cloudflare:workers';
import {handleCoop} from '@/lib/coop/server';
export async function POST(request:Request) {
  try {
    const db=(env as unknown as {DB?:D1Database}).DB;
    if(!db) return Response.json({error:'Ortak dünya sunucusu henüz hazır değil.'},{status:503});
    return await handleCoop(request,db);
  } catch(error) {
    console.error('Coop request failed',error instanceof Error ? error.message : 'unknown');
    return Response.json({error:'Bağlantı kurulamadı. Kaydın korunuyor; yeniden dene.'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
