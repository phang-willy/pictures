"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthed } from "@/app/(authed)/authed-provider";

export function ProfileInfoCard() {
  const { user } = useAuthed();

  return (
    <section id="profile-info">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="wrap-break-word text-black dark:text-white">
            Connecté en tant que <span className="font-bold">{user?.email}</span>
          </p>
          <p className="text-black dark:text-white">
            Rôle: <span className="font-bold">{user?.role}</span>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
