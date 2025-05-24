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

// https://www.kreativekorp.com/moccp/#Mac-OS-X-Crayons
export const OSXPaletteColors = [
  ["#000000", "Licorice"],
  ["#191919", "Lead"],
  ["#333333", "Tungsten"],
  ["#4c4c4c", "Iron"],
  ["#666666", "Steel"],
  ["#7f7f7f", "Tin"],
  ["#808080", "Nickel"],
  ["#999999", "Aluminum"],
  ["#b3b3b3", "Magnesium"],
  ["#cccccc", "Silver"],
  ["#e6e6e6", "Mercury"],
  ["#ffffff", "Snow"],

  ["#800000", "Cayenne"],
  ["#804000", "Mocha"],
  ["#808000", "Asparagus"],
  ["#408000", "Fern"],
  ["#008000", "Clover"],
  ["#008040", "Moss"],
  ["#008080", "Teal"],
  ["#004080", "Ocean"],
  ["#000080", "Midnight"],
  ["#400080", "Eggplant"],
  ["#800080", "Plum"],
  ["#800040", "Maroon"],

  ["#ff0000", "Maraschino"],
  ["#ff8000", "Tangerine"],
  ["#ffff00", "Lemon"],
  ["#80ff00", "Lime"],
  ["#00ff00", "Spring"],
  ["#00ff80", "Sea Foam"],
  ["#00ffff", "Turquoise"],
  ["#0080ff", "Aqua"],
  ["#0000ff", "Blueberry"],
  ["#8000ff", "Grape"],
  ["#ff00ff", "Magenta"],
  ["#ff0080", "Strawberry"],

  ["#ff6666", "Salmon"],
  ["#ffcc66", "Cantaloupe"],
  ["#ffff66", "Banana"],
  ["#ccff66", "Honeydew"],
  ["#66ff66", "Flora"],
  ["#66ffcc", "Spindrift"],
  ["#66ffff", "Ice"],
  ["#66ccff", "Sky"],
  ["#6666ff", "Orchid"],
  ["#cc66ff", "Lavender"],
  ["#ff66ff", "Bubblegum"],
  ["#ff70cf", "Carnation"],
] as const;

// https://www.kreativekorp.com/moccp/#Mac-OS-Classic-Crayons
export const ClassicPaletteColors = [
  ["#ffffff", "Chalk"],
  ["#eeeeee", "Marble"],
  ["#cccccc", "Soapstone"],
  ["#aaaaaa", "Concrete"],
  ["#888888", "Granite"],
  ["#777777", "Flint"],
  ["#555555", "Shale"],
  ["#333333", "Gabbro"],
  ["#222222", "Basalt"],
  ["#000000", "Obsidian"],
  ["#7465dc", "Violet Dusk"],
  ["#5b87f2", "Sky Blue"],
  ["#62d6ac", "Ocean Green"],
  ["#5fbd71", "Spring Frost"],
  ["#7e835b", "Mildew"],
  ["#e6e658", "Mustard"],
  ["#ffbf56", "Canteloupe"],
  ["#f87b57", "Tulip"],
  ["#da456b", "Carnation"],
  ["#bb56c3", "Orchid"],
  ["#8154d1", "Pale Violet"],
  ["#6876e7", "Evening Blue"],
  ["#5dbaca", "Fog"],
  ["#60ca8e", "Chlorine"],
  ["#71985e", "Moss"],
  ["#b2b459", "Olive"],
  ["#ffe957", "Banana"],
  ["#ff9456", "Grapefruit"],
  ["#f06157", "Salmon"],
  ["#dc54ad", "Grape"],
  ["#5918bb", "Violet"],
  ["#1822cd", "Blue"],
  ["#18605a", "Seaweed"],
  ["#2f8b20", "Clover"],
  ["#8cbc1c", "Cactus"],
  ["#ffea18", "Lemon"],
  ["#ffaf18", "Tangerine"],
  ["#ff7518", "Melon"],
  ["#f63f1b", "Red Orange"],
  ["#ed181e", "Red"],
  ["#6c18b0", "Royal Violet"],
  ["#4618c6", "Blue Violet"],
  ["#184b81", "Sea Blue"],
  ["#187534", "Pine"],
  ["#5da31e", "Fern"],
  ["#bad41a", "Watercress"],
  ["#ffcc18", "Marigold"],
  ["#ff9218", "Orange"],
  ["#fa4e19", "Fire"],
  ["#ef1f1d", "Apple"],
  ["#291a10", "Sepia"],
  ["#5b3d23", "Raw Sienna"],
  ["#8c6137", "Dirt"],
  ["#be844a", "Tan"],
  ["#cdc7c1", "Warm Marble"],
  ["#8c8073", "Warm Granite"],
  ["#3e3832", "Warm Shale"],
  ["#c1c1cd", "Cool Marble"],
  ["#73738c", "Cool Granite"],
  ["#32323e", "Cool Shale"],
] as const;

export const targetPaletteColors = OSXPaletteColors;

const targetPaletteColorsRgb = targetPaletteColors.map(([color]) => {
  const rgb = parseToRgb(color);
  return {
    R: rgb.red,
    G: rgb.green,
    B: rgb.blue,
  };
});

export const targetPaletteColorsLab = targetPaletteColorsRgb.map(
  colorDiff.rgb_to_lab,
);

export function findNameForPaletteColor(color: colorDiff.RGBColor) {
  const matchedIndex = targetPaletteColorsRgb.findIndex((targetLab) => {
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
          color: {
            R: rawPaletteColor[0],
            G: rawPaletteColor[1],
            B: rawPaletteColor[2],
          },
          name: toColorString({
            red: rawPaletteColor[0],
            green: rawPaletteColor[1],
            blue: rawPaletteColor[2],
          }),
        } as const;
      }

      const closest = colorDiff.closest(
        {
          R: rawPaletteColor[0],
          G: rawPaletteColor[1],
          B: rawPaletteColor[2],
        },
        targetPaletteColorsRgb,
      );
      const diff = 0;

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
    .slice(0, 6);
}
