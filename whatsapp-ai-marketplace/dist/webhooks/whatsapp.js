export function parseWhatsAppMessages(body) {
    const parsed = [];
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
                const textPayload = rawMessage.text;
                const buttonPayload = rawMessage.button;
                const audioPayload = rawMessage.audio;
                const imagePayload = rawMessage.image;
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
function normalizeMessageType(type) {
    if (type === "text" || type === "button" || type === "audio" || type === "image") {
        return type;
    }
    return "unknown";
}
function asString(value) {
    return typeof value === "string" ? value : undefined;
}
//# sourceMappingURL=whatsapp.js.map