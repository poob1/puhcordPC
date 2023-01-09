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

import "./styles.css";

import * as DataStore from "@api/DataStore";
import { showNotice } from "@api/Notices";
import { useSettings } from "@api/settings";
import { classNameFactory } from "@api/Styles";
import ErrorBoundary from "@components/ErrorBoundary";
import { ErrorCard } from "@components/ErrorCard";
import { Flex } from "@components/Flex";
import { handleComponentFailed } from "@components/handleComponentFailed";
import { Badge } from "@components/PluginSettings/components";
import PluginModal from "@components/PluginSettings/PluginModal";
import { ChangeList } from "@utils/ChangeList";
import Logger from "@utils/Logger";
import { classes, LazyComponent, useAwaiter } from "@utils/misc";
import { openModalLazy } from "@utils/modal";
import { Plugin } from "@utils/types";
import { findByCode, findByPropsLazy } from "@webpack";
import { Alerts, Button, Forms, Margins, Parser, React, Select, Switch, Text, TextInput, Toasts, Tooltip } from "@webpack/common";

import Plugins from "~plugins";

const cl = classNameFactory("vc-plugins-");

import { startDependenciesRecursive, startPlugin, stopPlugin } from "../../plugins";

const logger = new Logger("PluginSettings", "#a6d189");

const InputStyles = findByPropsLazy("inputDefault", "inputWrapper");

const CogWheel = LazyComponent(() => findByCode("18.564C15.797 19.099 14.932 19.498 14 19.738V22H10V19.738C9.069"));
const InfoIcon = LazyComponent(() => findByCode("4.4408921e-16 C4.4771525,-1.77635684e-15 4.4408921e-16"));

function showErrorToast(message: string) {
    Toasts.show({
        message,
        type: Toasts.Type.FAILURE,
        id: Toasts.genId(),
        options: {
            position: Toasts.Position.BOTTOM
        }
    });
}

interface ReloadRequiredCardProps extends React.HTMLProps<HTMLDivElement> {
    plugins: string[];
}

function ReloadRequiredCard({ plugins, ...props }: ReloadRequiredCardProps) {
    if (plugins.length === 0) return null;

    const pluginPrefix = plugins.length === 1 ? "The plugin" : "The following plugins require a reload to apply changes:";
    const pluginSuffix = plugins.length === 1 ? " requires a reload to apply changes." : ".";

    return (
        <ErrorCard {...props} className={cl("reload-card")}>
            <span className={cl("dep-text")}>
                {pluginPrefix} <code>{plugins.join(", ")}</code>{pluginSuffix}
            </span>
            <Button look={Button.Looks.INVERTED} onClick={() => location.reload()}>Reload</Button>
        </ErrorCard>
    );
}

interface PluginCardProps extends React.HTMLProps<HTMLDivElement> {
    plugin: Plugin;
    disabled: boolean;
    onRestartNeeded(name: string): void;
    isNew?: boolean;
}

