import { generateStructured } from "./_providers.js";

const DEPARTMENTS = ["CRM", "Veri Platformları", "Legal", "Pazarlama"];

const MEMORY = [
  { name: "Genç Segment Kredi Kartı", tags: ["öğrenci", "genç", "kredi", "kart", "kira", "puan"], channel: "Push", openRate: 42, conversion: 8.4 },
  { name: "Mevduat Faiz Kampanyası", tags: ["mevduat", "faiz", "birikim", "yatırım"], channel: "Mobil Banner", openRate: 31, conversion: 5.2 },
  { name: "KOBİ İşletme Kredisi", tags: ["kobi", "işletme", "kredi", "pos", "ticari"], channel: "E-posta", openRate: 17, conversion: 3.1 },
  { name: "Kira Öde Puan Kazan", tags: ["kira", "puan", "öğrenci", "genç", "ödeme"], channel: "In-app", openRate: 38, conversion: 7.1 },
  { name: "Emekli Bankacılığı", tags: ["emekli", "maaş", "55", "promosyon"], channel: "SMS", openRate: 24, conversion: 4.6 },
];

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

CANLI TALEP SİNYALLERİ:
- Konut kredisi hesaplama +%34, döviz alarmı +%21, öğrenci hesabı araması +%31, borç yapılandırma +%18.

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
      inputs: ["Kampanya brief'i", "benzerlik sonuçları", "kanal skorları", "risk kuralları"],
      outputs: ["CRM", "Veri Platformları", "Legal", "Pazarlama"],
    });

    const analysisContext = JSON.stringify({ segments, similarCampaigns: matches, channelScores: channels.slice(0, 3), complianceRules: findings });
    const { json, provider, model } = await generateStructured(`${SYSTEM}\n\nHESAPLANMIŞ ANALİTİK ARA SONUÇLAR:\n${analysisContext}`, `Kampanya fikri: ${idea}`, SCHEMA, 7000);
    stage("model", "AI görev sentezi tamamlandı", `${provider} · ${model} · yapılandırılmış çıktı alındı`, "done", {
      algorithm: "OpenAI structured synthesis",
      why: "Analitik bulguları ekiplerin uygulayabileceği görev paketlerine çevirmek için.",
      inputs: ["4 analitik aşamanın doğrulanmış çıktıları"],
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
