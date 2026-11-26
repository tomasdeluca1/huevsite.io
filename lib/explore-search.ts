export function getInitialExploreSearch(query: string | undefined, readStoredSearch: () => string | null) {
  return query ?? readStoredSearch() ?? "";
}

export function getUpdatedExploreSearchUrl(href: string, search: string) {
  const url = new URL(href);
  if (url.searchParams.get("q") === (search || null)) return null;
  if (search) {
    url.searchParams.set("q", search);
  } else {
    url.searchParams.delete("q");
  }
  return url;
}
