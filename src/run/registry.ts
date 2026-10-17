import type { Adapter } from "../core/types.ts";
import { adapters as providerAdapters } from "../adapters/index.ts";
export const adapters: readonly Adapter[] = Object.values(providerAdapters);
