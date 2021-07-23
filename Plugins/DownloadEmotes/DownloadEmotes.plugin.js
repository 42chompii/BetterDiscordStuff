/**
 * @name DownloadEmotes
 * @author HypedDomi#1711
 * @description Downloads all emotes from a guild and saves them in your download directory
 * @version 0.3
 * @authorId 354191516979429376
 * @donate https://paypal.me/dominik1711
 * @source https://github.com/HypedDomi/BetterDiscordStuff/tree/main/Plugins/DownloadEmotes
 * @updateUrl https://raw.githubusercontent.com/HypedDomi/BetterDiscordStuff/main/Plugins/DownloadEmotes/DownloadEmotes.plugin.js
 */

 const request = require("request");
 const https = require('https')
 const fs = require("fs");
 const path = require("path");
 
 const config = {
     info: {
         name: "DownloadEmotes",
         authors: [
             {
                 name: "HypedDomi",
                 discord_id: "354191516979429376",
             }
         ],
         version: "0.3",
         description: "Downloads all emotes from a guild and saves them in your download directory",
         github: "https://github.com/HypedDomi/BetterDiscordStuff/tree/main/Plugins/DownloadEmotes",
         github_raw: "https://raw.githubusercontent.com/HypedDomi/BetterDiscordStuff/main/Plugins/DownloadEmotes/DownloadEmotes.plugin.js"
     },
    changelog: [
        {
            title: "YEAH",
            type: "added",
            items: ["The Plugin exist"]
        }
    ]
 };
 
 module.exports = !global.ZeresPluginLibrary ? class {
     constructor() {
         this._config = config;
     }
 
     load() {
        BdApi.showConfirmationModal("Library plugin is needed",
        `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
            confirmText: "Download",
            cancelText: "Cancel",
            onConfirm: () => {
                request.get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", (error, response, body) => {
                    if (error)
                        return electron.shell.openExternal("https://betterdiscord.app/Download?id=9");

                    fs.writeFileSync(path.join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body);
                });
            }
        });
     }
     start() {this.load();}
     stop() {}
 } : (([Plugin, Library]) => {
    const {Patcher, WebpackModules, DCM} = Library;
    let downloadsFolder;
     class DownloadEmotes extends Plugin {
        onStart() {
            this.patchContextMenu();
        }

        patchContextMenu() {
            const GuildContextMenu = WebpackModules.getModule(m => m?.default?.displayName === "GuildContextMenu")
            Patcher.after(GuildContextMenu, "default", (_, [props], component) => {
                const {guild} = props;
                component.props.children.push(DCM.buildMenuItem({
                    label: "Download Emotes",
                    type: "text",
                    action: () => this.downloadEmotes(guild)
                }))
            })
        }

        getDownloadLocation () {
            if (downloadsFolder && fs.existsSync(downloadsFolder)) return downloadsFolder;
            let homePath = process.env.USERPROFILE || process.env.HOMEPATH || process.env.HOME;
            let downloadPath = homePath && path.join(homePath, "Downloads");
            if (downloadPath && fs.existsSync(downloadPath)) return downloadsFolder = downloadPath;
            else {
                downloadsFolder = path.join(BDUtils.getPluginsFolder(), "downloads");
                if (!fs.existsSync(downloadsFolder)) fs.mkdirSync(downloadsFolder);
                return downloadsFolder;
            }
        }
        
        downloadEmotes(guild){
            var downloadLocation = this.getDownloadLocation()
            let emotes = BdApi.findModuleByProps("isUploadingEmoji").getEmojis(guild.id)
            if (emotes == null) emotes = BdApi.findModuleByProps('uploadEmoji').fetchEmoji(guild.id)
            if (emotes != null){
                if(emotes.length != 0){
                    try {
                        if (!fs.existsSync(downloadsFolder+"\\"+guild)) {
                            fs.mkdirSync(downloadsFolder+"\\"+guild)
                        }
                        console.log("Started Downloading Emotes from " + guild)
                        console.log(`Saving Emotes to ${downloadLocation}`)
                        emotes.forEach(function(item) {
                            https.get(`https://cdn.discordapp.com/emojis/${item.id}.${item.animated ? "gif" : "png"}`, function(response) {
                                response.pipe(fs.createWriteStream(path.join(`${downloadsFolder}\\${guild}`, `${item.name}.${item.animated ? "gif" : "png"}`)))
                            });
                          });
                          console.log("Emotes downloaded successfully")
                          BdApi.showToast("Emotes downloaded successfully", {type: "success"})
                    } catch (err) {
                        console.error(err)
                        BdApi.showToast("An Error occurred", {type: "error"})
                    }
                }else{
                    BdApi.showToast("This guild has no Emotes", {type: "error"})
                }
            }
            else{
                BdApi.showConfirmationModal("Emotes not loaded", ["The emotes you are trying to reach could not be loaded. Please try again"],
                {
                    danger: false,
                    confirmText: "Try again",
                    cancelText: "Close",
                    onConfirm: () => {this.downloadEmotes(guild)}
                });
            }
        }

        onStop() {
            Patcher.unpatchAll();
        }
     }
     return DownloadEmotes;

 })(global.ZeresPluginLibrary.buildPlugin(config)); 