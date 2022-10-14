import { makeCodeblock } from "../../utils/misc";
import { generateId, sendBotMessage } from "./commandHelpers";
import { ApplicationCommandInputType, ApplicationCommandType, Argument, Command, CommandContext, Option, CommandReturnValue } from "./types";

export * from "./types";
export * from "./commandHelpers";

export let BUILT_IN: Command[];
export const commands = {} as Record<string, Command>;

// hack for plugins being evaluated before we can grab these from webpack
const OptPlaceholder = Symbol("OptionalMessageOption") as any as Option;
const ReqPlaceholder = Symbol("RequiredMessageOption") as any as Option;
/**
 * Optional message option named "message" you can use in commands.
 * Used in "tableflip" or "shrug"
 * @see {@link RequiredMessageOption}
 */
export let OptionalMessageOption: Option = OptPlaceholder;
/**
 * Required message option named "message" you can use in commands.
 * Used in "me"
 * @see {@link OptionalMessageOption}
 */
export let RequiredMessageOption: Option = ReqPlaceholder;

export const _init = function (cmds: Command[]) {
    try {
        BUILT_IN = cmds;
        OptionalMessageOption = cmds.find(c => c.name === "shrug")!.options![0];
        RequiredMessageOption = cmds.find(c => c.name === "me")!.options![0];
    } catch (e) {
        console.error("Failed to load CommandsApi");
    }
    return cmds;
} as never;

export const _handleCommand = function (cmd: Command, args: Argument[], ctx: CommandContext) {
    if (!cmd.isVencordCommand)
        return cmd.execute(args, ctx);

    const handleError = (err: any) => {
        // TODO: cancel send if cmd.inputType === BUILT_IN_TEXT
        const msg = `An Error occurred while executing command "${cmd.name}"`;
        const reason = err instanceof Error ? err.stack || err.message : String(err);

        console.error(msg, err);
        sendBotMessage(ctx.channel.id, {
            content: `${msg}:\n${makeCodeblock(reason)}`,
            author: {
                username: "Vencord"
            }
        });
    };

    try {
        const res = cmd.execute(args, ctx);
        return res instanceof Promise ? res.catch(handleError) : res;
    } catch (err) {
        return handleError(err);
    }
} as never;

function modifyOpt(opt: Option | Command) {
    opt.displayName ||= opt.name;
    opt.displayDescription ||= opt.description;
    opt.options?.forEach((opt, i, opts) => {
        // See comment above Placeholders
        if (opt === OptPlaceholder) opts[i] = OptionalMessageOption;
        else if (opt === ReqPlaceholder) opts[i] = RequiredMessageOption;
        opt.choices?.forEach(x => x.displayName ||= x.name);

        modifyOpt(opts[i]);
    });
}

export function registerCommand(command: Command, plugin: string) {
    if (BUILT_IN.some(c => c.name === command.name))
        throw new Error(`Command '${command.name}' already exists.`);

    command.isVencordCommand = true;
    command.id ??= generateId();
    command.applicationId ??= "-1"; // BUILT_IN;
    command.type ??= ApplicationCommandType.CHAT_INPUT;
    command.inputType ??= ApplicationCommandInputType.BUILT_IN_TEXT;
    command.plugin ||= plugin;

    modifyOpt(command);
    commands[command.name] = command;
    BUILT_IN.push(command);
}

export function unregisterCommand(name: string) {
    const idx = BUILT_IN.findIndex(c => c.name === name);
    if (idx === -1)
        return false;

    BUILT_IN.splice(idx, 1);
    delete commands[name];

    return true;
}
