import { env } from "../config/env.js";
import { extractProfileFromText } from "./profileExtractor.js";
export async function understandUserProfileText(text) {
    const trimmed = text.trim();
    if (!trimmed) {
        return fallbackUnderstanding(trimmed, false);
    }
    if (!env.openAiApiKey) {
        return fallbackUnderstanding(trimmed, true);
    }
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${env.openAiApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: "You extract onboarding profile details for a Nigerian WhatsApp marketplace bot. Return only valid JSON with keys: profession, location, intent, wantsJobs, wantsBusinessHelp, isMeaningful, confidence, clarification. intent must be TRADER, JOB_SEEKER, BUSINESS_GROWTH, or UNKNOWN. Extract any real profession, trade, skill, service, job, or business, not only selling goods. If the message is random, greeting-only, too vague, or not enough to identify work/business/location, set isMeaningful false and confidence below 0.5. Do not invent details.",
                    },
                    {
                        role: "user",
                        content: trimmed,
                    },
                ],
            }),
        });
        if (!response.ok) {
            const body = await response.text();
            console.error(`OpenAI understanding failed with ${response.status}: ${body}`);
            return fallbackUnderstanding(trimmed, true);
        }
        const result = (await response.json());
        const content = result.choices?.[0]?.message?.content;
        if (!content) {
            return fallbackUnderstanding(trimmed, true);
        }
        return normalizeUnderstanding(JSON.parse(content));
    }
    catch (error) {
        console.error(error);
        return fallbackUnderstanding(trimmed, true);
    }
}
function fallbackUnderstanding(text, allowSimpleProfession) {
    const extracted = extractProfileFromText(text);
    const hasWorkSignal = /\b(i\s+am|i'm|im|am\s+a|am\s+an|i\s+sell|selling|i\s+do|i\s+make|i\s+repair|i\s+fix|i\s+build|i\s+cook|i\s+drive|i\s+work|profession|occupation|skill|business|service|trade|job)\b/i.test(text);
    const profession = allowSimpleProfession && hasWorkSignal ? extracted.trade : undefined;
    const hasUsefulSignal = Boolean(profession || extracted.location || extracted.wantsJobs || extracted.wantsBusinessHelp);
    return {
        profession,
        location: extracted.location,
        intent: extracted.intent,
        wantsJobs: extracted.wantsJobs,
        wantsBusinessHelp: extracted.wantsBusinessHelp,
        isMeaningful: hasUsefulSignal,
        confidence: hasUsefulSignal ? 0.65 : 0.2,
        clarification: hasUsefulSignal ? undefined : "Please tell me your work, skill, or business.",
    };
}
function normalizeUnderstanding(value) {
    const confidence = typeof value.confidence === "number" ? clamp(value.confidence, 0, 1) : 0;
    const intent = parseIntent(value.intent);
    return {
        profession: cleanString(value.profession),
        location: cleanString(value.location),
        intent,
        wantsJobs: Boolean(value.wantsJobs) || intent === "JOB_SEEKER",
        wantsBusinessHelp: Boolean(value.wantsBusinessHelp) || intent === "BUSINESS_GROWTH" || intent === "TRADER",
        isMeaningful: Boolean(value.isMeaningful) && confidence >= 0.45,
        confidence,
        clarification: cleanString(value.clarification),
    };
}
function parseIntent(value) {
    if (value === "TRADER" || value === "JOB_SEEKER" || value === "BUSINESS_GROWTH") {
        return value;
    }
    return "UNKNOWN";
}
function cleanString(value) {
    if (typeof value !== "string") {
        return undefined;
    }
    const cleaned = value.trim();
    return cleaned || undefined;
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
//# sourceMappingURL=aiUnderstanding.js.map