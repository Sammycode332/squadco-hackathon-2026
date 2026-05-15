import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { transcribeWhatsAppAudio } from "./audio/transcription.js";
import { handleOnboardingTurn } from "./bot/onboarding.js";
import { getOrCreateUser, saveMessage, updateUser } from "./bot/memoryStore.js";
import type { IncomingBotMessage } from "./bot/types.js";
import { env } from "./config/env.js";
import { sendWhatsAppReply } from "./webhooks/whatsappClient.js";
import { parseWhatsAppMessages } from "./webhooks/whatsapp.js";

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    console.log(`${request.method} ${url.pathname}`);

    if (request.method === "GET" && url.pathname === "/health") {
      return sendJson(response, 200, { ok: true });
    }

    if (request.method === "GET" && url.pathname === "/debug/env") {
      return sendJson(response, 200, {
        whatsappVerifyToken: env.whatsappVerifyToken,
        whatsappVerifyTokenLength: env.whatsappVerifyToken.length,
        hasWhatsAppAccessToken: Boolean(env.whatsappAccessToken),
        hasWhatsAppPhoneNumberId: Boolean(env.whatsappPhoneNumberId),
        hasOpenAiApiKey: Boolean(env.openAiApiKey),
        whatsappTtsReplies: env.whatsappTtsReplies,
      });
    }

    if (request.method === "GET" && isWhatsAppWebhookPath(url.pathname)) {
      return verifyWebhook(url, response);
    }

    if (request.method === "POST" && isWhatsAppWebhookPath(url.pathname)) {
      const body = await readJson(request);
      const messages = parseWhatsAppMessages(body);
      const replies = [];

      for (const message of messages) {
        const reply = await processIncomingMessage(message);
        await sendWhatsAppReply(message.from, reply);
        replies.push({ to: message.from, reply });
      }

      return sendJson(response, 200, { ok: true, replies });
    }

    if (request.method === "POST" && url.pathname === "/dev/message") {
      const message = (await readJson(request)) as IncomingBotMessage;
      const reply = await processIncomingMessage(message);
      return sendJson(response, 200, reply);
    }

    return sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    console.error(error);
    return sendJson(response, 500, { error: "Internal server error" });
  }
});

server.listen(env.port, () => {
  console.log(`WhatsApp onboarding bot listening on http://localhost:${env.port}`);
});

async function processIncomingMessage(message: IncomingBotMessage) {
  const preparedMessage = await prepareAudioMessage(message);
  const profile = await getOrCreateUser(message);
  await saveMessage(preparedMessage, "inbound", preparedMessage.text ?? preparedMessage.transcript);

  const turn = await handleOnboardingTurn(profile, preparedMessage);
  const updatedProfile = await updateUser(profile.phone, turn.profilePatch);

  await saveMessage(preparedMessage, "outbound", turn.reply.text);

  return {
    ...turn.reply,
    profile: updatedProfile,
  };
}

async function prepareAudioMessage(message: IncomingBotMessage): Promise<IncomingBotMessage> {
  if (message.type !== "audio" || message.transcript || !message.mediaUrl) {
    return message;
  }

  try {
    const transcript = await transcribeWhatsAppAudio(message.mediaUrl);
    return transcript ? { ...message, transcript } : message;
  } catch (error) {
    console.error(error);
    return message;
  }
}

function verifyWebhook(url: URL, response: ServerResponse) {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token")?.trim();
  const challenge = url.searchParams.get("hub.challenge");
  console.log("Webhook verify", {
    mode,
    hasChallenge: Boolean(challenge),
    tokenMatches: token === env.whatsappVerifyToken,
  });

  if (mode === "subscribe" && token === env.whatsappVerifyToken && challenge) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end(challenge);
    return;
  }

  return sendJson(response, 403, { error: "Webhook verification failed" });
}

function isWhatsAppWebhookPath(pathname: string) {
  return pathname === "/webhooks/whatsapp" || pathname === "/webhook/whatsapp";
}

async function readJson(request: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}
