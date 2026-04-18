import { CountryAdmin } from "./data-table";

export const dynamic = "force-dynamic";

export default function AdminCountryPage() {
  return (
    <section className="container mx-auto space-y-8">
      <CountryAdmin />
    </section>
  );
}
