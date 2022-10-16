import definePlugin from "../utils/types";
import { Devs } from "../utils/constants";
import { Message, ReactionEmoji } from "discord-types/general";
import { FluxDispatcher, SelectedChannelStore } from "../webpack/common";
import { sleep } from "../utils/misc";

interface IMessageCreate {
    type: "MESSAGE_CREATE";
    optimistic: boolean;
    isPushNotification: boolean;
    channelId: string;
    message: Message;
}

interface IReactionAdd {
    type: "MESSAGE_REACTION_ADD";
    optimistic: boolean;
    channelId: string;
    messageId: string;
    userId: "195136840355807232";
    emoji: ReactionEmoji;
}

const MOYAI = "🗿";
const MOYAI_URL =
    "https://raw.githubusercontent.com/MeguminSama/VencordPlugins/main/plugins/moyai/moyai.mp3";

// Implement once Settings are a thing
const ignoreBots = true;

export default definePlugin({
    name: "Moyai",
    authors: [Devs.Megu],
    description: "🗿🗿🗿🗿🗿🗿🗿🗿",

    async onMessage(e: IMessageCreate) {
        if (e.optimistic || e.type !== "MESSAGE_CREATE") return;
        if (e.message.state === "SENDING") return;
        if (ignoreBots && e.message.author?.bot) return;
        if (!e.message.content) return;
        if (e.channelId !== SelectedChannelStore.getChannelId()) return;

        const moyaiCount = getMoyaiCount(e.message.content);

        for (let i = 0; i < moyaiCount; i++) {
            boom();
            await sleep(300);
        }
    },

    onReaction(e: IReactionAdd) {
        if (e.optimistic || e.type !== "MESSAGE_REACTION_ADD") return;
        if (e.channelId !== SelectedChannelStore.getChannelId()) return;

        const name = e.emoji.name.toLowerCase();
        if (name !== MOYAI && !name.includes("moyai") && !name.includes("moai")) return;

        boom();
    },

    start() {
        FluxDispatcher.subscribe("MESSAGE_CREATE", this.onMessage);
        FluxDispatcher.subscribe("MESSAGE_REACTION_ADD", this.onReaction);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", this.onMessage);
        FluxDispatcher.unsubscribe("MESSAGE_REACTION_ADD", this.onReaction);
    },
});

function countOccurrences(sourceString: string, subString: string) {
    let i = 0;
    let lastIdx = 0;
    while ((lastIdx = sourceString.indexOf(subString, lastIdx) + 1) !== 0)
        i++;

    return i;
}

function countMatches(sourceString: string, pattern: RegExp) {
    if (!pattern.global)
        throw new Error("pattern must be global");

    let i = 0;
    while (pattern.test(sourceString))
        i++;

    return i;
}

const customMoyaiRe = /<a?:\w*moy?ai\w*:\d{17,20}>/gi;

function getMoyaiCount(message: string) {
    let count = countOccurrences(message, MOYAI)
        + countMatches(message, customMoyaiRe);

    return Math.min(count, 10);
}

function boom() {
    const audioElement = document.createElement("audio");
    audioElement.src = MOYAI_URL;
    audioElement.play();
}
