/**
 * Nom de l’app côté navigateur et RSC.
 * Utilise `NEXT_PUBLIC_APP_NAME` (injecté depuis `APP_NAME` au chargement de `next.config`, voir `.env.exemple`).
 */
export const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Picturesssss";
