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

import Plugins from "~plugins";

import { showNotice } from "../../api/Notices";
import { Settings, useSettings } from "../../api/settings";
import { startDependenciesRecursive, startPlugin, stopPlugin } from "../../plugins";
import { ChangeList } from "../../utils/ChangeList";
import Logger from "../../utils/logger";
import { classes, LazyComponent, lazyWebpack } from "../../utils/misc";
import { openModalLazy } from "../../utils/modal";
import { Plugin } from "../../utils/types";
import { filters, findByCode } from "../../webpack";
import { Alerts, Button, Forms, Margins, Parser, React, Select, Switch, Text, TextInput, Toasts, Tooltip } from "../../webpack/common";
import ErrorBoundary from "../ErrorBoundary";
import { ErrorCard } from "../ErrorCard";
import { Flex } from "../Flex";
import PluginModal from "./PluginModal";
import * as styles from "./styles";

const logger = new Logger("PluginSettings", "#a6d189");

const InputStyles = lazyWebpack(filters.byProps("inputDefault", "inputWrapper"));

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
        <ErrorCard {...props} style={{ padding: "1em", display: "grid", gridTemplateColumns: "1fr auto", gap: 8, ...props.style }}>
            <span style={{ margin: "auto 0" }}>
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
}

function PluginCard({ plugin, disabled, onRestartNeeded, onMouseEnter, onMouseLeave }: PluginCardProps) {
    const settings = useSettings();
    const pluginSettings = settings.plugins[plugin.name];

    const [iconHover, setIconHover] = React.useState(false);

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
        <Flex style={styles.PluginsGridItem} flexDirection="column" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <Switch
                onChange={toggleEnabled}
                disabled={disabled}
                value={isEnabled()}
                note={<Text variant="text-md/normal" style={{
                    height: 40,
                    overflow: "hidden",
                    // mfw css is so bad you need whatever this is to get multi line overflow ellipsis to work
                    textOverflow: "ellipsis",
                    display: "-webkit-box", // firefox users will cope (it doesn't support it)
                    WebkitLineClamp: 2,
                    lineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    boxOrient: "vertical"
                }}>
                    {plugin.description}
                </Text>}
                hideBorder={true}
            >
                <Flex style={{ marginTop: "auto", width: "100%", height: "100%", alignItems: "center" }}>
                    <Text variant="text-md/bold" style={{ flexGrow: "1" }}>{plugin.name}</Text>
                    <button role="switch" onClick={() => openModal()} style={styles.SettingsIcon} className="button-12Fmur">
                        {plugin.options
                            ? <CogWheel
                                style={{ color: iconHover ? "" : "var(--text-muted)" }}
                                onMouseEnter={() => setIconHover(true)}
                                onMouseLeave={() => setIconHover(false)}
                            />
                            : <InfoIcon
                                width="24" height="24"
                                style={{ color: iconHover ? "" : "var(--text-muted)" }}
                                onMouseEnter={() => setIconHover(true)}
                                onMouseLeave={() => setIconHover(false)}
                            />}
                    </button>
                </Flex>
            </Switch>
        </Flex>
    );
}

export default ErrorBoundary.wrap(function Settings() {
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

    const [searchValue, setSearchValue] = React.useState({ value: "", status: "all" });

    const onSearch = (query: string) => setSearchValue(prev => ({ ...prev, value: query }));
    const onStatusChange = (status: string) => setSearchValue(prev => ({ ...prev, status }));

    const pluginFilter = (plugin: typeof Plugins[keyof typeof Plugins]) => {
        const showEnabled = searchValue.status === "enabled" || searchValue.status === "all";
        const showDisabled = searchValue.status === "disabled" || searchValue.status === "all";
        const enabled = settings.plugins[plugin.name]?.enabled || plugin.started;
        return (
            ((showEnabled && enabled) || (showDisabled && !enabled)) &&
            (
                plugin.name.toLowerCase().includes(searchValue.value.toLowerCase()) ||
                plugin.description.toLowerCase().includes(searchValue.value.toLowerCase())
            )
        );
    };

    return (
        <Forms.FormSection tag="h1" title="Vencord">
            <Forms.FormTitle tag="h5" className={classes(Margins.marginTop20, Margins.marginBottom8)}>
                Plugins
            </Forms.FormTitle>

            <ReloadRequiredCard plugins={[...changes.getChanges()]} style={{ marginBottom: 16 }} />

            <div style={styles.FiltersBar}>
                <TextInput value={searchValue.value} placeholder={"Search for a plugin..."} onChange={onSearch} style={{ marginBottom: 24 }} />
                <div className={InputStyles.inputWrapper}>
                    <Select
                        className={InputStyles.inputDefault}
                        options={[
                            { label: "Show All", value: "all", default: true },
                            { label: "Show Enabled", value: "enabled" },
                            { label: "Show Disabled", value: "disabled" }
                        ]}
                        serialize={String}
                        select={onStatusChange}
                        isSelected={v => v === searchValue.status}
                        closeOnSelect={true}
                    />
                </div>
            </div>

            <div style={styles.PluginsGrid}>
                {sortedPlugins?.length ? sortedPlugins
                    .filter(a => !a.required && !dependencyCheck(a.name, depMap).length && pluginFilter(a))
                    .map(plugin => {
                        const enabledDependants = depMap[plugin.name]?.filter(d => settings.plugins[d].enabled);
                        const dependency = enabledDependants?.length;
                        return <PluginCard
                            onRestartNeeded={name => changes.add(name)}
                            disabled={plugin.required || !!dependency}
                            plugin={plugin}
                        />;
                    })
                    : <Text variant="text-md/normal">No plugins meet search criteria.</Text>
                }
            </div>
            <Forms.FormDivider />
            <Forms.FormTitle tag="h5" className={classes(Margins.marginTop20, Margins.marginBottom8)}>
                Required Plugins
            </Forms.FormTitle>
            <div style={styles.PluginsGrid}>
                {sortedPlugins?.length ? sortedPlugins
                    .filter(a => a.required || dependencyCheck(a.name, depMap).length && pluginFilter(a))
                    .map(plugin => {
                        const enabledDependants = depMap[plugin.name]?.filter(d => settings.plugins[d].enabled);
                        const dependency = enabledDependants?.length;
                        const tooltipText = plugin.required
                            ? "This plugin is required for Vencord to function."
                            : makeDependencyList(dependencyCheck(plugin.name, depMap));
                        return <Tooltip text={tooltipText}>
                            {({ onMouseLeave, onMouseEnter }) => (
                                <PluginCard
                                    onMouseLeave={onMouseLeave}
                                    onMouseEnter={onMouseEnter}
                                    onRestartNeeded={name => changes.add(name)}
                                    disabled={plugin.required || !!dependency}
                                    plugin={plugin}
                                />
                            )}
                        </Tooltip>;
                    })
                    : <Text variant="text-md/normal">No plugins meet search criteria.</Text>
                }
            </div>
        </Forms.FormSection >
    );
});

function makeDependencyList(deps: string[]) {
    return (
        <React.Fragment>
            <Forms.FormText>This plugin is required by:</Forms.FormText>
            {deps.map((dep: string) => <Forms.FormText style={{ margin: "0 auto" }}>{dep}</Forms.FormText>)}
        </React.Fragment>
    );
}

function dependencyCheck(pluginName: string, depMap: Record<string, string[]>): string[] {
    return depMap[pluginName]?.filter(d => Settings.plugins[d].enabled) || [];
}
