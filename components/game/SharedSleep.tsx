'use client';
import type { Engine } from '@/lib/game/model';
import { sleepBlockReason } from '@/lib/game/rest';

export default function SharedSleep({engine}:{engine:Engine}) {
  if(!engine.network?.shared)return null;
  const status=engine.network.sleep,blocked=sleepBlockReason(engine.s);
  return <section className="friend-lobby" aria-label="Ortak uyku">
    <h3>Günü birlikte bitir</h3>
    <p>Akşam olunca herkes evin yakınına gelsin ve hazır olsun. Son onayla üretim, hayvan bakımı ve sabah bütün çiftlikte birlikte ilerler.</p>
    {status&&<p role="status">Hazır: {status.ready.join(', ')||'Kimse yok'} · Beklenen: {status.waiting.join(', ')||'Herkes hazır'}</p>}
    <button className="primary-button" disabled={!!blocked||!!status?.voted} onClick={()=>engine.sleep()}>{status?.voted?'Hazırsın · arkadaşların bekleniyor':'Uykuya hazırım'}</button>
    {status&&<button className="secondary-button" onClick={()=>engine.cancelSleep()}>Uyku isteğini iptal et</button>}
    <p>{blocked||'Evden uzaklaşmak, bağlantı kopması veya 90 saniyelik sürenin dolması onayları iptal eder.'}</p>
  </section>;
}
