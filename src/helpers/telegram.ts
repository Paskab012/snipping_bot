import { Telegraf } from "telegraf";
import { SwapsWrapper } from "../swaps";
import { config } from "./config";
import { BOT_TOKEN } from "./constant";
import { HelpersWrapper } from "./helpers";
import { message } from "telegraf/filters";

const bot = new Telegraf(BOT_TOKEN!);

bot.start((ctx: any) => {
  console.log("\n\n User is starting the bot");
  ctx.reply("Welcome back, Your account is well set...");
});

const sendNotification = async (message: any) => {
  console.log("\n\nSending Tg notification...");
  const chatIDs = config.TG_USERS_ID;
  console.log(typeof chatIDs);
  chatIDs.forEach((chat) => {
    bot.telegram
      .sendMessage(chat, message, {
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
      .catch((error: any) => {
        console.log("Network error ", chat);
        console.log("*****************");
        console.log(error);
      });
  });
  console.log("Done!");
};

bot.on(message("text"), async (ctx: any) => {
  try {
    // const text: any = ctx.message?.text
    //   ? ctx.message?.text
    //   : ctx.update.message.text || "";

    const text =
      (ctx.message && ctx.message.text) ||
      (ctx.update.message && ctx.update.message.text) ||
      "";

    if (!text || text.trim() === "") {
      console.error("Empty message text");
      return;
    }

    let details = text.split(",");

    let user = ctx.message.from.id.toString();

    if (config.TG_USERS_ID.includes(user)) {
      let commandSell = details[0].trim();

      const tokenAddress = HelpersWrapper.checkAddress(ctx, details[1].trim());

      if (tokenAddress && commandSell) {
        ctx.reply("Processing ...");

        const nonce = await HelpersWrapper.getNonce();
        const tokenBalance = await HelpersWrapper.getTokenBalance(
          tokenAddress,
          config.PUBLIC_KEY
        );

        if (tokenBalance > 0) {
          const sellTx =
            await SwapsWrapper.swapExactTokensForETHSupportingFeeOnTransferTokens(
              tokenBalance,
              1,
              [tokenAddress, config.WBNB_ADDRESS],
              nonce!
            );

          if (sellTx!.success) {
            let message = "Manual Sell Notification";
            message += "\n\n Txn ";
            message += `\nhttps://testnet.bscscan.com/tx/${sellTx!.data}`;
            message += "\n\n Token";
            message += `\nhttps://testnet.bscscan.com/token/${tokenAddress}`;
            ctx.reply(message);
          } else {
            let message = "Manual Sell Error";
            message += "\n\n Token";
            message += `\nhttps://testnet.bscscan.com/${tokenAddress}`;
            message += "\n\n Error";
            message += `\nhttps://testnet.bscscan.com/tx/${sellTx!.data}`;
            ctx.reply(message);
          }
        }
      } else {
        let message = "Wrong sell format";
        message += "You either did not provide the token address";
        message += "Example of a correct sell command";
        message += "\n\n  sell, 0x4dbcdf9b62e891a7cec5a2568c3f4faf9e8abe2b";
        ctx.reply();
      }
    } else {
      ctx.reply("Error, You are not authorised to make this request");
    }
  } catch (error) {
    let message = "Encoutered this error while selling";
    message += `\n\n\ ${error}`;
    return message;
  }
});

bot.launch();

export { sendNotification };
