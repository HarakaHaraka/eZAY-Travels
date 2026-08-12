import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The Duffel access token is like a password for the account — anyone holding
 * it can spend money or read other customers' bookings. Duffel therefore
 * forbids calling their API from a browser, and requires a backend that holds
 * the token and sits between the frontend and Duffel.
 *
 * This app does exactly that: the token is read only in src/lib/config.ts
 * (which is `import 'server-only'`), and the Duffel gateway is called only
 * from server routes and server components. This test locks that in — it
 * fails the build if any Client Component ("use client") imports the config
 * or the Duffel gateway, either of which would risk pulling the token, or the
 * means to use it, into the browser bundle.
 */

const SRC = path.join(process.cwd(), 'src');

async function sourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(full);
      return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
    })
  );
  return nested.flat();
}

function isClientComponent(contents: string): boolean {
  // The 'use client' directive must be the first statement; a simple check of
  // the opening bytes is enough and avoids matching it inside a comment.
  const head = contents.replace(/^﻿/, '').trimStart().slice(0, 40);
  return head.startsWith("'use client'") || head.startsWith('"use client"');
}

const FORBIDDEN_IN_CLIENT = [
  /from\s+['"]@\/lib\/config['"]/,
  /from\s+['"]@\/lib\/duffel(?:\/[^'"]*)?['"]/,
  /from\s+['"].*duffelGateway['"]/,
  /from\s+['"]@duffel\/api['"]/,
];

describe('Duffel token isolation', () => {
  it('no Client Component imports the config or the Duffel gateway', async () => {
    const files = await sourceFiles(SRC);
    const offenders: string[] = [];

    for (const file of files) {
      const contents = await readFile(file, 'utf8');
      if (!isClientComponent(contents)) continue;
      if (FORBIDDEN_IN_CLIENT.some((pattern) => pattern.test(contents))) {
        offenders.push(path.relative(process.cwd(), file));
      }
    }

    expect(
      offenders,
      `These Client Components import server-only config or the Duffel gateway. The token must never be reachable from the browser — call the /api/fares/* backend instead:\n${offenders.join('\n')}`
    ).toEqual([]);
  });

  it('the Duffel SDK is imported only inside src/lib/duffel/', async () => {
    const files = await sourceFiles(SRC);
    const importers: string[] = [];
    const duffelDir = path.join(SRC, 'lib', 'duffel') + path.sep;

    for (const file of files) {
      const contents = await readFile(file, 'utf8');
      if (/from\s+['"]@duffel\/api['"]/.test(contents) && !file.startsWith(duffelDir)) {
        importers.push(path.relative(process.cwd(), file));
      }
    }

    expect(
      importers,
      `The @duffel/api SDK must stay inside src/lib/duffel/. Found in:\n${importers.join('\n')}`
    ).toEqual([]);
  });

  it('detects a violation when one is introduced', () => {
    // Guards the guard, so the scans above cannot pass vacuously.
    expect(isClientComponent("'use client';\nimport x from 'y';")).toBe(true);
    expect(isClientComponent("import x from 'y';")).toBe(false);
    expect(FORBIDDEN_IN_CLIENT.some((p) => p.test("import { config } from '@/lib/config';"))).toBe(true);
    expect(FORBIDDEN_IN_CLIENT.some((p) => p.test("import { flightGateway } from '@/lib/duffel';"))).toBe(true);
    expect(FORBIDDEN_IN_CLIENT.some((p) => p.test("import { formatMoney } from '@/lib/money';"))).toBe(false);
  });
});
