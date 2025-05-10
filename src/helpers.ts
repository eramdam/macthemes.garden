import type { Page } from "astro";
import { z, type CollectionEntry } from "astro:content";
import archivesData from "./themes/archive-data.json" with { type: "json" };
import { chunk, orderBy } from "lodash-es";
import { customSlugify } from "./themesLoader";

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
  Page<CollectionEntry<"themes">>,
  "url" | "lastPage" | "currentPage" | "data"
>;

export function sortThemes(
  collection: Array<CollectionEntry<"themes">>,
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
      }
    },
    sortOrder === SortOrdersEnum.enum.asc ? "asc" : "desc",
  );
}

export const PAGINATION = {
  size: pageSize,
  getPage: (
    collection: Array<CollectionEntry<"themes">>,
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

const SortOptionValues = ["created", "name", "author"] as const;
export const SortOptionsEnum = z.enum(SortOptionValues);
export type SortOptions = z.infer<typeof SortOptionsEnum>;

const SortOrderValues = ["asc", "desc"] as const;
export const SortOrdersEnum = z.enum(SortOrderValues);
export type SortOrders = z.infer<typeof SortOrdersEnum>;

const sortOptionToKey = {
  [SortOptionsEnum.enum.author]: "a",
  [SortOptionsEnum.enum.created]: "d",
  [SortOptionsEnum.enum.name]: "n",
} as const;
const keyToSortOption = {
  d: SortOptionsEnum.enum.created,
  a: SortOptionsEnum.enum.author,
  n: SortOptionsEnum.enum.name,
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

export const possibleSortSlugs = SortOptionsEnum.options.flatMap((option) => {
  return SortOrdersEnum.options.flatMap((order) => {
    const k = sortOptionToKey[option];
    return [`${k}-${order}`];
  });
}) as SortOptionAndOrderSlug[];
export const sortSlugsRegex = new RegExp(`(${possibleSortSlugs.join("|")})`);
