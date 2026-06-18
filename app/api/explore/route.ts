import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeOrFilterValue } from "@/lib/postgrest-filter";
import { CONTINENTS, countriesInContinent, isValidCountry } from "@/lib/countries";

export const dynamic = "force-dynamic";

const VALID_SORTS = new Set([
  "score",
  "created_at",
  "updated_at",
  "followers",
  "nominations",
  "endorsements",
  "following",
  "followers_me",
]);

const VALID_FILTERS = new Set([
  "score",
  "created_at",
  "updated_at",
  "followers",
  "nominations",
  "endorsements",
]);

function normalizeSearchValue(value: string | null | undefined) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getSearchRelevance(profile: any, query: string) {
  const username = normalizeSearchValue(profile.username);
  const name = normalizeSearchValue(profile.name);

  if (username === query) return 0;
  if (username.startsWith(query)) return 1;
  if (name === query) return 2;
  if (name.startsWith(query)) return 3;
  if (username.includes(query)) return 4;
  if (name.includes(query)) return 5;
  return 6;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "24", 10);
    const rawSort = searchParams.get("sort") || "score";
    const q = searchParams.get("q") || "";
    const rawFilter = searchParams.get("filter") || "score";
    const sort = VALID_SORTS.has(rawSort) ? rawSort : "score";
    const filter = VALID_FILTERS.has(rawFilter) ? rawFilter : "score";

    const startIndex = page * limit;
    const endIndex = startIndex + limit - 1;
    const normalizedQuery = normalizeSearchValue(q);

    const supabase = await createClient();

    // Use the view that has pre-calculated counts
    let query = supabase
      .from("profiles_explore")
      .select("*", { count: "exact" });

    if (q) {
      // Improved text search over username, name or tagline
      // Replace spaces with % to allow fuzzy matching (e.g. "Joaquin Giorgis" matches "JoaquinGiorgis")
      const fuzzyQ = sanitizeOrFilterValue(q).replace(/\s+/g, '%');
      if (fuzzyQ) {
        query = query.or(`username.ilike.%${fuzzyQ}%,name.ilike.%${fuzzyQ}%,tagline.ilike.%${fuzzyQ}%`);
      }
    }

    // Country / continent filter. A specific country wins over a continent.
    const countryParam = (searchParams.get("country") || "").toUpperCase();
    const continentParam = searchParams.get("continent") || "";
    let filterCountryCodes: string[] = [];
    if (isValidCountry(countryParam)) {
      filterCountryCodes = [countryParam];
    } else if ((CONTINENTS as readonly string[]).includes(continentParam)) {
      filterCountryCodes = countriesInContinent(continentParam);
    }
    const countryFilterActive = filterCountryCodes.length > 0;
    if (countryFilterActive) {
      query = query.in("country", filterCountryCodes);
    }

    // We might need the user object for certain filters
    const { data: { user } } = await supabase.auth.getUser();

    // Sort mapping
    let sortField = "builder_score";
    let isFollowingFilter = false;
    let isFollowersMeFilter = false;

    if (sort === 'following') {
      isFollowingFilter = true;
    } else if (sort === 'followers_me') {
      isFollowersMeFilter = true;
      sortField = "updated_at"; // Placeholder logic for now if needed, but we handle score below
    } else {
      sortField = {
        'score': 'builder_score',
        'created_at': 'created_at',
        'updated_at': 'updated_at',
        'followers': 'followers_count',
        'nominations': 'nominations_count',
        'endorsements': 'endorsements_count'
      }[sort] || 'builder_score';
    }

    if (isFollowingFilter) {
      if (!user) {
        return NextResponse.json({ error: "Debes estar logueado para ver a quién seguís." }, { status: 401 });
      }

      const { data: followsData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = (followsData || []).map(f => f.following_id);
      if (followingIds.length === 0) {
        return NextResponse.json({ profiles: [], count: 0, hasMore: false }, { status: 200 });
      }
      query = query.in("id", followingIds);
    } else if (isFollowersMeFilter) {
      if (!user) {
        return NextResponse.json({ error: "Debes estar logueado para ver quién te sigue." }, { status: 401 });
      }

      const { data: followersData } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", user.id);

      const followerIds = (followersData || []).map(f => f.follower_id);
      if (followerIds.length === 0) {
        return NextResponse.json({ profiles: [], count: 0, hasMore: false }, { status: 200 });
      }
      query = query.in("id", followerIds);
    }

    // Final Ordering Logic (Universal)
    const shouldPin = filter === "score";

    if (shouldPin) {
      // PIN WINNERS/PRO FIRST
      query = query.order("is_winner", { ascending: false, nullsFirst: false });
      query = query.order("pro_since", { ascending: false, nullsFirst: false });
      query = query.order(sortField, { ascending: false });
    } else {
      // ABSOLUTE SORT (Respect field above all)
      query = query.order(sortField, { ascending: false });
      query = query.order("is_winner", { ascending: false, nullsFirst: false });
      query = query.order("pro_since", { ascending: false, nullsFirst: false });
      query = query.order("created_at", { ascending: false });
    }

    if (normalizedQuery) {
      const searchWindowEnd = Math.max(endIndex, 199);
      query = query.range(0, searchWindowEnd);
    } else {
      query = query.range(startIndex, endIndex);
    }

    const { data, error, count } = await query;

    if (error) {
      // Resilient to the `country` column/view not existing yet (i.e. the
      // migration hasn't been applied): degrade to "no results for this filter"
      // instead of a 500, so Explore keeps working before the migration lands.
      if (countryFilterActive && (error.code === "42703" || /country/i.test(error.message || ""))) {
        return NextResponse.json(
          { profiles: [], count: 0, hasMore: false, countryUnavailable: true },
          { status: 200 }
        );
      }
      console.error("Explore API DB error:", error);
      return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }

    let profiles = data || [];

    if (normalizedQuery) {
      profiles = [...profiles].sort((a, b) => {
        const relevanceDiff = getSearchRelevance(a, normalizedQuery) - getSearchRelevance(b, normalizedQuery);
        if (relevanceDiff !== 0) return relevanceDiff;
        return 0;
      }).slice(startIndex, endIndex + 1);
    }

    return NextResponse.json({ profiles, count, hasMore: (startIndex + limit) < (count || 0) }, { status: 200 });
  } catch (error) {
    console.error("Explore API error:", error);
    return NextResponse.json({ error: "Interal Server Error" }, { status: 500 });
  }
}
