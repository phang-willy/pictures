import { PagesRootShell } from "@/components/base/pages-root-shell";

import { PagesStack } from "./pages-stack";

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <PagesRootShell>
      <PagesStack>{children}</PagesStack>
    </PagesRootShell>
  );
}
