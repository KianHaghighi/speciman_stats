import { log } from "./logger";

export function safe<T>(fn: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  return fn().then(
    (data) => ({ ok: true as const, data }),
    (e) => {
      log.error("Unhandled server error", { error: (e as Error)?.message });
      return { ok: false as const, error: "Something went wrong. Please try again." };
    }
  );
}
