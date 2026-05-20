/** Résumé court post (SEO / chapô), même contrainte que la colonne DB. */
export const POST_SHORT_DESCRIPTION_MIN_LEN = 120;
export const POST_SHORT_DESCRIPTION_MAX_LEN = 160;

export function assertPostShortDescriptionLength(description: string): string {
  const t = description.trim();
  if (t.length < POST_SHORT_DESCRIPTION_MIN_LEN || t.length > POST_SHORT_DESCRIPTION_MAX_LEN) {
    throw new Error(
      `La description doit contenir entre ${POST_SHORT_DESCRIPTION_MIN_LEN} et ${POST_SHORT_DESCRIPTION_MAX_LEN} caractères.`,
    );
  }
  return t;
}
