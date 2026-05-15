import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 3000),
  whatsappVerifyToken: (process.env.WHATSAPP_VERIFY_TOKEN ?? "dev-verify-token").trim(),
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN?.trim(),
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
  openAiApiKey: process.env.OPENAI_API_KEY?.trim(),
  whatsappTtsReplies: (process.env.WHATSAPP_TTS_REPLIES ?? "false").trim().toLowerCase() === "true",
};
