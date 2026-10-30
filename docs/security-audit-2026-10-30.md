# 30 Ekim 2026 — yayın öncesi bağımlılık güvenliği

**Sonraki yayın checkpoint'i:** burada incelenen dar yama alpha.1/3331e6a ile
üretime çıktı ve alpha.2/914bde9 içinde korunur. Aşağıdaki üretime yayımlanmadı
ifadesi ilk yerel denetim anını anlatır. Son kanıt verification-release-1.14.0-alpha.2.md.
Alpha.3 HUD/rehber işi yeni audit veya bağımlılık güncellemesi yapmadı.

**Yerel güvenlik yaması; üretime yayımlanmadı.** İlk taze audit **25 paket:
3 kritik /11 yüksek /10 orta /1 düşük**. Kontrollü yama sonrası **20 paket:
0 kritik /8 yüksek /11 orta /1 düşük**. Sayım paket/metavulnerability
kayıtlarıdır; benzersiz istismar sayısı değildir. `--omit=dev` sonrası17
(0 kritik/8 yüksek/8 orta/1 düşük); bu etiket canlıda erişilebilirlik kanıtı değildir.
Önceki canlı1.13.1 veya değişmemiş A–D tabanı bu yamaları almış sayılmaz.

## İncelenen kanıt ve sınır

Node22.13.0/npm10.9.2; registry `npm audit --json` önce/sonra,
`package.json`, kilitli paket sürümleri/ebeveyn aralıkları, kaynak importları,
Vite yapılandırması, güvenli Worker girişi ve üretilmiş JS/MJS kontrol edildi.
Ham raporlar Git dışı `work/audit-2026-10-30.json`,
`work/audit-security-patched.json`, `work/audit-security-production.json`.
Kalıcı advisory/sürüm özeti [JSON kanıtı](security-audit-2026-10-30.json).

Kaynakta shadcn yalnız `app/globals.css` içinden CSS içe aktarır; CLI/MCP/
Express uygulaması başlatılmaz. `@shadcn/react` farklı pakettir. API'ler Fetch
Request/Response ve DO kullanır; Express trust-proxy yolu değildir. Vite/
Wrangler/Miniflare üretimde dev sunucusu olarak çalıştırılmaz. `ImageResponse`,
`next/og`, Satori veya kullanıcı içerikli OG rotası bulunmadı; sosyal görseller
statik public dosyalarıdır. Güncel dağıtım JS/MJS'sinde proxy-addr, tinypool,
systeminformation, MCP SDK, open-in-editor, ImageResponse, OG/Satori ve
source-map-js adları bulunmadı. Bu arama, minify edilmiş her fonksiyonun
erişilemezliğinin matematiksel kanıtı veya tam pentest değildir.

**Bu sınırlı incelemede canlı Worker'a erişen kritik/yüksek istismar yolu
kanıtlanmadı.** Yerel makine/CI/CLI riskleri gerçektir; özellikle güvenilmeyen
config, kaynak haritası, SVG, HTTP sunucusu veya proje içeriği işlenirken.
Cloudflare üretim hesabı/derleme ortamı salt-okunur ayrıntıları erişim olmadığı
için doğrulanamadı. Canlıya saldırı testi veya üretim DB yazımı yapılmadı.

## Öncelikli 3 kritik +11 yüksek kayıt

D=doğrudan, T=transitif. P=lockfile üretim bağımlılığı; Dev=geliştirme.
P, Worker istek yoluna dahil anlamına gelmez. Dereceler ilk audit'e aittir.

