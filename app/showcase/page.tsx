import { redirect } from "next/navigation";

// /showcase is retired — the weekly winner now surfaces in the discovery rail
// (linking to the profile) and ranking lives in /leaderboard. Redirect (not a
// hard 404) so old links in emails / external sites / the sitemap keep working.
export default function ShowcasePage() {
  redirect("/leaderboard");
}
