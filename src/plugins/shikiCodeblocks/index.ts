/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Devs } from "@utils/constants";
import { parseUrl } from "@utils/misc";
import { wordsFromPascal, wordsToTitle } from "@utils/text";
import definePlugin, { OptionType } from "@utils/types";

import cssText from "~fileContent/style.css";

import { Settings } from "../../Vencord";
import { shiki } from "./api/shiki";
import { themes } from "./api/themes";
import { createHighlighter } from "./components/Highlighter";
import { DeviconSetting, HljsSetting, ShikiSettings, StyleSheets } from "./types";
import { clearStyles, removeStyle, setStyle } from "./utils/createStyle";

const themeNames = Object.keys(themes);
const devIconCss = "@import url('https://cdn.jsdelivr.net/gh/devicons/devicon@v2.10.1/devicon.min.css');";

const getSettings = () => Settings.plugins.ShikiCodeblocks as ShikiSettings;

export default definePlugin({
    name: "ShikiCodeblocks",
    description: "Brings vscode-style codeblocks into Discord, powered by Shiki",
    authors: [Devs.Vap],
    patches: [
        {
            find: "codeBlock:{react:function",
            replacement: {
                match: /codeBlock:\{react:function\((.),(.),(.)\)\{/,
                replace: "$&return Vencord.Plugins.plugins.ShikiCodeblocks.renderHighlighter($1,$2,$3);",
            },
        },
    ],
    start: async () => {
        setStyle(cssText, StyleSheets.Main);
        if (getSettings().useDevIcon !== DeviconSetting.Disabled)
            setStyle(devIconCss, StyleSheets.DevIcons);

        await shiki.init(getSettings().customTheme || getSettings().theme);
    },
    stop: () => {
        shiki.destroy();
        clearStyles();
    },
    options: {
        theme: {
            type: OptionType.SELECT,
            description: "Default themes",
            options: themeNames.map(themeName => ({
                label: wordsToTitle(wordsFromPascal(themeName)),
                value: themes[themeName],
                default: themes[themeName] === themes.DarkPlus,
            })),
            disabled: () => !!getSettings().customTheme,
            onChange: shiki.setTheme,
        },
        customTheme: {
            type: OptionType.STRING,
            description: "A link to a custom vscode theme",
            placeholder: themes.MaterialCandy,
            isValid: value => {
                if (!value) return true;
                const url = parseUrl(value);
                if (!url) return "Must be a valid URL";

                if (!url.pathname.endsWith(".json")) return "Must be a json file";

                return true;
            },
            onChange: value => shiki.setTheme(value || getSettings().theme),
        },
        tryHljs: {
            type: OptionType.SELECT,
            description: "Use the more lightweight default Discord highlighter and theme.",
            options: [
                {
                    label: "Never",
                    value: HljsSetting.Never,
                },
                {
                    label: "Prefer Shiki instead of Highlight.js",
                    value: HljsSetting.Secondary,
                    default: true,
                },
                {
                    label: "Prefer Highlight.js instead of Shiki",
                    value: HljsSetting.Primary,
                },
                {
                    label: "Always",
                    value: HljsSetting.Always,
                },
            ],
        },
        useDevIcon: {
            type: OptionType.SELECT,
            description: "How to show language icons on codeblocks",
            options: [
                {
                    label: "Disabled",
                    value: DeviconSetting.Disabled,
                },
                {
                    label: "Colorless",
                    value: DeviconSetting.Greyscale,
                    default: true,
                },
                {
                    label: "Colored",
                    value: DeviconSetting.Color,
                },
            ],
            onChange: (newValue: DeviconSetting) => {
                if (newValue === DeviconSetting.Disabled) removeStyle(StyleSheets.DevIcons);
                else setStyle(devIconCss, StyleSheets.DevIcons);
            },
        },
        bgOpacity: {
            type: OptionType.SLIDER,
            description: "Background opacity",
            markers: [0, 20, 40, 60, 80, 100],
            default: 100,
            stickToMarkers: false,
        },
    },

    // exports
    shiki,
    createHighlighter,
    renderHighlighter: ({ lang, content }: { lang: string; content: string; }) => {
        return createHighlighter({
            lang,
            content,
            isPreview: false,
        });
    },
});