function PluginCard({ plugin, disabled, onRestartNeeded, onMouseEnter, onMouseLeave, isNew }: PluginCardProps) {
    const settings = useSettings();
    const pluginSettings = settings.plugins[plugin.name];

    function isEnabled() {
        return pluginSettings?.enabled || plugin.started;
    }

    function openModal() {
        openModalLazy(async () => {
            return modalProps => {
                return <PluginModal {...modalProps} plugin={plugin} onRestartNeeded={() => onRestartNeeded(plugin.name)} />;
            };
        });
    }

    function toggleEnabled() {
        const wasEnabled = isEnabled();

        // If we're enabling a plugin, make sure all deps are enabled recursively.
        if (!wasEnabled) {
            const { restartNeeded, failures } = startDependenciesRecursive(plugin);
            if (failures.length) {
                logger.error(`Failed to start dependencies for ${plugin.name}: ${failures.join(", ")}`);
                showNotice("Failed to start dependencies: " + failures.join(", "), "Close", () => null);
                return;
            } else if (restartNeeded) {
                // If any dependencies have patches, don't start the plugin yet.
                pluginSettings.enabled = true;
                onRestartNeeded(plugin.name);
                return;
            }
        }

        // if the plugin has patches, dont use stopPlugin/startPlugin. Wait for restart to apply changes.
        if (plugin.patches) {
            pluginSettings.enabled = !wasEnabled;
            onRestartNeeded(plugin.name);
            return;
        }

        // If the plugin is enabled, but hasn't been started, then we can just toggle it off.
        if (wasEnabled && !plugin.started) {
            pluginSettings.enabled = !wasEnabled;
            return;
        }

        const result = wasEnabled ? stopPlugin(plugin) : startPlugin(plugin);
        const action = wasEnabled ? "stop" : "start";

        if (!result) {
            logger.error(`Failed to ${action} plugin ${plugin.name}`);
            showErrorToast(`Failed to ${action} plugin: ${plugin.name}`);
            return;
        }

        pluginSettings.enabled = !wasEnabled;
    }

    return (
        <Flex className={cl("card")} flexDirection="column" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <Switch
                onChange={toggleEnabled}
                disabled={disabled}
                value={isEnabled()}
                note={<Text className={cl("note")} variant="text-md/normal">{plugin.description}</Text>}
                hideBorder={true}
            >
                <Flex className={cl("flex")}>
                    <Text
                        variant="text-md/bold"
                        className={cl("name")}
                    >
                        {plugin.name}{isNew && <Badge text="NEW" color="#ED4245" />}
                    </Text>
                    <button role="switch" onClick={() => openModal()} className={classes("button-12Fmur", cl("info-button"))}>
                        {plugin.options
                            ? <CogWheel />
                            : <InfoIcon width="24" height="24" />}
                    </button>
                </Flex>
            </Switch>
        </Flex>
    );
}

enum SearchStatus {
    ALL,
    ENABLED,
    DISABLED
}

