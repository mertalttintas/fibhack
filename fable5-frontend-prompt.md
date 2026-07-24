# Fable 5 / Claude Code Prompt — AI Business Orchestrator Frontend (v2)

Aşağıdaki metni olduğu gibi Claude Code / Fable 5'e yapıştır. İstersen başına kendi ek notlarını ekleyebilirsin.

---

## ROL

Sen kıdemli bir fintech ürün ekibinin parçasısın: bir tasarımcı, bir frontend mühendisi ve bir ürün müdürünün ortak bakış açısıyla çalışıyorsun. Bu proje bir hackathon demosu gibi DEĞİL, aylardır bankanın içinde canlı çalışan, geçmiş verilerle beslenmiş, olgun bir kurumsal otomasyon ürünüymüş gibi tasarlanmalı ve inşa edilmeli. Kullanıcı (banka çalışanı) bu sistemi ilk kez görmüyor — sistem zaten geçmiş kampanya kararlarını biliyor, öğrenmiş, ve bugün yeni bir karar veriyor. Bu "olgunluk hissi" tüm arayüz boyunca hissedilmeli: boş/yeni bir uygulama değil, arkasında veri ve tarihçe olan bir sistem.

## PROJE ÖZETİ

**Ad:** AI Business Orchestrator (Fibabanka — Fintern Hackathon projesi)
**Konumlandırma:** Bu bir departmanlar arası karar otomasyonu. Bir kampanya fikri girildiğinde, AI bunu geçmiş kampanya verileri, müşteri davranışları, mevsimsellik ve piyasa trendleriyle birlikte analiz eder; ilgili departmanlara somut görevler atar; ve neden o kararı verdiğini gerekçeleriyle gösterir.

**Dört ana modül (öncekinden farkı: artık görev takibi ve karar şeffaflığı da var):**
1. **Reaktif orchestrator** — kullanıcı bir cümle yazar, AI bunu analiz edip CRM, Veri Platformları, Legal, Pazarlama gibi departmanlara özel görev kartları üretir.
2. **Organizational memory** — orchestrator geçmiş kampanya sonuçlarını referans alıp gerekçeli öneri sunar.
3. **Proaktif talep sinyali dashboard'u** — mobil bankacılık kullanım verisi + mevsimsellik + piyasa trendleri analiz edilip "bu ay şuna talep arttı" kartları üretilir.
4. **YENİ — Departman görev takip ekranı ve AI karar günlüğü** — AI'ın departmanlara attığı görevlerin durumu (bekliyor / işleniyor / atandı / tamamlandı) görülebilir bir panoda (kanban tarzı) izlenir. Her görevin yanında AI'ın o kararı NEDEN verdiğini açıklayan bir "karar gerekçesi" paneli var (örn. "Push kanalı seçildi çünkü Mart 2025 kampanyasında %42 açılma oranı, SMS'in iki katı performans gösterdi").

## MARKA / TEMA — FİBABANKA

