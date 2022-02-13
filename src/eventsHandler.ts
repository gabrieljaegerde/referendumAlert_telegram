import { GenericExtrinsic, Vec } from "@polkadot/types";
import { u8aToHex } from "@polkadot/util";
import { logger } from "../tools/logger.js";
import { handleReferendumStart } from "./handleReferendumStart.js";

async function handleEventWithExtrinsic(
  blockIndexer,
  event,
  eventSort,
  extrinsic,
  extrinsicIndex,
  blockEvents
) {
  const indexer = {
    ...blockIndexer,
    eventIndex: eventSort,
    extrinsicIndex,
  };

  // await handleVoteEvent(event, extrinsic, indexer);
  await handleReferendumStart(event, indexer);
}

async function handleEventWithoutExtrinsic(
  blockIndexer,
  event,
  eventSort,
  blockEvents
) {
  const indexer = {
    ...blockIndexer,
    eventIndex: eventSort,
  };

  await handleReferendumStart(event, indexer);
}

export const handleEvents = async (events, extrinsics, blockIndexer) => {

  for (let sort = 0; sort < events.length; sort++) {
    const { event, phase } = events[sort];
    if (phase.isNull) {
      await handleEventWithoutExtrinsic(blockIndexer, event, sort, events);
      continue;
    }

    const extrinsicIndex = phase.value.toNumber();
    const extrinsic = extrinsics[extrinsicIndex];
    await handleEventWithExtrinsic(
      blockIndexer,
      event,
      sort,
      extrinsic,
      extrinsicIndex,
      events
    );
  }
};