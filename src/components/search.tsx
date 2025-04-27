import { matchSorter } from "match-sorter";
import { type FunctionComponent, type JSX } from "preact";

import { useComputed, useSignal } from "@preact/signals";
import { chunk } from "lodash-es";
import { useEffect } from "preact/hooks";
import { OS9Button } from "./OS9Button";
import { SingleTheme } from "./singleTheme";
import { type SearchTheme, decompressThemes } from "../searchThemes";

interface SearchFormProps {
  defaultQuery?: string;
  defaultPage?: number;
  themes: SearchTheme[];
}

interface FormElements extends HTMLFormControlsCollection {
  q: HTMLInputElement;
}

const pageSize = 51;

export const SearchForm: FunctionComponent<SearchFormProps> = (props) => {
  const searchQuery = useSignal(props.defaultQuery ?? "");
  const page = useSignal(props.defaultPage ?? 1);
  const themes = props.themes;

  const searchResults = useComputed(() => {
    if (!searchQuery.value.trim()) {
      return [[]];
    }

    return chunk(
      matchSorter(themes, searchQuery.value.trim(), {
        keys: ["name", "authors.*.name", "year"],
        threshold: matchSorter.rankings.CONTAINS,
      }),
      pageSize,
    );
  });
  const searchResultsCount = useComputed(() => {
    return searchResults.value.reduce((acc, cur) => acc + cur.length, 0);
  });

  const pageIndex = useComputed(() => {
    return page.value - 1;
  });
  const pageCount = useComputed(() => {
    if (!searchQuery.value.trim()) {
      return 1;
    }
    return Math.ceil(searchResultsCount.value / pageSize);
  });

  const onChange = (e: JSX.TargetedSubmitEvent<HTMLFormElement>) => {
    if (!(e.target instanceof HTMLFormElement)) {
      return;
    }
    e.preventDefault();

    searchQuery.value = (e.target.elements as FormElements).q.value;
    page.value = 1;
    const url = new URL(window.location.href);
    url.searchParams.set("q", searchQuery.value);
    url.searchParams.set("page", page.value.toString());
    window.history.pushState({}, "", url);
  };

  const onPageChange = (direction: "next" | "prev") => {
    if (direction === "next") {
      page.value = Math.min(page.value + 1, pageCount.value);
    } else {
      page.value = Math.max(page.value - 1, 1);
    }

    const url = new URL(window.location.href);
    url.searchParams.set("page", page.value.toString());
    window.history.pushState({}, "", url);
  };

  const hasMoreThanOnePage = useComputed(() => {
    return pageCount.value > 1;
  });

  return (
    <>
      <section className="macos9-window-genericbar search">
        <form action="/search" onSubmit={onChange}>
          <input type="search" name="q" defaultValue={searchQuery.value} />
          <OS9Button asButton type={"submit"}>
            Search
          </OS9Button>
        </form>
        <div className="pagination">
          {searchResultsCount.value > 0 && (
            <p>
              Found {searchResultsCount} theme
              {searchResultsCount.value > 1 ? "s" : ""}{" "}
              {hasMoreThanOnePage.value && (
                <>
                  (page {page.value} of {pageCount})
                </>
              )}
            </p>
          )}
          {searchQuery.value.trim() && searchResultsCount.value === 0 && (
            <p>No results found for "{searchQuery.value}"</p>
          )}
          {hasMoreThanOnePage.value && (
            <>
              <OS9Button
                asButton
                type={"button"}
                onClick={() => {
                  onPageChange("prev");
                }}
                disabled={page.value <= 1}
              >
                {"<"} Previous
              </OS9Button>
              <OS9Button
                asButton
                type={"button"}
                onClick={() => {
                  onPageChange("next");
                }}
                disabled={page.value >= pageCount.value}
              >
                Next {">"}
              </OS9Button>
            </>
          )}
        </div>
      </section>
      <div class="themes-grid">
        {searchResults.value[pageIndex.value].map((t) => {
          return (
            <div>
              <SingleTheme theme={t} authors={t.authors}></SingleTheme>
            </div>
          );
        })}
      </div>
    </>
  );
};
