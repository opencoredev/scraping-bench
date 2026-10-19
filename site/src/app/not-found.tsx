import Link from "next/link";
import { PageShell } from "@/components/site/chrome";

export default function NotFound() {
  return (
    <PageShell>
      <h1 className="pt-16 pb-3 text-2xl font-medium tracking-[-0.02em]">Page not found</h1>
      <p className="max-w-prose pb-24 text-sm text-muted-foreground">
        That page isn&apos;t here. The{" "}
        <Link href="/" className="text-foreground underline decoration-foreground/30 underline-offset-[3px] hover:decoration-foreground">
          results
        </Link>{" "}
        are on the home page.
      </p>
    </PageShell>
  );
}
