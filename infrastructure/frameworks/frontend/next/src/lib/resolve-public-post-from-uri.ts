import { cache } from "react";
import {
  serverFetchAllActiveCities,
  serverFetchAllActivePosts,
} from "@/lib/api";
import type { CityHttpDetail } from "@/types/city.types";
import type { PostHttpDetail } from "@/types/post.types";

const citiesCatalog = cache(async () => serverFetchAllActiveCities(undefined));

/**
 * Segment d’URL public : `{countrySlug}-{citySlug}-{postSlug}` (minuscules dans les liens).
 * Les tirets dans `countrySlug` / `citySlug` / `postSlug` sont gérés en préfixant
 * par le couple pays-ville le plus long qui matche.
 */
export async function resolveActivePublicPostFromUriSegment(
  uriSegment: string,
): Promise<{ post: PostHttpDetail; city: CityHttpDetail } | null> {
  const raw = decodeURIComponent(uriSegment.trim()).toLowerCase();
  if (!raw) {
    return null;
  }

  const cities = await citiesCatalog();
  const candidates = cities
    .map((city) => ({
      city,
      prefix: `${city.country.slug.toLowerCase()}-${city.slug.toLowerCase()}-`,
    }))
    .sort((a, b) => b.prefix.length - a.prefix.length);

  for (const { city, prefix } of candidates) {
    if (!raw.startsWith(prefix)) {
      continue;
    }
    const postSlug = raw.slice(prefix.length);
    if (!postSlug) {
      continue;
    }

    const posts = await serverFetchAllActivePosts(undefined, {
      cityId: city.id,
    });
    const post = posts.find(
      (p) => p.slug.toLowerCase() === postSlug.toLowerCase(),
    );
    if (!post || post.deactivatedAt != null) {
      continue;
    }
    if (post.city.id !== city.id) {
      continue;
    }
    return { post, city };
  }

  return null;
}