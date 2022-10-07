import { Devs } from "../utils/constants";
import definePlugin from "../utils/types";

export default definePlugin({
    name: "iLoveSpam",
    description: "Do not hide messages from 'likely spammers'",
    authors: [
        Devs.botato,
        {
            name: "Iryis",
            id: 118437263754395652n,
        },
    ],
    patches: [
        {
            find: "),{hasFlag:",
            replacement: {
                match: /(if\((.{1,2})<=1<<30\)return)/,
                replace: "if($2===(1<<20)){return false};$1",
            },
        },
    ],
});
