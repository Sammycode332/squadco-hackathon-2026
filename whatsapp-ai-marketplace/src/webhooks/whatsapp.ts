import type { IncomingBotMessage } from "../bot/types.js";

type WhatsAppWebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
        messages?: Array<Record<string, unknown>>;
      };
    }>;
  }>;
};

export function parseWhatsAppMessages(body: WhatsAppWebhookBody): IncomingBotMessage[] {
  const parsed: IncomingBotMessage[] = [];

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const contact = value?.contacts?.[0];

      for (const rawMessage of value?.messages ?? []) {
        const from = asString(rawMessage.from) ?? contact?.wa_id;
        if (!from) {
          continue;
        }

        const type = normalizeMessageType(asString(rawMessage.type));
        const textPayload = rawMessage.text as { body?: unknown } | undefined;
        const buttonPayload = rawMessage.button as { payload?: unknown; text?: unknown } | undefined;
        const audioPayload = rawMessage.audio as { id?: unknown } | undefined;
        const imagePayload = rawMessage.image as { id?: unknown; caption?: unknown } | undefined;

        parsed.push({
          from,
          id: asString(rawMessage.id),
          type,
          text: asString(textPayload?.body) ?? asString(imagePayload?.caption),
          buttonId: asString(buttonPayload?.payload) ?? asString(buttonPayload?.text),
          mediaUrl: asString(audioPayload?.id) ?? asString(imagePayload?.id),
          transcript: asString(rawMessage.transcript),
          profileName: contact?.profile?.name,
        });
      }
    }
  }

  return parsed;
}

function normalizeMessageType(type: string | undefined): IncomingBotMessage["type"] {
  if (type === "text" || type === "button" || type === "audio" || type === "image") {
    return type;
  }

  return "unknown";
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
