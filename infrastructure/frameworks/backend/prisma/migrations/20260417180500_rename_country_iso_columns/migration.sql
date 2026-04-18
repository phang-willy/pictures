-- Rename columns
ALTER TABLE "Country" RENAME COLUMN "codeIso2" TO "iso2";
ALTER TABLE "Country" RENAME COLUMN "codeIso3" TO "iso3";

-- Rename indexes to keep naming consistency
ALTER INDEX "Country_codeIso2_key" RENAME TO "Country_iso2_key";
ALTER INDEX "Country_codeIso3_key" RENAME TO "Country_iso3_key";
