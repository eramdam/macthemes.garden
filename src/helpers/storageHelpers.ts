import { z } from "astro/zod";

const LIKES_KEY = "macthemes-likes";

const localLikes = z.record(z.string(), z.boolean()).default({});

function getLocalLikes(): z.TypeOf<typeof localLikes> {
  const raw = localStorage.getItem(LIKES_KEY);

  return localLikes.parse(JSON.parse(raw || "{}"));
}

export function getLocalLike(themeId: string): boolean {
  return getLocalLikes()[themeId] ?? false;
}

export function setLocalLike(themeId: string, value: boolean) {
  const current = getLocalLikes();
  console.log({
    themeId,
    value,
  });

  localStorage.setItem(
    LIKES_KEY,
    JSON.stringify({
      ...current,
      [themeId]: value,
    }),
  );
}
