import { CityAdmin } from "./data-table";

export const dynamic = "force-dynamic";

export default function AdminCityPage() {
  return (
    <section className="container mx-auto space-y-8">
      <CityAdmin />
    </section>
  );
}
