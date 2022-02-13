import { params } from "../config.js";
import { getUserCollection } from "./mongo/index.js";
import { DemocracyEvents, Modules, ReferendumMethods } from "../tools/constants.js";
import { InlineKeyboard } from "grammy";
import { escapeMarkdown, send } from "../tools/utils.js";

const sendNewMessages = async (referendumId) => {
    const userCol = await getUserCollection();
    const chain = params.settings.network.name.toLowerCase();
    const inlineKeyboard = new InlineKeyboard().url("PolkAssembly",
      `https://${chain}.polkassembly.io/referendum/${referendumId}`);
  
    const users = await userCol.find({}).toArray();
    for (const user of users) {
      if (user && !user.blocked && user.broadcast) {
        const message = `A new referendum with ID ${referendumId} is up for vote\\.`;
        await send(user.chatId, message, "MarkdownV2", inlineKeyboard);
      }
    }
  };

const isReferendumEvent = (section, method) => {
    if (
        ![Modules.Democracy].includes(section)
    ) {
        return false;
    }
    return ReferendumMethods.hasOwnProperty(method);
};

export const handleReferendumStart = async (
    event,
    indexer // this indexer doesn't have extrinsic index
) => {
    const { section, method } = event;
    if (!isReferendumEvent(section, method)) {
        return;
    }
    console.log("method", method)
    console.log("block", indexer.blockHeight)
    if (ReferendumMethods.Started === method) {
        const [id, type] = event.data;
        sendNewMessages(id)
        //await saveNewReferendum(event, indexer);
    }
};