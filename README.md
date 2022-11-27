# puhcordPC

This is based on Vencord, the original Discord Client this is based upon. I only made puhcordPC for the funnies xd

below is the original description :p

to actually install it, dont use the gui, use this instead

install Node.JS, just look that up... 

install `pnpm`:

> :exclamation: this may need to be run as admin depending on your system, and you may need to close and reopen your terminal.

(run these in your command prompt or whatever you like)

```shell
npm i -g pnpm
```

(during my installation, you need to restart your cmd prompt on windows after doing this)

Clone puhcordPC:

```shell
git clone https://github.com/poob1/puhcordPC
cd puhcordPC
```

Install dependencies:

```shell
pnpm install --frozen-lockfile
```

Build da puhcordPC:

```shell
pnpm build
```

Inject puhcord into your client:

```shell
pnpm inject
```

Then fully close Discord from your taskbar or task manager, and restart it. puhcordPCshould be injected - you can check this by looking for the puhcordPC section in Discord settings.


## Features

-   Super easy to install, no git or node or anything else required
-   Many plugins built in: [See a list](https://gist.github.com/Vendicated/8696cde7b92548064a3ae92ead84d033)
    -   Some highlights: SpotifyControls, Experiments, NoTrack, MessageLogger, QuickReply, Free Emotes/Stickers, custom slash commands, ShowHiddenChannels
-   Browser Support: Run Vencord in your Browser via extension or UserScript
-   Custom CSS and Themes: Inbuilt css editor with support to import any css files (including BetterDiscord themes)
-   Works in all Electron versions (Confirmed working on versions 13-23)

## Installing / Uninstalling

If you're just a normal user, use [our simple gui installer!](https://github.com/Vendicated/VencordInstaller#usage)

If you're a power user who wants to contribute and make plugins or just want to build from source and install manually, read [Megu's Installation Guide!](docs/1_INSTALLING.md)

## Installing on Browser

Install [the browser extension](https://github.com/Vendicated/Vencord/releases/latest/download/extension.zip) or [UserScript](https://github.com/Vendicated/Vencord/releases/download/devbuild/Vencord.user.js). Please note that they aren't automatically updated for now, so you will regularely have to reinstall it.

You may also build them from source, to do that do the same steps as in the manual regular install method,
except run `pnpm buildWeb` instead of `pnpm build`, and your outputs will be in the dist folder

```sh
pnpm buildWeb
```

You will find the built extension at dist/extension.zip. Now just install this extension in your Browser

## Installing Plugins

> **Note**
> You can only use 3rd party plugins in the manual Vencord install for now.

Vencord comes with a bunch of plugins out of the box!

However, if you want to install your own ones, create a `userplugins` folder in the `src` directory and create or clone your plugins in there.
Don't forget to rebuild!

Want to learn how to create your own plugin, and maybe PR it into Vencord? See the [Contributing](#contributing) section below!

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [Megu's Plugin Guide!](docs/2_PLUGINS.md)

[contribute]: CONTRIBUTING.md

[contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute] [contribute]

## Join

[join]: https://discord.gg/D9uwnFnqmd

[join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join] [join]
