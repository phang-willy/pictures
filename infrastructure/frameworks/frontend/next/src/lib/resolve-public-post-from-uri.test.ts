import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CityHttpDetail } from "@/types/city.types";
import type { PostHttpDetail } from "@/types/post.types";

const apiMocks = vi.hoisted(() => ({
  serverFetchAllActiveCities: vi.fn(),
  serverFetchAllActivePosts: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

vi.mock("react", () => ({
  cache: <T extends (...args: never[]) => unknown>(fn: T): T => fn,
}));

import { resolveActivePublicPostFromUriSegment } from "./resolve-public-post-from-uri";

const france = {
  id: "country-fr",
  name: "France",
  iso2: "FR",
  iso3: "FRA",
  slug: "fr",
  continent: {
    id: "continent-eu",
    code: "EU",
    name: "Europe",
  },
};

function city(id: string, slug: string, name: string): CityHttpDetail {
  return {
    id,
    name,
    slug,
    latitude: 0,
    longitude: 0,
    deactivatedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    country: france,
  };
}

function post(cityDetail: CityHttpDetail, slug: string): PostHttpDetail {
  return {
    id: `post-${cityDetail.id}-${slug}`,
    name: slug,
    slug,
    description: null,
    content: null,
    latitude: cityDetail.latitude,
    longitude: cityDetail.longitude,
    deactivatedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    city: {
      id: cityDetail.id,
      name: cityDetail.name,
      slug: cityDetail.slug,
      latitude: cityDetail.latitude,
      longitude: cityDetail.longitude,
      country: cityDetail.country,
    },
  };
}

describe("resolveActivePublicPostFromUriSegment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches active posts once outside ambiguous city-prefix resolution", async () => {
    const shortCity = city("city-par", "par", "Par");
    const longCity = city("city-par-is", "par-is", "Par Is");
    const matchingPost = post(shortCity, "is-target");

    apiMocks.serverFetchAllActiveCities.mockResolvedValue([
      shortCity,
      longCity,
    ]);
    apiMocks.serverFetchAllActivePosts.mockResolvedValue([matchingPost]);

    await expect(
      resolveActivePublicPostFromUriSegment("fr-par-is-target"),
    ).resolves.toEqual({
      post: matchingPost,
      city: shortCity,
    });

    expect(apiMocks.serverFetchAllActivePosts).toHaveBeenCalledTimes(1);
    expect(apiMocks.serverFetchAllActivePosts).toHaveBeenCalledWith(undefined);
  });

  it("does not fetch posts when no city prefix matches", async () => {
    apiMocks.serverFetchAllActiveCities.mockResolvedValue([
      city("city-par", "par", "Par"),
    ]);

    await expect(
      resolveActivePublicPostFromUriSegment("fr-lyon-target"),
    ).resolves.toBeNull();

    expect(apiMocks.serverFetchAllActivePosts).not.toHaveBeenCalled();
  });
});
