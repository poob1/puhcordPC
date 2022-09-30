import definePlugin from "../utils/types";
import gitHash from "git-hash";

export default definePlugin({
    name: "Settings",
    description: "Adds Settings UI and debug info",
    author: "Vendicated",
    required: true,
    patches: [{
        find: "().versionHash",
        replacement: [
            {
                match: /\w\.createElement\(.{1,2}.Fragment,.{0,30}\{[^}]+\},"Host ".+?\):null/,
                replace: m => {
                    const idx = m.indexOf("Host") - 1;
                    const template = m.slice(0, idx);
                    return `${m}, ${template}"puhcordPC ", "${gitHash}"), " "), ` +
                        `${template} "Electron ",VencordNative.getVersions().electron)," "), ` +
                        `${template} "Chrome ",VencordNative.getVersions().chrome)," ")`;
                }
            }
        ]
    }, {
        find: "Messages.ACTIVITY_SETTINGS",
        replacement: {
            match: /\{section:(.{1,2})\.ID\.HEADER,\s*label:(.{1,2})\..{1,2}\.Messages\.ACTIVITY_SETTINGS\}/,
            replace: (m, mod) =>
                `{section:${mod}.ID.HEADER,label:"puhcordPC"},` +
                `{section:"puhcordPC",label:"puhcordPC",element:Vencord.Components.Settings},` +
                `{section:${mod}.ID.DIVIDER},${m}`

        }
    }]
});
