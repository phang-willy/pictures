import { cache } from "react";
import {
  serverFetchAllActiveCities,
  serverFetchAllActivePosts,
} from "@/lib/api";
import type { CityHttpDetail } from "@/types/city.types";
import type { PostHttpDetail } from "@/types/post.types";

const citiesCatalog = cache(async () => serverFetchAllActiveCities(undefined));
const postIndexCatalog = cache(async () => {
  const posts = await serverFetchAllActivePosts(undefined);
  const index = new Map<string, Map<string, PostHttpDetail>>();

  for (const post of posts) {
    if (post.deactivatedAt != null) {
      continue;
    }

    let cityPosts = index.get(post.city.id);
    if (!cityPosts) {
      cityPosts = new Map<string, PostHttpDetail>();
      index.set(post.city.id, cityPosts);
    }

    cityPosts.set(post.slug.toLowerCase(), post);
  }

  return index;
});

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

  const matchingCandidates: Array<{
    city: CityHttpDetail;
    postSlug: string;
  }> = [];

  for (const { city, prefix } of candidates) {
    if (!raw.startsWith(prefix)) {
      continue;
    }
    const postSlug = raw.slice(prefix.length);
    if (!postSlug) {
      continue;
    }

    matchingCandidates.push({ city, postSlug });
  }

  if (matchingCandidates.length === 0) {
    return null;
  }

  const postIndex = await postIndexCatalog();

  for (const { city, postSlug } of matchingCandidates) {
    const post = postIndex.get(city.id)?.get(postSlug);
    if (!post) {
      continue;
    }

    return { post, city };
  }

  return null;
}
