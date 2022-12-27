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

import gitHash from "~git-hash";

import IpcEvents from "./IpcEvents";
import Logger from "./Logger";
import { IpcRes } from "./types";

export const UpdateLogger = new Logger("Updater", "white");
export let isOutdated = false;
export let isNewer = false;
export let updateError: any;
export let changes: Record<"hash" | "author" | "message", string>[];

async function Unwrap<T>(p: Promise<IpcRes<T>>) {
    const res = await p;

    if (res.ok) return res.value;

    updateError = res.error;
    throw res.error;
}

export async function checkForUpdates() {
    changes = await Unwrap(VencordNative.ipc.invoke<IpcRes<typeof changes>>(IpcEvents.GET_UPDATES));
    if (changes.some(c => c.hash === gitHash)) {
        isNewer = true;
        return (isOutdated = false);
    }
    return (isOutdated = changes.length > 0);
}

export async function update() {
    if (!isOutdated) return true;

    const res = await Unwrap(VencordNative.ipc.invoke<IpcRes<boolean>>(IpcEvents.UPDATE));

    if (res)
        isOutdated = false;

    return res;
}

export function getRepo() {
    return Unwrap(VencordNative.ipc.invoke<IpcRes<string>>(IpcEvents.GET_REPO));
}

type Hashes = Record<"patcher.js" | "preload.js" | "renderer.js" | "renderer.css", string>;

/**
 * @returns true if hard restart is required
 */
export async function rebuild() {
    const oldHashes = await Unwrap(VencordNative.ipc.invoke<IpcRes<Hashes>>(IpcEvents.GET_HASHES));

    if (!await Unwrap(VencordNative.ipc.invoke<IpcRes<boolean>>(IpcEvents.BUILD)))
        throw new Error("The Build failed. Please try manually building the new update");

    const newHashes = await Unwrap(VencordNative.ipc.invoke<IpcRes<Hashes>>(IpcEvents.GET_HASHES));

    return oldHashes["patcher.js"] !== newHashes["patcher.js"] ||
        oldHashes["preload.js"] !== newHashes["preload.js"];
}
