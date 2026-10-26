#!/usr/bin/env node
/**
 * Validate `market-index.json` against DSH's own plugin-market format.
 *
 * The official validator (`@deepseek-ai/dsh-plugin-market-index`) is used when it
 * can be resolved — the GitHub workflow installs it first. Without it the script
 * still checks the fields DSH would reject and says so, so a local run needs no
 * dependency.
 *
 * Usage: node scripts/validate-market-index.mjs [index-url]
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const indexUrl = process.argv[2] ?? 'https://zhouribin.github.io/dsh-ai-girl-theme/market-index.json';
const document = JSON.parse(readFileSync(resolve(root, 'market-index.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

/** Collect every problem instead of throwing on the first one. */
const problems = [];

/** Report one failed expectation. */
function expect(condition, message) {
  if (!condition) problems.push(message);
}

/** Structural checks mirroring the rules the official validator enforces. */
function structural() {
  expect(document.format === 1, '$.format must be 1');
  const title = document.title;
  const hasEnglish = typeof title === 'string' ? title.trim() !== '' : title?.['en'] !== undefined;
  expect(hasEnglish, '$.title must be a string or a localized object containing "en"');
  expect(Array.isArray(document.plugins) && document.plugins.length > 0, '$.plugins must be a non-empty array');
  const names = new Set();
  for (const [position, plugin] of (document.plugins ?? []).entries()) {
    const at = `$.plugins[${position}]`;
    expect(typeof plugin.name === 'string' && /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/u.test(plugin.name), `${at}.name must be a valid npm package name`);
    expect(!names.has(plugin.name), `${at}.name duplicates ${plugin.name}`);
    names.add(plugin.name);
    if (plugin.icon?.startsWith('data:')) {
      const payload = plugin.icon.split(',')[1] ?? '';
      const decoded = Math.floor(payload.length / 4) * 3 - (payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0);
      expect(decoded <= 32 * 1024, `${at}.icon must not exceed 32 KiB decoded`);
    }
    expect(Array.isArray(plugin.versions) && plugin.versions.length > 0, `${at}.versions must be a non-empty array`);
    for (const [index, version] of (plugin.versions ?? []).entries()) {
      const versionAt = `${at}.versions[${index}]`;
      expect(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(version.version), `${versionAt}.version must be exact SemVer`);
      expect(Number.isInteger(version.publishTimestamp) && version.publishTimestamp >= 0, `${versionAt}.publishTimestamp must be Unix seconds`);
      expect(version.source?.type === 'npm' || version.source?.type === 'git', `${versionAt}.source.type must be "npm" or "git"`);
      if (version.source?.type === 'git') {
        expect(/^[0-9a-f]{40}$/u.test(version.source.commit ?? ''), `${versionAt}.source.commit must be a 40-hex commit`);
        expect(/^https:\/\/[^?#]+$/u.test(version.source.url ?? ''), `${versionAt}.source.url must be a canonical https URL`);
      }
    }
  }
}

/** The manifest and the index must describe the same package and version. */
function consistent() {
  const entry = (document.plugins ?? []).find((plugin) => plugin.name === manifest.name);
  expect(entry !== undefined, `market-index.json has no entry for ${manifest.name}`);
  if (entry === undefined) return;
  expect(
    entry.versions.some((version) => version.version === manifest.version),
    `no version ${manifest.version} for ${manifest.name} in market-index.json`,
  );
  for (const version of entry.versions) {
    if (version.source?.type !== 'git') continue;
    try {
      execFileSync('git', ['cat-file', '-e', `${version.source.commit}^{commit}`], { cwd: root, stdio: 'ignore' });
    } catch {
      problems.push(`commit ${version.source.commit} is not in this checkout (fetch full history to check)`);
    }
  }
}

structural();
consistent();

let install;
try {
  const { parseMarketIndex, marketInstallTarget } = await import('@deepseek-ai/dsh-plugin-market-index');
  const parsed = parseMarketIndex(document, indexUrl);
  install = marketInstallTarget(parsed.plugins[0].name, parsed.plugins[0].versions[0]).spec;
  console.log(`validated with @deepseek-ai/dsh-plugin-market-index against ${indexUrl}`);
} catch (error) {
  if (error instanceof Error && error.name === 'MarketIndexError') {
    problems.push(String(error.message));
  } else {
    console.warn('note: @deepseek-ai/dsh-plugin-market-index is not installed — structural checks only');
    install = `(install target not computed; expected git+<url>.git#<commit>)`;
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`✗ ${problem}`);
  process.exit(1);
}
console.log(`✓ market-index.json is valid${install === undefined ? '' : ` — install target: ${install}`}`);