Bu proje Fibabanka hackathonu için, arayüz Fibabanka kurumsal kimliğini yansıtmalı:
- **Ana renkler:** Koyu lacivert/gece mavisi taban (#0A2647 – #0B2A5B aralığında), Fibabanka logosundaki mavi-yeşil elmas (diamond) tonları vurgu rengi olarak (teal/turkuaz #2FB6A6 gibi ve canlı yeşil #8DC63F gibi — marka yeşili).
- **İkincil vurgu:** Sunumlardaki arka plan dokusunda gördüğün gibi mercan/pembe (#E85D75 gibi) çok az, sadece nokta vurgu olarak (uyarı/rozet renginde) kullanılabilir.
- **Logo motifi:** Fibabanka logosundaki elmas (diamond) şeklini arka planda çok hafif, düşük opasiteli bir desen/watermark olarak kullanabilirsin (header'da, boş state'lerde, loading ekranlarında).
- **Genel his:** Kurumsal ama donuk değil — koyu tema üzerine parlayan teal/yeşil vurgularla "yüksek teknoloji, güvenilir banka" hissi.

## SAYFA / EKRAN DÖKÜMÜ

### 1. Ana ekran — Fikir girişi
- Header'da Fibabanka elmas logosu (basit SVG ile yeniden üretilebilir, marka kopyası değil sadece ilham) çok hafif animasyonla (yavaşça dönen/parlayan glow) — bu "sistem canlı ve çalışıyor" hissi verir.
- Büyük başlık, altında input textarea, 3-4 örnek senaryo chip'i.
- Sağ üstte küçük bir "Bugün işlenen kampanya: 12 · Ortalama karar süresi: 40sn" gibi canlı görünen sahte metrik şeridi — sistemin zaten kullanımda olduğu hissini pekiştirir.

### 2. Sonuç ekranı — Departman görev kartları
- Grid, her departman için kart (CRM, Veri Platformları, Legal, Pazarlama — MVP için 4 tanesi yeterli).
- Kartlar sırayla (staggered, 150-200ms arayla) fade+slide-up ile belirsin.
- Üstte "Organizational memory önerisi" banner'ı, amber/altın vurgulu.
- Legal kartında "⚠ dikkat noktası" rozeti.

### 3. YENİ — Departman görev takip panosu (Kanban)
- Sütunlar: **Bekliyor → AI işliyor → Departmana atandı → Tamamlandı**
- Her kart bir görev: hangi departman, kısa özet, atanma zamanı.
- Karta tıklanınca yan panelde/modal'da **"AI karar gerekçesi"** açılır: AI'ın bu görevi neden bu departmana, bu öncelikle, bu içerikle attığını 2-3 cümlelik gerekçeyle gösterir — geçmiş veriye referans vererek (örn. "Geçmiş 3 kampanyada bu segment için Push kanalı %28 daha iyi dönüşüm verdi").
- Bu ekran, "AI kararlarını şeffaf gösterme" vaadinin görsel kanıtı — jüriye en çok güven verecek ekranlardan biri, zaman ayırmaya değer.
- Kartların sütunlar arası "hareket ettiği" hissi verecek küçük bir otomatik demo modu eklenebilir (opsiyonel, zaman kalırsa): birkaç saniyede bir bir kart otomatik ilerler, sistemin canlı çalıştığını gösterir.

### 4. Proaktif talep sinyali dashboard'u
- Trend kartları + mini grafikler ("Bu ay en çok kullanılan sekmeler", "En çok aranan terimler").
- Her trend için "önerilen aksiyon" satırı.

### 5. Genel navigasyon
- Sol sidebar: "Yeni Kampanya", "Görev Panosu" (yeni eklenen kanban), "Talep Sinyalleri", "Geçmiş Kampanyalar" (placeholder olabilir).
- Sidebar'da aktif sekme, teal/yeşil glow ile vurgulansın.

## ANİMASYON YÖNERGELERİ — "uçuk kaçık" ama işlevi bozmadan

Bankacılık ciddiyetini koruyarak görsel olarak iddialı ol:
- **Karar akışı animasyonu**: fikir girişinden departman kartlarına giden ince, parlayan "veri parçacığı" çizgileri (SVG path boyunca hareket eden küçük glow noktaları) — AI'ın kararı departmanlara "gönderdiğini" gözle görünür kıl.
- **Glassmorphism kartlar**: yarı saydam, hafif blur arka planlı kartlar, ince parlayan border (teal glow, hover'da güçlenir).
- **Sayı animasyonları**: metrikler (açılma oranı %42 gibi) sayfa yüklenince 0'dan hedef değere sayarak animasyonla dolsun.
- **Karar gerekçesi paneli** açılırken typewriter efektiyle (harf harf) yazılsın — "AI düşünüyor ve açıklıyor" hissi verir.
- **Elmas logo motifi** header'da yavaşça (8-10 saniyede bir tur) dönen çok ince bir glow halkasıyla canlansın.
- Tüm animasyonlar `prefers-reduced-motion` ile kapatılabilir olsun, performansı bozmasın (60fps hedefle, ağır parçacık efektlerinden kaçın — 10-15 parçacık yeterli).

## TEKNİK GEREKSİNİMLER

- **Stack:** React + TypeScript + Tailwind CSS + shadcn/ui.
- **Animasyon:** Framer Motion (kart girişleri, sayfa geçişleri, sayı sayaçları), gerekirse basit SVG path animasyonu için native CSS/SVG animate.
- **State:** Basit React state yeterli.
- **Sahte veri:** AI çıktısı, organizational memory, karar gerekçeleri ve talep sinyali verileri için gerçekçi mock JSON dosyaları oluştur. Gerçek bir LLM API bağlanabiliyorsa (örn. Anthropic API) fikir girişini gerçekten işleyip yapılandırılmış JSON döndürecek şekilde entegre et.
- **Responsive:** Öncelik masaüstü/projeksiyon ekranı, temel mobil uyumluluk da olsun.

## BAŞARI KRİTERİ

Arayüz görüldüğü an "bu ekip aylardır bu ürünü işletiyor" hissi vermeli — geçmiş veri, karar gerekçeleri ve canlı görünen metrikler bunu destekler. Jenerik AI chatbot arayüzlerinden kesinlikle kaçın. Görev takip panosu ve karar gerekçesi paneli, projenin "şeffaf ve güvenilir AI" mesajını en güçlü şekilde taşıyan iki ekran — bunlara özel özen göster.

Şimdi bu spesifikasyona göre proje iskeletini kur: önce ana ekran + sonuç ekranı, sonra görev takip panosu (kanban + karar gerekçesi paneli), son olarak talep sinyali dashboard'u.
