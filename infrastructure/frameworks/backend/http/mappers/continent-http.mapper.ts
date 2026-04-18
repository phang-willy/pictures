export type ContinentForSelect = {
  id: string;
  code: string;
  name: string;
};

export function toContinentListItemHttp(row: ContinentForSelect) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
  };
}