| Paket / ilk sürüm | Tür ve kaynak | İstismar şartı / mevcut erişim | Çözüm ve major durumu |
| --- | --- | --- | --- |
| oxfmt0.61.0 — kritik | D/Dev →tinypool | Formatter worker seçeneklerinde önceden prototip kirlenmesi; oyun Worker'ında formatter yok. Kendi ayrı CVE'si değil, alt paket etkisi. | Scoped tinypool2.1.2 override uygulandı; oxfmt0.75'e atlanmadı. |
| tinypool2.1.0 — kritik | T/Dev, oxfmt sabit2.1.0 | Kirlenmiş worker/run seçenekleri saldırgan modül çalıştırabilir; oyun testleri Node runner kullanır, Vitest değildir. | 2.1.2 patch uygulandı; iki advisory kapandı. Formatter parse smoke ayrıca çalıştırılır. |
| proxy-addr2.0.7 — kritik | T/P, shadcn→MCP→Express | Hatalı IPv4-mapped IPv6 trust subnet +X-Forwarded-For; Express IP erişim/kota atlatma. Oyunun Fetch API'sinde bu yol yok. | 2.0.8 patch override uygulandı. |
| @modelcontextprotocol/sdk1.30.0 — yüksek | T/P, shadcn | Kötü niyetli OAuth discovery/redirect ile sır sızması; oturuma bağlanmayan tasks; limitsiz batch/schema DoS; yanlış audience bearer. Oyunun WebMCP'si bu SDK'yı import etmez. | ≥1.32.0 aynı major planlandı; CLI/MCP akışı birlikte sınanmalı, bu pakette uygulanmadı. |
| body-parser2.3.0 — yüksek | T/P, MCP→Express | Sıkıştırılmış istek sonuna byte ekleyerek işlenmeyen hata/DoS; canlıda Express parser yok. | ≥2.4.0 minor; MCP grubu ile planlandı. |
| brace-expansion5.0.9 — yüksek | T/P, shadcn→ts-morph→minimatch | Saldırgan glob/derin brace dizileri CPU/stack tüketir; canlı API glob kabul etmiyor. | ≥5.0.12 patch; CLI grubunda planlandı. |
| miniflare5.20260908.0-alpha — yüksek | T/Dev, plugin/Wrangler | Sharp/Undici alt paket etkisi; yerel Workers/resim/ağ emülatörü, canlı runtime değil. | Sharp yaması sonrası orta; Undici riski açık. Tarih tabanlı alpha zincirini tek başına zorla yükseltme. |
| shadcn4.18.0 — yüksek | D/P, geliştirme CLI'si | Zod/deepmerge alt paket etkisi; CLI/registry/MCP girdileri. Oyunda yalnız CSS. | Audit'in shadcn1.0 önerisi major geri düşüştür, uygulanmadı. Upstream/MCP/Zod uyumlu paket ayrı kontrol. |
| sharp0.35.4 — yüksek | D/Dev, Miniflare ortak override | Kötü SVG'nin librsvg üzerinde işlenmesi; bazı glibc/Node koşullarında RCE. Canlı Worker native Sharp çağırmıyor. | 0.35.5 patch +tüm platform paketleri uygulandı; Windows binary rsvg2.63.2 doğrulandı. Linux yerel native çalışma bu Windows kabulünün kapsamı değil. |
| source-map-js1.2.1 — yüksek | T/P, PostCSS/Tailwind/shadcn | Büyük indexed source-map section offset ile event-loop DoS; build girdileri, oyun API'si sourcemap almıyor. | 1.2.2 patch override uygulandı. |
| systeminformation5.33.10 — yüksek | T/P, shadcn→dotenvx | Windows services() Unicode tırnak komut enjeksiyonu; Linux networkStats prototip/path sızıntısı; güvenilmeyen parametre gerekir. Canlı Fetch Worker bu OS fonksiyonlarını kullanmaz. | ≥5.33.16 patch; dotenvx/CLI grubu planlandı. |
| undici7.29.0 /7.29.1 — yüksek | T/P+Dev, shadcn/dotenvx/Miniflare | Kötü HTTP/WS/TLS uç noktası, aşırı encoding/EventSource/PONG, redirect-cache/TLS seçenekleri; Node ağ istemcisi riski. Oyunun WS yolu Cloudflare native WebSocket; npm Undici importu yok. | Tüm kopyalar≥7.30.1; Miniflare sabit7.29.0 olduğu için yalnız dedupe yetmez. Araç zinciri grubu açık, zorla override yapılmadı. |
| vite8.2.2 — yüksek | D/Dev, P peer yolu da var | Windows open-in-editor komut enjeksiyonu, dev middleware cross-origin ve fs sınırları. Üretilmiş Worker dev editör yolunu sunmuyor; yerel dev sunucusunu internete açma. | 8.2.4 bu rapor aralıklarını kapatır; güncel audit8.3.5 öneriyor. Framework/plugin eş uyumu ayrı paket, uygulanmadı. |
| zod3.25.76 — yüksek | T/P, shadcn/MCP | Saldırgan büyüklükte constrained collection schema doğrulamasında bellek DoS. Oyun komutları kendi sınırlı validator'ını kullanır. | ≥4.6.6 **major**;3.x üzerine zorlanmadı. Upstream shadcn/MCP uyumu gerekir. |

## Kalan10 orta +1 düşük kayıt

