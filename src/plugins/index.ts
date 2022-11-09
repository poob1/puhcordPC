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

import { registerCommand, unregisterCommand } from "../api/Commands";
import { Settings } from "../api/settings";
import { traceFunction } from "../debug/Tracer";
import Logger from "../utils/logger";
import { Patch, Plugin } from "../utils/types";

const logger = new Logger("PluginManager", "#a6d189");

export const PMLogger = logger;
export const plugins = Plugins;
export const patches = [] as Patch[];

export function isPluginEnabled(p: string) {
    return (Settings.plugins[p]?.enabled || Plugins[p]?.required) ?? false;
}

for (const p of Object.values(Plugins))
    if (p.patches && isPluginEnabled(p.name)) {
        for (const patch of p.patches) {
            patch.plugin = p.name;
            if (!Array.isArray(patch.replacement))
                patch.replacement = [patch.replacement];
            patches.push(patch);
        }
    }

export const startAllPlugins = traceFunction("startAllPlugins", function startAllPlugins() {
    for (const name in Plugins)
        if (isPluginEnabled(name)) {
            startPlugin(Plugins[name]);
        }
});

export function startDependenciesRecursive(p: Plugin) {
    let restartNeeded = false;
    const failures: string[] = [];
    p.dependencies?.forEach(dep => {
        if (!Settings.plugins[dep].enabled) {
            startDependenciesRecursive(Plugins[dep]);
            // If the plugin has patches, don't start the plugin, just enable it.
            if (Plugins[dep].patches) {
                logger.warn(`Enabling dependency ${dep} requires restart.`);
                Settings.plugins[dep].enabled = true;
                restartNeeded = true;
                return;
            }
            const result = startPlugin(Plugins[dep]);
            if (!result) failures.push(dep);
        }
    });
    return { restartNeeded, failures };
}

export const startPlugin = traceFunction("startPlugin", function startPlugin(p: Plugin) {
    if (p.start) {
        logger.info("Starting plugin", p.name);
        if (p.started) {
            logger.warn(`${p.name} already started`);
            return false;
        }
        try {
            p.start();
            p.started = true;
        } catch (e) {
            logger.error(`Failed to start ${p.name}\n`, e);
            return false;
        }
    }

    if (p.commands?.length) {
        logger.info("Registering commands of plugin", p.name);
        for (const cmd of p.commands) {
            try {
                registerCommand(cmd, p.name);
            } catch (e) {
                logger.error(`Failed to register command ${cmd.name}\n`, e);
                return false;
            }
        }

    }

    return true;
}, p => `startPlugin ${p.name}`);

export const stopPlugin = traceFunction("stopPlugin", function stopPlugin(p: Plugin) {
    if (p.stop) {
        logger.info("Stopping plugin", p.name);
        if (!p.started) {
            logger.warn(`${p.name} already stopped`);
            return false;
        }
        try {
            p.stop();
            p.started = false;
        } catch (e) {
            logger.error(`Failed to stop ${p.name}\n`, e);
            return false;
        }
    }

    if (p.commands?.length) {
        logger.info("Unregistering commands of plugin", p.name);
        for (const cmd of p.commands) {
            try {
                unregisterCommand(cmd.name);
            } catch (e) {
                logger.error(`Failed to unregister command ${cmd.name}\n`, e);
                return false;
            }
        }
    }

    return true;
}, p => `stopPlugin ${p.name}`);
