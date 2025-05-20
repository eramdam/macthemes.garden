import { differenceInMilliseconds } from "date-fns";
import {
  getLastRequestFromUserId,
  recordLastRequestFromUserId,
} from "./dbHelpers";

// milliseconds
const timeWindow = 3_000;

export async function canUserIdMakeRequest(userId: string) {
  if (import.meta.env.DEV) {
    return true;
  }
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
