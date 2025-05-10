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

export const PAGINATION = {
  size: pageSize,
  getPage: (
    collection: Array<CollectionEntry<"themes">>,
    pageNumber: number,
    sortOption: SortOptions = SortOptions.CREATED,
    sortOrder: SortOrders = SortOrders.DESC,
  ): GetPageReturn => {
    console.log({ sortOrder });
    const sorted = orderBy(
      collection,
      (t) => {
        switch (sortOption) {
          case SortOptions.CREATED:
            return t.data.createdAt;
          case SortOptions.AUTHOR:
            if (t.data.authors.length === 0) {
              return "z".repeat(200);
            }
            return t.data.authors
              .map((t) => customSlugify(t.id))
              .join("\n")
              .toLowerCase();
          case SortOptions.NAME:
            return customSlugify(t.data.name).toLowerCase();
          case SortOptions.YEAR:
            return t.data.year || 1997;
        }
      },
      sortOrder === SortOrders.ASC ? "asc" : "desc",
    );
    const pages = chunk(sorted, pageSize);

    return {
      lastPage: pages.length,
      currentPage: pageNumber,
      data: pages[Math.max(pageNumber - 1, 0)],
      url: {
        last: `/page/${Math.ceil(collection.length / pageSize)}`,
        current: pageNumber === 1 ? "/" : `/page/${pageNumber}`,
        first: pageNumber > 1 ? "/" : undefined,
        next: pageNumber < pages.length ? `/page/${pageNumber + 1}` : undefined,
        prev:
          pages.length > 1 && pageNumber > 1
            ? `/page/${pageNumber - 1}`
            : undefined,
      },
    };
  },
};

export enum SortOptions {
  CREATED = "created",
  NAME = "name",
  AUTHOR = "author",
  YEAR = "year",
}
export const SortOptionsEnum = z
  .nativeEnum(SortOptions)
  .catch(SortOptions.CREATED);
export enum SortOrders {
  ASC = "asc",
  DESC = "desc",
}
export const SortOrdersEnum = z.nativeEnum(SortOrders).catch(SortOrders.DESC);
