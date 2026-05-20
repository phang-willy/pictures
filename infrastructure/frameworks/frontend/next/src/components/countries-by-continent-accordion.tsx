"use client";

import { CountryFlag } from "@/components/country-flag";
import { EmbedMapDynamic } from "@/components/embed-map-dynamic";
import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { countryGeometryCenter } from "@/lib/country-geometry-center";
import type { CountryListHttpItem } from "@/types/country.types";
import Link from "next/link";

export type PaysContinentGroup = {
  continentId: string;
  continentName: string;
  countries: CountryListHttpItem[];
};

export function CountriesByContinentAccordion({
  groups,
}: {
  groups: PaysContinentGroup[];
}) {
  const [openContinents, setOpenContinents] = React.useState<string[]>([]);

  return (
    <section className="container mx-auto space-y-6 p-4">
      <Accordion
        type="multiple"
        className="w-full border rounded-lg bg-card"
        value={openContinents}
        onValueChange={setOpenContinents}
      >
        {groups.map((group) => {
          const sectionOpen = openContinents.includes(group.continentId);
          return (
            <AccordionItem
              key={group.continentId}
              value={group.continentId}
              className="border-b last:border-b-0 px-4"
            >
              <AccordionTrigger className="text-base hover:no-underline">
                <span className="flex flex-wrap items-baseline gap-x-2 text-lg font-bold tracking-tight">
                  <span>{group.continentName}</span>
                  <span className="font-normal text-muted-foreground">
                    ({group.countries.length})
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {group.countries.map((country) => {
                    const center = countryGeometryCenter(country.geometry);
                    return (
                      <li key={country.id}>
                        <Card className="h-full">
                          <CardHeader>
                            <CardTitle>
                              <CountryFlag
                                name={country.name}
                                iso2={country.iso2}
                                size="base"
                              />
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-0">
                            {center && country.geometry ? (
                              sectionOpen ? (
                                <EmbedMapDynamic
                                  from="country"
                                  countryGeometry={country.geometry}
                                  ariaLabel={`Carte - ${country.name}`}
                                />
                              ) : (
                                <div
                                  className="aspect-square w-full rounded-md border border-dashed border-muted-foreground/25 bg-muted/30"
                                  aria-hidden
                                />
                              )
                            ) : (
                              <div
                                className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed border-muted-foreground/25 bg-muted/30 text-center text-muted-foreground text-xs"
                                aria-hidden
                              >
                                Carte indisponible
                              </div>
                            )}
                          </CardContent>
                          <CardFooter>
                            <Link
                              href={`/country/${encodeURIComponent(country.slug.toLowerCase())}`}
                              className="hover:underline focus:underline"
                            >
                              En savoir plus sur {country.name}
                            </Link>
                          </CardFooter>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}