| Paket / sürüm | Tür / kaynak | Şart ve üretim erişimi | Güvenli yön |
| --- | --- | --- | --- |
| @cloudflare/vite-plugin1.54.6 | D/Dev →Wrangler/Miniflare | Alt paket etkisi, build/dev; canlı plugin sunucusu yok. | Audit1.66.0; plugin/Wrangler/Miniflare birlikte, bu tur açık. |
| @hono/node-server2.1.1 | T/P, MCP | serveStatic çift decode ile middleware atlama; canlı Node Hono statik sunucusu yok. | ≥2.1.3 patch, MCP grubu. |
| @vercel/og0.8.6 | T/P, Vinext→Satori | SVG escaping alt etkisi; mevcut sosyal görseller statik. | Uyumlu OG/Satori upstream; doğrudan Satori0.16→0.33 override riskli. |
| fast-uri3.1.7 | T/P, MCP/AJV ve dotenvx/conf | Scheme/host/path farklı normalize edilmesi; bu normalize sonuçlarıyla güven kararı alınırsa risk. Oyun bu paketi import etmez. | ≥3.1.9 patch, CLI grubu. |
| hono4.13.7 | T/P, MCP | Node serveStatic çift decode, yukarıdaki koşul. | ≥4.13.11 patch, MCP grubu. |
| ip-address10.7.0 | T/P, rate-limit/socks CLI | Yanlış aile/subnet kabulü; büyük zone/IPv6 parse DoS. Canlı kimlik kontrolü bu pakete dayanmaz. | ≥10.7.4 patch, CLI grubu. |
| qs6.16.0 | T/P, Express/body-parser | comma stringify +çağrılamaz own toString ile DoS. Oyun kendi JSON parser'ını kullanır. | >6.16.0 yamalı6.x durumu registry'de doğrulanarak; açık. |
| satori0.16.0 | T/P, OG | Saldırgan değer SVG markup olur; tüketim biçimine göre etki. Mevcut kullanıcı girdili SVG/OG rotası yok. | ≥0.33.5;0.x minor API değişikliği riski, framework grubu. |
| vinext1.0.0-beta.9 | D/P →OG | Satori alt etkisi; tüm framework açık demek değildir. | Audit1.4.0 beta→stable geniş değişim; bu acil pakette yapılmadı. |
| wrangler4.130.0 | D/Dev →Miniflare | Yerel simülatör/ağ alt etkisi; deployment CLI canlı istek sunucusu değildir. | Plugin ile uyumlu sürüm; bağımsız plansız yükseltme yok. |
| deepmerge4.3.1 — düşük | T/P, shadcn | Saldırgan nesnesinde prototype poisoning; CLI birleşimleri. Oyun state'ini bu merge ile işlemiyor. | Audit'te aynı major güvenli yama yok; shadcn downgrade önerisi reddedildi, upstream çözüm açık. |

## Uygulanan dar yama ve kalan sıra

`codex/security-patch-1-13-2`, hotbar checkpoint'inden ayrı dal.
Yalnız package/lock: Sharp doğrudan sürümü ve override0.35.5,
oxfmt içindeki Tinypool2.1.2, proxy-addr2.0.8, source-map-js1.2.2.
Lock farkında bu dört paket ve Sharp platform/libvips ikilileri dışında
paket sürümü değişmedi. Parent/API/React/oyun motoru değiştirilmedi.
`npm audit fix --force` veya major upgrade yapılmadı.

Hotbar+güvenlik dalının (`a09f7eb`) doğrulaması: temiz `npm ci`584 paket/585 tarama; typecheck,
234/234 test (16.05s), build ve yerel dört oyunculu runtime çıkış0.
Statik2,956,261 bayt /tahmini1,560,921;3MB sınırı korunur.
Formatter stdin parse ve Sharp SVG→64px PNG smoke geçti. API nonce/CSP,
kimlik/üretim sahipliği, çift/tekrar istek, Worker restart/4WS reconnect,
D1 çakışması ve ortak uyku yerel runtime'da geçti. Loglar
`work/security-{ci,typecheck,test,build,runtime}.log`.
Bu Windows doğrulaması Cloudflare Linux CI veya fiziksel telefon kabulü değildir.

Sonraki sıra: (1) Vite dev güvenliği +peer uyum testi; (2) CLI/MCP/Express
patchleri, Zod major için upstream kararı; (3) Cloudflare üçlüsü ve tüm
Undici kopyaları; (4) Vinext/OG/Satori uyum paketi ve deepmerge upstream.
Güvenlik sınıflandırması tam uygulama güvenlik denetimi yerine geçmez.
Her grup temiz ci, typecheck/test/build/bütçe/yerel4WS ve kayıt kabulü ister.
Canlıya çıkabilecek yeni erişilebilir kritik/yüksek yol bulunursa P0 yayın engelidir.

Birincil kaynaklar: [Tinypool worker](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3),
[Tinypool run](https://github.com/advisories/GHSA-85c8-ppgw-ccpr),
[proxy-addr](https://github.com/advisories/GHSA-jqcg-44mw-7w3h),
[Sharp](https://github.com/advisories/GHSA-wq5f-xc86-pv6w),
[source-map-js](https://github.com/advisories/GHSA-68fv-2mgg-jv7q),
[Vite/launch-editor](https://github.com/advisories/GHSA-587h-7wmj-h5pm),
[Satori](https://github.com/advisories/GHSA-wx4j-mvgx-mqwp),
[Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
Diğer advisory kimlikleri/range'leri JSON kanıtında tek tek korunur.
