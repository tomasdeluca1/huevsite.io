export function getInitialExploreSearch(query: string | undefined, readStoredSearch: () => string | null) {
  return query ?? readStoredSearch() ?? "";
}
