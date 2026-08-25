import { SITE_URL } from "@/lib/site-url";

/**
 * schema.org builders shared by the public routes. Every one of these ends up
 * inside a <script type="application/ld+json"> and MUST be serialized with
 * `safeJsonLd` from lib/json-ld.ts (user-controlled names/taglines flow into
 * several of them).
 */

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

type Crumb = { name: string; path: string };

/**
 * BreadcrumbList — gives Google the "huevsite.io › Builders › @user" trail
 * shown under the result instead of the raw URL, and helps it understand the
 * site hierarchy on a flat, mostly-username URL structure.
 */
export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path === "/" ? "" : crumb.path}`,
    })),
  };
}

type ProfileLdInput = {
  username: string;
  displayName: string;
  description: string;
  url: string;
  image?: string | null;
  location?: string | null;
  roles?: string[];
  skills?: string[];
  sameAs?: string[];
  createdAt?: string | null;
};

/**
 * ProfilePage + Person. This is the single highest-value schema on the site:
 * Google has a dedicated ProfilePage treatment for creator/portfolio pages,
 * and it is what makes a builder's own name query resolve to their huevsite
 * profile (knowledge-panel style) rather than to a random social account.
 */
export function profilePageLd({
  username,
  displayName,
  description,
  url,
  image,
  location,
  roles = [],
  skills = [],
  sameAs = [],
  createdAt,
}: ProfileLdInput) {
  const person: Record<string, unknown> = {
    "@type": "Person",
    "@id": `${url}#person`,
    name: displayName,
    alternateName: `@${username}`,
    identifier: username,
    description,
    url,
  };

  if (image) person.image = image;
  if (location) person.homeLocation = { "@type": "Place", name: location };
  if (roles.length) person.jobTitle = roles.slice(0, 3).join(", ");
  if (skills.length) person.knowsAbout = skills.slice(0, 20);
  if (sameAs.length) person.sameAs = sameAs;

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#profilepage`,
    url,
    name: `${displayName} (@${username})`,
    description,
    ...(createdAt ? { dateCreated: createdAt } : {}),
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: person,
  };
}

type ListItemInput = { name: string; url: string; description?: string };

/**
 * CollectionPage + ItemList for the directory routes (/explore, /leaderboard,
 * /recruiter, /builders-de-la-semana). Tells crawlers these are curated lists
 * of profiles — the difference between "a page with links" and an indexable
 * directory that can surface individual builders.
 */
export function collectionPageLd({
  name,
  description,
  url,
  items,
}: {
  name: string;
  description: string;
  url: string;
  items: ListItemInput[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    url,
    name,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    // An ItemList with zero entries is worse than no ItemList — it tells
    // crawlers the collection is empty. Pages whose list is client-fetched
    // emit the CollectionPage alone.
    ...(items.length
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: items.length,
            itemListElement: items.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: item.url,
              name: item.name,
              ...(item.description ? { description: item.description } : {}),
            })),
          },
        }
      : {}),
  };
}

/**
 * SoftwareApplication + offers for /precios. Makes the plan lineup eligible
 * for price-annotated results and is the structured answer an LLM quotes when
 * asked "how much does huevsite cost".
 */
export function pricingLd({
  name,
  description,
  url,
  offers,
}: {
  name: string;
  description: string;
  url: string;
  offers: { name: string; price: string; currency?: string; recurring?: boolean; description?: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name,
    description,
    url,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: ["es", "en"],
    publisher: { "@id": ORGANIZATION_ID },
    offers: offers.map((offer) => ({
      "@type": "Offer",
      name: offer.name,
      price: offer.price,
      priceCurrency: offer.currency ?? "USD",
      url,
      availability: "https://schema.org/InStock",
      ...(offer.description ? { description: offer.description } : {}),
      ...(offer.recurring
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: offer.price,
              priceCurrency: offer.currency ?? "USD",
              billingDuration: 1,
              billingIncrement: 1,
              unitCode: "MON",
            },
          }
        : {}),
    })),
  };
}
