"use client";

import { ProfileChangePasswordCard } from "@/app/(authed)/profile/profile-change-password-card";
import { ProfileInfoCard } from "@/app/(authed)/profile/profile-info-card";

const ProfilePage = () => {
  return (
    <section className="w-full container mx-auto px-4 py-8 space-y-8">
      <ProfileInfoCard />
      <ProfileChangePasswordCard />
    </section>
  );
};

export default ProfilePage;
