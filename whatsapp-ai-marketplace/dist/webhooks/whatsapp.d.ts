import type { IncomingBotMessage } from "../bot/types.js";
type WhatsAppWebhookBody = {
    entry?: Array<{
        changes?: Array<{
            value?: {
                contacts?: Array<{
                    wa_id?: string;
                    profile?: {
                        name?: string;
                    };
                }>;
                messages?: Array<Record<string, unknown>>;
            };
        }>;
    }>;
};
export declare function parseWhatsAppMessages(body: WhatsAppWebhookBody): IncomingBotMessage[];
export {};
//# sourceMappingURL=whatsapp.d.ts.map