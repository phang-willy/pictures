import { ImageAssetAdmin } from "./image-asset-admin";

export const dynamic = "force-dynamic";

export default function AdminImagePage() {
  return (
    <section className="container mx-auto space-y-8">
      <ImageAssetAdmin />
    </section>
  );
}
