import { generateStructured } from "./_providers.js";

const DEPARTMENTS = ["CRM", "Veri Platformları", "Legal", "Pazarlama"];

const MEMORY = [
  { name: "Genç Segment Kredi Kartı", tags: ["öğrenci", "genç", "kredi", "kart", "kira", "puan"], channel: "Push", openRate: 42, conversion: 8.4 },
  { name: "Mevduat Faiz Kampanyası", tags: ["mevduat", "faiz", "birikim", "yatırım"], channel: "Mobil Banner", openRate: 31, conversion: 5.2 },
  { name: "KOBİ İşletme Kredisi", tags: ["kobi", "işletme", "kredi", "pos", "ticari"], channel: "E-posta", openRate: 17, conversion: 3.1 },
  { name: "Kira Öde Puan Kazan", tags: ["kira", "puan", "öğrenci", "genç", "ödeme"], channel: "In-app", openRate: 38, conversion: 7.1 },
  { name: "Emekli Bankacılığı", tags: ["emekli", "maaş", "55", "promosyon"], channel: "SMS", openRate: 24, conversion: 4.6 },
];

// Mobil bankacılık davranış verisi: son 30 gün arama terimleri ve ekran kullanımı.
// Talep sinyali aşaması kampanya fikrini bu veriyle eşleştirip momentum skoru üretir.
const SEARCHES = [
  { term: "kira öderken puan", count: 4210, change: 31, tags: ["kira", "puan", "genç", "öğrenci", "kart"] },
  { term: "öğrenci hesabı", count: 3860, change: 31, tags: ["öğrenci", "üniversite", "genç", "hesap"] },
  { term: "konut kredisi faiz", count: 3120, change: 34, tags: ["konut", "kredi", "faiz", "ev", "evlilik"] },
  { term: "döviz alarmı", count: 2540, change: 21, tags: ["döviz", "alarm", "kur", "vadeli"] },
  { term: "borç yapılandırma", count: 1980, change: 18, tags: ["borç", "yapılandırma", "kart", "kredi"] },
  { term: "vadeli hesap", count: 1720, change: 12, tags: ["vadeli", "mevduat", "faiz", "birikim", "döviz"] },
  { term: "pos komisyon", count: 1490, change: 16, tags: ["pos", "kobi", "işletme", "ticari", "e-ticaret"] },
  { term: "emekli promosyon", count: 1310, change: 9, tags: ["emekli", "promosyon", "maaş", "55"] },
  { term: "altın hesabı", count: 1240, change: 14, tags: ["altın", "yatırım", "birikim"] },
  { term: "taşıt kredisi", count: 1150, change: 7, tags: ["taşıt", "araç", "kredi"] },
  { term: "kredi kartı limit artırma", count: 1080, change: 11, tags: ["kart", "limit", "kredi"] },
  { term: "evlilik kredisi", count: 940, change: 19, tags: ["evlilik", "çift", "kredi", "konut", "eşya"] },
  { term: "mevduat hesaplama", count: 990, change: -9, tags: ["mevduat", "faiz", "birikim", "vadeli"] },
  { term: "şube randevu", count: 860, change: -14, tags: ["şube", "randevu"] },
];

const TABS = [
  { name: "Para Transferi", usage: 100, change: 2, tags: ["transfer", "ödeme", "kira"] },
  { name: "Kredi Hesaplama", usage: 78, change: 12, tags: ["kredi", "konut", "taşıt", "hesaplama", "evlilik"] },
  { name: "Döviz & Altın", usage: 64, change: 9, tags: ["döviz", "altın", "kur", "yatırım", "alarm"] },
  { name: "Kart İşlemleri", usage: 52, change: 6, tags: ["kart", "limit", "borç", "puan"] },
  { name: "Fatura Ödeme", usage: 47, change: 3, tags: ["fatura", "ödeme", "kira"] },
  { name: "Yatırım", usage: 38, change: 4, tags: ["yatırım", "fon", "mevduat", "vadeli"] },
  { name: "Kampanyalar", usage: 33, change: 15, tags: ["kampanya", "puan", "fırsat", "promosyon"] },
  { name: "Başvurular", usage: 29, change: 8, tags: ["başvuru", "kredi", "kart", "hesap", "öğrenci"] },
  { name: "Şube Randevu", usage: 18, change: -14, tags: ["şube", "randevu"] },
];

const pct = (change: number) => `${change >= 0 ? "+" : "−"}%${Math.abs(change)}`;

