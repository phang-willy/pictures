"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthed } from "@/app/(authed)/authed-provider";

const ProfilePage = () => {
  const { user } = useAuthed();

  return (
    <section className="w-full container mx-auto p-4 xl:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Connecté en tant que <span className="font-bold">{user?.email}</span></p>
          <p className="text-muted-foreground">Rôle: <span className="font-bold">{user?.role}</span></p>
        </CardContent>
      </Card>
    </section>
  );
};

export default ProfilePage;
