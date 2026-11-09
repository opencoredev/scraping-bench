import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlternativesPage, alternativesMetadata } from "@/components/site/alternatives";
import { firecrawlAlternatives } from "@/lib/alternatives";

const data = firecrawlAlternatives();

export function generateMetadata(): Metadata {
  return data ? alternativesMetadata(data) : {};
}

export default function FirecrawlAlternativesPage() {
  if (!data) notFound();
  return <AlternativesPage data={data} />;
}