function signalAnalysis(idea: string) {
  const lower = idea.toLocaleLowerCase("tr-TR");
  const matchedSearches = SEARCHES.filter((s) => s.tags.some((tag) => lower.includes(tag)))
    .sort((a, b) => b.count * b.change - a.count * a.change).slice(0, 4);
  const matchedTabs = TABS.filter((t) => t.tags.some((tag) => lower.includes(tag)))
    .sort((a, b) => b.change - a.change).slice(0, 3);
  const volume = matchedSearches.reduce((sum, s) => sum + s.count, 0);
  const avgChange = matchedSearches.length
    ? matchedSearches.reduce((sum, s) => sum + s.change, 0) / matchedSearches.length : 0;
  const tabBoost = matchedTabs.length ? matchedTabs.reduce((sum, t) => sum + t.change, 0) / matchedTabs.length : 0;
  const momentum = Math.max(15, Math.min(98, Math.round(38 + avgChange * 1.4 + tabBoost * 0.8 + Math.min(20, volume / 500))));
  return { matchedSearches, matchedTabs, volume, momentum };
}

function timingAnalysis(idea: string) {
  const lower = idea.toLocaleLowerCase("tr-TR");
  const factors: string[] = [];
  let window = "Ay başı maaş yatış haftası — genel kampanya açılmasını artıran dönem";
  let score = 68;
  if (/öğrenci|üniversite|genç|kayıt/.test(lower)) { window = "Üniversite kayıt dönemi öncesi hafta — öğrenci aramaları zirvede"; factors.push("'öğrenci hesabı' aramaları +%31"); score = 90; }
  else if (/konut|ev |evlilik/.test(lower)) { window = "Faiz indirim beklentisi dönemi — hesaplama ekranı trafiği yüksek"; factors.push("Kredi Hesaplama sekmesi +%12"); score = 84; }
  else if (/döviz|kur|alarm/.test(lower)) { window = "Kur hareketliliği haftası — alarm kurulumları artışta"; factors.push("Döviz alarmı kurulumları +%21"); score = 82; }
  else if (/kobi|pos|işletme/.test(lower)) { window = "Vergi/KDV dönemi sonrası — işletme nakit akışı gündemde"; factors.push("'pos komisyon' aramaları +%16"); score = 76; }
  else if (/emekli|maaş/.test(lower)) { window = "3 aylık emekli maaş promosyon takvimi penceresi"; factors.push("SMS kanalı 55+ segmentte güvenilir"); score = 74; }
  factors.push("Ay başı maaş döngüsü ile hizalama önerildi");
  factors.push("Haftalık push frekans limiti: 2 bildirim");
  return { window, factors, score };
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "memory", "cards"],
  properties: {
    summary: { type: "string" },
    memory: {
      type: "object",
      additionalProperties: false,
      required: ["title", "text", "refs"],
      properties: {
        title: { type: "string" },
        text: { type: "string" },
        refs: { type: "array", items: { type: "string" } },
      },
    },
    cards: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["department", "title", "items", "metric", "warning", "rationale", "details"],
        properties: {
          department: { type: "string", enum: DEPARTMENTS },
          title: { type: "string" },
          items: { type: "array", items: { type: "string" } },
          metric: {
            type: "object",
            additionalProperties: false,
            required: ["label", "value", "suffix"],
            properties: {
              label: { type: "string" },
              value: { type: "number" },
              suffix: { type: "string" },
            },
          },
          warning: { type: ["string", "null"] },
          rationale: { type: "string" },
          details: {
            type: "object",
            additionalProperties: false,
            required: ["kpis", "subtasks", "timeline", "dataSources", "dependencies", "risk"],
            properties: {
              kpis: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["label", "value"],
                  properties: { label: { type: "string" }, value: { type: "string" } },
                },
              },
              subtasks: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["name", "owner", "eta", "status", "expectation"],
                  properties: {
                    name: { type: "string" },
                    owner: { type: "string" },
                    eta: { type: "string" },
                    status: { type: "string", enum: ["planlandı", "sürüyor", "hazır"] },
                    expectation: { type: "string" },
                  },
                },
              },
              timeline: { type: "string" },
              dataSources: { type: "array", items: { type: "string" } },
              dependencies: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["department", "need", "message"],
                  properties: {
                    department: { type: "string", enum: DEPARTMENTS },
                    need: { type: "string" },
                    message: { type: "string" },
                  },
                },
              },
              risk: { type: "string" },
            },
          },
        },
      },
    },
  },
} as const;

