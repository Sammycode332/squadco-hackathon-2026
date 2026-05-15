import type { IncomingBotMessage, ProfilePatch, UserProfile } from "./types.js";
export declare function getOrCreateUser(message: IncomingBotMessage): Promise<UserProfile>;
export declare function updateUser(phone: string, patch: ProfilePatch): Promise<UserProfile>;
export declare function saveMessage(_message: IncomingBotMessage, _direction: "inbound" | "outbound", _body?: string): Promise<void>;
//# sourceMappingURL=memoryStore.d.ts.map