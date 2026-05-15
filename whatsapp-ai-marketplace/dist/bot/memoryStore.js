const users = new Map();
export async function getOrCreateUser(message) {
    const existing = users.get(message.from);
    if (existing) {
        return existing;
    }
    const created = {
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
export async function updateUser(phone, patch) {
    const existing = users.get(phone);
    if (!existing) {
        throw new Error(`User ${phone} does not exist`);
    }
    const updated = { ...existing, ...patch };
    users.set(phone, updated);
    return updated;
}
export async function saveMessage(_message, _direction, _body) {
    return;
}
//# sourceMappingURL=memoryStore.js.map