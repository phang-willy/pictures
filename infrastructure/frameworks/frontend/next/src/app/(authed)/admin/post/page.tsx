import { PostAdmin } from "./data-table";

export const dynamic = "force-dynamic";

export default function AdminPostPage() {
  return (
    <section className="container mx-auto space-y-8">
      <PostAdmin />
    </section>
  );
}
