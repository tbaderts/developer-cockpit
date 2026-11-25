import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve(__dirname, '..', '..', 'src');
const TEXT = /\.(ts|tsx|js|mjs|cjs|html|css|json|md)$/;
/** Generated or vendored assets copied in at build time; not written by us. */
const SKIP = [path.join('renderer', 'public', 'excalidraw-assets')];

/** "oms" as a word, or as the start of oms-/oms_ names ("rooms" and "atoms" do not count). */
const PROJECT_NAME = /(?<![a-z0-9])oms(?![a-z0-9])/i;

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (SKIP.some((s) => full.includes(s))) return [];
    if (e.isDirectory()) return files(full);
    return TEXT.test(e.name) ? [full] : [];
  });
}

describe('the cockpit carries no project-specific names (SPEC-0076 AC-6)', () => {
  it('srcHasNoOmsReferences', () => {
    const all = files(SRC);
    expect(all.length).toBeGreaterThan(100);
    const hits: string[] = [];
    for (const file of all) {
      fs.readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (PROJECT_NAME.test(line)) hits.push(`${path.relative(SRC, file)}:${i + 1}: ${line.trim()}`);
        });
    }
    expect(hits).toEqual([]);
  });

  it('the pattern catches the forms it is meant to catch', () => {
    for (const s of ['OMS', 'the oms', 'oms-core', 'oms_orders', '"oms"', 'OMS-DRIFT']) expect(PROJECT_NAME.test(s), s).toBe(true);
    for (const s of ['rooms', 'atoms-x', 'customs_y', 'omission']) expect(PROJECT_NAME.test(s), s).toBe(false);
  });
});
