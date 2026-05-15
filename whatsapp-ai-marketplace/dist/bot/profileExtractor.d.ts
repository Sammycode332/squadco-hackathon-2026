import type { UserIntent } from "./types.js";
export type ExtractedProfile = {
    trade?: string | undefined;
    location?: string | undefined;
    intent: UserIntent;
    wantsJobs: boolean;
    wantsBusinessHelp: boolean;
};
export declare function extractProfileFromText(input: string): ExtractedProfile;
//# sourceMappingURL=profileExtractor.d.ts.map