# AI Business Orchestrator — deneme Akademi · Fintern Hackathon

Departmanlar arası karar otomasyonu prototipi. Bir kampanya fikri girildiğinde AI; geçmiş
kampanya verileri, müşteri davranışları, mevsimsellik ve piyasa trendleriyle analiz eder,
ilgili departmanlara gerekçeli görevler atar ve her kararın **nedenini** şeffaf biçimde gösterir.

## Modüller

1. **Reaktif Orchestrator** — Fikir girişi → AI analizi → CRM / Veri Platformları / Legal / Pazarlama görev kartları
2. **Organizational Memory** — Geçmiş 14 kampanyanın sonuçlarına referans veren gerekçeli öneriler
3. **Proaktif Talep Sinyalleri** — Mobil kullanım + mevsimsellik + trend analizi ile fırsat kartları
4. **Görev Panosu + AI Karar Günlüğü** — Kanban takibi (Bekliyor → AI İşliyor → Atandı → Tamamlandı) ve her görev için "AI karar gerekçesi" paneli. "Canlı akış" düğmesiyle otomatik demo modu.

## Teknoloji

React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · Lucide Icons
Tüm animasyonlar `prefers-reduced-motion` tercihine saygı duyar.

## Çalıştırma

```bash
npm install
npm run dev        # geliştirme: http://localhost:5173
npm run build      # üretim çıktısı → dist/
npm run preview    # üretim önizleme: http://localhost:4173
```

## Yayınlama (demo bağlantısı)

**Vercel (önerilen):**

```bash
npx vercel login
npx vercel --prod --yes
```

Komut sonunda verilen `https://<proje>.vercel.app` adresi jüriyle paylaşılabilir.

### Gerçek AI entegrasyonu (opsiyonel)

`/api/refine` ve `/api/analyze` fonksiyonları çok sağlayıcılı çalışır — Vercel ortam
değişkenlerinden hangisi tanımlıysa onu kullanır, hiçbiri yoksa uygulama zengin
simülasyon verisiyle çalışmaya devam eder:

| Değişken | Sağlayıcı | Nasıl alınır |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude (birincil) | console.anthropic.com (kredi gerektirir) |
| `GEMINI_API_KEY` | Google Gemini (ücretsiz) | aistudio.google.com/apikey |
| `GEMINI_MODEL` | (ops.) model adı | varsayılan: `gemini-2.5-flash` |

**Alternatif — Netlify Drop:** `npm run build` sonrası oluşan `dist/` klasörünü
(veya hazır `dist.zip` dosyasını) https://app.netlify.com/drop sayfasına sürükleyin;
saniyeler içinde herkese açık bir bağlantı üretilir.
