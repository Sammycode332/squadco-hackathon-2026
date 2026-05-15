import type { IncomingBotMessage, ProfilePatch, UserProfile } from "./types.js";

const users = new Map<string, UserProfile>();

export async function getOrCreateUser(message: IncomingBotMessage): Promise<UserProfile> {
  const existing = users.get(message.from);
  if (existing) {
    return existing;
  }

  const created: UserProfile = {
    phone: message.from,
    displayName: message.profileName,
    onboardingStage: "NEW",
    intent: "UNKNOWN",
    wantsJobs: false,
    wantsBusinessHelp: false,
  };

  users.set(message.from, created);
  return created;
}

export async function updateUser(phone: string, patch: ProfilePatch): Promise<UserProfile> {
  const existing = users.get(phone);
  if (!existing) {
    throw new Error(`User ${phone} does not exist`);
  }

  const updated = { ...existing, ...patch };
  users.set(phone, updated);
  return updated;
}

export async function saveMessage(_message: IncomingBotMessage, _direction: "inbound" | "outbound", _body?: string) {
  return;
}
