import definePlugin from "../utils/types";

export default definePlugin({
    name: "STFU",
    description: "Disables the 'HOLD UP' banner in the console",
    author: "Vendicated",
    patches: [{
        find: "setDevtoolsCallbacks",
        replacement: {
            match: /\.setDevtoolsCallbacks\(.+?else/,
            replace: ".setDevtoolsCallbacks(null,null);else"
        }
    }]
});
