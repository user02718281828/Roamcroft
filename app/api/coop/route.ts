// Bağımsız yayında doğrulanmış oturum sağlayıcısı kurulana kadar erişim kapalıdır.
// İstemcinin gönderebildiği Sites başlıkları kullanıcı kimliği olarak kabul edilmez.
export async function POST(_request:Request) {
  return Response.json({error:'Bu sürüm tek oyunculudur.'},{status:404,headers:{'Cache-Control':'no-store'}});
}
