import { cookies } from "next/headers";
import { apiUrl } from "@/lib/api";
import { parseCountryListItems, type CountryRow } from "@shared/schemas";
import { CountryAdmin } from "./data-table";

async function getCountries(): Promise<CountryRow[]> {
  const jar = await cookies();
  const cookieHeader = jar
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const res = await fetch(apiUrl("/api/country"), {
    cache: "no-store",
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
  });
  if (!res.ok) {
    throw new Error("Impossible de charger la liste des pays.");
  }
  const json = (await res.json()) as unknown;
  return parseCountryListItems(json);
}

export default async function AdminCountryPage() {
  let countries: CountryRow[] = [];
  let loadError: string | null = null;
  try {
    countries = await getCountries();
  } catch {
    loadError = "Erreur lors du chargement des pays.";
  }

  return (
    <section className="container mx-auto space-y-8">
      <CountryAdmin initialCountries={countries} loadError={loadError} />
    </section>
  );
}
