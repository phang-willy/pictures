import { appName } from "@/lib/app-name";
import { apiUrl } from "@/lib/api";

/** En-tête injecté par `proxy.ts` pour `generateMetadata` du layout admin. */
export const ADMIN_PATHNAME_HEADER = "x-pathname";

const ADMIN_SEGMENT = `${appName} - Administration`;

export type AdminPageMeta = {
  title: string;
  description: string;
};

function adminTitle(...parts: string[]): string {
  const suffix = parts.filter(Boolean).join(" - ");
  return `${ADMIN_SEGMENT} - ${suffix}`;
}

async function fetchCountryNameById(id: string): Promise<string | null> {
  try {
    const response = await fetch(
      apiUrl(`/api/country/${encodeURIComponent(id)}`),
      {
        next: { revalidate: 300 },
      },
    );
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { name?: unknown };
    return typeof data.name === "string" ? data.name : null;
  } catch {
    return null;
  }
}

/**
 * Titre + description pour la zone /admin (titre : {appName} - Administration - …).
 */
export async function resolveAdminPageMetaAsync(
  pathname: string,
): Promise<AdminPageMeta> {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] !== "admin") {
    return {
      title: adminTitle("Accueil"),
      description: `Espace d'administration de ${appName}.`,
    };
  }

  const resource = segments[1];
  const action = segments[2];
  const id = segments[3];

  if (resource === "country") {
    if (!action) {
      return {
        title: adminTitle("Pays"),
        description: `Liste et gestion des pays (${appName}).`,
      };
    }

    if (action === "new") {
      return {
        title: adminTitle("Pays", "Nouveau"),
        description: `Créer un pays (${appName}).`,
      };
    }

    const needsName =
      id &&
      (action === "view" ||
        action === "edit" ||
        action === "delete" ||
        action === "activate");

    const countryName = needsName ? await fetchCountryNameById(id) : null;
    const nameSuffix = countryName ?? (id ? id.slice(0, 8) : "");

    if (action === "view" && id) {
      return {
        title: adminTitle("Pays", "Details", nameSuffix),
        description: `Consulter un pays (${appName}).`,
      };
    }
    if (action === "edit" && id) {
      return {
        title: adminTitle("Pays", "Modification", nameSuffix),
        description: `Modifier un pays (${appName}).`,
      };
    }
    if (action === "delete" && id) {
      return {
        title: adminTitle("Pays", "Suppression", nameSuffix),
        description: `Supprimer un pays (${appName}).`,
      };
    }
    if (action === "activate" && id) {
      return {
        title: adminTitle("Pays", "Réactiver", nameSuffix),
        description: `Réactiver un pays (${appName}).`,
      };
    }

    return {
      title: adminTitle("Pays"),
      description: `Gestion des pays (${appName}).`,
    };
  }

  const label = resource
    ? resource.charAt(0).toUpperCase() + resource.slice(1).replace(/-/g, " ")
    : "Accueil";

  return {
    title: adminTitle(label),
    description: `Administration : ${label} (${appName}).`,
  };
}

export async function buildAdminMetadataAsync(pathname: string) {
  const { title, description } = await resolveAdminPageMetaAsync(pathname);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website" as const,
    },
  };
}
