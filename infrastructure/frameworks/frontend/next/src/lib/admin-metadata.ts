import { appName } from "@/config/app-name";
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

async function fetchResourceNameById(
  resource: string,
  id: string,
): Promise<string | null> {
  try {
    const response = await fetch(
      apiUrl(`/api/${resource}/${encodeURIComponent(id)}`),
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

  const resources = [
    {
      name: "Pays",
      singular: "pays",
      path: "country",
      article: "un",
    },
    {
      name: "Villes",
      singular: "ville",
      path: "city",
      article: "une",
    },
    {
      name: "Posts",
      singular: "post",
      path: "post",
      article: "un",
    },
  ];

  const resource = resources.find((r) => r.path === segments[1]) ?? null;
  const action = segments[2];
  const id = segments[3];

  if (resource) {
    if (!action) {
      return {
        title: adminTitle(resource.name),
        description: `${appName} - Liste et gestion des ${resource.singular}.`,
      };
    }

    if (action === "new") {
      return {
        title: adminTitle(resource.name, "Nouveau"),
        description: `${appName} - Créer ${resource.article} ${resource.singular}.`,
      };
    }

    const needsName =
      id &&
      (action === "view" ||
        action === "edit" ||
        action === "delete" ||
        action === "activate");

    const resourceName = needsName
      ? await fetchResourceNameById(resource.path, id)
      : null;
    const nameSuffix = resourceName ?? (id ? id.slice(0, 8) : "");

    if (action === "view" && id) {
      return {
        title: adminTitle(resource.name, "Details", nameSuffix),
        description: `${appName} - Consulter ${resource.article} ${resource.singular}.`,
      };
    }
    if (action === "edit" && id) {
      return {
        title: adminTitle(resource.name, "Modification", nameSuffix),
        description: `${appName} - Modifier ${resource.article} ${resource.singular}.`,
      };
    }
    if (action === "delete" && id) {
      return {
        title: adminTitle(resource.name, "Suppression", nameSuffix),
        description: `${appName} - Supprimer ${resource.article} ${resource.singular}.`,
      };
    }
    if (action === "activate" && id) {
      return {
        title: adminTitle(resource.name, "Réactiver", nameSuffix),
        description: `${appName} - Réactiver ${resource.article} ${resource.singular}.`,
      };
    }

    return {
      title: adminTitle(resource.name),
      description: `${appName} - Gestion des ${resource.singular} .`,
    };
  }

  const fallbackResource = segments[1] ?? "Accueil";
  return {
    title: adminTitle(fallbackResource),
    description: `${appName} - Administration : ${fallbackResource}.`,
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
