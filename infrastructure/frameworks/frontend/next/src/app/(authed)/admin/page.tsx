import { KpiCard } from "@/components/admin/kpi-card";
import { User, Camera, Earth, MapPin } from "lucide-react";

export default function AdminPage() {
  return (
    <>
      <section id="information" className="space-y-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        </div>
      </section>
      <section id="posts"className="space-y-4">
        <h2 className="text-lg font-medium">Publications</h2>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <li>
            <KpiCard 
              title="Total"
              value={5}
              icon={<Camera />}
            />
          </li>
          <li>
            <KpiCard 
              title="Actifs"
              value={5}
              icon={<Camera />}
            />
          </li>
          <li>
            <KpiCard 
              title="Inactives"
              value={5}
              icon={<Camera />}
            />
          </li>
        </ul>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <li>
            <KpiCard 
              title="Cette année"
              subtitle="2026"
              value={5}
              icon={<Camera />}
            />
          </li>
          <li>
            <KpiCard 
              title="Ce mois-ci"
              subtitle="mai 2026"
              value={5}
              icon={<Camera />}
            />
          </li>
          <li>
            <KpiCard 
              title="7 derniers jours"
              subtitle="14-21 mai 2026"
              value={5}
              icon={<Camera />}
            />
          </li>
          <li>
            <KpiCard 
              title="Aujourd'hui"
              subtitle="21 mai 2026"
              value={5}
              icon={<Camera />}
            />
          </li>
        </ul>
      </section>
      <section id="countries"className="space-y-4">
        <h2 className="text-lg font-medium">Pays</h2>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <li>
            <KpiCard 
              title="Total"
              value={5}
              icon={<Earth />}
            />
          </li>
          <li>
            <KpiCard 
              title="Actifs"
              value={5}
              icon={<Earth />}
            />
          </li>
          <li>
            <KpiCard 
              title="Inactifs"
              value={5}
              icon={<Earth />}
            />
          </li>
        </ul>
      </section>
      <section id="cities"className="space-y-4">
        <h2 className="text-lg font-medium">Villes</h2>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <li>
            <KpiCard 
              title="Total"
              value={5}
              icon={<MapPin />}
            />
          </li>
          <li>
            <KpiCard 
              title="Actives"
              value={5}
              icon={<MapPin />}
            />
          </li>
          <li>
            <KpiCard 
              title="Inactives"
              value={5}
              icon={<MapPin />}
            />
          </li>
        </ul>
      </section>
      <section id="users"className="space-y-4">
        <h2 className="text-lg font-medium">Utilisateurs</h2>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <li>
            <KpiCard 
              title="Total"
              value={5}
              icon={<User />}
            />
          </li>
          <li>
            <KpiCard 
              title="Actifs"
              value={5}
              icon={<User />}
            />
          </li>
          <li>
            <KpiCard 
              title="Inactifs"
              value={5}
              icon={<User />}
            />
          </li>
        </ul>
      </section>
    </>
  );
}