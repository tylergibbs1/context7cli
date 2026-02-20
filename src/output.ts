import type { CLIResult } from "./types.js";

export function success<T>(data: T): never {
  const result: CLIResult<T> = { ok: true, data };
  process.stdout.write(JSON.stringify(result) + "\n");
  process.exit(0);
}

export function failure(error: string): never {
  const result: CLIResult<never> = { ok: false, error };
  process.stdout.write(JSON.stringify(result) + "\n");
  process.exit(1);
}

export function log(msg: string): void {
  process.stderr.write(msg + "\n");
}
