import { synthesizeSpeech } from "../audio/textToSpeech.js";
import { env } from "../config/env.js";
export async function sendWhatsAppReply(to, reply) {
    if (!env.whatsappAccessToken || !env.whatsappPhoneNumberId) {
        console.warn("Skipping WhatsApp send because WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing.");
        return;
    }
    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
            preview_url: false,
            body: formatReply(reply),
        },
    };
    const response = await fetch(`https://graph.facebook.com/v20.0/${env.whatsappPhoneNumberId}/messages`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.whatsappAccessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`WhatsApp send failed with ${response.status}: ${errorBody}`);
    }
    if (env.whatsappTtsReplies) {
        await sendAudioReply(to, reply.text);
    }
}
function formatReply(reply) {
    if (!reply.buttons?.length) {
        return reply.text;
    }
    const options = reply.buttons.map((button, index) => `${index + 1}. ${button.title}`).join("\n");
    return `${reply.text}\n\n${options}`;
}
async function sendAudioReply(to, text) {
    const audio = await synthesizeSpeech(text);
    if (!audio) {
        return;
    }
    const mediaId = await uploadWhatsAppAudio(audio);
    if (!mediaId) {
        return;
    }
    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "audio",
        audio: { id: mediaId },
    };
    const response = await fetch(`https://graph.facebook.com/v20.0/${env.whatsappPhoneNumberId}/messages`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.whatsappAccessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`WhatsApp audio send failed with ${response.status}: ${errorBody}`);
    }
}
async function uploadWhatsAppAudio(audio) {
    const formData = new FormData();
    formData.set("messaging_product", "whatsapp");
    formData.set("type", "audio/mpeg");
    formData.set("file", new Blob([audio], { type: "audio/mpeg" }), "reply.mp3");
    const response = await fetch(`https://graph.facebook.com/v20.0/${env.whatsappPhoneNumberId}/media`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.whatsappAccessToken}`,
        },
        body: formData,
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`WhatsApp audio upload failed with ${response.status}: ${errorBody}`);
    }
    const result = (await response.json());
    return result.id;
}
//# sourceMappingURL=whatsappClient.js.map