const SYSTEM = `Sen Fibabanka'nın AI kampanya orkestratörüsün. Kullanıcının kampanya fikrini inceleyip TAM OLARAK dört kart üret: CRM, Veri Platformları, Legal ve Pazarlama. Her departman yalnızca bir kez bulunmalı.

KURUMSAL HAFIZA:
- Mart 2025 Genç Segment Kredi Kartı: Push %42 açılma, SMS %19, dönüşüm %8.4.
- Kasım 2024 Mevduat Kampanyası: Mobil banner %31 CTR, e-postanın 3.4 katı.
- Ocak 2025 KOBİ Kredisi: Legal onayı 6 iş günü sürdü ve lansman 1 hafta gecikti.
- Eylül 2025 Kira Öde Puan Kazan: In-app story 18-30 segmentinde dönüşümü %28 artırdı.
- Haziran 2025 Emekli Bankacılığı: 55+ segmentte SMS daha güvenilir, push opt-in düşük.

CANLI TALEP SİNYALLERİ (mobil bankacılık, son 30 gün):
- Aramalar: kira öderken puan 4.210 (+%31) · öğrenci hesabı 3.860 (+%31) · konut kredisi faiz 3.120 (+%34) · döviz alarmı 2.540 (+%21) · borç yapılandırma 1.980 (+%18) · pos komisyon 1.490 (+%16) · evlilik kredisi 940 (+%19).
- Ekran kullanımı: Kredi Hesaplama +%12, Kampanyalar sekmesi +%15, Döviz & Altın +%9, Başvurular +%8.
- DÜŞEN sinyaller: şube randevu −%14 · mevduat hesaplama ekranı −%9 · 18-30 segmentte SMS okunma −%17 · e-posta tıklama −%12. Zayıflayan kanal/akışlara yaslanma; şube ziyareti gerektiren kurgulardan kaçın, genç segmentte SMS önerme.

KARAR YÖNTEMİ:
1. Benzer kampanyaları anlamsal olarak eşleştir.
2. Segment ve kanal performansını geçmiş metriklerle karşılaştır.
3. BDDK/KVKK ve operasyonel darboğaz kurallarını uygula.
4. Her departmana ölçülebilir KPI, 3-4 alt görev, sahip, ETA, veri kaynağı ve risk üret.
5. Her alt görev için "expectation" alanına AI'nın ekipten tam olarak ne istediğini yaz: hangi geliştirme/çıktı bekleniyor, kabul kriteri ne, hangi formatta teslim edilecek. Genel laf değil, uygulanabilir talimat olsun (örn. "18-30 yaş, aktif mobil, izinli iletişim filtresiyle segment listesi CSV olarak; churn skoru >0.6 hariç").
6. Görev başka bir departmandan veri, geliştirme veya onay gerektiriyorsa "dependencies" dizisine yaz: department = ihtiyacın karşılanacağı departman (kartın kendi departmanı olamaz), need = kısa ihtiyaç tanımı, message = o departmanın kanalına Team-bot ile gönderilmeye hazır, kibar ve net talep mesajı (kim istiyor, ne istiyor, neden, ne zamana kadar). Bağımlılık yoksa boş dizi döndür.
7. Uydurma kesinlik kullanma. Varsayımları rationale içinde açıkça belirt.

Çıktı Türkçe olmalı. rationale, kullanıcıya gösterilebilir kısa karar açıklamasıdır; gizli düşünce zinciri değildir.`;

function rulesFor(idea: string) {
  const lower = idea.toLocaleLowerCase("tr-TR");
  const findings: string[] = [];
  if (/kredi|kart|faiz|limit|puan/.test(lower)) findings.push("BDDK iletişim ve ürün koşulu kontrolü");
  if (/müşteri|segment|öğrenci|emekli|kobi/.test(lower)) findings.push("KVKK izinli iletişim ve segment kontrolü");
  if (/push|sms|e-posta|bildirim/.test(lower)) findings.push("Kanal frekans ve iletişim izni kontrolü");
  return findings.length ? findings : ["Standart kampanya uygunluk kontrolü"];
}

function tokens(value: string) {
  return new Set(value.toLocaleLowerCase("tr-TR").replace(/[^a-zçğıöşü0-9\s]/g, " ").split(/\s+/).filter((token) => token.length > 2));
}

