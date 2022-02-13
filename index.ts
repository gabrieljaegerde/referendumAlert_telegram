import '@polkadot/api-augment';
import { params, getDb, getLocalStorage } from "./config.js";
import { getSettings } from "./tools/settings.js";
import { CountAdapter } from "./tools/countAdapter.js";
import dotenv from "dotenv";
import * as bot from "./bot.js";
import { getApi } from "./tools/substrateUtils.js";
import { ApiPromise } from "@polkadot/api";
import { Low } from "lowdb/lib";
import mongoose from "mongoose";
import { BlockListener } from "./src/blockListener.js";

dotenv.config();

class SubstrateBot {
  settings: any;
  api: ApiPromise;
  localStorage: Low;
  /**
   * Create SubstrateBot instance
   * @param config - SubstrateBot config
   * @param config.settings - main bot settings, should contain substrate network params (name, prefix, decimals, token),
   * telegram bot token, start & validators messages, links (governance, common), list of group alerts. See sample in examples
   * @param config.api - polkadot-api instance for connect to node
   */
  constructor({
    settings,
    api
  }) {
    this.settings = settings;
    this.api = api;
    this.localStorage = getLocalStorage();
  }

  async run() {
    await getDb();
    params.api = this.api;
    params.localStorage = this.localStorage;
    const networkProperties = await this.api.rpc.system.properties();
    if (!this.settings.network.prefix && networkProperties.ss58Format) {
      this.settings.network.prefix = networkProperties.ss58Format.toString();
    }
    if (!this.settings.network.decimals && networkProperties.tokenDecimals) {
      this.settings.network.decimals = networkProperties.tokenDecimals.toString();
    }
    if (
      this.settings.network.token === undefined &&
      networkProperties.tokenSymbol
    ) {
      this.settings.network.token = networkProperties.tokenSymbol.toString();
    }
    params.settings = this.settings;
    const { runnerHandle, tBot } = await bot.start();
    params.bot = tBot;
    params.runnerHandle = runnerHandle;
    params.blockCountAdapter = new CountAdapter(params.localStorage, "headerBlock");
    params.blockListener = new BlockListener(params.api,
      params.blockCountAdapter);
  }

  async stop() {
    await params.runnerHandle.stop();
    console.log("bot stopped.");
    await mongoose.connection.close(false);
    console.log('MongoDb connection closed.');
    process.exit(0);
  }
}

let substrateBot;
async function main() {
  const settings = getSettings();
  const api = await getApi();
  substrateBot = new SubstrateBot({
    settings,
    api
  });
  await substrateBot.run();

  process.once('SIGINT', () => {
    substrateBot.stop();
  });
  process.once('SIGTERM', () => {
    substrateBot.stop();
  });
}

main();

