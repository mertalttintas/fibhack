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
  // dependency: departmanlar arası talep — kart, görevin sahibi yerine ihtiyacın
  // karşılanacağı departmanın kanalına gider; from talebi yapan departmandır.
  const { department, title, summary, rationale, priority, draft, dependency } = req.body ?? {};
  if (!DEPARTMENTS.includes(department) || typeof title !== "string" || title.length > 300) {
    return res.status(400).json({ error: "invalid_input" });
  }
  const isDependency = dependency && typeof dependency.message === "string" && DEPARTMENTS.includes(dependency.from);

  const channel = CHANNELS[department];
  const webhook = (process.env[ENV_KEYS[department]] || process.env.TEAMS_WEBHOOK_URL || "").trim();
  if (!webhook) return res.status(200).json({ delivered: false, reason: "no_webhook", channel });

  // Slack webhook desteği: URL'den algılanır, Block Kit formatında gönderilir.
  // Kurumsal tarafta aynı env değişkenine Teams Workflows URL'si konabilir.
  if (webhook.includes("hooks.slack.com")) {
    const blocks: any[] = isDependency
      ? [
          { type: "header", text: { type: "plain_text", text: "🤝 Team-bot departmanlar arası talep", emoji: true } },
          { type: "section", text: { type: "mrkdwn", text: `Merhaba *${department}* ekibi — *${dependency.from}* ekibinin görevi için sizden bir ihtiyaç var.` } },
          { type: "section", text: { type: "mrkdwn", text: `*İlgili görev:* ${title}${typeof dependency.need === "string" && dependency.need ? `\n*İhtiyaç:* ${dependency.need}` : ""}`.slice(0, 2900) } },
          { type: "section", text: { type: "mrkdwn", text: dependency.message.slice(0, 2900) } },
          { type: "section", fields: [
            { type: "mrkdwn", text: `*Talep eden:*\n${dependency.from}` },
            { type: "mrkdwn", text: `*Hedef kanal:*\n${channel}` },
          ] },
        ]
      : [
          { type: "header", text: { type: "plain_text", text: "🤖 Team-bot görev paketi", emoji: true } },
          { type: "section", text: { type: "mrkdwn", text: `Merhaba *${department}* ekibi — onaylanan kampanya için yeni görev paketi yönlendirildi.` } },
          { type: "section", text: { type: "mrkdwn", text: `*${title}*${typeof summary === "string" && summary ? `\n${summary}` : ""}`.slice(0, 2900) } },
          { type: "section", fields: [
            { type: "mrkdwn", text: `*Öncelik:*\n${typeof priority === "string" ? priority : "-"}` },
            { type: "mrkdwn", text: `*Hedef kanal:*\n${channel}` },
          ] },
        ];
    if (typeof rationale === "string" && rationale) {
      blocks.push({ type: "section", text: { type: "mrkdwn", text: `*Karar gerekçesi:* ${rationale}`.slice(0, 2900) } });
    }
    if (draft?.headline && Array.isArray(draft.items)) {
      blocks.push({ type: "divider" });
      blocks.push({ type: "section", text: { type: "mrkdwn", text: `*✨ AI ön çalışması — ${draft.headline}*`.slice(0, 2900) } });
      for (const item of draft.items.slice(0, 4)) {
        if (item?.title && item?.content) {
          blocks.push({ type: "section", text: { type: "mrkdwn", text: `• *${item.title}:* ${item.content}`.slice(0, 2900) } });
        }
      }
    }
    blocks.push({ type: "actions", elements: [{ type: "button", text: { type: "plain_text", text: "Görev panosunu aç", emoji: true }, url: BOARD_URL }] });
    blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: "AI Kampanya Orkestratörü · insan onayı olmadan yayına çıkmaz" }] });

    try {
      const response = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: isDependency ? `Team-bot departmanlar arası talep: ${title}` : `Team-bot görev paketi: ${title}`, blocks }),
      });
      if (!response.ok) throw new Error(`slack ${response.status}`);
      return res.status(200).json({ delivered: true, channel, via: "slack" });
    } catch (error: any) {
      console.error("slack webhook error:", error?.message ?? error);
      return res.status(200).json({ delivered: false, reason: "webhook_failed", channel });
    }
  }

  const body: any[] = isDependency
    ? [
        { type: "TextBlock", text: "🤝 Team-bot departmanlar arası talep", weight: "Bolder", color: "Accent" },
        { type: "TextBlock", text: `Merhaba ${department} ekibi — ${dependency.from} ekibinin görevi için sizden bir ihtiyaç var.`, isSubtle: true, wrap: true, spacing: "None" },
        { type: "TextBlock", text: title, weight: "Bolder", size: "Large", wrap: true },
      ]
    : [
        { type: "TextBlock", text: "🤖 Team-bot görev paketi", weight: "Bolder", color: "Accent" },
        { type: "TextBlock", text: `Merhaba ${department} ekibi — onaylanan kampanya için yeni görev paketi yönlendirildi.`, isSubtle: true, wrap: true, spacing: "None" },
        { type: "TextBlock", text: title, weight: "Bolder", size: "Large", wrap: true },
      ];
  if (isDependency) {
    if (typeof dependency.need === "string" && dependency.need) body.push({ type: "TextBlock", text: `İhtiyaç: ${dependency.need}`, wrap: true });
    body.push({ type: "TextBlock", text: dependency.message, wrap: true });
    body.push({
      type: "FactSet",
      facts: [
        { title: "Talep eden", value: dependency.from },
        { title: "Muhatap", value: department },
        { title: "Kanal", value: channel },
      ],
    });
  } else {
    if (typeof summary === "string" && summary) body.push({ type: "TextBlock", text: summary, wrap: true });
    body.push({
      type: "FactSet",
      facts: [
        { title: "Departman", value: department },
        { title: "Öncelik", value: typeof priority === "string" ? priority : "-" },
        { title: "Kanal", value: channel },
      ],
    });
  }
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