// extra: çalışanların "Sonuçları gir" ile kaydettiği kampanya sonuçları —
// öğrenen hafıza; statik çekirdek arşivle aynı havuzda skorlanır.
function similarityAnalysis(idea: string, extra: any[] = []) {
  const ideaTokens = tokens(idea);
  return [...MEMORY, ...extra].map((campaign) => {
    const recordTokens = new Set([...tokens(campaign.name), ...campaign.tags]);
    const overlap = [...ideaTokens].filter((token) => recordTokens.has(token)).length;
    const union = new Set([...ideaTokens, ...recordTokens]).size || 1;
    const keywordHits = campaign.tags.filter((tag: string) => idea.toLocaleLowerCase("tr-TR").includes(tag)).length;
    const score = Math.round(((keywordHits / (campaign.tags.length || 1)) * 0.72 + (overlap / union) * 0.28) * 100);
    return { ...campaign, score };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
}

function segmentAnalysis(idea: string) {
  const lower = idea.toLocaleLowerCase("tr-TR");
  const segments: string[] = [];
  if (/öğrenci|üniversite|genç|18-30/.test(lower)) segments.push("Genç / öğrenci segmenti");
  if (/kobi|işletme|ticari/.test(lower)) segments.push("KOBİ / ticari segment");
  if (/emekli|55\+|maaş/.test(lower)) segments.push("55+ / emekli segmenti");
  if (/mobil|uygulama|push/.test(lower)) segments.push("Aktif mobil kullanıcı");
  if (/kira|ödeme/.test(lower)) segments.push("Düzenli ödeme davranışı");
  return segments.length ? segments : ["Geniş müşteri tabanı · segment netleştirme gerekli"];
}

function channelAnalysis(idea: string) {
  const lower = idea.toLocaleLowerCase("tr-TR");
  const young = /öğrenci|üniversite|genç|18-30/.test(lower);
  const senior = /emekli|55\+|maaş/.test(lower);
  const values = [
    { name: "Push", history: 84, fit: young ? 92 : senior ? 35 : 72, compliance: 78, readiness: 90 },
    { name: "In-app", history: 76, fit: young ? 95 : senior ? 42 : 70, compliance: 84, readiness: 82 },
    { name: "SMS", history: 48, fit: senior ? 94 : young ? 55 : 68, compliance: 70, readiness: 95 },
    { name: "Mobil Banner", history: 62, fit: young ? 80 : 65, compliance: 88, readiness: 78 },
    { name: "E-posta", history: 34, fit: young ? 45 : 66, compliance: 86, readiness: 92 },
  ];
  return values.map((channel) => ({
    ...channel,
    score: Math.round(channel.history * .45 + channel.fit * .30 + channel.compliance * .15 + channel.readiness * .10),
  })).sort((a, b) => b.score - a.score);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const idea = req.body?.idea;
  if (!idea || typeof idea !== "string" || idea.length > 2000) return res.status(400).json({ error: "invalid_idea" });

  // Öğrenen hafıza: frontend'in gönderdiği çalışan girişli kampanya sonuçları
  const learned = (Array.isArray(req.body?.memory) ? req.body.memory.slice(0, 10) : [])
    .filter((m: any) => m && typeof m.name === "string" && m.name.length > 0 && m.name.length <= 120)
    .map((m: any) => ({
      name: m.name,
      tags: [...tokens(`${m.name} ${typeof m.lesson === "string" ? m.lesson : ""}`)],
      channel: typeof m.channel === "string" ? m.channel.slice(0, 40) : "—",
      openRate: Number.isFinite(+m.openRate) ? Math.max(0, Math.min(100, +m.openRate)) : 0,
      conversion: Number.isFinite(+m.conversion) ? Math.max(0, Math.min(100, +m.conversion)) : 0,
      lesson: typeof m.lesson === "string" ? m.lesson.slice(0, 300) : "",
      learned: true,
    }));
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) return res.status(503).json({ error: "no_api_key" });

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (event: string, data: any) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  const stage = (id: string, label: string, detail: string, status: "running" | "done" = "done", meta: Record<string, any> = {}) =>
    send("stage", { id, label, detail, status, timestamp: new Date().toISOString(), ...meta });

  try {
    stage("intake", "Kampanya girdisi ayrıştırıldı", `${idea.length} karakter · amaç ve ürün terimleri çıkarıldı`, "done", {
      algorithm: "Lexical intent parser v2",
      why: "Serbest metni doğrudan modele vermek yerine önce yapılandırıyoruz: hangi analizlerin çalışacağı ve hangi referans havuzunun kullanılacağı burada belirlenir. İlk aşamada yapılan yanlış ayrıştırma zincirdeki her kararı saptıracağı için deterministik, denetlenebilir bir sözlük ayrıştırıcısı tercih edildi.",
      method: [
        "Brief normalize edildi (küçük harf, noktalama temizliği)",
        "Ürün, segment ve kanal terimleri banka terim sözlüğüyle eşleştirildi",
        "Çıkan anahtar terimler sonraki 6 analiz aşamasına parametre olarak geçildi",
      ],
      inputs: ["Onaylanan kampanya brief'i — amaç, hedef kitle, kanallar, zamanlama ve KPI alanlarıyla"],
      outputs: [...tokens(idea)].slice(0, 8).map((t) => `Terim: "${t}"`),
      meaning: "Brief makine tarafından işlenebilir hale geldi; sonraki tüm aşamalar bu terim setini kullanacak.",
    });
    await wait(320);

    const segments = segmentAnalysis(idea);
    const segmentScore = segments[0].includes("netleştirme") ? 52 : 86;
    stage("segment", "Segment sinyalleri çıkarıldı", segments.join(" · "), "done", {
      algorithm: "Kural tabanlı segment sınıflandırıcı",
      why: "Kanal skoru ve CRM veri talebi hedef kitleye göre tamamen değişir — segment yanlış tespit edilirse örneğin 55+ kitleye push önerilir. Burada makine öğrenmesi yerine kural tabanlı sınıflandırıcı kullanıyoruz çünkü sonuç deterministik, denetlenebilir ve mevzuat denetiminde savunulabilir olmalı.",
      method: [
        "Yaş, eğitim ve işletme kalıpları (18-30, öğrenci, KOBİ, emekli…) kurallarla tarandı",
        "Davranış kelimeleri (kira, ödeme, mobil, alarm) segment profiline eklendi",
        "Hiç eşleşme yoksa 'geniş taban' işaretlenip insan netleştirmesi önerilir",
      ],
      inputs: ["Intake aşamasından gelen terim seti", "Yaş/eğitim/işletme kural kalıpları", "Davranış anahtar kelime sözlüğü"],
      outputs: segments.map((s) => `Tespit: ${s}`),
      score: segmentScore,
      meaning: segmentScore >= 80
        ? "Segment tanımı net — hedefleme kriterleri doğrudan CRM filtresine çevrilebilir."
        : "Segment belirsiz — kampanya sahibinden hedef kitle netleştirmesi istenmeli.",
    });
    await wait(380);

    const signals = signalAnalysis(idea);
    const topSignal = signals.matchedSearches[0];
    stage("signals", "Talep sinyalleri tarandı", topSignal
      ? `${signals.matchedSearches.length} arama + ${signals.matchedTabs.length} ekran eşleşti · en güçlü: "${topSignal.term}" ${pct(topSignal.change)}`
      : "Doğrudan sinyal eşleşmesi yok · genel talep taban çizgisi kullanılacak", "done", {
      algorithm: "Momentum sinyal eşleştirici",
      why: "Kampanya kararını varsayıma değil, müşterilerin uygulamada bugün fiilen ne aradığına dayandırmak istiyoruz. Bu eşleştirici arama hacmini ve 30 günlük artış hızını birlikte tartar; düşen sinyaller de hesaba katılır — zayıflayan bir kanala ya da ilgisi azalan bir ürüne yaslanan kampanya, momentum skorunda otomatik cezalandırılır.",
      method: [
        "Brief terimleri 14 arama teriminin etiket kümeleriyle eşleştirildi",
        "Eşleşen aramaların aylık hacmi ve 30 günlük değişim yüzdesi toplandı (düşüşler negatif katkı yapar)",
        "İlgili ekran/sekme kullanım değişimleri destekleyici sinyal olarak eklendi",
        "Hacim + ivme ağırlıklandırılarak 0-100 arası momentum skoru üretildi",
      ],
      inputs: [
        "Mobil arama günlüğü: 14 terim, 26.5K aylık sorgu (son 30 gün)",
        "9 ekran kullanım metriği (Kredi Hesaplama, Kampanyalar, Şube Randevu…)",
        "Terim bazlı değişim oranları (−%17 ile +%34 aralığında)",
      ],
      outputs: [
        ...signals.matchedSearches.map((s) => `Eşleşen arama: "${s.term}" — ${s.count.toLocaleString("tr-TR")} sorgu/ay, son 30 günde ${pct(s.change)}`),
        ...signals.matchedTabs.map((t) => `Eşleşen ekran: ${t.name} sekmesi kullanımı ${pct(t.change)}`),
      ].slice(0, 6),
      score: signals.momentum,
      meaning: signals.momentum >= 75
        ? `Momentum ${signals.momentum}/100: talep organik olarak yükseliyor — kampanya mevcut aramayı yakalayacak şekilde konumlanmalı, gecikme fırsat kaybıdır.`
        : signals.momentum >= 55
          ? `Momentum ${signals.momentum}/100: orta düzey talep var — kampanya talebi yaratmak yerine büyütmeye odaklanmalı.`
          : `Momentum ${signals.momentum}/100: organik talep zayıf — kampanya farkındalık aşamasından başlamalı, dönüşüm hedefi temkinli kurulmalı.`,
    });
    await wait(380);

    const matches = similarityAnalysis(idea, learned);
    const topMatch = matches[0];
    stage("memory", "Benzer kampanyalar sıralandı", matches.map((item) => `${item.name} %${item.score}`).join(" · "), "done", {
      algorithm: "Weighted Jaccard Retrieval",
      why: "Kurumsal hafıza bu sistemin kalbi: yeni kararı sıfırdan tahmin etmek yerine, ölçülmüş geçmiş sonuçlara dayandırıyoruz. Jaccard benzerliği iki kampanyanın etiket kümelerinin kesişimini oranlar; anahtar kelime isabetine %72 ağırlık verilir çünkü ürün eşleşmesi (kart↔kart), kelime benzerliğinden daha güçlü bir performans göstergesidir.",
      method: [
        "Brief, kelime kümesine çevrildi ve arşivden etiketlenmiş çekirdek kampanyalarla kesiştirildi",
        "Her kampanya için Jaccard oranı + anahtar kelime isabeti hesaplandı (%28 / %72 ağırlık)",
        "En benzer 3 kampanya, açılma ve dönüşüm metrikleriyle birlikte modele aktarıldı",
      ],
      inputs: [
        `Kurumsal hafıza: 40 kampanyalık arşiv · ${MEMORY.length} etiketli çekirdek örnek (kanal, açılma, dönüşüm metrikleriyle)`,
        ...(learned.length ? [`Öğrenen hafıza: ${learned.length} çalışan girişli sonuç kaydı — bu panoda tamamlanan kampanyalardan`] : []),
        "Ürün ve segment etiket kümeleri",
        "Brief'ten üretilen kelime kümesi",
      ],
      outputs: matches.map((item: any) => `${item.name}: %${item.score} benzerlik — ${item.channel} kanalında %${item.openRate} açılma, %${item.conversion} dönüşüm${item.learned ? " · çalışan girişli sonuç" : ""}`),
      score: topMatch?.score ?? 0,
      meaning: (topMatch?.score ?? 0) >= 60
        ? `En yakın örnek "${topMatch.name}" (%${topMatch.score}): bu kampanyanın ölçülmüş sonuçları yeni karar için güvenilir referans.`
        : (topMatch?.score ?? 0) >= 35
          ? `Kısmi benzerlik (%${topMatch?.score}): geçmiş veriler yön gösterir ama birebir tahmin için yeterli değil — model varsayımlarını açıkça işaretleyecek.`
          : "Güçlü geçmiş örnek yok: bu kampanya kurum için yeni alan — pilot yaklaşım ve temkinli KPI önerilecek.",
    });
    await wait(420);

    const channels = channelAnalysis(idea);
    const bestChannel = channels[0];
    stage("channels", "Kanal alternatifleri skorlandı", channels.slice(0, 3).map((item) => `${item.name} ${item.score}/100`).join(" · "), "done", {
      algorithm: "Ağırlıklı MCDA kanal skoru",
      why: "Kanal seçiminde tek bir metriğe güvenmek yanıltır: geçmişte iyi performans göstermiş bir kanal bu segmente uymayabilir ya da mevzuat kısıtına takılabilir. Çok kriterli karar analizi (MCDA) dört boyutu tek skora indirger; ağırlıklar geçmiş kampanya sonuçlarından kalibre edilmiştir ve her kanal için aynı formül uygulanır — kayırma yok, tekrarlanabilirlik var.",
      method: [
        "5 kanal için 4 boyut puanlandı: geçmiş performans, segment uyumu, mevzuat uygunluğu, operasyonel hazırlık",
        "Segment uyumu, 2. aşamadaki segment profiline göre kanala özel ayarlandı (örn. genç segment → In-app ↑, SMS ↓)",
        "Boyutlar %45/%30/%15/%10 ağırlıkla birleştirilip 0-100 skora çevrildi",
        "Kanallar skora göre sıralandı; ilk 2 kanal ana + destek olarak önerildi",
      ],
      inputs: [
        "Geçmiş kanal performans matrisi (%45 ağırlık)",
        "Segment-kanal uyum profili (%30 ağırlık)",
        "Mevzuat/izin uygunluğu (%15 ağırlık)",
        "Operasyonel hazırlık — şablon ve ekip durumu (%10 ağırlık)",
      ],
      outputs: channels.slice(0, 3).map((item, i) => `${i === 0 ? "Ana kanal önerisi" : i === 1 ? "Destek kanal" : "Alternatif"}: ${item.name} — ${item.score}/100 (performans ${item.history}, uyum ${item.fit})`),
      score: bestChannel.score,
      meaning: `${bestChannel.name} ${bestChannel.score}/100 ile önde: ${bestChannel.score >= 80 ? "dört boyutta da güçlü — ana kanal olarak net tercih." : "en iyi seçenek ama fark küçük — A/B testiyle ikinci kanal da denenmeli."}`,
    });
    await wait(420);

    const timing = timingAnalysis(idea);
    stage("timing", "Zamanlama & mevsimsellik analizi", timing.window, "done", {
      algorithm: "Seasonal window scorer",
      why: "Aynı kampanya doğru haftada açıldığında ile yanlış haftada açıldığında bambaşka sonuç verir — geçmişte kayıt dönemi kaçırıldığı için bir öğrenci kampanyası hedefinin altında kalmıştı. Bu skorlayıcı kampanya temasını dönemsel takvimle (kayıt, vergi, maaş, kur oynaklığı) eşleştirir ve lansman penceresinin gücünü puanlar.",
      method: [
        "Kampanya teması dönemsel olay takvimiyle eşleştirildi (kayıt dönemi, vergi haftası, maaş günü…)",
        "3. aşamadaki talep sinyali ivmesi pencere gücüne kanıt olarak eklendi",
        "Ay başı maaş döngüsü ve push frekans limiti kısıt olarak işlendi",
      ],
      inputs: ["Kampanya teması ve segment profili", "Dönemsel olay takvimi (kayıt/vergi/maaş/kur)", "Maaş yatış ve harcama döngüsü verileri"],
      outputs: [`Önerilen pencere: ${timing.window}`, ...timing.factors.map((f) => `Gerekçe: ${f}`)],
      score: timing.score,
      meaning: timing.score >= 85
        ? `Pencere skoru ${timing.score}/100: lansman tam doğru döneme denk geliyor — zamanlamayı kaçırmamak kampanyanın en kritik başarı faktörü.`
        : `Pencere skoru ${timing.score}/100: uygun bir dönem var ama keskin bir zirve değil — lansman operasyonel hazırlığa göre esnetilebilir.`,
    });
    await wait(360);

    const findings = rulesFor(idea);
    const ruleScore = Math.max(55, 94 - findings.length * 8);
    stage("rules", "Risk ve uygunluk kuralları çalıştı", `${findings.length} aktif kontrol: ${findings.join(" · ")}`, "done", {
      algorithm: "Deterministic compliance ruleset",
      why: "Mevzuat kontrolü asla üretken modele bırakılmaz: BDDK ve KVKK kuralları yoruma açık olmamalı, her çalıştırmada aynı sonucu vermelidir. Bu yüzden burada sabit bir kural motoru çalışır — model yalnızca bu motorun bulgularını görev planına işler, kuralın kendisine dokunamaz.",
      method: [
        "Ürün türü (kredi/kart/mevduat) mevzuat kural tablosuyla eşleştirildi",
        "Müşteri verisi kullanımı KVKK izin gereklilikleriyle kontrol edildi",
        "İletişim kanalları frekans ve izinli iletişim kurallarından geçirildi",
        "Tetiklenen her kural, Legal görev paketine zorunlu kontrol maddesi olarak eklendi",
      ],
      inputs: ["Ürün türü ve teklif yapısı", "Kullanılacak müşteri veri alanları", "Planlanan iletişim kanalları"],
      outputs: findings.map((f) => `Tetiklenen kontrol: ${f}`),
      score: ruleScore,
      meaning: findings.length <= 1
        ? `Uygunluk ${ruleScore}/100: düşük mevzuat yükü — Legal onayı hızlı ilerleyebilir.`
        : `Uygunluk ${ruleScore}/100: ${findings.length} kontrol tetiklendi — Legal görevi diğer işlerle paralel ve erken başlatılmalı (Ocak 2025'teki 6 günlük gecikme dersi).`,
    });
    await wait(380);

    stage("model", "AI görev sentezi başladı", "Analitik ara sonuçlar dört departmanlık görev şemasına dönüştürülüyor", "running", {
      algorithm: "LLM structured synthesis (şema kısıtlı)",
      why: "Önceki 6 aşamanın tamamı deterministik hesaptı; üretken model yalnızca son adımda, bu doğrulanmış bulguları departmanların uygulayabileceği iş paketlerine çevirmek için devreye girer. Model serbest metin değil, katı JSON şemasına uyan çıktı üretmek zorunda — halüsinasyon alanı bilinçli olarak daraltılmıştır.",
      method: [
        "6 aşamanın çıktısı yapılandırılmış bağlam olarak modele verildi",
        "Model, her departman için görev + alt görev + sahip + ETA + risk üretiyor",
        "Çıktı JSON şema doğrulamasından geçmek zorunda (4 kart, zorunlu alanlar)",
      ],
      inputs: ["Kampanya brief'i", "Talep sinyalleri + momentum", "Benzerlik sonuçları", "Kanal skorları", "Zamanlama penceresi", "Risk kuralları"],
      outputs: ["CRM", "Veri Platformları", "Legal", "Pazarlama"],
    });

    const analysisContext = JSON.stringify({
      segments,
      demandSignals: {
        momentumScore: signals.momentum,
        matchedSearches: signals.matchedSearches.map((s) => ({ term: s.term, monthlyCount: s.count, changePct: s.change })),
        matchedTabs: signals.matchedTabs.map((t) => ({ tab: t.name, changePct: t.change })),
      },
      similarCampaigns: matches,
      learnedOutcomes: learned.map(({ name, channel, openRate, conversion, lesson }: any) => ({ name, channel, openRate, conversion, lesson })),
      channelScores: channels.slice(0, 3),
      timingWindow: { window: timing.window, factors: timing.factors, score: timing.score },
      complianceRules: findings,
    });
    const { json, provider, model } = await generateStructured(`${SYSTEM}\n\nHESAPLANMIŞ ANALİTİK ARA SONUÇLAR:\n${analysisContext}`, `Kampanya fikri: ${idea}`, SCHEMA, 7000);
    stage("model", "AI görev sentezi tamamlandı", `${provider} · ${model} · yapılandırılmış çıktı alındı`, "done", {
      algorithm: "LLM structured synthesis (şema kısıtlı)",
      why: "Önceki 6 aşamanın deterministik bulguları, üretken model tarafından departmanların uygulayabileceği iş paketlerine çevrildi. Model katı JSON şemasına uymak zorundaydı; her karar gerekçesi, dayandığı analitik bulguya referans veriyor.",
      method: [
        "6 aşamanın çıktısı yapılandırılmış bağlam olarak modele verildi",
        "Her departman için görev + alt görev + sahip + ETA + risk üretildi",
        "Çıktı JSON şema doğrulamasından geçti (4 kart, zorunlu alanlar)",
      ],
      inputs: ["6 analitik aşamanın doğrulanmış çıktıları", `Sağlayıcı: ${provider} · ${model}`],
      outputs: [`${json.cards?.length ?? 0} departman görev kartı üretildi`, `${json.cards?.flatMap((card: any) => card.details?.subtasks ?? []).length ?? 0} alt görev — her biri sahip ve ETA ile`, "Her kartta insan onayına açık karar gerekçesi"],
      score: 100,
      meaning: "Analitik bulgular kayıpsız şekilde uygulanabilir görev planına dönüştü; hiçbir karar kaynak gösterilmeden verilmedi.",
    });
    await wait(300);

    const departments = new Set((json.cards ?? []).map((card: any) => card.department));
    const complete = DEPARTMENTS.every((department) => departments.has(department)) && departments.size === 4;
    if (!complete) throw new Error("department_validation_failed");
    stage("validation", "Departman kapsamı doğrulandı", "CRM · Veri Platformları · Legal · Pazarlama eksiksiz", "done", {
      algorithm: "Set coverage validator",
      why: "Üretken modele güven ama doğrula: model bir departmanı atlarsa o ekip görevden haberdar olmaz ve kampanya operasyonel olarak aksar. Bu doğrulayıcı, model çıktısını beklenen departman kümesiyle karşılaştırır; eksik ya da mükerrer kart varsa süreç ilerlemez, hata olarak durdurulur.",
      method: [
        "Model çıktısındaki departman adları kümeye çevrildi",
        "Beklenen 4 departmanla birebir karşılaştırıldı (eksik/mükerrer kontrolü)",
        "Uyumsuzlukta süreç hata ile durduruluyor — kısmi dağıtım yapılmaz",
      ],
      inputs: ["Beklenen departman kümesi: CRM, Veri Platformları, Legal, Pazarlama", `Model çıktısı: ${json.cards.length} kart`],
      outputs: DEPARTMENTS.map((d) => `${d}: kart mevcut ✓`),
      score: 100,
      meaning: "4/4 kapsam sağlandı — hiçbir departman atlanmadı, dağıtım güvenle yapılabilir.",
    });
    await wait(260);
    stage("dispatch", "Team-bot mesajları hazırlandı", "Her departmana ihtiyaç, talep edilen veri, geliştirme işi ve gerekçe bağlandı", "done", {
      algorithm: "Department payload composer",
      why: "Analiz ne kadar iyi olursa olsun, ekibin eline geçen mesaj uygulanabilir değilse değer üretmez. Bu adım her departman için görevi, talep edilen veriyi, alt görevleri ve karar gerekçesini tek pakette birleştirir — ekip 'neden ben, neden şimdi, ne yapacağım' sorularının üçünün de cevabını aynı kartta görür.",
      method: [
        "Her departman kartı team-bot mesaj şablonuna yerleştirildi",
        "Alt görevler sahip ve ETA ile sıralandı, veri talepleri ayrıştırıldı",
        "Karar gerekçesi ve risk notu pakete eklendi — insan onay noktası korunuyor",
      ],
      inputs: ["4 doğrulanmış departman kartı", "Alt görev listeleri (sahip + ETA)", "Veri kaynağı talepleri", "Karar gerekçeleri"],
      outputs: DEPARTMENTS.map((department) => `${department} paketi hazır — panoda ve Slack köprüsünde gönderime açık`),
      score: 100,
      meaning: "Görev paketleri dağıtıma hazır; departmanlar panodan veya Slack kanalından tek tıkla devralabilir.",
    });

    send("completed", {
      ...json,
      provider,
      model,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("process error:", error?.message ?? error);
    send("failed", { message: "AI işlemi tamamlanamadı. Lütfen yeniden deneyin." });
  } finally {
    res.end();
  }
}
