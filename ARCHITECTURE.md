# AI Business Orchestrator — Mimari Şablonu

Bir kampanya fikrinin sisteme girişinden departman görev kartlarına ve Teams bildirimine
kadar geçen yolun baştan sona açıklaması. Jüri sunumu, dokümantasyon veya yeni geliştirici
onboarding'i için şablon olarak kullanılabilir.

---

## 1. Genel Bakış

```
Kullanıcı (banka çalışanı)
        │  kampanya fikri (serbest metin)
        ▼
┌─────────────────────────────┐
│  Frontend (React + Vite)    │  4 sayfa: Yeni Kampanya · Görev Panosu · Sinyaller · Geçmiş
└──────────────┬──────────────┘
               │  fetch /api/...
               ▼
┌─────────────────────────────┐
│  Backend (Vercel Serverless)│  refine → process → prepare → teams
│  api/*.ts                   │
└──────────────┬──────────────┘
               │  generateStructured()
               ▼
┌─────────────────────────────┐
│  AI Sağlayıcı Zinciri       │  OpenAI → Claude → Gemini (sırayla, ilk başarılı kazanır)
│  api/_providers.ts          │  hepsi başarısız → frontend simülasyon moduna düşer
└─────────────────────────────┘
```

**Temel tasarım ilkesi:** Üretken AI yalnızca son adımda, doğrulanmış deterministik
analiz sonuçlarını görev paketlerine çevirmek için kullanılır. Mevzuat (BDDK/KVKK),
benzerlik eşleme ve sinyal analizi gibi kritik adımlar sabit kural motorlarıyla çalışır —
halüsinasyon alanı bilinçli olarak daraltılmıştır.

---

## 2. Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| UI | React 18 · TypeScript · Vite |
| Stil | Tailwind CSS (Fibabanka açık teması, mavi→yeşil gradyan) |
| Animasyon | Framer Motion (`prefers-reduced-motion` uyumlu) |
| İkon | Lucide Icons |
| Backend | Vercel Serverless Functions (`api/*.ts`) |
| AI SDK | `@anthropic-ai/sdk` (Claude) · REST (OpenAI Responses API, Gemini generateContent) |
| Dağıtım | Vercel (`npx vercel --prod`) veya Netlify Drop |

---

## 3. Frontend Yapısı (`src/`)

| Dosya | Görev |
|---|---|
| `App.tsx` | Sayfa yönlendirme + merkezi state: `tasks` (görev kartları) ve `campaigns` (kampanya işleri). Kampanya tamamlanınca AI çıktısındaki 4 departman kartını görev listesine ekler. |
| `pages/NewCampaign.tsx` | Fikir girişi → `/api/refine` ile AI destekli brief/yönlendirme önerisi → kullanıcı onayı → kampanya oluşturma. Onaysız hiçbir şey dağıtılmaz. |
| `pages/TaskBoard.tsx` | Kanban panosu (Bekliyor → AI İşliyor → Atandı → Tamamlandı) + her görev için "AI karar gerekçesi" paneli + canlı akış demo modu. |
| `pages/Signals.tsx` | Proaktif talep sinyalleri: mobil arama terimleri, ekran kullanımı, mevsimsellik fırsat kartları. |
| `pages/History.tsx` | Organizational Memory — geçmiş 14 kampanyanın sonuçları. |
| `components/` | Sidebar (maskotlu), ProcessingTheater (aşama animasyonu), Sparkline, CountUp, Typewriter, DiamondLogo. |
| `data/mock.ts` | Simülasyon verileri: seed kampanyalar, başlangıç görevleri, skor fonksiyonu. API anahtarı yoksa uygulama bu veriyle tam işlevli çalışır. |

---

## 4. Backend Uç Noktaları (`api/`)

| Uç nokta | Ne yapar | AI kullanır mı |
|---|---|---|
| `refine.ts` | Ham fikri kullanıcıyla tartışılabilir bir brief'e (hedef, segment, kanal, KPI) ve departman yönlendirme önerisine çevirir. Dağıtım öncesi insan onayı adımıdır. | ✅ |
| `process.ts` | Ana orkestrasyon boru hattı — aşağıda detaylı. Sonuç: özet + hafıza referansları + 4 departman görev kartı + karar izi (trace). | ✅ (yalnız sentez aşamasında) |
| `prepare.ts` | Tek bir departman görevi için başlangıç TASLAK çalışma paketi üretir (ör. Pazarlama için push metni varyantları, Legal için kontrol maddeleri). | ✅ |
| `analyze.ts` | Kampanya fikrinin bağımsız analizi (özet + kartlar). | ✅ |
| `teams.ts` | Görev paketini departmanın Microsoft Teams kanalına Adaptive Card olarak gönderir (webhook). Webhook tanımlı değilse "demo modu" raporlar. | ❌ |
| `_providers.ts` | Ortak AI katmanı — tüm uç noktalar `generateStructured()` çağırır. | — |

---

## 5. Orkestrasyon Boru Hattı (`api/process.ts`)

Her aşama, frontend'deki ProcessingTheater'da gerekçesiyle ("why") birlikte canlı gösterilen
bir `stage` olayı yayınlar. İlk 7 aşama **deterministik**tir; üretken model yalnızca 8. aşamada devreye girer.

