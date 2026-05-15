# WhatsApp AI Marketplace

This project is starting with the strongest path: WhatsApp onboarding.

## Current Flow

1. User messages the bot with `Hi`.
2. Bot asks for language: English, Yoruba, Hausa, Igbo, or Pidgin.
3. User chooses a language.
4. User can type or send a voice-note transcript like:

   ```text
   I sell tomatoes in Mile 12
   ```

5. The bot extracts:

   ```json
   {
     "trade": "Tomatoes",
     "location": "Mile 12",
     "intent": "TRADER"
   }
   ```

6. Bot asks whether the user wants jobs or help growing the business.

## Run Locally

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:3000/health
```

Test the onboarding without WhatsApp:

```bash
curl -X POST http://localhost:3000/dev/message \
  -H "Content-Type: application/json" \
  -d "{\"from\":\"2348000000000\",\"type\":\"text\",\"text\":\"Hi\"}"
```

Then send:

```bash
curl -X POST http://localhost:3000/dev/message \
  -H "Content-Type: application/json" \
  -d "{\"from\":\"2348000000000\",\"type\":\"text\",\"text\":\"English\"}"
```

Then:

```bash
curl -X POST http://localhost:3000/dev/message \
  -H "Content-Type: application/json" \
  -d "{\"from\":\"2348000000000\",\"type\":\"audio\",\"transcript\":\"I sell tomatoes in Mile 12\"}"
```

## WhatsApp Webhook

Use this verification URL in Meta's WhatsApp Cloud API setup:

```text
GET /webhooks/whatsapp
```

Set this environment variable to match the token you enter in Meta:

```text
WHATSAPP_VERIFY_TOKEN=dev-verify-token
```

For WhatsApp replies, voice-note transcription, and optional audio replies, use:

```text
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
OPENAI_API_KEY=your_openai_api_key
WHATSAPP_TTS_REPLIES=false
```

Set `WHATSAPP_TTS_REPLIES=true` only when you want the bot to send an extra audio version of each reply.

Incoming webhook messages should be posted to:

```text
POST /webhooks/whatsapp
```

The server currently returns replies in JSON. The next step is to connect `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`, then send the replies back through the WhatsApp Cloud API.
