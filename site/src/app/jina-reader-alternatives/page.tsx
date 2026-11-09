import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlternativesPage, alternativesMetadata } from "@/components/site/alternatives";
import { jinaAlternatives } from "@/lib/alternatives";

const data = jinaAlternatives();

export function generateMetadata(): Metadata {
  return data ? alternativesMetadata(data) : {};
}

export default function JinaReaderAlternativesPage() {
  if (!data) notFound();
  return <AlternativesPage data={data} />;
}