| # | Aşama | Tür | Açıklama |
|---|---|---|---|
| 1 | `intake` | Deterministik | Serbest metin sözlük ayrıştırıcısıyla amaç/ürün terimlerine ayrıştırılır. |
| 2 | `segment` | Deterministik | Hedef segment sinyalleri çıkarılır (öğrenci, KOBİ, emekli…). |
| 3 | `signals` | Deterministik | Fikir, son 30 günün mobil arama terimleri ve ekran kullanımıyla eşleştirilir; momentum skoru hesaplanır. |
| 4 | `memory` | Deterministik | Geçmiş kampanya havuzundan en benzer 3 kampanya, açılma/dönüşüm metrikleriyle sıralanır. |
| 5 | `channels` | Deterministik | Kanal alternatifleri (Push, In-app, SMS, E-posta…) skorlanır. |
| 6 | `timing` | Deterministik | Mevsimsellik ve zamanlama penceresi analizi (maaş döngüsü, kayıt dönemi, kur hareketliliği…). |
| 7 | `rules` | Deterministik | BDDK/KVKK kural motoru — mevzuat kontrolü asla üretken modele bırakılmaz, her çalıştırmada aynı sonucu verir. |
| 8 | `model` | **Üretken AI** | 7 aşamanın doğrulanmış çıktısı yapılandırılmış bağlam olarak modele verilir; model katı JSON şemasına uyarak 4 departman için görev + alt görev + KPI + ETA + risk üretir. |
| 9 | `validation` | Deterministik | Model çıktısı beklenen departman kümesiyle (CRM · Veri Platformları · Legal · Pazarlama) karşılaştırılır; eksik/mükerrer kart varsa süreç hata ile durur. |
| 10 | `dispatch` | Deterministik | Her departman için Teams-bot mesajı hazırlanır. |

---

## 6. AI Sağlayıcı Katmanı (`api/_providers.ts`)

Tek giriş noktası: `generateStructured(system, user, schema, maxTokens)`.
Tanımlı API anahtarına göre sırayla dener, ilk başarılı yanıtı döndürür:

| Sıra | Sağlayıcı | Model | Çağrı biçimi |
|---|---|---|---|
| 1 | OpenAI | `gpt-5.6-luna` (env: `OPENAI_MODEL`) | Responses API, strict `json_schema`, düşük reasoning eforu |
| 2 | Anthropic Claude | `claude-opus-4-8` | `@anthropic-ai/sdk`, adaptive thinking + JSON şema çıktısı |
| 3 | Google Gemini | `gemini-flash-latest` (env: `GEMINI_MODEL`) | REST `generateContent`; şema `toGeminiSchema()` ile Gemini formatına çevrilir |

Üçü de başarısız olursa `no_api_key` / hata döner ve **frontend `data/mock.ts` üzerinden
simülasyon moduna geçer** — demo hiçbir zaman boş ekranla kalmaz.

Tüm yanıtlar JSON şemasıyla kısıtlanır; serbest metin üretimine izin verilmez.
Yanıta `provider` ve `model` alanları eklenir ve UI'da her görev kartında hangi
modelin karar verdiği şeffaf biçimde gösterilir.

---

## 7. Uçtan Uca Akış (bir kampanyanın yaşam döngüsü)

1. **Fikir girişi** — Çalışan, Yeni Kampanya sayfasına serbest metin yazar.
2. **Rafine etme** — `/api/refine` fikri brief'e çevirir, departman yönlendirmesi önerir; kullanıcı düzenleyip **onaylar** (insan onayı olmadan dağıtım yok).
3. **Orkestrasyon** — `/api/process` 10 aşamalı boru hattını çalıştırır; her aşama gerekçesiyle canlı izlenir.
4. **Görev kartları** — 4 departmana görev kartları düşer; her kartta AI karar gerekçesi, KPI'lar, riskler, hafıza referansları ve `sağlayıcı · model` bilgisi bulunur.
5. **Taslak paket** — Departman kartından `/api/prepare` ile işi başlatan taslak çalışma paketi üretilebilir (insan denetimi notuyla).
6. **Teams bildirimi** — `/api/teams` görevi ilgili kanala Adaptive Card olarak iletir.
7. **Takip** — Kanban panosunda görevler Bekliyor → AI İşliyor → Atandı → Tamamlandı akışında ilerler; Geçmiş sayfası organizasyonel hafızayı besler.

---

## 8. Ortam Değişkenleri

| Değişken | Amaç | Zorunlu mu |
|---|---|---|
| `OPENAI_API_KEY` / `OPENAI_MODEL` | OpenAI (1. sıra) | Hayır |
| `ANTHROPIC_API_KEY` | Claude (2. sıra) | Hayır |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Gemini (3. sıra, ücretsiz) | Hayır |
| `TEAMS_WEBHOOK_CRM` / `_VERI` / `_LEGAL` / `_PAZARLAMA` | Departman bazlı Teams kanalı | Hayır |
| `TEAMS_WEBHOOK_URL` | Ortak Teams kanalı (departman bazlısı yoksa) | Hayır |

Hiçbir anahtar tanımlı değilse uygulama tamamen simülasyon verisiyle çalışır.

---

## 9. Güven ve Şeffaflık İlkeleri

- **AI'ya en dar rol:** Üretken model yalnızca sentez yapar; ayrıştırma, mevzuat ve doğrulama deterministiktir.
- **Katı şema:** Tüm model çıktıları JSON Schema ile kısıtlanır (`strict` / `output_config` / `response_schema`).
- **Güven ama doğrula:** `validation` aşaması model çıktısını departman kümesiyle karşılaştırır; eksikse süreç durur.
- **İnsan onayı:** Rafine edilen brief kullanıcı onayı olmadan dağıtılmaz; taslak paketler departman onayı notuyla üretilir.
- **İzlenebilirlik:** Her görev kartı hangi sağlayıcı/modelin, hangi analitik bulguya dayanarak karar verdiğini gösterir; tüm süreç `trace` olarak saklanır.
