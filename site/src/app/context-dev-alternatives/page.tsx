import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlternativesPage, alternativesMetadata } from "@/components/site/alternatives";
import { contextDevAlternatives } from "@/lib/alternatives";

const data = contextDevAlternatives();

export function generateMetadata(): Metadata {
  return data ? alternativesMetadata(data) : {};
}

export default function ContextDevAlternativesPage() {
  if (!data) notFound();
  return <AlternativesPage data={data} />;
}
