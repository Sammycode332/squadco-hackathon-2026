import { understandUserProfileText } from "./aiUnderstanding.js";
import { extractProfileFromText } from "./profileExtractor.js";
const LANGUAGES = {
    english: "English",
    yoruba: "Yoruba",
    hausa: "Hausa",
    igbo: "Igbo",
    pidgin: "Pidgin",
};
const LANGUAGE_ALIASES = {
    "1": "english",
    english: "english",
    en: "english",
    "2": "yoruba",
    yoruba: "yoruba",
    yo: "yoruba",
    "3": "hausa",
    hausa: "hausa",
    ha: "hausa",
    "4": "igbo",
    igbo: "igbo",
    ibo: "igbo",
    ig: "igbo",
    "5": "pidgin",
    pidgin: "pidgin",
    pid: "pidgin",
    pcm: "pidgin",
};
export async function handleOnboardingTurn(profile, message) {
    const text = getMessageText(message);
    const normalized = normalize(text);
    if (profile.onboardingStage === "NEW") {
        const language = parseLanguage(normalized);
        if (!language) {
            return {
                reply: languagePrompt(),
                profilePatch: { onboardingStage: "NEW", displayName: message.profileName },
            };
        }
        return {
            reply: askTrade(language),
            profilePatch: {
                displayName: message.profileName,
                language,
                onboardingStage: "ASKING_TRADE",
            },
        };
    }
    if (isGreeting(normalized)) {
        return {
            reply: languagePrompt(),
            profilePatch: { onboardingStage: "NEW" },
        };
    }
    if (profile.onboardingStage === "LANGUAGE_SELECTED") {
        return {
            reply: askTrade(profile.language),
            profilePatch: { onboardingStage: "ASKING_TRADE" },
        };
    }
    if (profile.onboardingStage === "ASKING_TRADE") {
        if (message.type === "audio" && !message.transcript) {
            return {
                reply: audioTranscriptMissingReply(profile.language),
                profilePatch: {},
            };
        }
        const understood = await understandUserProfileText(text);
        if (understood.isMeaningful && understood.profession) {
            return {
                reply: askLocation(understood.profession, understood.location, profile.language),
                profilePatch: {
                    trade: understood.profession,
                    location: understood.location,
                    intent: understood.intent,
                    wantsJobs: understood.wantsJobs,
                    wantsBusinessHelp: understood.wantsBusinessHelp,
                    onboardingStage: "ASKING_LOCATION",
                },
            };
        }
        return {
            reply: {
                text: understood.clarification ?? copy(profile.language).tradeRetry,
            },
            profilePatch: {},
        };
    }
    if (profile.onboardingStage === "ASKING_LOCATION") {
        const understood = await understandUserProfileText(text);
        const location = understood.location ?? (understood.isMeaningful ? text.trim() : undefined);
        if (!location) {
            return {
                reply: { text: copy(profile.language).locationRetry },
                profilePatch: {},
            };
        }
        return {
            reply: askGoal(profile.trade, location, profile.language),
            profilePatch: {
                location,
                wantsJobs: understood.wantsJobs,
                wantsBusinessHelp: understood.wantsBusinessHelp,
                onboardingStage: "ASKING_GOAL",
            },
        };
    }
    if (profile.onboardingStage === "ASKING_GOAL") {
        const goal = parseGoal(normalized);
        if (!goal) {
            return {
                reply: goalPrompt(profile.trade, profile.location, profile.language),
                profilePatch: {},
            };
        }
        const updatedProfile = { ...profile, ...goal, onboardingStage: "COMPLETE" };
        return {
            reply: completeReply(updatedProfile),
            profilePatch: {
                intent: goal.intent,
                wantsJobs: goal.wantsJobs,
                wantsBusinessHelp: goal.wantsBusinessHelp,
                onboardingStage: "COMPLETE",
            },
        };
    }
    return {
        reply: postOnboardingReply(profile, message),
        profilePatch: {},
    };
}
function getMessageText(message) {
    return message.transcript ?? message.text ?? message.buttonId ?? "";
}
function normalize(text) {
    return text.trim().toLowerCase().replace(/^\d+\.\s*/, "").replace(/[.?!]+$/g, "");
}
function parseLanguage(text) {
    return LANGUAGE_ALIASES[text];
}
function isGreeting(text) {
    return ["hi", "hii", "hello", "hey", "start", "menu", "good morning", "good afternoon", "good evening"].includes(text);
}
function languagePrompt() {
    return {
        text: "Hi, I am your WhatsApp marketplace assistant. I can help you set up your trader or job profile, then connect you to useful opportunities.\n\nChoose the language you want us to continue with. You can reply with a number:",
        buttons: [
            { id: "english", title: "English" },
            { id: "yoruba", title: "Yoruba" },
            { id: "hausa", title: "Hausa" },
            { id: "igbo", title: "Igbo" },
            { id: "pidgin", title: "Pidgin" },
        ],
    };
}
function askTrade(language = "english") {
    const selectedCopy = copy(language);
    return { text: selectedCopy.askTrade(LANGUAGES[language]) };
}
function askLocation(trade, guessedLocation, language = "english") {
    return { text: copy(language).askLocation(trade, guessedLocation) };
}
function askGoal(trade, location, language = "english") {
    return goalPrompt(trade, location, language);
}
function goalPrompt(trade, location, language = "english") {
    const summary = [trade, location].filter(Boolean).join(" in ");
    return {
        text: copy(language).goalPrompt(summary),
        buttons: [
            { id: "jobs", title: "Jobs" },
            { id: "grow_business", title: "Grow business" },
        ],
    };
}
function audioTranscriptMissingReply(language = "english") {
    return { text: copy(language).audioTranscriptMissing };
}
function parseGoal(text) {
    if (text === "1" || text.includes("job") || text === "jobs") {
        return { intent: "JOB_SEEKER", wantsJobs: true, wantsBusinessHelp: false };
    }
    if (text === "2" || text.includes("grow") || text.includes("business") || text.includes("market")) {
        return { intent: "BUSINESS_GROWTH", wantsJobs: false, wantsBusinessHelp: true };
    }
    return undefined;
}
function completeReply(profile) {
    return { text: copy(profile.language).complete(profile) };
}
function postOnboardingReply(profile, message) {
    const normalized = normalize(getMessageText(message));
    if (isGreeting(normalized) || normalized === "profile") {
        return { text: copy(profile.language).dashboard(profile) };
    }
    if (message.type === "image") {
        return { text: copy(profile.language).photoReceived(profile) };
    }
    if (normalized.includes("job") || normalized === "1") {
        return { text: copy(profile.language).jobs(profile) };
    }
    if (normalized.includes("grow") || normalized.includes("business") || normalized.includes("customer") || normalized === "2") {
        return { text: copy(profile.language).businessHelp(profile) };
    }
    return { text: copy(profile.language).dashboard(profile) };
}
function copy(language = "english") {
    if (language === "pidgin") {
        return {
            askTrade: (_languageName) => "Correct. We go continue for Pidgin.\n\nWetin you dey do? You fit type am for here.\n\nExample: I sell tomatoes in Mile 12",
            askLocation: (trade, guessedLocation) => `${guessedLocation ? `I hear say na ${guessedLocation}. ` : ""}Where you dey stay or where your business dey${trade ? ` for ${trade}` : ""}?`,
            goalPrompt: (summary) => `${summary ? `I don get am: ${summary}.\n\n` : ""}Wetin you want make I help you with?`,
            tradeRetry: "Tell me wetin you dey do. For now, type am here.\n\nExample: I am a tailor in Yaba",
            locationRetry: "I no understand the location. Abeg type where you dey stay or where your business dey.\n\nExample: I stay in Yaba",
            audioTranscriptMissing: "I received your voice note, but voice-to-text never connect yet. Abeg type wetin you talk for now.\n\nExample: I sell tomatoes in Mile 12",
            complete: (profile) => `Done. I don create your profile.\n\nName: ${profile.displayName ?? "Your WhatsApp name"}\nProfession: ${profile.trade ?? "Not set"}\nLocation: ${profile.location ?? "Not set"}\nGoal: ${profile.wantsJobs ? "Find jobs" : "Grow business"}\n\nNext: send photo of your goods/work, type "jobs", or type "business".`,
            dashboard: (profile) => `Welcome back${profile.displayName ? `, ${profile.displayName}` : ""}.\n\nProfession: ${profile.trade ?? "Not set"}\nLocation: ${profile.location ?? "Not set"}\n\nSend photo of your goods/work, type "jobs", or type "business".`,
            photoReceived: (profile) => `I don receive the photo. I go attach am to your ${profile.trade ?? "business"} profile. You fit send another photo, type "jobs", or type "business".`,
            jobs: (profile) => `Jobs noted. I go use your profile: ${profile.trade ?? "profession"} for ${profile.location ?? "your area"} to match opportunities. Send your skill, price/rate, or any certificate if you get.`,
            businessHelp: (profile) => `Business help noted. For ${profile.trade ?? "your business"} in ${profile.location ?? "your area"}, send photo of what you sell/work you do, your price range, and the kind customer you want.`,
        };
    }
    if (language === "yoruba") {
        return localizedCopy({
            askTrade: "O dara. A maa tesiwaju ni Yoruba.\n\nIse wo ni o n se? Ko si ibi yii.\n\nApeere: I am a tailor in Yaba",
            askLocation: (trade, guessedLocation) => `${guessedLocation ? `Mo gbo pe o wa ni ${guessedLocation}. ` : ""}Nibo ni o ngbe tabi nibo ni ise re wa${trade ? ` fun ${trade}` : ""}?`,
            goalPrompt: (summary) => `${summary ? `Mo ti gba eleyi: ${summary}.\n\n` : ""}Se o fe ise, tabi o fe dagba business re?`,
            retry: "So fun mi iru ise ti o n se.\n\nApeere: I am a tailor in Yaba",
            audio: "Mo ri voice note re, sugbon voice-to-text ko tii pari. Jowo ko ohun ti o so.\n\nApeere: I am a tailor in Yaba",
            done: "O ti pari. Mo ti da profile re sile.",
            dashboard: "Kaabo pada.",
        });
    }
    if (language === "hausa") {
        return localizedCopy({
            askTrade: "Madalla. Za mu ci gaba da Hausa.\n\nWane aiki kake yi? Rubuta a nan.\n\nMisali: I am a mechanic in Kano",
            askLocation: (trade, guessedLocation) => `${guessedLocation ? `Na ji kana ${guessedLocation}. ` : ""}Ina kake zama ko ina kasuwancinka yake${trade ? ` na ${trade}` : ""}?`,
            goalPrompt: (summary) => `${summary ? `Na samu: ${summary}.\n\n` : ""}Kana son aiki ne, ko kana son bunkasa kasuwanci?`,
            retry: "Fada min aikin da kake yi.\n\nMisali: I am a mechanic in Kano",
            audio: "Na karbi voice note dinka, amma voice-to-text bai gama haduwa ba. Don Allah ka rubuta abin da ka fada.\n\nMisali: I am a mechanic in Kano",
            done: "An gama. Na kirkiri profile dinka.",
            dashboard: "Barka da dawowa.",
        });
    }
    if (language === "igbo") {
        return localizedCopy({
            askTrade: "O di mma. Anyi ga-aga n'ihu na Igbo.\n\nKedu oru i na-aru? Dee ya ebe a.\n\nIhe atu: I am a hairdresser in Onitsha",
            askLocation: (trade, guessedLocation) => `${guessedLocation ? `Anuru m na i no na ${guessedLocation}. ` : ""}Ebee ka i bi ma obu ebee ka business gi di${trade ? ` maka ${trade}` : ""}?`,
            goalPrompt: (summary) => `${summary ? `Enwetara m ya: ${summary}.\n\n` : ""}I choro jobs, ka i choro ime ka business gi too?`,
            retry: "Gwa m oru i na-aru.\n\nIhe atu: I am a hairdresser in Onitsha",
            audio: "Anatara m voice note gi, mana voice-to-text ejikọtabeghị. Biko dee ihe ikwuru.\n\nIhe atu: I am a hairdresser in Onitsha",
            done: "Emechala. Emeputala m profile gi.",
            dashboard: "Nnoo ozo.",
        });
    }
    const languageNote = language === "english"
        ? "Great. We will continue in English."
        : `Great. I have saved ${LANGUAGES[language]}. Full ${LANGUAGES[language]} replies are coming soon, so I will continue in simple English for now.`;
    return {
        askTrade: (_languageName) => `${languageNote}\n\nWhat do you do? You can type it here.\n\nExample: I sell tomatoes in Mile 12`,
        askLocation: (trade, guessedLocation) => `${guessedLocation ? `I heard ${guessedLocation}. ` : ""}Where do you stay or where is your business located${trade ? ` for ${trade}` : ""}?`,
        goalPrompt: (summary) => `${summary ? `I got: ${summary}.\n\n` : ""}Do you want jobs or do you want to grow your business?`,
        tradeRetry: "Tell me what you do. For now, type it here.\n\nExample: I am a tailor in Yaba",
        locationRetry: "I did not understand the location. Please type where you stay or where your business is located.\n\nExample: I stay in Yaba",
        audioTranscriptMissing: "I received your voice note, but voice-to-text is not connected yet. Please type what you said for now.\n\nExample: I sell tomatoes in Mile 12",
        complete: (profile) => `Done. I created your profile.\n\nName: ${profile.displayName ?? "Your WhatsApp name"}\nProfession: ${profile.trade ?? "Not set"}\nLocation: ${profile.location ?? "Not set"}\nGoal: ${profile.wantsJobs ? "Find jobs" : "Grow business"}\n\nNext: send photos of your goods/work, type "jobs", or type "business".`,
        dashboard: (profile) => `Welcome back${profile.displayName ? `, ${profile.displayName}` : ""}.\n\nProfession: ${profile.trade ?? "Not set"}\nLocation: ${profile.location ?? "Not set"}\n\nSend photos of your goods/work, type "jobs", or type "business".`,
        photoReceived: (profile) => `Photo received. I will attach it to your ${profile.trade ?? "business"} profile. You can send another photo, type "jobs", or type "business".`,
        jobs: (profile) => `Jobs noted. I will use your profile: ${profile.trade ?? "profession"} in ${profile.location ?? "your area"} to match opportunities. Send your skill details, expected pay, or certificate if you have one.`,
        businessHelp: (profile) => `Business help noted. For ${profile.trade ?? "your business"} in ${profile.location ?? "your area"}, send photos, your price range, and the kind of customers you want.`,
    };
}
function localizedCopy(config) {
    return {
        askTrade: () => config.askTrade,
        askLocation: config.askLocation,
        goalPrompt: config.goalPrompt,
        tradeRetry: config.retry,
        locationRetry: "Please type your location clearly. Example: I stay in Yaba",
        audioTranscriptMissing: config.audio,
        complete: (profile) => `${config.done}\n\nName: ${profile.displayName ?? "Your WhatsApp name"}\nProfession: ${profile.trade ?? "Not set"}\nLocation: ${profile.location ?? "Not set"}\nGoal: ${profile.wantsJobs ? "Jobs" : "Grow business"}\n\nNext: send photo, type "jobs", or type "business".`,
        dashboard: (profile) => `${config.dashboard}\n\nProfession: ${profile.trade ?? "Not set"}\nLocation: ${profile.location ?? "Not set"}\n\nSend photo, type "jobs", or type "business".`,
        photoReceived: (profile) => `Photo received for ${profile.trade ?? "your profile"}. Send another photo, type "jobs", or type "business".`,
        jobs: (profile) => `Jobs noted for ${profile.trade ?? "your profession"} in ${profile.location ?? "your area"}. Send skill details, expected pay, or certificate if available.`,
        businessHelp: (profile) => `Business help noted for ${profile.trade ?? "your business"} in ${profile.location ?? "your area"}. Send photos, price range, and target customers.`,
    };
}
//# sourceMappingURL=onboarding.js.map