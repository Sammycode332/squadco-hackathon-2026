const SELLING_PATTERNS = [
    /\b(?:i\s+sell|selling|i\s+dey\s+sell|my\s+business\s+is)\s+(.+?)(?:\s+(?:in|at|around|for)\s+(.+))?$/i,
    /\b(?:trade|work)\s*(?:is|:)?\s*(.+?)(?:\s+(?:in|at|around)\s+(.+))?$/i,
    /\b(?:i\s+am|i'm|im|am)\s+(?:a|an)?\s*(.+?)(?:\s+(?:in|at|around|from)\s+(.+))?$/i,
    /\b(?:i\s+do|i\s+make|i\s+repair|i\s+fix|i\s+build|i\s+cook|i\s+drive)\s+(.+?)(?:\s+(?:in|at|around|from)\s+(.+))?$/i,
    /\b(?:my\s+profession\s+is|profession\s*:?|occupation\s*:?|skill\s*:?|job\s*:?|business\s*:?|service\s*:?)\s*(.+?)(?:\s+(?:in|at|around|from)\s+(.+))?$/i,
    /\b(?:i\s+work\s+as)\s+(?:a|an)?\s*(.+?)(?:\s+(?:in|at|around|from)\s+(.+))?$/i,
];
const LOCATION_PATTERNS = [
    /\b(?:in|at|around|from|located\s+in|based\s+in|stay\s+in|live\s+in|i\s+stay\s+at|i\s+live\s+at)\s+([a-z0-9\s-]+)$/i,
    /\b(?:mile\s*12|oshodi|yaba|ikeja|aba|kano|kaduna|onitsha|abuja|ibadan)\b/i,
];
export function extractProfileFromText(input) {
    const text = input.trim();
    const lower = text.toLowerCase();
    const wantsJobs = /\b(job|work|hire|employment|vacancy|apprentice)\b/i.test(text);
    const wantsBusinessHelp = /\b(grow|business|customer|sell|market|inventory|supplier|loan)\b/i.test(text);
    let intent = "UNKNOWN";
    if (wantsJobs) {
        intent = "JOB_SEEKER";
    }
    else if (wantsBusinessHelp || /\b(?:trader|seller|vendor|shop|store)\b/i.test(text)) {
        intent = "TRADER";
    }
    let trade;
    let location;
    for (const pattern of SELLING_PATTERNS) {
        const match = text.match(pattern);
        if (match?.[1]) {
            trade = cleanValue(match[1]);
            location = match[2] ? cleanValue(match[2]) : undefined;
            intent = "TRADER";
            break;
        }
    }
    if (!location) {
        for (const pattern of LOCATION_PATTERNS) {
            const match = text.match(pattern);
            if (match?.[1] ?? match?.[0]) {
                location = cleanValue(match[1] ?? match[0]);
                break;
            }
        }
    }
    if (trade?.includes(" In ")) {
        const [possibleTrade, possibleLocation] = trade.split(/\s+In\s+(.+)/);
        trade = cleanValue(possibleTrade ?? trade);
        location = location ?? cleanValue(possibleLocation ?? "");
    }
    if (!trade && looksLikeSimpleProfession(text)) {
        trade = cleanValue(text);
        intent = wantsJobs ? "JOB_SEEKER" : "TRADER";
    }
    if (lower === "jobs" || lower.includes("want jobs")) {
        intent = "JOB_SEEKER";
    }
    if (lower.includes("grow") || lower.includes("business")) {
        intent = intent === "JOB_SEEKER" ? "JOB_SEEKER" : "BUSINESS_GROWTH";
    }
    return {
        trade,
        location,
        intent,
        wantsJobs,
        wantsBusinessHelp,
    };
}
function looksLikeSimpleProfession(text) {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount === 0 || wordCount > 6) {
        return false;
    }
    return !/\b(hi|hello|hey|english|yoruba|hausa|igbo|pidgin|job|jobs|grow|business|yes|no)\b/i.test(text);
}
function cleanValue(value) {
    const cleaned = value
        .replace(/[.?!,]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
    if (!cleaned) {
        return undefined;
    }
    return cleaned
        .split(" ")
        .map((word) => (word.length <= 2 ? word : word[0]?.toUpperCase() + word.slice(1).toLowerCase()))
        .join(" ");
}
//# sourceMappingURL=profileExtractor.js.map