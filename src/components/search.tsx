import { matchSorter } from "match-sorter";
import { type FunctionComponent, type JSX } from "preact";
import { sample } from "lodash-es";

import { useComputed, useSignal } from "@preact/signals";
import { chunk } from "lodash-es";
import { useEffect } from "preact/hooks";
import { type SearchTheme } from "../searchThemes";
import { OS9Button } from "./OS9Button";
import { SingleTheme } from "./singleTheme";

interface SearchFormProps {
  themes: SearchTheme[];
}

interface FormElements extends HTMLFormControlsCollection {
  searchInput: HTMLInputElement;
}

const pageSize = 51;

export const SearchForm: FunctionComponent<SearchFormProps> = (props) => {
  const searchQuery = useSignal("");
  const page = useSignal(1);
  const themes = props.themes;
  const inputKey = useSignal("");
  const onLoad = () => {
    const initialSearchQuery =
      new URLSearchParams(window.location.search).get("q") ?? "";
    searchQuery.value = initialSearchQuery;
    inputKey.value = initialSearchQuery;
    const initialPage =
      parseInt(
        new URLSearchParams(window.location.search).get("page") ?? "1",
      ) || 1;
    page.value = initialPage;
  };

  useEffect(() => {
    onLoad();
    window.addEventListener("popstate", onLoad);
    return () => window.removeEventListener("popstate", onLoad);
  }, []);
  const searchResults = useComputed(() => {
    if (!searchQuery.value.trim()) {
      return [[]];
    }

    const results = chunk(
      matchSorter(themes, searchQuery.value.trim(), {
        keys: ["name", "authors.*.name", "year", "archiveFile"],
        threshold: matchSorter.rankings.CONTAINS,
      }),
      pageSize,
    );
    if (results.length < 1) {
      return [[]];
    }
    return results;
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

    searchQuery.value = (e.target.elements as FormElements).searchInput.value;
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
        <form action="#" onSubmit={onChange}>
          <input
            key={inputKey.value}
            type="search"
            name="searchInput"
            defaultValue={searchQuery.value}
            autoFocus
          />
          <OS9Button asButton type={"submit"}>
            Search
          </OS9Button>
          <OS9Button
            asButton
            type={"button"}
            onClick={() => {
              const random = sample(props.themes);
              if (random) {
                window.location.pathname = `/themes/${random.urlBase}`;
              }
            }}
          >
            Random
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
            <div class="pagination-buttons">
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
            </div>
          )}
        </div>
      </section>
      <div class="themes-grid">
        {searchResults.value[pageIndex.value].map((t) => {
          return (
            <div>
              {/* @ts-expect-error */}
              <SingleTheme theme={t} authors={t.authors}></SingleTheme>
            </div>
          );
        })}
      </div>
    </>
  );
};
