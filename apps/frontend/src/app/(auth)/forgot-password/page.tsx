import { Suspense } from "react";
import { ForgotPasswordPageClient } from "@/app/(auth)/forgot-password/forgot-password-page-client";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPageClient />
    </Suspense>
  );
}
