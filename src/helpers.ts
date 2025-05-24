import type { Page } from "astro";
import { z, type CollectionEntry } from "astro:content";
import archivesData from "./themes/archive-data.json" with { type: "json" };
import { chunk, isEqual, orderBy, uniq } from "lodash-es";
import { customSlugify } from "./themesLoader";
import rawPaletteData from "./themes/palettes.json" with { type: "json" };
import type { RgbPixel } from "quantize";
import * as colorDiff from "color-diff";
import { parseToRgb, toColorString } from "polished";

const paletteData = rawPaletteData as unknown as Record<string, RgbPixel[]>;

const archives = Object.keys(archivesData);
const formatter = Intl.NumberFormat("en-US", {
  style: "unit",
  unit: "kilobyte",
  unitDisplay: "short",
  maximumFractionDigits: 1,
});

export function archiveFileSize(value: string) {
  try {
    const matchingArchive = archives.find((a) => a === value);

    if (!matchingArchive) {
      return "";
    }

    // @ts-expect-error
    const size = archivesData[matchingArchive].size;
    const sizeKilobytes = size / 1024;

    return `(${formatter.format(sizeKilobytes)})`;
  } catch (e) {
    console.error(e);
    return "";
  }
}

export function archiveMd5(value: string) {
  try {
    const matchingArchive = archives.find((a) => a === value);

    if (!matchingArchive) {
      return "";
    }

    // @ts-expect-error
    return archivesData[matchingArchive].md5;
  } catch (e) {
    console.error(e);
    return "";
  }
}

const pageSize = 51;
type GetPageReturn = Pick<
  Page<CollectionEntry<"themes"> & { likes: number }>,
  "url" | "lastPage" | "currentPage" | "data"
>;

export function sortThemes(
  collection: Array<
    CollectionEntry<"themes"> & {
      likes: number;
    }
  >,
  sortOption: SortOptions = SortOptionsEnum.enum.created,
  sortOrder: SortOrders = SortOrdersEnum.enum.asc,
) {
  return orderBy(
    collection,
    (t) => {
      switch (sortOption) {
        case SortOptionsEnum.enum.created:
          return t.data.createdAt;
        case SortOptionsEnum.enum.author:
          if (t.data.authors.length === 0) {
            return "z".repeat(200);
          }
          return t.data.authors
            .map((t) => customSlugify(t.id))
            .join("\n")
            .toLowerCase();
        case SortOptionsEnum.enum.name:
          return customSlugify(t.data.name).toLowerCase();
        case SortOptionsEnum.enum.likes:
          return t.likes;
      }
    },
    sortOrder === SortOrdersEnum.enum.asc ? "asc" : "desc",
  );
}

export const PAGINATION = {
  size: pageSize,
  getPage: (
    collection: Array<CollectionEntry<"themes"> & { likes: number }>,
    pageNumber: number,
    sortOption: SortOptions = SortOptionsEnum.enum.created,
    sortOrder: SortOrders = SortOrdersEnum.enum.asc,
  ): GetPageReturn => {
    const sorted = sortThemes(collection, sortOption, sortOrder);
    const pages = chunk(sorted, pageSize);

    const slug = makeKeyFromSortAndOrder(sortOption, sortOrder);

    return {
      lastPage: pages.length,
      currentPage: pageNumber,
      data: pages[Math.max(pageNumber - 1, 0)],
      url: {
        last: `/${slug}/${Math.ceil(collection.length / pageSize)}`,
        current: pageNumber === 1 ? "/" : `/${slug}/${pageNumber}`,
        first: pageNumber > 1 ? "/" : undefined,
        next:
          pageNumber < pages.length ? `/${slug}/${pageNumber + 1}` : undefined,
        prev:
          pages.length > 1 && pageNumber > 1
            ? `/${slug}/${pageNumber - 1}`
            : undefined,
      },
    };
  },
};

const SortOptionValues = ["created", "name", "author", "likes"] as const;
export const SortOptionsEnum = z.enum(SortOptionValues);
export type SortOptions = z.infer<typeof SortOptionsEnum>;

const SortOrderValues = ["asc", "desc"] as const;
export const SortOrdersEnum = z.enum(SortOrderValues);
export type SortOrders = z.infer<typeof SortOrdersEnum>;

const sortOptionToKey = {
  [SortOptionsEnum.enum.author]: "a",
  [SortOptionsEnum.enum.created]: "d",
  [SortOptionsEnum.enum.name]: "n",
  [SortOptionsEnum.enum.likes]: "l",
} as const;
const keyToSortOption = {
  d: SortOptionsEnum.enum.created,
  a: SortOptionsEnum.enum.author,
  n: SortOptionsEnum.enum.name,
  l: SortOptionsEnum.enum.likes,
} as const;

type SortOptionAndOrderSlug =
  `${(typeof sortOptionToKey)[SortOptions]}-${SortOrders}`;

