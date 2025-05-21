import { differenceInMilliseconds } from "date-fns";
import {
  getLastRequestFromUserId,
  recordLastRequestFromUserId,
} from "./dbHelpers";

// milliseconds
const timeWindow = import.meta.env.DEV ? 10 : 1_000;

export async function canUserIdMakeRequest(userId: string) {
  const lastRequestForUser = (await getLastRequestFromUserId(userId))?.[0];

  if (!lastRequestForUser?.date) {
    await recordLastRequestFromUserId(userId);
    return true;
  }

  const now = new Date();
  const lastDate = lastRequestForUser.date;
  const diff = differenceInMilliseconds(now, lastDate);
  const isAllowed = diff > timeWindow;

  if (isAllowed) {
    await recordLastRequestFromUserId(userId);
  }

  return isAllowed;
}
