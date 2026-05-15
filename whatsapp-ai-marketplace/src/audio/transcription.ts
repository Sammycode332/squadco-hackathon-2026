import { env } from "../config/env.js";

type MediaInfo = {
  url: string;
  mime_type?: string;
};

export async function transcribeWhatsAppAudio(mediaId: string): Promise<string | undefined> {
  if (!env.whatsappAccessToken || !env.whatsappPhoneNumberId || !env.openAiApiKey) {
    console.warn("Skipping transcription because WhatsApp or OpenAI credentials are missing.");
    return undefined;
  }

  const mediaInfo = await getWhatsAppMediaInfo(mediaId);
  const audio = await downloadWhatsAppMedia(mediaInfo.url);

  const formData = new FormData();
  formData.set("model", "gpt-4o-mini-transcribe");
  formData.set("file", new Blob([audio], { type: mediaInfo.mime_type ?? "application/octet-stream" }), filenameForMimeType(mediaInfo.mime_type));

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`OpenAI transcription failed with ${response.status}: ${body}`);
    return undefined;
  }

  const result = (await response.json()) as { text?: string };
  return result.text?.trim();
}

async function getWhatsAppMediaInfo(mediaId: string): Promise<MediaInfo> {
  const url = new URL(`https://graph.facebook.com/v20.0/${mediaId}`);
  url.searchParams.set("phone_number_id", env.whatsappPhoneNumberId ?? "");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.whatsappAccessToken}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Could not retrieve WhatsApp media URL: ${response.status} ${body}`);
  }

  return (await response.json()) as MediaInfo;
}

async function downloadWhatsAppMedia(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.whatsappAccessToken}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Could not download WhatsApp media: ${response.status} ${body}`);
  }

  return response.arrayBuffer();
}

function filenameForMimeType(mimeType?: string): string {
  if (mimeType?.includes("mpeg")) return "voice.mp3";
  if (mimeType?.includes("mp4")) return "voice.mp4";
  if (mimeType?.includes("wav")) return "voice.wav";
  if (mimeType?.includes("webm")) return "voice.webm";
  if (mimeType?.includes("ogg")) return "voice.ogg";
  return "voice.audio";
}
