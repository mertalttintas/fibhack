import Anthropic from "@anthropic-ai/sdk";

type ProviderResult = {
  json: any;
  provider: "openai" | "claude" | "gemini";
  model: string;
};

function responseText(data: any): string {
  if (typeof data?.output_text === "string") return data.output_text;
  return (data?.output ?? [])
    .flatMap((item: any) => item?.content ?? [])
    .filter((part: any) => part?.type === "output_text")
    .map((part: any) => part?.text ?? "")
    .join("");
}

async function callOpenAI(system: string, user: string, schema: any, maxTokens: number) {
  const model = (process.env.OPENAI_MODEL || "gpt-5.6-luna").trim();
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${(process.env.OPENAI_API_KEY || "").trim()}`,
    },
    body: JSON.stringify({
      model,
      instructions: system,
      input: user,
      reasoning: { effort: "low" },
      max_output_tokens: maxTokens,
      text: {
        format: {
          type: "json_schema",
          name: "orchestrator_response",
          strict: true,
          schema,
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const data: any = await res.json();
  const text = responseText(data);
  if (!text) throw new Error("openai: empty response");
  return { json: JSON.parse(text), model };
}

// Anthropic JSON şemasını Gemini response_schema formatına çevirir
// (uppercase tipler, additionalProperties yok, ["x","null"] → nullable)
export function toGeminiSchema(s: any): any {
  if (!s || typeof s !== "object") return s;
  const out: any = {};
  let t = s.type;
  if (Array.isArray(t)) {
    out.nullable = t.includes("null");
    t = t.find((x: string) => x !== "null");
  }
  if (t) out.type = String(t).toUpperCase();
  if (s.enum) out.enum = s.enum;
  if (s.required) out.required = s.required;
  if (s.properties) {
    out.properties = {};
    for (const k of Object.keys(s.properties)) out.properties[k] = toGeminiSchema(s.properties[k]);
  }
  if (s.items) out.items = toGeminiSchema(s.items);
  return out;
}

async function callAnthropic(system: string, user: string, schema: any, maxTokens: number) {
  // env değerleri CRLF artığı içerebilir — auth hatasına yol açmasın
  const client = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY || "").trim() });
  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema },
    },
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("anthropic: empty response");
  return JSON.parse(text.text);
}

async function callGemini(system: string, user: string, schema: any, maxTokens: number) {
  const model = (process.env.GEMINI_MODEL || "gemini-flash-latest").trim();
  const key = (process.env.GEMINI_API_KEY || "").trim();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          response_mime_type: "application/json",
          response_schema: toGeminiSchema(schema),
          maxOutputTokens: maxTokens,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data: any = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
  if (!text) throw new Error("gemini: empty response");
  return JSON.parse(text);
}

// Sağlayıcı zinciri: Anthropic → Gemini → hata (frontend simülasyona düşer)
export async function generateStructured(
  system: string,
  user: string,
  schema: any,
  maxTokens = 8000
): Promise<ProviderResult> {
  const errors: string[] = [];
  if (process.env.OPENAI_API_KEY) {
    try {
      const result = await callOpenAI(system, user, schema, maxTokens);
      return { json: result.json, provider: "openai", model: result.model };
    } catch (e: any) {
      console.warn("OpenAI provider failed:", e?.message ?? e);
      errors.push(`openai: ${e?.message ?? e}`);
    }
  }
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return { json: await callAnthropic(system, user, schema, maxTokens), provider: "claude", model: "claude-opus-4-8" };
    } catch (e: any) {
      errors.push(`anthropic: ${e?.message ?? e}`);
    }
  }
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = (process.env.GEMINI_MODEL || "gemini-flash-latest").trim();
      return { json: await callGemini(system, user, schema, maxTokens), provider: "gemini", model };
    } catch (e: any) {
      errors.push(`gemini: ${e?.message ?? e}`);
    }
  }
  throw new Error(errors.length ? errors.join(" | ") : "no_api_key");
}
