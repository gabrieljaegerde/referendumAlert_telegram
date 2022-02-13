import { Low, JSONFile } from 'lowdb';
import { ApiPromise } from "@polkadot/api";
import { Bot, Keyboard } from "grammy";
import { RunnerHandle } from '@grammyjs/runner';
import { getUserCollection, initDb } from './src/mongo/index.js';
import { CountAdapter } from './tools/countAdapter.js';
import { BlockListener } from './src/blockListener.js';

type BotParams = {
  api: ApiPromise,
  localStorage: Low,
  settings: any,
  bot: Bot,
  runnerHandle: RunnerHandle;
  blockCountAdapter: CountAdapter;
  blockListener: BlockListener
};

export const params: BotParams = {
  api: null,
  localStorage: null,
  settings: null,
  bot: null,
  runnerHandle: null,
  blockCountAdapter: null,
  blockListener: null
};

export const getDb = async (): Promise<void> => {
  await initDb();
};

export const getLocalStorage = (): Low => {
  const db = new Low(new JSONFile(process.env.LOCAL_STORAGE_DB_FILE_PATH));
  return db;
};

export const getKeyboard = async (ctx): Promise<Keyboard> => {
  const userCol = await getUserCollection();
  const user = await userCol.findOne({ chatId: ctx.chat.id });
  if (user.broadcast) {
    return new Keyboard()
      .text("✅ Turn off new referendum broadcasting").row();
  }
  else {
    return new Keyboard()
      .text("❌ Turn on new referendum broadcasting").row();
  }
};