export default ErrorBoundary.wrap(function PluginSettings() {
    const settings = useSettings();
    const changes = React.useMemo(() => new ChangeList<string>(), []);

    React.useEffect(() => {
        return () => void (changes.hasChanges && Alerts.show({
            title: "Restart required",
            body: (
                <>
                    <p>The following plugins require a restart:</p>
                    <div>{changes.map((s, i) => (
                        <>
                            {i > 0 && ", "}
                            {Parser.parse("`" + s + "`")}
                        </>
                    ))}</div>
                </>
            ),
            confirmText: "Restart now",
            cancelText: "Later!",
            onConfirm: () => location.reload()
        }));
    }, []);

    const depMap = React.useMemo(() => {
        const o = {} as Record<string, string[]>;
        for (const plugin in Plugins) {
            const deps = Plugins[plugin].dependencies;
            if (deps) {
                for (const dep of deps) {
                    o[dep] ??= [];
                    o[dep].push(plugin);
                }
            }
        }
        return o;
    }, []);

    const sortedPlugins = React.useMemo(() => Object.values(Plugins)
        .sort((a, b) => a.name.localeCompare(b.name)), []);

    const [searchValue, setSearchValue] = React.useState({ value: "", status: SearchStatus.ALL });

    const onSearch = (query: string) => setSearchValue(prev => ({ ...prev, value: query }));
    const onStatusChange = (status: SearchStatus) => setSearchValue(prev => ({ ...prev, status }));

    const pluginFilter = (plugin: typeof Plugins[keyof typeof Plugins]) => {
        const enabled = settings.plugins[plugin.name]?.enabled || plugin.started;
        if (enabled && searchValue.status === SearchStatus.DISABLED) return false;
        if (!enabled && searchValue.status === SearchStatus.ENABLED) return false;
        if (!searchValue.value.length) return true;
        return (
            plugin.name.toLowerCase().includes(searchValue.value.toLowerCase()) ||
            plugin.description.toLowerCase().includes(searchValue.value.toLowerCase())
        );
    };

    const [newPlugins] = useAwaiter(() => DataStore.get("Vencord_existingPlugins").then((cachedPlugins: Record<string, number> | undefined) => {
        const now = Date.now() / 1000;
        const existingTimestamps: Record<string, number> = {};
        const sortedPluginNames = Object.values(sortedPlugins).map(plugin => plugin.name);

        const newPlugins: string[] = [];
        for (const { name: p } of sortedPlugins) {
            const time = existingTimestamps[p] = cachedPlugins?.[p] ?? now;
            if ((time + 60 * 60 * 24 * 2) > now) {
                newPlugins.push(p);
            }
        }
        DataStore.set("Vencord_existingPlugins", existingTimestamps);

        return window._.isEqual(newPlugins, sortedPluginNames) ? [] : newPlugins;
    }));

    type P = JSX.Element | JSX.Element[];
    let plugins: P, requiredPlugins: P;
    if (sortedPlugins?.length) {
        plugins = [];
        requiredPlugins = [];

        for (const p of sortedPlugins) {
            if (!pluginFilter(p)) continue;

            const isRequired = p.required || depMap[p.name]?.some(d => settings.plugins[d].enabled);

            if (isRequired) {
                const tooltipText = p.required
                    ? "This plugin is required for Vencord to function."
                    : makeDependencyList(depMap[p.name]?.filter(d => settings.plugins[d].enabled));

                requiredPlugins.push(
                    <Tooltip text={tooltipText} key={p.name}>
                        {({ onMouseLeave, onMouseEnter }) => (
                            <PluginCard
                                onMouseLeave={onMouseLeave}
                                onMouseEnter={onMouseEnter}
                                onRestartNeeded={name => changes.handleChange(name)}
                                disabled={true}
                                plugin={p}
                            />
                        )}
                    </Tooltip>
                );
            } else {
                plugins.push(
                    <PluginCard
                        onRestartNeeded={name => changes.handleChange(name)}
                        disabled={false}
                        plugin={p}
                        isNew={newPlugins?.includes(p.name)}
                        key={p.name}
                    />
                );
            }

        }
    } else {
        plugins = requiredPlugins = <Text variant="text-md/normal">No plugins meet search criteria.</Text>;
    }

    return (
        <Forms.FormSection>
            <Forms.FormTitle tag="h5" className={classes(Margins.marginTop20, Margins.marginBottom8)}>
                Filters
            </Forms.FormTitle>

            <ReloadRequiredCard plugins={[...changes.getChanges()]} className={Margins.marginBottom20} />

            <div className={cl("filter-controls")}>
                <TextInput autoFocus value={searchValue.value} placeholder="Search for a plugin..." onChange={onSearch} className={Margins.marginBottom20} />
                <div className={InputStyles.inputWrapper}>
                    <Select
                        className={InputStyles.inputDefault}
                        options={[
                            { label: "Show All", value: SearchStatus.ALL, default: true },
                            { label: "Show Enabled", value: SearchStatus.ENABLED },
                            { label: "Show Disabled", value: SearchStatus.DISABLED }
                        ]}
                        serialize={String}
                        select={onStatusChange}
                        isSelected={v => v === searchValue.status}
                        closeOnSelect={true}
                    />
                </div>
            </div>

            <Forms.FormTitle className={Margins.marginTop20}>Plugins</Forms.FormTitle>

            <div className={cl("grid")}>
                {plugins}
            </div>
            <Forms.FormDivider />
            <Forms.FormTitle tag="h5" className={classes(Margins.marginTop20, Margins.marginBottom8)}>
                Required Plugins
            </Forms.FormTitle>
            <div className={cl("grid")}>
                {requiredPlugins}
            </div>
        </Forms.FormSection >
    );
}, {
    message: "Failed to render the Plugin Settings. If this persists, try using the installer to reinstall!",
    onError: handleComponentFailed,
});

function makeDependencyList(deps: string[]) {
    return (
        <React.Fragment>
            <Forms.FormText>This plugin is required by:</Forms.FormText>
            {deps.map((dep: string) => <Forms.FormText className={cl("dep-text")}>{dep}</Forms.FormText>)}
        </React.Fragment>
    );
}
