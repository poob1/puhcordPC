import IpcEvents from "../utils/IpcEvents";
import definePlugin from '../utils/types';

const OPEN_URL = "Vencord.Plugins.plugins.ViewIcons.openImage(";
export default definePlugin({
    name: "ViewIcons",
    author: "Vendicated",
    description: "Makes Avatars/Banners in user profiles clickable, and adds Guild Context Menu Entries to View Banner/Icon.",

    openImage(url: string) {
        VencordNative.ipc.invoke(IpcEvents.OPEN_EXTERNAL, url);
        // husk
        /* openModal(() => (
            <ImageModal
                shouldAnimate={true}
                original={url}
                src={url}
                renderLinkComponent={renderMaskedLink}
            />
        ), { size: Modal.ModalSize.DYNAMIC }); */
    },

    patches: [
        {
            find: "onAddFriend:",
            replacement: {
                match: /\{src:(.{1,2}),avatarDecoration/,
                replace: (_, src) => `{src:${src},onClick:()=>${OPEN_URL}${src}.replace(/\\?.+$/, "")+"?size=2048"),avatarDecoration`
            }
        }, {
            find: "().popoutNoBannerPremium",
            replacement: {
                match: /style:.{0,10}\{\},(.{1,2})\)/,
                replace: (m, bannerObj) => `onClick:${bannerObj}.backgroundImage&&(()=>${OPEN_URL}${bannerObj}.backgroundImage.replace("url(", "").replace(/(\\?size=.+)?\\)/, "?size=2048"))),${m}`
            }
        }, {
            find: '"GuildContextMenu:',
            replacement: [
                {
                    match: /\w=(\w)\.id/,
                    replace: (m, guild) => `_guild=${guild},${m}`
                },
                {
                    match: /(?<=createElement\((.{1,5}),\{id:"leave-guild".{0,100}\,)(.{1,2}\.createElement)\((.{1,5}),null,(.{1,2})\)(?=\)\}function)/,
                    replace: (_, menu, createElement, menuGroup, copyIdElement) =>
                        `${createElement}(${menuGroup},null,[` +
                        `_guild.icon&&${createElement}(${menu},` +
                        `{id:"viewicons-copy-icon",label:"View Icon",action:()=>${OPEN_URL}_guild.getIconURL(void 0,true)+"size=2048")}),` +
                        `_guild.banner&&${createElement}(${menu},` +
                        `{id:"viewicons-copy-banner",label:"View Banner",action:()=>${OPEN_URL}Vencord.Webpack.findByProps("getGuildBannerURL").getGuildBannerURL(_guild).replace(/\\?size=.+/, "?size=2048"))})`
                        + `,${copyIdElement}])`
                }
            ]
        }
    ]
});
