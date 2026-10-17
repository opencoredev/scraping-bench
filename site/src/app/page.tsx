import { BenchPage } from "@/components/bench/bench-page";
import { results } from "@/lib/results";

export default function Home() {
  return <BenchPage results={results} />;
}
