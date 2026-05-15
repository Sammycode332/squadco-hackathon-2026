import { env } from "../config/env.js";

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer | undefined> {
  if (!env.openAiApiKey) {
    console.warn("Skipping text-to-speech because OPENAI_API_KEY is missing.");
    return undefined;
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "coral",
      input: text.slice(0, 4096),
      instructions: "Speak clearly and warmly, like a helpful WhatsApp assistant for Nigerian traders and workers.",
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`OpenAI text-to-speech failed with ${response.status}: ${body}`);
    return undefined;
  }

  return response.arrayBuffer();
}
