import { Telegraf } from "telegraf";
import { config } from "./config";
import {BOT_TOKEN} from './constant'


const bot = new Telegraf(BOT_TOKEN!);


bot.start((ctx: any) => {
    console.log("\n\n User is starting the bot")
    ctx.reply(
        "Welcome back, Your account is well set..."
    );

});

const sendNotification = async (message: any) => {
    console.log("\n\nSending Tg notification...");
    const chatIDs = config.TG_USERS_ID;
    console.log(typeof chatIDs);
    chatIDs.forEach(chat => {
        bot.telegram.sendMessage(chat, message, {
            parse_mode: "HTML",
            disable_web_page_preview: true,
        }).catch((error: any) => {
            console.log("Network error ", chat)
            console.log("*****************")
            console.log(error)
        })
    });
    console.log("Done!");
};

bot.launch();



export { sendNotification }
