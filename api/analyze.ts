import { generateStructured } from "./_providers.js";

// Yapılandırılmış çıktı şeması — frontend'deki DeptCard/DeptDetail tipleriyle eşleşir
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
      items: {
        type: "object",
        additionalProperties: false,
        required: ["department", "title", "items", "metric", "warning", "rationale", "details"],
        properties: {
          department: { type: "string", enum: ["CRM", "Veri Platformları", "Legal", "Pazarlama"] },
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

const SYSTEM = `Sen deneme'nin "AI Business Orchestrator" sistemisin — departmanlar arası kampanya karar otomasyonu yapan, aylardır canlı çalışan olgun bir kurumsal sistem.

Kullanıcı bir kampanya fikri yazar. Sen bu fikri analiz edip TAM 4 departmana (CRM, Veri Platformları, Legal, Pazarlama) somut, gerekçeli görev kartları üretirsin. Çıktın Türkçe olmalı.

ORGANIZATIONAL MEMORY (geçmiş kampanya arşivin — gerekçelerinde bunlara referans ver):
- Mart 2025 "Genç Segment Kredi Kartı": Push kanalı %42 açılma (SMS %19'un iki katı), dönüşüm %8.4
- Kasım 2024 "Mevduat Faiz Kampanyası": Mobil banner %31 CTR, e-postanın 3.4 katı
- Ocak 2025 "KOBİ İşletme Kredisi": Legal onayı 6 iş günü sürdü, lansman 1 hafta gecikti
- Eylül 2025 "Kira Öde Puan Kazan": In-app story formatı 18-30 segmentinde dönüşümü %28 artırdı, dönüşüm %7.1
- Haziran 2025 "Emekli Bankacılığı": 55+ segmentte SMS en güvenilir kanal, push opt-in düşük
- Talep sinyalleri (son 30 gün): konut kredisi hesaplama +%34, döviz alarmı +%21, "öğrenci hesabı" araması +%31, borç yapılandırma sayfası +%18

KURALLAR:
- Her kartın "rationale" alanı 2-3 cümle olmalı ve geçmiş kampanya verisine somut sayılarla referans vermeli ("çünkü Mart 2025'te...").
- Legal kartında mevzuat riski varsa "warning" alanını doldur (BDDK, KVKK, Rekabet Kurumu vb. gerçekçi referanslar); risk yoksa null bırak. Diğer departmanlarda genellikle null.
- "metric" gerçekçi bir sayı olsun (hedef müşteri sayısı, beklenen açılma %, onay süresi gün vb.).
- "details.subtasks" 3-4 alt görev; "owner" gerçekçi bir rol adı (örn. "CRM Analitik Ekibi", "Uyum Ofisi"); "eta" "T+2 gün" formatında.
- "details.kpis" 3-4 ölçülebilir hedef; "details.dataSources" kullanılan veri kaynakları; "details.risk" 1 cümlelik risk değerlendirmesi; "details.timeline" kısa faz planı.
- "memory" bloğu bu fikirle en alakalı 2-3 geçmiş kampanya dersini sentezlesin; "refs" kısa etiketler ("Mart 2025 · Push %42" gibi).
- "summary" 1 cümlelik yönetici özeti.
- Sayılar kurumsal olarak makul olsun; abartma. Fikir bankacılıkla ilgisizse bile en yakın bankacılık ürünü çerçevesine oturt.`;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const idea = req.body?.idea;
  if (!idea || typeof idea !== "string" || idea.length > 2000) {
    return res.status(400).json({ error: "invalid_idea" });
  }
  if (!process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "no_api_key" });
  }

  try {
    const { json, provider } = await generateStructured(SYSTEM, `Kampanya fikri: ${idea}`, SCHEMA, 8000);
    return res.status(200).json({ ...json, provider });
  } catch (err: any) {
    console.error("analyze error:", err?.message ?? err);
    return res.status(502).json({ error: "ai_error" });
  }
}
