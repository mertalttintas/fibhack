import { generateStructured } from "./_providers.js";

// Fikir onaya sunulmadan önce AI ile tartışma/rafine etme adımı
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["aiComment", "brief", "suggestions", "routing"],
  properties: {
    aiComment: { type: "string" },
    brief: {
      type: "object",
      additionalProperties: false,
      required: ["title", "objective", "segment", "channels", "timing", "kpi"],
      properties: {
        title: { type: "string" },
        objective: { type: "string" },
        segment: { type: "string" },
        channels: { type: "string" },
        timing: { type: "string" },
        kpi: { type: "string" },
      },
    },
    suggestions: { type: "array", items: { type: "string" } },
    routing: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["department", "reason", "priority"],
        properties: {
          department: { type: "string", enum: ["CRM", "Veri Platformları", "Legal", "Pazarlama"] },
          reason: { type: "string" },
          priority: { type: "string", enum: ["Yüksek", "Orta", "Düşük"] },
        },
      },
    },
  },
} as const;

const SYSTEM = `Sen deneme'nin "AI Business Orchestrator" sisteminin ön analiz asistanısın. Kullanıcı (banka çalışanı) ham bir kampanya fikri yazar. Görevin fikri DOĞRUDAN dağıtmak DEĞİL; önce kullanıcıyla tartışıp fikri yapılandırılmış bir kampanya brief'ine çevirmek ve hangi departmanlara hangi gerekçeyle dağıtılacağını önermektir. Kullanıcı onaylamadan hiçbir şey dağıtılmaz. Çıktın Türkçe.

ORGANIZATIONAL MEMORY (önerilerinde referans ver):
- Mart 2025 "Genç Segment Kredi Kartı": Push %42 açılma (SMS'in 2 katı), dönüşüm %8.4
- Ocak 2025 "KOBİ Kredisi": Legal onayı 6 iş günü sürdü, lansman gecikti
- Eylül 2025 "Kira Öde Puan Kazan": In-app story 18-30 segmentinde dönüşümü %28 artırdı
- Talep sinyalleri: konut kredisi hesaplama +%34, döviz alarmı +%21, "öğrenci hesabı" araması +%31

KURALLAR:
- "aiComment": 2-4 cümlelik samimi ama profesyonel bir tartışma yorumu — fikri nasıl anladığını, hangi varsayımları yaptığını, neyi güçlendirdiğini söyle. Kullanıcıya danışan bir iş ortağı gibi konuş.
- "brief": fikri 6 alanlı yapılandırılmış brief'e çevir (başlık, amaç, hedef segment, kanallar, zamanlama, başarı ölçütü). Eksik bilgiyi geçmiş veriye dayanarak makul varsayımlarla doldur ve bunu aiComment'te belirt.
- "suggestions": 2-3 kısa iyileştirme önerisi (kullanıcı isterse bunları feedback olarak geri yazabilir).
- "routing": fikirle gerçekten ilgili departmanları listele (genellikle 4'ü de; ama fikir hukuki risk taşımıyorsa Legal'i "Düşük" öncelikle yine ekle). Her biri için 1 cümlelik somut gerekçe ve öncelik.
- Kullanıcı feedback verdiyse önceki brief'i o yönde revize et ve aiComment'te neyi değiştirdiğini söyle.`;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const { idea, feedback, previousBrief } = req.body ?? {};
  if (!idea || typeof idea !== "string" || idea.length > 2000) {
    return res.status(400).json({ error: "invalid_idea" });
  }
  if (!process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "no_api_key" });
  }

  let userContent = `Kampanya fikrim: ${idea}`;
  if (feedback && previousBrief) {
    userContent += `\n\nÖnceki brief: ${JSON.stringify(previousBrief)}\n\nDeğişiklik isteğim: ${feedback}`;
  }

  try {
    const { json, provider } = await generateStructured(SYSTEM, userContent, SCHEMA, 4000);
    return res.status(200).json({ ...json, provider });
  } catch (err: any) {
    console.error("refine error:", err?.message ?? err);
    return res.status(502).json({ error: "ai_error" });
  }
}
