// Teams botu köprüsü: görev paketini departmanın Teams kanalına Adaptive Card
// olarak iletir. Kanal bağlantısı Teams "Workflows → Webhook isteği alındığında
// kanala gönder" şablonuyla alınan URL'nin env değişkenine yazılmasıyla kurulur.
// Departman bazlı değişken yoksa TEAMS_WEBHOOK_URL ortak kanala düşer;
// hiçbiri yoksa gönderim "demo modu" olarak raporlanır (delivered: false).

const DEPARTMENTS = ["CRM", "Veri Platformları", "Legal", "Pazarlama"];

const ENV_KEYS: Record<string, string> = {
  CRM: "TEAMS_WEBHOOK_CRM",
  "Veri Platformları": "TEAMS_WEBHOOK_VERI",
  Legal: "TEAMS_WEBHOOK_LEGAL",
  Pazarlama: "TEAMS_WEBHOOK_PAZARLAMA",
};

const CHANNELS: Record<string, string> = {
  CRM: "#crm-kampanyalar",
  "Veri Platformları": "#veri-platformlari",
  Legal: "#legal-uyum",
  Pazarlama: "#pazarlama-kanal",
};

const BOARD_URL = "https://ai-business-orchestrator.vercel.app";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const { department, title, summary, rationale, priority, draft } = req.body ?? {};
  if (!DEPARTMENTS.includes(department) || typeof title !== "string" || title.length > 300) {
    return res.status(400).json({ error: "invalid_input" });
  }

  const channel = CHANNELS[department];
  const webhook = (process.env[ENV_KEYS[department]] || process.env.TEAMS_WEBHOOK_URL || "").trim();
  if (!webhook) return res.status(200).json({ delivered: false, reason: "no_webhook", channel });

  const body: any[] = [
    { type: "TextBlock", text: "🤖 Team-bot görev paketi", weight: "Bolder", color: "Accent" },
    { type: "TextBlock", text: `Merhaba ${department} ekibi — onaylanan kampanya için yeni görev paketi yönlendirildi.`, isSubtle: true, wrap: true, spacing: "None" },
    { type: "TextBlock", text: title, weight: "Bolder", size: "Large", wrap: true },
  ];
  if (typeof summary === "string" && summary) body.push({ type: "TextBlock", text: summary, wrap: true });
  body.push({
    type: "FactSet",
    facts: [
      { title: "Departman", value: department },
      { title: "Öncelik", value: typeof priority === "string" ? priority : "-" },
      { title: "Kanal", value: channel },
    ],
  });
  if (typeof rationale === "string" && rationale) {
    body.push({ type: "TextBlock", text: `Karar gerekçesi: ${rationale}`, wrap: true, isSubtle: true });
  }
  if (draft?.headline && Array.isArray(draft.items)) {
    body.push({ type: "TextBlock", text: `✨ AI ön çalışması — ${draft.headline}`, weight: "Bolder", wrap: true, separator: true });
    for (const item of draft.items.slice(0, 4)) {
      if (item?.title && item?.content) body.push({ type: "TextBlock", text: `• ${item.title}: ${item.content}`, wrap: true });
    }
  }

  const card = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body,
          actions: [{ type: "Action.OpenUrl", title: "Görev panosunu aç", url: BOARD_URL }],
        },
      },
    ],
  };

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });
    if (!response.ok) throw new Error(`webhook ${response.status}`);
    return res.status(200).json({ delivered: true, channel });
  } catch (error: any) {
    console.error("teams webhook error:", error?.message ?? error);
    return res.status(200).json({ delivered: false, reason: "webhook_failed", channel });
  }
}
