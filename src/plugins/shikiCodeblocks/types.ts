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

import type {
    ILanguageRegistration,
    IShikiTheme,
    IThemedToken,
    IThemeRegistration,
} from "@vap/shiki";

import type { Settings } from "../../Vencord";

/** This must be atleast a subset of the `@vap/shiki-worker` spec */
export type ShikiSpec = {
    setOnigasm: ({ wasm }: { wasm: string; }) => Promise<void>;
    setHighlighter: ({ theme, langs }: {
        theme: IThemeRegistration | void;
        langs: ILanguageRegistration[];
    }) => Promise<void>;
    loadTheme: ({ theme }: {
        theme: string | IShikiTheme;
    }) => Promise<void>;
    getTheme: ({ theme }: { theme: string; }) => Promise<{ themeData: string; }>;
    loadLanguage: ({ lang }: { lang: ILanguageRegistration; }) => Promise<void>;
    codeToThemedTokens: ({
        code,
        lang,
        theme,
    }: {
        code: string;
        lang?: string;
        theme?: string;
    }) => Promise<IThemedToken[][]>;
};

export enum StyleSheets {
    Main = "MAIN",
    DevIcons = "DEVICONS",
}

export enum HljsSetting {
    Never = "NEVER",
    Secondary = "SECONDARY",
    Primary = "PRIMARY",
    Always = "ALWAYS",
}
export enum DeviconSetting {
    Disabled = "DISABLED",
    Greyscale = "GREYSCALE",
    Color = "COLOR"
}

type CommonSettings = {
    [K in keyof Settings["plugins"][string]as K extends `${infer V}` ? K : never]: Settings["plugins"][string][K];
};

export interface ShikiSettings extends CommonSettings {
    theme: string;
    customTheme: string;
    tryHljs: HljsSetting;
    useDevIcon: DeviconSetting;
    bgOpacity: number;
}
