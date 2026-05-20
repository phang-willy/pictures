"use client";

import { useState } from "react";
import { CameraIcon, EarthIcon, HistoryIcon, Map, MapPin, X } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { CountryFlag } from "./country-flag";

type MapHistoryProps = {
  selectedContinentName: string | null;
  selectedCountryName: string | null;
  selectedCountryIso2: string | null;
  selectedCityName: string | null;
  selectedPostName: string | null;
  onFocusWorld: () => void;
  onFocusContinent: () => void;
  onFocusCountry: () => void;
  onFocusCity: () => void;
  onFocusPost: () => void;
};

export function MapHistory({
  selectedContinentName,
  selectedCountryName,
  selectedCountryIso2,
  selectedCityName,
  selectedPostName,
  onFocusWorld,
  onFocusContinent,
  onFocusCountry,
  onFocusCity,
  onFocusPost,
}: MapHistoryProps) {
  const DEFAULT_OPEN = false;
  const [open, setOpen] = useState(DEFAULT_OPEN);

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-80 max-w-1/2 xl:max-w-1/8 w-full">
        {!open ? (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => setOpen(true)}
            aria-expanded={false}
            aria-controls="map-history-panel"
          >
            <HistoryIcon className="size-4" aria-hidden />
            Historique
          </Button>
        ) : (
        <Card id="map-history-panel">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Historique</CardTitle>
            <CardAction>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setOpen(false)}
                aria-expanded
                aria-controls="map-history-panel"
                aria-label="Réduire l'historique"
              >
                <X className="size-4" aria-hidden />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 xl:space-y-1 text-xs sm:text-sm">
              <li>
                <Button
                  type="button"
                  variant="ghost"
                  size="default"
                  onClick={onFocusWorld}
                  className="h-auto justify-start text-left"
                >
                  <EarthIcon className="size-4" aria-hidden />
                  <span>Monde</span>
                </Button>
              </li>
              {selectedContinentName !== null && (
                <li>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onFocusContinent}
                    className="h-auto justify-start text-left"
                  >
                    <Map className="size-4" aria-hidden />
                    {selectedContinentName}
                  </Button>
                </li>
              )}
              {selectedCountryName !== null && (
                <li>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onFocusCountry}
                    className="h-auto justify-start text-left"
                  >
                    {selectedCountryIso2 ? (
                      <CountryFlag
                        name={selectedCountryName}
                        iso2={selectedCountryIso2}
                        className="flex items-center gap-1.5"
                      />
                    ) : (
                      <span>{selectedCountryName}</span>
                    )}
                  </Button>
                </li>
              )}
              {selectedCityName !== null && (
                <li>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onFocusCity}
                    className="h-auto justify-start text-left"
                  >
                    <MapPin className="size-4" aria-hidden />
                    <span>{selectedCityName}</span>
                  </Button>
                </li>
              )}
              {selectedPostName !== null && (
                <li>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onFocusPost}
                    className="h-auto justify-start text-left"
                  >
                    <CameraIcon className="size-4" aria-hidden />
                    <span>{selectedPostName}</span>
                  </Button>
                </li>
              )}
            </ol>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}