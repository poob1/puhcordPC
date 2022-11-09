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

import { addPreEditListener, addPreSendListener, removePreEditListener, removePreSendListener } from "../api/MessageEvents";
import { Devs } from "../utils/constants";
import { ApngDisposeOp, getGifEncoder, importApngJs } from "../utils/dependencies";
import { lazyWebpack } from "../utils/misc";
import definePlugin, { OptionType } from "../utils/types";
import { Settings } from "../Vencord";
import { filters } from "../webpack";
import { ChannelStore, UserStore } from "../webpack/common";

const DRAFT_TYPE = 0;
const promptToUpload = lazyWebpack(filters.byCode("UPLOAD_FILE_LIMIT_ERROR"));

interface Sticker {
    available: boolean;
    description: string;
    format_type: number;
    guild_id: string;
    id: string;
    name: string;
    tags: string;
    type: number;
    _notAvailable?: boolean;
}

interface StickerPack {
    id: string;
    name: string;
    sku_id: string;
    description: string;
    cover_sticker_id: string;
    banner_asset_id: string;
    stickers: Sticker[];
}

export default definePlugin({
    name: "NitroBypass",
    authors: [
        Devs.Arjix,
        Devs.D3SOX,
        Devs.Ven
    ],
    description: "Allows you to stream in nitro quality and send fake emojis/stickers.",
    dependencies: ["MessageEventsAPI"],

    patches: [
        {
            find: "canUseAnimatedEmojis:function",
            predicate: () => Settings.plugins.NitroBypass.enableEmojiBypass === true,
            replacement: [
                "canUseAnimatedEmojis",
                "canUseEmojisEverywhere"
            ].map(func => {
                return {
                    match: new RegExp(`${func}:function\\(.+?}`),
                    replace: `${func}:function(e){return true;}`
                };
            })
        },
        {
            find: "canUseAnimatedEmojis:function",
            predicate: () => Settings.plugins.NitroBypass.enableStickerBypass === true,
            replacement: {
                match: /canUseStickersEverywhere:function\(.+?}/,
                replace: "canUseStickersEverywhere:function(e){return true;}"
            },
        },
        {
            find: "\"SENDABLE\"",
            replacement: {
                match: /(\w+)\.available\?/,
                replace: "true?"
            }
        },
        {
            find: "canUseAnimatedEmojis:function",
            predicate: () => Settings.plugins.NitroBypass.enableStreamQualityBypass === true,
            replacement: [
                "canUseHighVideoUploadQuality",
                "canStreamHighQuality",
                "canStreamMidQuality"
            ].map(func => {
                return {
                    match: new RegExp(`${func}:function\\(.+?}`),
                    replace: `${func}:function(e){return true;}`
                };
            })
        },
        {
            find: "STREAM_FPS_OPTION.format",
            predicate: () => Settings.plugins.NitroBypass.enableStreamQualityBypass === true,
            replacement: {
                match: /(userPremiumType|guildPremiumTier):.{0,10}TIER_\d,?/g,
                replace: ""
            }
        },
    ],

    options: {
        enableEmojiBypass: {
            description: "Allow sending fake emojis",
            type: OptionType.BOOLEAN,
            default: true,
            restartNeeded: true,
        },
        enableStickerBypass: {
            description: "Allow sending fake stickers",
            type: OptionType.BOOLEAN,
            default: true,
            restartNeeded: true,
        },
        stickerSize: {
            description: "Size of the stickers when sending",
            type: OptionType.SLIDER,
            default: 160,
            markers: [32, 64, 128, 160, 256, 512],
        },
        enableStreamQualityBypass: {
            description: "Allow streaming in nitro quality",
            type: OptionType.BOOLEAN,
            default: true,
            restartNeeded: true,
        }
    },

    get guildId() {
        return window.location.href.split("channels/")[1].split("/")[0];
    },

    get canUseEmotes() {
        return (UserStore.getCurrentUser().premiumType ?? 0) > 0;
    },

    get canUseSticker() {
        return (UserStore.getCurrentUser().premiumType ?? 0) > 1;
    },

    getStickerLink(stickerId: string) {
        return `https://media.discordapp.net/stickers/${stickerId}.png?size=${Settings.plugins.NitroBypass.stickerSize}`;
    },

    async sendAnimatedSticker(stickerLink: string, stickerId: string, channelId: string) {
        const [{ parseURL }, {
            GIFEncoder,
            quantize,
            applyPalette
        }] = await Promise.all([importApngJs(), getGifEncoder()]);

        const { frames, width, height } = await parseURL(stickerLink);

        const gif = new GIFEncoder();
        const resolution = Settings.plugins.NitroBypass.stickerSize;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", {
            willReadFrequently: true
        })!;

        const scale = resolution / width;
        ctx.scale(scale, scale);

        let lastImg: HTMLImageElement | null = null;
        for (const { left, top, width, height, disposeOp, img, delay } of frames) {
            if (disposeOp === ApngDisposeOp.BACKGROUND) {
                ctx.clearRect(left, top, width, height);
            }
            ctx.drawImage(img, left, top, width, height);

            const { data } = ctx.getImageData(0, 0, resolution, resolution);

            const palette = quantize(data, 256);
            const index = applyPalette(data, palette);

            gif.writeFrame(index, resolution, resolution, {
                transparent: true,
                palette,
                delay,
            });

            if (disposeOp === ApngDisposeOp.PREVIOUS && lastImg) {
                ctx.drawImage(lastImg, left, top, width, height);
            }
            lastImg = img;
        }

        gif.finish();
        const file = new File([gif.bytesView()], `${stickerId}.gif`, { type: "image/gif" });
        promptToUpload([file], ChannelStore.getChannel(channelId), DRAFT_TYPE);
    },

    start() {
        const settings = Settings.plugins.NitroBypass;
        if (!settings.enableEmojiBypass && !settings.enableStickerBypass) {
            return;
        }

        const EmojiStore = lazyWebpack(filters.byProps("getCustomEmojiById"));
        const StickerStore = lazyWebpack(filters.byProps("getAllGuildStickers")) as {
            getPremiumPacks(): StickerPack[];
            getAllGuildStickers(): Map<string, Sticker[]>;
            getStickerById(id: string): Sticker | undefined;
        };

        function getWordBoundary(origStr: string, offset: number) {
            return (!origStr[offset] || /\s/.test(origStr[offset])) ? "" : " ";
        }

        this.preSend = addPreSendListener((channelId, messageObj, extra) => {
            const { guildId } = this;

            if (settings.enableStickerBypass) {
                const stickerId = extra?.stickerIds?.[0];

                if (stickerId) {
                    let stickerLink = this.getStickerLink(stickerId);
                    let sticker: Sticker | undefined;

                    const discordStickerPack = StickerStore.getPremiumPacks().find(pack => {
                        const discordSticker = pack.stickers.find(sticker => sticker.id === stickerId);
                        if (discordSticker) {
                            sticker = discordSticker;
                        }
                        return discordSticker;
                    });

                    if (discordStickerPack) {
                        // discord stickers provided by the Distok project
                        stickerLink = `https://distok.top/stickers/${discordStickerPack.id}/${stickerId}.gif`;
                    } else {
                        // guild stickers
                        sticker = StickerStore.getStickerById(stickerId);
                    }

                    if (sticker) {
                        // when the user has Nitro and the sticker is available, send the sticker normally
                        if (this.canUseSticker && sticker.available) {
                            return { cancel: false };
                        }

                        // only modify if sticker is not from current guild
                        if (sticker.guild_id !== guildId) {
                            // if it's an animated guild sticker, download it, convert to gif and send it
                            const isAnimated = sticker.format_type === 2;
                            if (!discordStickerPack && isAnimated) {
                                this.sendAnimatedSticker(stickerLink, stickerId, channelId);
                                return { cancel: true };
                            }

                            if (messageObj.content)
                                messageObj.content += " ";
                            messageObj.content += stickerLink;

                            delete extra.stickerIds;
                        }
                    }
                }
            }

            if (!this.canUseEmotes && settings.enableEmojiBypass) {
                for (const emoji of messageObj.validNonShortcutEmojis) {
                    if (!emoji.require_colons) continue;
                    if (emoji.guildId === guildId && !emoji.animated) continue;

                    const emojiString = `<${emoji.animated ? "a" : ""}:${emoji.originalName || emoji.name}:${emoji.id}>`;
                    const url = emoji.url.replace(/\?size=\d+/, "?size=48");
                    messageObj.content = messageObj.content.replace(emojiString, (match, offset, origStr) => {
                        return `${getWordBoundary(origStr, offset - 1)}${url}${getWordBoundary(origStr, offset + match.length)}`;
                    });
                }
            }

            return { cancel: false };
        });

        if (!this.canUseEmotes && settings.enableEmojiBypass) {
            this.preEdit = addPreEditListener((_, __, messageObj) => {
                const { guildId } = this;

                for (const [emojiStr, _, emojiId] of messageObj.content.matchAll(/(?<!\\)<a?:(\w+):(\d+)>/ig)) {
                    const emoji = EmojiStore.getCustomEmojiById(emojiId);
                    if (emoji == null || (emoji.guildId === guildId && !emoji.animated)) continue;
                    if (!emoji.require_colons) continue;

                    const url = emoji.url.replace(/\?size=\d+/, "?size=48");
                    messageObj.content = messageObj.content.replace(emojiStr, (match, offset, origStr) => {
                        return `${getWordBoundary(origStr, offset - 1)}${url}${getWordBoundary(origStr, offset + match.length)}`;
                    });
                }
            });
        }
    },

    stop() {
        removePreSendListener(this.preSend);
        removePreEditListener(this.preEdit);
    }
});