export function slugFromSortAndOrder(slug: SortOptionAndOrderSlug): {
  sort: SortOptions;
  order: SortOrders;
} {
  const [sortKey, order] = slug.split("-");

  return {
    sort: keyToSortOption[
      sortKey as (typeof sortOptionToKey)[SortOptions]
    ] as SortOptions,
    order: order as SortOrders,
  };
}

export function makeKeyFromSortAndOrder(
  sort: SortOptions,
  order: SortOrders,
): SortOptionAndOrderSlug {
  return `${sortOptionToKey[sort]}-${order}`;
}

export const invertOrdersMap = {
  [SortOrdersEnum.enum.desc]: SortOrdersEnum.enum.asc,
  [SortOrdersEnum.enum.asc]: SortOrdersEnum.enum.desc,
};

export const possibleSortSlugs = SortOptionsEnum.options.flatMap((option) => {
  return SortOrdersEnum.options.flatMap((order) => {
    const k = sortOptionToKey[option];
    return [`${k}-${order}`];
  });
}) as SortOptionAndOrderSlug[];
export const sortSlugsRegex = new RegExp(`(${possibleSortSlugs.join("|")})`);

// From https://www.kreativekorp.com/moccp/#Mac-OS-X-Crayons
const targetPaletteColors = [
  ["#ffcc66", "Cantaloupe"],
  ["#ccff66", "Honeydew"],
  ["#66ffcc", "Spindrift"],
  ["#66ccff", "Sky"],
  ["#cc66ff", "Lavender"],
  ["#ff70cf", "Carnation"],
  ["#000000", "Licorice"],
  ["#ffffff", "Snow"],
  ["#ff6666", "Salmon"],
  ["#ffff66", "Banana"],
  ["#66ff66", "Flora"],
  ["#66ffff", "Ice"],
  ["#6666ff", "Orchid"],
  ["#ff66ff", "Bubblegum"],
  ["#191919", "Lead"],
  ["#e6e6e6", "Mercury"],
  ["#ff8000", "Tangerine"],
  ["#80ff00", "Lime"],
  ["#00ff80", "Sea Foam"],
  ["#0080ff", "Aqua"],
  ["#8000ff", "Grape"],
  ["#ff0080", "Strawberry"],
  ["#333333", "Tungsten"],
  ["#cccccc", "Silver"],
  ["#ff0000", "Maraschino"],
  ["#ffff00", "Lemon"],
  ["#00ff00", "Spring"],
  ["#00ffff", "Turquoise"],
  ["#0000ff", "Blueberry"],
  ["#ff00ff", "Magenta"],
  ["#4c4c4c", "Iron"],
  ["#b3b3b3", "Magnesium"],
  ["#804000", "Mocha"],
  ["#408000", "Fern"],
  ["#008040", "Moss"],
  ["#004080", "Ocean"],
  ["#400080", "Eggplant"],
  ["#800040", "Maroon"],
  ["#666666", "Steel"],
  ["#999999", "Aluminum"],
  ["#800000", "Cayenne"],
  ["#808000", "Asparagus"],
  ["#008000", "Clover"],
  ["#008080", "Teal"],
  ["#000080", "Midnight"],
  ["#800080", "Plum"],
  ["#7f7f7f", "Tin"],
  ["#808080", "Nickel"],
] as const;

const targetColors = targetPaletteColors
  .map(([color]) => {
    const rgb = parseToRgb(color);
    return {
      R: rgb.red,
      G: rgb.green,
      B: rgb.blue,
    };
  })
  .map(colorDiff.rgb_to_lab);

export function findNameForPaletteColor(color: colorDiff.LabColor) {
  const matchedIndex = targetColors.findIndex((targetLab) => {
    return isEqual(targetLab, color);
  });
  if (matchedIndex < 0) {
    return undefined;
  }
  return targetPaletteColors[matchedIndex][1];
}

export function getPaletteForThemeId(themeId: string) {
  const rawPaletteColors = paletteData[themeId];

  if (!rawPaletteColors) {
    return undefined;
  }

  return rawPaletteColors
    .map((rawPaletteColor) => {
      const rawPaletteColorLab = colorDiff.rgb_to_lab({
        R: rawPaletteColor[0],
        G: rawPaletteColor[1],
        B: rawPaletteColor[2],
      });
      const useRaw = false;
      if (useRaw) {
        return {
          diff: 0,
          color: rawPaletteColorLab,
          name: toColorString({
            red: rawPaletteColor[0],
            green: rawPaletteColor[1],
            blue: rawPaletteColor[2],
          }),
        } as const;
      }

      const closest = colorDiff.closest_lab(rawPaletteColorLab, targetColors);
      const diff = colorDiff.diff(closest, rawPaletteColorLab);

      return {
        diff,
        color: closest,
        name: findNameForPaletteColor(closest),
      } as const;
    })
    .filter(Boolean)
    .filter(({ color }, index, array) => {
      const colors = array.map(({ color: c }) => c);
      return colors.lastIndexOf(color) === index;
    })
    .slice(0, 8);
}
