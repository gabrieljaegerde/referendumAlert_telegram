import { params } from "../config.js";
import { getUserCollection } from "./mongo/index.js";
import { DemocracyEvents, Modules, ReferendumMethods } from "../tools/constants.js";
import { InlineKeyboard } from "grammy";
import { escapeMarkdown, send } from "../tools/utils.js";

const sendNewMessages = async (referendumId) => {
  const userCol = await getUserCollection();
  const chain = params.settings.network.name.toLowerCase();
  const inlineKeyboard = new InlineKeyboard()
    .url("PolkAssembly", `https://${chain}.polkassembly.io/referendum/${referendumId}`)
    .url("polkadot.js", "https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Fkusama-rpc.polkadot.io#/democracy");

  const users = await userCol.find({}).toArray();
  for (const user of users) {
    if (user && !user.blocked && user.broadcast) {
      const message = `A new referendum with ID ${referendumId} is up for vote\\.\n\n` + 
      `Go vote on polkadot\\.js at your earliest convenience to secure your NFT\\.\n\nYes, voters get NFTs\\!\n\n` +
      `*Want me to send alerts in ${ user.type === "private" ? "a" : "another"} group${ user.type === "private" ? "" : " too"}\\?*\n` +
      `_Add me to that group as a member\\, then ask an admin to run\\: /newReferendumBroadcastOn_`;
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