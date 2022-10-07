import IpcEvents from "../src/utils/IpcEvents";

// Discord deletes this so need to store in variable
var localStorage = window.localStorage;

const handlers = {
    [IpcEvents.GET_REPO]: () => "", // TODO
    [IpcEvents.GET_SETTINGS_DIR]: () => "LocalStorage",

    [IpcEvents.GET_QUICK_CSS]: () => localStorage.getItem("VencordQuickCss"),
    [IpcEvents.GET_SETTINGS]: () => localStorage.getItem("VencordSettings") || "{}",
    [IpcEvents.SET_SETTINGS]: (s: string) => localStorage.setItem("VencordSettings", s),

    [IpcEvents.GET_UPDATES]: () => ({ ok: true, value: [] }),

    [IpcEvents.OPEN_EXTERNAL]: (url: string) => open(url, "_blank"),
    [IpcEvents.OPEN_QUICKCSS]: () => { } // TODO
};

function onEvent(event: string, ...args: any[]) {
    const handler = handlers[event];
    if (!handler) throw new Error(`Event ${event} not implemented.`);
    return handler(...args);
}

window.VencordNative = {
    getVersions: () => ({}),
    ipc: {
        send: (event: string, ...args: any[]) => void onEvent(event, ...args),
        sendSync: onEvent,
        on(event: string, listener: () => {}) {
            // TODO quickCss
        },
        off(event: string, listener: () => {}) {
            // not used for now
        },
        invoke: (event: string, ...args: any[]) => Promise.resolve(onEvent(event, ...args))
    },
};
