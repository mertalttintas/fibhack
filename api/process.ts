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
];

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
  const momentum = Math.min(98, Math.round(38 + avgChange * 1.4 + tabBoost * 0.8 + Math.min(20, volume / 500)));
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
            required: ["kpis", "subtasks", "timeline", "dataSources", "risk"],
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
                  required: ["name", "owner", "eta", "status"],
                  properties: {
                    name: { type: "string" },
                    owner: { type: "string" },
                    eta: { type: "string" },
                    status: { type: "string", enum: ["planlandı", "sürüyor", "hazır"] },
                  },
                },
              },
              timeline: { type: "string" },
              dataSources: { type: "array", items: { type: "string" } },
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

KARAR YÖNTEMİ:
1. Benzer kampanyaları anlamsal olarak eşleştir.
2. Segment ve kanal performansını geçmiş metriklerle karşılaştır.
3. BDDK/KVKK ve operasyonel darboğaz kurallarını uygula.
4. Her departmana ölçülebilir KPI, 3-4 alt görev, sahip, ETA, veri kaynağı ve risk üret.
5. Uydurma kesinlik kullanma. Varsayımları rationale içinde açıkça belirt.

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

function similarityAnalysis(idea: string) {
  const ideaTokens = tokens(idea);
  return MEMORY.map((campaign) => {
    const recordTokens = new Set([...tokens(campaign.name), ...campaign.tags]);
    const overlap = [...ideaTokens].filter((token) => recordTokens.has(token)).length;
    const union = new Set([...ideaTokens, ...recordTokens]).size || 1;
    const keywordHits = campaign.tags.filter((tag) => idea.toLocaleLowerCase("tr-TR").includes(tag)).length;
    const score = Math.round(((keywordHits / campaign.tags.length) * 0.72 + (overlap / union) * 0.28) * 100);
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
      why: "Hangi analizlerin çalıştırılacağını ve doğru referans havuzunu belirlemek için.",
      inputs: ["Onaylanan kampanya brief'i"],
      outputs: [...tokens(idea)].slice(0, 8),
    });
    await wait(320);

    const segments = segmentAnalysis(idea);
    stage("segment", "Segment sinyalleri çıkarıldı", segments.join(" · "), "done", {
      algorithm: "Kural tabanlı segment sınıflandırıcı",
      why: "Kanal uygunluğu ve CRM veri talebini hedef kitleye göre özelleştirmek için.",
      inputs: ["Yaş", "ürün", "davranış ve kanal anahtar kelimeleri"],
      outputs: segments,
      score: segments[0].includes("netleştirme") ? 52 : 86,
    });
    await wait(380);

    const signals = signalAnalysis(idea);
    const topSignal = signals.matchedSearches[0];
    stage("signals", "Talep sinyalleri tarandı", topSignal
      ? `${signals.matchedSearches.length} arama + ${signals.matchedTabs.length} ekran eşleşti · en güçlü: "${topSignal.term}" +%${topSignal.change}`
      : "Doğrudan sinyal eşleşmesi yok · genel talep taban çizgisi kullanılacak", "done", {
      algorithm: "Momentum sinyal eşleştirici",
      why: "Kampanyayı varsayımla değil, müşterilerin uygulamada şu an aradığı ve gezdiği gerçek davranış verisiyle temellendirmek için.",
      inputs: ["12 arama terimi · 24.6K aylık sorgu", "8 ekran kullanım metriği", "Son 30 gün değişim oranları"],
      outputs: [
        ...signals.matchedSearches.map((s) => `"${s.term}" ${s.count.toLocaleString("tr-TR")} arama · +%${s.change}`),
        ...signals.matchedTabs.map((t) => `${t.name} sekmesi +%${t.change}`),
      ].slice(0, 6),
      score: signals.momentum,
    });
    await wait(380);

    const matches = similarityAnalysis(idea);
    stage("memory", "Benzer kampanyalar sıralandı", matches.map((item) => `${item.name} %${item.score}`).join(" · "), "done", {
      algorithm: "Weighted Jaccard Retrieval",
      why: "Yeni kararı ölçülmüş geçmiş sonuçlarla temellendirmek için.",
      inputs: [`${MEMORY.length} geçmiş kampanya`, "ürün ve segment etiketleri"],
      outputs: matches.map((item) => `${item.name}: %${item.score} benzerlik`),
      score: matches[0]?.score ?? 0,
    });
    await wait(420);

    const channels = channelAnalysis(idea);
    stage("channels", "Kanal alternatifleri skorlandı", channels.slice(0, 3).map((item) => `${item.name} ${item.score}/100`).join(" · "), "done", {
      algorithm: "Ağırlıklı MCDA kanal skoru",
      why: "Tek bir geçmiş metriğe güvenmeden performans, segment uyumu, uygunluk ve hazırlığı birlikte değerlendirmek için.",
      inputs: ["%45 geçmiş performans", "%30 segment uyumu", "%15 uygunluk", "%10 operasyonel hazırlık"],
      outputs: channels.slice(0, 3).map((item) => `${item.name}: ${item.score}/100`),
      score: channels[0].score,
    });
    await wait(420);

    const timing = timingAnalysis(idea);
    stage("timing", "Zamanlama & mevsimsellik analizi", timing.window, "done", {
      algorithm: "Seasonal window scorer",
      why: "Doğru içerik yanlış haftada açılırsa performans kaybediyor; lansman penceresi davranış döngüleriyle hizalanır.",
      inputs: ["Kampanya teması", "Dönemsel takvim (kayıt/vergi/maaş)", "Maaş ve harcama döngüleri"],
      outputs: timing.factors,
      score: timing.score,
    });
    await wait(360);

    const findings = rulesFor(idea);
    stage("rules", "Risk ve uygunluk kuralları çalıştı", `${findings.length} aktif kontrol: ${findings.join(" · ")}`, "done", {
      algorithm: "Deterministic compliance ruleset",
      why: "Model yorumundan bağımsız, tekrarlanabilir BDDK/KVKK kontrolü sağlamak için.",
      inputs: ["Ürün türü", "müşteri verisi", "iletişim kanalı"],
      outputs: findings,
      score: Math.max(55, 94 - findings.length * 8),
    });
    await wait(380);

    stage("model", "AI görev sentezi başladı", "Analitik ara sonuçlar dört departmanlık görev şemasına dönüştürülüyor", "running", {
      algorithm: "OpenAI structured synthesis",
      why: "Hesaplanan bulguları departmana özel, uygulanabilir iş paketlerine çevirmek için.",
      inputs: ["Kampanya brief'i", "talep sinyalleri", "benzerlik sonuçları", "kanal skorları", "zamanlama penceresi", "risk kuralları"],
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
      channelScores: channels.slice(0, 3),
      timingWindow: { window: timing.window, factors: timing.factors, score: timing.score },
      complianceRules: findings,
    });
    const { json, provider, model } = await generateStructured(`${SYSTEM}\n\nHESAPLANMIŞ ANALİTİK ARA SONUÇLAR:\n${analysisContext}`, `Kampanya fikri: ${idea}`, SCHEMA, 7000);
    stage("model", "AI görev sentezi tamamlandı", `${provider} · ${model} · yapılandırılmış çıktı alındı`, "done", {
      algorithm: "OpenAI structured synthesis",
      why: "Analitik bulguları ekiplerin uygulayabileceği görev paketlerine çevirmek için.",
      inputs: ["6 analitik aşamanın doğrulanmış çıktıları"],
      outputs: [`${json.cards?.length ?? 0} departman kartı`, `${json.cards?.flatMap((card: any) => card.details?.subtasks ?? []).length ?? 0} alt görev`],
      score: 100,
    });
    await wait(300);

    const departments = new Set((json.cards ?? []).map((card: any) => card.department));
    const complete = DEPARTMENTS.every((department) => departments.has(department)) && departments.size === 4;
    if (!complete) throw new Error("department_validation_failed");
    stage("validation", "Departman kapsamı doğrulandı", "CRM · Veri Platformları · Legal · Pazarlama eksiksiz", "done", {
      algorithm: "Set coverage validator",
      why: "Hiçbir departmanın model tarafından atlanmasını engellemek için.",
      inputs: ["Beklenen departman kümesi: 4", `Üretilen kart: ${json.cards.length}`],
      outputs: DEPARTMENTS,
      score: 100,
    });
    await wait(260);
    stage("dispatch", "Team-bot mesajları hazırlandı", "Her departmana ihtiyaç, talep edilen veri, geliştirme işi ve gerekçe bağlandı", "done", {
      algorithm: "Department payload composer",
      why: "Analiz sonucunu ekiplerin doğrudan aksiyona çevirebileceği mesajlara dönüştürmek için.",
      inputs: ["Departman kartları", "alt görevler", "sahipler", "ETA"],
      outputs: DEPARTMENTS.map((department) => `${department} team-bot paketi`),
      score: 100,
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
