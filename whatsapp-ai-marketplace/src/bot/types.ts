export type LanguageCode = "english" | "yoruba" | "hausa" | "igbo" | "pidgin";

export type OnboardingStage =
  | "NEW"
  | "LANGUAGE_SELECTED"
  | "ASKING_TRADE"
  | "ASKING_LOCATION"
  | "ASKING_GOAL"
  | "COMPLETE";

export type UserIntent = "TRADER" | "JOB_SEEKER" | "BUSINESS_GROWTH" | "UNKNOWN";

export type IncomingBotMessage = {
  from: string;
  id?: string | undefined;
  type: "text" | "button" | "audio" | "image" | "unknown";
  text?: string | undefined;
  buttonId?: string | undefined;
  mediaUrl?: string | undefined;
  transcript?: string | undefined;
  profileName?: string | undefined;
};

export type UserProfile = {
  phone: string;
  displayName?: string | undefined;
  language?: LanguageCode | undefined;
  onboardingStage: OnboardingStage;
  trade?: string | undefined;
  location?: string | undefined;
  intent: UserIntent;
  wantsJobs: boolean;
  wantsBusinessHelp: boolean;
};

export type ProfilePatch = Partial<Omit<UserProfile, "phone">>;

export type BotReply = {
  text: string;
  buttons?: Array<{ id: string; title: string }>;
};

export type BotTurn = {
  reply: BotReply;
  profilePatch: ProfilePatch;
};

export type ProfileUnderstanding = {
  profession?: string | undefined;
  location?: string | undefined;
  intent: UserIntent;
  wantsJobs: boolean;
  wantsBusinessHelp: boolean;
  isMeaningful: boolean;
  confidence: number;
  clarification?: string | undefined;
};
