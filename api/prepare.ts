import { generateStructured } from "./_providers.js";

const DEPARTMENTS = ["CRM", "Veri Platformları", "Legal", "Pazarlama"];

const BRIEFS: Record<string, string> = {
  Pazarlama: "2 push bildirim metni varyantı (Varyant A fayda odaklı, Varyant B aciliyet odaklı; kısa, Türkçe, en fazla 1 emoji) ve 1 in-app story başlığı",
  CRM: "hedef segment filtre kriterleri (yaş, davranış, izin durumu), önceliklendirme kuralı ve hariç tutma listesi",
  Legal: "BDDK, KVKK ve reklam kurulu yönünden kontrol maddeleri ve gerekli metin revizyonu önerileri",
  "Veri Platformları": "funnel event şeması (event isimleriyle), dashboard panelleri ve otomatik raporlama kurulumu",
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "items", "note"],
  properties: {
    headline: { type: "string" },
    items: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "content"],
        properties: { title: { type: "string" }, content: { type: "string" } },
      },
    },
    note: { type: "string" },
  },
} as const;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const { department, title, summary } = req.body ?? {};
  if (!DEPARTMENTS.includes(department) || typeof title !== "string" || title.length > 300) {
    return res.status(400).json({ error: "invalid_input" });
  }
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "no_api_key" });
  }

  const system = `Sen Fibabanka'nın ${department} departmanı için çalışan bir AI asistansın. Sana verilen kampanya görevi için departmanın işini başlatan somut bir TASLAK çalışma paketi üret: ${BRIEFS[department]}.

Kurallar:
- Türkçe yaz. Kısa, uygulanabilir ve bankacılık diline uygun ol.
- Uydurma kesin rakam/oran kullanma; sayı gerekiyorsa "hedeflenen" veya "geçmiş referans" olarak işaretle.
- headline tek cümlelik paket özeti olsun.
- note alanına insan denetimi hatırlatması yaz (taslağın departman onayı olmadan yayına çıkmayacağı).`;

  try {
    const { json, provider, model } = await generateStructured(
      system,
      `Görev: ${title}\nÖzet: ${typeof summary === "string" ? summary.slice(0, 500) : "-"}`,
      SCHEMA,
      2500
    );
    return res.status(200).json({ ...json, provider, model, generatedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error("prepare error:", error?.message ?? error);
    return res.status(502).json({ error: "generation_failed" });
  }
}
