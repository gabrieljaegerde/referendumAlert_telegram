import { Bot, GrammyError, HttpError } from "grammy";
import { params, getKeyboard } from "./config.js";
import { run, RunnerHandle } from "@grammyjs/runner";
import { getUserCollection } from "./src/mongo/index.js";

export const start = async (): Promise<{ runnerHandle: RunnerHandle, tBot: Bot; }> => {

  /*
   *   BOT initialization
   */

  const bot = new Bot(params.settings.botToken);

  //bot.api.config.use(apiThrottler());

  /*
   *   /start command handler
   */

  bot.command("start", async (ctx) => {
    if (ctx.chat.type == "private") {
      const userCol = await getUserCollection();
      const user = await userCol.findOne({ chatId: ctx.chat.id });

      let message: string;
      //normal start
      if (!user) {
        await userCol.insertOne({
          firstName: ctx.chat.first_name,
          username: ctx.chat.username,
          chatId: ctx.chat.id,
          type: ctx.chat.type,
          blocked: false,
          broadcast: true,
          createdAt: new Date()
        });
      }
      if (user && user.blocked) {
        await userCol.findOneAndUpdate({ chatId: ctx.chat.id },
          {
            $set: { blocked: false }
          }
        );
      }
      message = `Welcome to the ${params.settings.network.name} Referendum Alert bot.\n\n` +
        `In order to have a healthy network it is important that EVERYONE vote on important decisions. ` +
        `I will alert you when a new referendum is up for vote here!\n\n` +
        `From a Dotsama Freelancer with love. 🤎`;
      await ctx.reply(
        message,
        {
          reply_markup: {
            keyboard: (await getKeyboard(ctx)).build(),
            resize_keyboard: true
          },
          parse_mode: "Markdown",
        }
      );
    }
  });

  /*
   *   /menu command handler
   */

  bot.command("menu", async (ctx) => {
    if (ctx.chat.type == "private") {
      const message = "Here you go";
      await ctx.reply(
        message,
        {
          reply_markup: {
            keyboard: (await getKeyboard(ctx)).build(),
            resize_keyboard: true
          },
          parse_mode: "Markdown",
        }
      );
    }
  });

  /*
   *   react bot on '✅ Turn off new referendum broadcasting' message
   */

  bot.hears("✅ Turn off referendum broadcasting", async (ctx) => {
    if (ctx.chat.type == "private") {
      const userCol = await getUserCollection();

      await userCol.findOneAndUpdate({ chatId: ctx.chat.id },
        {
          $set: { broadcast: false }
        }
      );
      const message = "You will no longer be notified of new referenda.";
      await ctx.reply(
        message,
        {
          reply_markup: {
            keyboard: (await getKeyboard(ctx)).build(),
            resize_keyboard: true
          },
          parse_mode: "Markdown",
        }
      );
    }
  });

  /*
   *   react bot on '❌ Turn on new referendum broadcasting' message
   */

  bot.hears("❌ Turn on new referendum broadcasting", async (ctx) => {
    if (ctx.chat.type == "private") {
      const userCol = await getUserCollection();
      await userCol.findOneAndUpdate({ chatId: ctx.chat.id },
        {
          $set: { broadcast: true }
        }
      );
      const message = "You will from now on be notified of new referenda as soon as they become up for vote.";
      await ctx.reply(
        message,
        {
          reply_markup: {
            keyboard: (await getKeyboard(ctx)).build(),
            resize_keyboard: true
          },
          parse_mode: "Markdown",
        }
      );
    }
  });

  /*
   *   Handle all unhandled callback queries
   */

  bot.on("callback_query:data", async (ctx, next) => {
    console.log("Unknown button event with payload", ctx.callbackQuery.data);
    await ctx.answerCallbackQuery(); // remove loading animation
  });

  /*
   *   Collect and show in console all bot errors
   */
  bot.catch(async (err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      if (e.description.includes("bot was blocked by the user")) {
        const userCol = await getUserCollection();
        await userCol.findOneAndUpdate({ chatId: ctx.chat.id },
          {
            $set: { blocked: true }
          }
        );
        console.log(new Date(), `Bot was blocked by user with chatid ${e.payload.chat_id}`);
        return;
      }
      console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
    } else {
      console.error("Unknown error:", e);
    }
  });
  const runnerHandle = run(bot);
  console.log(new Date(), "Bot started as", bot);
  return { runnerHandle, tBot: bot };
};
