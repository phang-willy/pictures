import type { PostHttpDetail } from "@/types/post.types";

type CityUrlParts = {
  slug: string;
  country: {
    slug: string;
  };
};

export function singlePostURL(post: PostHttpDetail) {
  const url = `${post.city.country.slug}-${post.city.slug}-${post.slug}`;
  return url.toLowerCase();
}

export function singleCityUrl(city: CityUrlParts) {
  const url = `${city.country.slug}-${city.slug}`;
  return url.toLowerCase();
}
