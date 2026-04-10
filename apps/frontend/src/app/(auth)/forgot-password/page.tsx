import { Suspense } from "react";
import { ForgotPasswordPageClient } from "./forgot-password-page-client";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordPageClient />
    </Suspense>
  );
}
