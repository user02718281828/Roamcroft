# Mobile Recovery — güncel bağımlılık güvenliği

29 Ekim 2026, Node 22.13.0/npm 10.9.2; npm registry audit API yeniden sorgulandı.
Bu denetim bağımlılık yükseltmesi veya istismar testi değildir. Paket sürümleri,
lock resolved/integrity ve override'lar değiştirilmedi. Ham JSON yerel ve Git dışı
`work/mobile-audit.json` / `mobile-audit-production.json` altında.

**25 paket bulgusu: 3 kritik, 11 yüksek, 10 orta, 1 düşük.** Önceki 25 sonucun
3/10/11/1 dağılımı tarihsel kalır: systeminformation artık yüksek bildirilir.
Bir paket kaydı birden çok advisory içerebilir; 25 benzersiz istismar demek değildir.
`--omit=dev` alt kümesi **19: 1 kritik, 9 yüksek, 8 orta, 1 düşük**.
shadcn CLI dependencies altında olduğundan üretim-alt-küme etiketi canlı istek
ulaşılabilirliği kanıtı değildir.

| Paket | Derece | omit=dev içinde | Kurulu konum (kök node_modules altında) |
| --- | --- | --- | --- |
| oxfmt | critical | Hayır | `oxfmt` |
| proxy-addr | critical | Evet | `proxy-addr` |
| tinypool | critical | Hayır | `tinypool` |
| @modelcontextprotocol/sdk | high | Evet | `@modelcontextprotocol/sdk` |
| body-parser | high | Evet | `body-parser` |
| brace-expansion | high | Evet | `brace-expansion` |
| miniflare | high | Hayır | `miniflare` |
| shadcn | high | Evet | `shadcn` |
| sharp | high | Hayır | `sharp` |
| source-map-js | high | Evet | `source-map-js` |
| systeminformation | high | Evet | `systeminformation` |
| undici | high | Evet | `shadcn/node_modules/undici`, `undici` |
| vite | high | Evet | `vite` |
| zod | high | Evet | `zod` |
| @cloudflare/vite-plugin | moderate | Hayır | `@cloudflare/vite-plugin` |
| @hono/node-server | moderate | Evet | `@hono/node-server` |
| @vercel/og | moderate | Evet | `@vercel/og` |
| fast-uri | moderate | Evet | `fast-uri` |
| hono | moderate | Evet | `hono` |
| ip-address | moderate | Evet | `ip-address` |
| qs | moderate | Evet | `qs` |
| satori | moderate | Evet | `satori` |
| vinext | moderate | Evet | `vinext` |
| wrangler | moderate | Hayır | `wrangler` |
| deepmerge | low | Evet | `deepmerge` |

## Erişilebilirlik ve güvenli çözüm sırası

1. **Kritik araç zinciri:** oxfmt 0.61.0 → tinypool 2.1.0. Worker yolları
   formatter çalıştırmıyor. Tinypool advisory'si kirlenmiş prototipten worker/run
   seçeneklerinin okunmasını gerektiriyor; varlığı tek başına uzaktan sömürü
   değildir. Uyumlu formatter/tinypool yaması (en az 2.1.2) ayrı grupta;
   audit'in önerdiği oxfmt 0.75.0 geçişi otomatik uygulanmaz.
2. **CLI / kritik proxy:** shadcn 4.18.0 → MCP SDK 1.30.0 → Express 5.2.1 →
   proxy-addr 2.0.7. IPv4-mapped IPv6 trust subnet/IP spoof riski; bu oyunun
   Worker handler'ı Express/trust proxy çalıştırmıyor. 2.0.8+ için CLI/MCP/
   Express/Zod uyumluluğu birlikte doğrulanır. shadcn → dotenvx 1.75.1 →
   systeminformation 5.33.10 Windows services() Unicode tırnak enjeksiyonu da
   bu gruptadır; en az 5.33.16 ve upstream tüketici kontrolü. Güvenilmeyen
   proje/config/servis girdileriyle bu araçlar çalıştırılmamalı.
3. **Vite/dev ve CSS üretimi:** Vite 8.2.2/framework/plugin zinciri ve
   Tailwind/PostCSS → source-map-js 1.2.1; açık development server/WAN maruziyeti
   ayrı risktir. Vite için en az 8.2.4, source-map-js için 1.2.2 tarihsel alt
   sınırları uygulama gününde tekrar kontrol et. Dev sunucusunu internete açma.
4. **Cloudflare / resim / HTTP araçları:** plugin 1.54.6, Wrangler 4.130.0,
   Miniflare 5.20260908.0-alpha, Sharp 0.35.4 ve Undici 7.29.0/7.29.1.
   Tek başına Wrangler güncellemesi yeterli olmayabilir; üçlü ve Sharp override
   birlikte ele alınır. Sharp 0.35.5+, tüm Undici kopyaları 7.30.1+ için yeniden
   audit/peer kontrolü. Native resim/yerel HTTP yolları gerçek Worker OG/resim
   rotalarıyla karıştırılmaz; yeni güvensiz dosya/resim girişi eklenmedi.
5. **OG/framework ve kalanlar:** Vinext → OG/Satori, Hono/node-server,
   body-parser/brace-expansion/fast-uri/ip-address/qs/Zod geçişli kopyaları ve
   deepmerge upstream çözümü. OG/framework yükseltmesinde React eş sürümleri,
   dinamik API ve resim yollarının erişilebilirliği ayrıca denetlenir. Yamalı
   sürüm olmadığı önceki raporda belirtilen deepmerge için upstream durumu
   uygulama günü yeniden incelenir; rastgele override veya silme yok.

İlk iki gruptaki kritik paket isimleri ile systeminformation çağrıları üretilmiş
server JS/MJS içinde aranarak yeni doğrudan Worker çağrı yolu bulunmadı. Kaynak
importları ve npm ls zincirleri de karşılaştırıldı. Bu sınırlı inceleme bütün
framework/OG yolları için güvenlik garantisi değildir. **Bu oturumda erişilebilir
kritik üretim istismarı kanıtlanmadı**; bulunursa mobil önceliğini kesen P0 olur.
Sentry mahremiyet filtresi, CSP, kayıt doğrulaması ve DO/D1 kuralları korunur.

Her kontrollü grup sonrası npm ci → yeni audit → typecheck → tam test → build/
bütçe → yerel HTTP/dört WS/runtime → görsel kontrol. Başarısız grup yayımlanmaz;
`npm audit fix --force` yok. Portal çıkışı bu açıklar kapandı sayılarak yapılmaz.

Birincil advisory kaynakları:
[Tinypool](https://github.com/advisories/GHSA-85c8-ppgw-ccpr),
[proxy-addr](https://github.com/advisories/GHSA-jqcg-44mw-7w3h),
[systeminformation](https://github.com/advisories/GHSA-3f7j-7jwc-fxfj).
