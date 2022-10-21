import { Message } from "discord-types/general";
import { fetchPronouns, formatPronouns } from "../utils";
import { classes, lazyWebpack, useAwaiter } from "../../../utils/misc";
import { PronounMapping } from "../types";
import { filters } from "../../../webpack";
import { UserStore } from "../../../webpack/common";
import { Settings } from "../../../Vencord";

const styles: Record<string, string> = lazyWebpack(filters.byProps(["timestampInline"]));

export default function PronounsChatComponent({ message }: { message: Message; }) {
    // Don't bother fetching bot or system users
    if (message.author.bot || message.author.system) return null;
    // Respect showSelf options
    if (!Settings.plugins.PronounDB.showSelf && message.author.id === UserStore.getCurrentUser().id) return null;

    const [result, , isPending] = useAwaiter(
        () => fetchPronouns(message.author.id),
        null,
        e => console.error("Fetching pronouns failed: ", e)
    );

    // If the promise completed, the result was not "unspecified", and there is a mapping for the code, then return a span with the pronouns
    if (!isPending && result && result !== "unspecified" && PronounMapping[result]) {
        return (
            <span
                className={classes(styles.timestampInline, styles.timestamp)}
            >• {formatPronouns(result)}</span>
        );
    }
    // Otherwise, return null so nothing else is rendered
    else return null;
}
