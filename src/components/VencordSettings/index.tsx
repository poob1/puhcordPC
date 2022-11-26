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

import cssText from "~fileContent/settingsStyles.css";

import { lazyWebpack } from "../../utils/misc";
import { filters } from "../../webpack";
import { Forms, React, Router, Text } from "../../webpack/common";
import ErrorBoundary from "../ErrorBoundary";
import BackupRestoreTab from "./BackupRestoreTab";
import PluginsTab from "./PluginsTab";
import Updater from "./Updater";
import VencordSettings from "./VencordTab";

const style = document.createElement("style");
style.textContent = cssText;
document.head.appendChild(style);

const st = (style: string) => `vcSettings${style}`;

const TabBar = lazyWebpack(filters.byCode('[role="tab"][aria-disabled="false"]'));

interface SettingsProps {
    tab: string;
}

const SettingsTabs = {
    VencordSettings: { name: "Vencord", component: () => <VencordSettings /> },
    VencordPlugins: { name: "Plugins", component: () => <PluginsTab /> },
    VencordThemes: { name: "Themes", component: () => <Text variant="text-md/medium">Coming soon to a Vencord near you!</Text> },
    VencordUpdater: { name: "Updater", component: () => Updater ? <Updater /> : null },
    VencordSettingsSync: { name: "Backup & Restore", component: () => <BackupRestoreTab /> },
};


function Settings(props: SettingsProps) {
    const { tab = "VencordSettings" } = props;

    const CurrentTab = SettingsTabs[tab]?.component ?? null;

    return <Forms.FormSection>
        <Text variant="heading-md/normal" tag="h2">Vencord Settings</Text>

        <TabBar
            type={TabBar.Types.TOP}
            look={TabBar.Looks.BRAND}
            className={st("TabBar")}
            selectedItem={tab}
            onItemSelect={Router.open}
        >
            {Object.entries(SettingsTabs).map(([key, { name }]) => {
                return <TabBar.Item
                    id={key}
                    className={st("TabBarItem")}
                    key={key}>
                    {name}
                </TabBar.Item>;
            })}
        </TabBar>
        <Forms.FormDivider />
        <CurrentTab />
    </Forms.FormSection >;
}

export default function (props: SettingsProps) {
    return <ErrorBoundary>
        <Settings tab={props.tab} />
    </ErrorBoundary>;
}
