"use client";

import { ProfileChangePasswordCard } from "@/app/(authed)/profile/profile-change-password-card";
import { ProfileInfoCard } from "@/app/(authed)/profile/profile-info-card";

const ProfilePage = () => {
  return (
    <>
      <section id="information" className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Profil</h1>
      </section>
      <ProfileInfoCard />
      <ProfileChangePasswordCard />
    </>
  );
};

export default ProfilePage;
