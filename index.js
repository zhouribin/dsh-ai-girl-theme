/**
 * AI 拟人主题包 / Gijinka theme pack — Host half.
 *
 * One bundle that gives the Harness Web GUI three things:
 *
 * 1. a per-model backdrop (the bundled AI-gijinka artwork, a portrait against
 *    the right edge with its left edge dissolved into the surface),
 * 2. a pixel typeface for the whole interface,
 * 3. a per-provider picker in the model settings that overrides the rules.
 *
 * Everything is served from one route (`/ai-girl-theme/…`) out of a directory
 * seeded on first activation (`~/.dsh/themes/images`), so a recipient can add
 * or replace pictures without touching the package.
 *
 * Hooks used: the composer model label's `data-provider-id` / `data-model-id`,
 * the `--dsw-alias-bg-base` alias token, `data-ds-dark-theme` (body) and
 * `data-ds-theme-source` (html), `webserver/index-inject`, and `webServer`.
 */

import { closeSync, createReadStream, existsSync, mkdirSync, openSync, readFileSync, readSync, statSync } from 'node:fs';
import { copyFile, mkdir, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, extname, isAbsolute, resolve as resolvePath, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Route prefix every picture and API call lives under. */
const ROUTE = '/ai-girl-theme';
/** Page global carrying bootstrap data to the Client half. */
const GLOBAL_NAME = '__DSH_AI_GIRL_THEME__';
/** File holding the per-provider choices written by the settings rows. */
const PREFS_FILE = 'prefs.json';
/** Directory bundled pictures are seeded from. */
const BUNDLED = fileURLToPath(new URL('./wallpapers', import.meta.url));
/** Directory the bundled pixel face is served from. */
const FONTS = fileURLToPath(new URL('./fonts', import.meta.url));
/** Bundled typeface: Fusion Pixel 12px proportional, Simplified Chinese (OFL 1.1). */
const FONT_FILE = 'fusion-pixel-12px-proportional-zh_hans.woff2';
/** Family name the bundled face is declared under. */
const FONT_FAMILY = 'DSH Pixel';

/** Media types served by the route. */
const MEDIA_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
};

/** Font types served from the package's own `fonts/` directory. */
const FONT_TYPES = {
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

/** Pixel faces tried in order; anything missing is skipped by the font matcher. */
const PIXEL_FAMILIES = [
  '"Zpix"',
  '"Fusion Pixel 12px Proportional SC"',
  '"Fusion Pixel 12px Monospaced SC"',
  '"Fusion Pixel 10px Proportional SC"',
  '"Ark Pixel 12px Proportional SC"',
  '"Ark Pixel 12px Monospaced SC"',
  '"LS Pixel"',
  '"VT323"',
  '"Press Start 2P"',
  '"Silkscreen"',
  '"Pixelify Sans"',
  '"DotGothic16"',
  '"Handjet"',
  '"Fixedsys Excelsior 3.01"',
  '"Fixedsys"',
  '"Perfect DOS VGA 437"',
  '"W95FA"',
  '"Pixel Operator"',
  '"04b03"',
  '"PingFang SC"',
  '"Hiragino Sans GB"',
  '"Microsoft YaHei"',
  '"Noto Sans CJK SC"',
  'monospace',
  'sans-serif',
];

/** Fallback aurora colours per model family, used when no picture matches. */
const AURORA = {
  ember: { base: '#160e10', blobs: [['#fb7185', 250, 180, 900, 700, 0.4], ['#f97316', 1250, 820, 800, 760, 0.45], ['#7c2d12', 900, 450, 700, 700, 0.35]] },
  azure: { base: '#08111c', blobs: [['#22d3ee', 300, 200, 880, 720, 0.38], ['#2563eb', 1200, 700, 860, 780, 0.45], ['#0e7490', 900, 950, 700, 600, 0.3]] },
  ocean: { base: '#050d16', blobs: [['#1d4ed8', 220, 880, 900, 760, 0.45], ['#0891b2', 1320, 160, 820, 700, 0.4], ['#1e3a8a', 820, 520, 760, 640, 0.35]] },
  violet: { base: '#110d1d', blobs: [['#8b5cf6', 280, 220, 900, 740, 0.42], ['#d946ef', 1250, 800, 820, 760, 0.38], ['#4c1d95', 800, 600, 780, 700, 0.4]] },
  jade: { base: '#07120f', blobs: [['#10b981', 300, 850, 880, 740, 0.4], ['#14b8a6', 1250, 200, 840, 700, 0.38], ['#065f46', 900, 500, 760, 680, 0.35]] },
  graphite: { base: '#0f1014', blobs: [['#64748b', 250, 180, 900, 720, 0.28], ['#334155', 1300, 800, 840, 760, 0.3], ['#1e293b', 800, 500, 780, 700, 0.25]] },
};

/** Provider/model patterns resolved to an aurora palette, later rules winning. */
const AURORA_RULES = [
  { key: 'ember', sel: '[data-provider-id="tx"]', attr: '[data-ai-girl-provider="tx"]' },
  { key: 'ocean', sel: '[data-provider-id^="deepseek"]', attr: '[data-ai-girl-provider^="deepseek"]' },
  { key: 'violet', sel: '[data-model-id*="reasoner"], [data-model-id*="think"], [data-model-id*="r1"]', attr: '[data-ai-girl-model*="reasoner"], [data-ai-girl-model*="think"], [data-ai-girl-model*="r1"]' },
  { key: 'azure', sel: '[data-model-id*="flash"], [data-model-id*="chat"], [data-model-id*="v4"]', attr: '[data-ai-girl-model*="flash"], [data-ai-girl-model*="chat"], [data-ai-girl-model*="v4"]' },
  { key: 'graphite', sel: '[data-model-id^="gpt"]', attr: '[data-ai-girl-model^="gpt"]' },
];

/** Default configuration; everything is overridable from the Loader row. */
const DEFAULTS = {
  enabled: true,
  /** Directory the route serves; seeded from the bundled artwork when empty. */
  dir: '~/.dsh/themes/images',
  /** Alpha of the base surface per palette (the picture shows through it). */
  veilLight: 0.6,
  veilDark: 0.4,
  /** Scrim laid over the picture so a bright image still reads as night. */
  scrimDark: 0.68,
  scrimLight: 0.88,
  /** Pixel typeface for the whole GUI. */
  font: true,
  /** Prefer the bundled Fusion Pixel face before anything the system has. */
  bundledFont: true,
  /** Extra families tried before the built-in stack. */
  families: [],
  /** `{ provider?, model?, image, scrimDark?, scrimLight? }`, last match winning. */
  rules: [],
};

/** Clamp one alpha option into 0–1. */
function alpha(value, fallback) {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0, parsed));
}

/** Expand a leading `~` and resolve relative paths against the home directory. */
function expandDir(value) {
  if (typeof value !== 'string' || value.trim() === '') return resolvePath(homedir(), '.dsh/themes/images');
  const raw = value.trim();
  const expanded = raw === '~' || raw.startsWith('~/') ? resolvePath(homedir(), raw.slice(2)) : raw;
  return isAbsolute(expanded) ? expanded : resolvePath(homedir(), expanded);
}

/** Quote a value for a double-quoted CSS attribute selector. */
function cssAttr(value) {
  return `"${String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

/** True for a plain relative path chain without traversal segments. */
function isSafeName(name) {
  return typeof name === 'string' && name !== '' && !name.includes('\0')
    && !name.startsWith('/') && !name.split('/').includes('..');
}

/** Bare data URI for one generated aurora, or `undefined` for an unknown palette. */
function auroraUrl(key) {
  const spec = AURORA[key];
  if (spec === undefined) return undefined;
  const gradients = [];
  const shapes = [];
  spec.blobs.forEach(([color, cx, cy, rx, ry, opacity], index) => {
    gradients.push(
      `<radialGradient id='b${String(index)}' cx='50%' cy='50%' r='50%'>`
        + `<stop offset='0' stop-color='${color}' stop-opacity='${String(opacity)}'/>`
        + `<stop offset='1' stop-color='${color}' stop-opacity='0'/></radialGradient>`,
    );
    shapes.push(`<ellipse cx='${String(cx)}' cy='${String(cy)}' rx='${String(rx)}' ry='${String(ry)}' fill='url(#b${String(index)})'/>`);
  });
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000' preserveAspectRatio='xMidYMid slice'>`
    + `<defs>${gradients.join('')}`
    + "<linearGradient id='depth' x1='0' y1='0' x2='0' y2='1'>"
    + "<stop offset='0' stop-color='#000000' stop-opacity='0.18'/>"
    + "<stop offset='1' stop-color='#000000' stop-opacity='0.52'/></linearGradient></defs>"
    + `<rect width='1600' height='1000' fill='${spec.base}'/>${shapes.join('')}`
    + "<rect width='1600' height='1000' fill='url(#depth)'/></svg>";
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Pixel size of one image, read from its header; `undefined` when unrecognized. */
function readImageSize(file) {
  let fd;
  try {
    fd = openSync(file, 'r');
    const head = Buffer.alloc(262144);
    const read = readSync(fd, head, 0, head.length, 0);
    const b = head.subarray(0, read);
    if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
      let at = 2;
      while (at + 9 < b.length) {
        if (b[at] !== 0xff) {
          at += 1;
          continue;
        }
        const marker = b[at + 1];
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: b.readUInt16BE(at + 5), width: b.readUInt16BE(at + 7) };
        }
        at += 2 + b.readUInt16BE(at + 2);
      }
      return undefined;
    }
    if (b.length > 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const chunk = b.toString('ascii', 12, 16);
      if (chunk === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
      if (chunk === 'VP8L') {
        const bits = b.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (chunk === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    }
    return undefined;
  } catch {
    return undefined;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

/** Cached picture sizes, invalidated by modification time. */
const sizeCache = new Map();

/** Cached pixel size for one served picture. */
function imageSize(dir, name) {
  const file = resolvePath(dir, name);
  try {
    const info = statSync(file);
    const key = `${file}:${String(info.mtimeMs)}`;
    if (sizeCache.has(key)) return sizeCache.get(key);
    const size = readImageSize(file);
    sizeCache.set(key, size);
    return size;
  } catch {
    return undefined;
  }
}

/** Distance over which the picture's near edge dissolves into the backdrop, in px. */
function fadeSpan(width) {
  const start = Math.max(24, Math.min(96, Math.round(width * 0.05)));
  const end = Math.max(140, Math.min(420, Math.round(width * 0.22)));
  return [start, Math.max(start + 80, end)];
}

/** Full-bleed fallback for pictures whose pixel size cannot be read. */
function coverLines(selector, url, scrimLight, scrimDark) {
  const has = `body:has(button[aria-haspopup="menu"] :is(${selector}))`;
  return [
    `html[data-ds-theme-source] ${has}{`
      + `background-image:linear-gradient(rgba(255,255,255,${scrimLight}),rgba(255,255,255,${scrimLight})),url("${url}") !important;`
      + 'background-size:cover,cover !important;background-position:center center,center !important;'
      + 'background-repeat:no-repeat,no-repeat !important;background-attachment:fixed,fixed !important;}',
    `html[data-ds-theme-source] body[data-ds-dark-theme]:has(button[aria-haspopup="menu"] :is(${selector})){`
      + `background-image:linear-gradient(rgba(9,10,14,${scrimDark}),rgba(9,10,14,${scrimDark})),url("${url}") !important;}`,
  ];
}

/**
 * Light and dark declarations painting one picture: full viewport height,
 * natural width, flush right, its left edge dissolved into the surface colour.
 * @param selector - attribute selector for the provider/model pair.
 * @param url - served picture URL.
 * @param size - pixel size of the picture, when known.
 * @param scrimLight - light-palette scrim alpha.
 * @param scrimDark - dark-palette scrim alpha.
 * @param boost - raise specificity so a saved choice beats every configured rule.
 */
function pictureLines(selector, url, size, scrimLight, scrimDark, boost = false) {
  const root = boost ? 'html[data-ds-theme-source]:root' : 'html[data-ds-theme-source]';
  if (size === undefined || !(size.width > 0) || !(size.height > 0)) {
    return boost
      ? coverLines(selector, url, scrimLight, scrimDark).map((line) => line.replace('html[data-ds-theme-source]', root))
      : coverLines(selector, url, scrimLight, scrimDark);
  }
  const has = `${root} body:has(button[aria-haspopup="menu"] :is(${selector}))`;
  const [start, end] = fadeSpan(size.width);
  const box = `calc(100vh * ${(size.width / size.height).toFixed(4)}) 100%`;
  return [
    `${has}{`
      + 'background-color:#ffffff !important;'
      + 'background-image:linear-gradient(to right,'
      + `rgba(255,255,255,1) 0px,rgba(255,255,255,1) ${String(start)}px,`
      + `rgba(255,255,255,${scrimLight}) ${String(end)}px,rgba(255,255,255,${scrimLight}) 100%),url("${url}") !important;`
      + `background-size:${box},auto 100% !important;`
      + 'background-position:right center,right center !important;'
      + 'background-repeat:no-repeat,no-repeat !important;'
      + 'background-attachment:fixed,fixed !important;}',
    `${root} body[data-ds-dark-theme]:has(button[aria-haspopup="menu"] :is(${selector})){`
      + 'background-color:#151517 !important;'
      + 'background-image:linear-gradient(to right,'
      + `rgba(21,21,23,1) 0px,rgba(21,21,23,1) ${String(start)}px,`
      + `rgba(9,10,14,${scrimDark}) ${String(end)}px,rgba(9,10,14,${scrimDark}) 100%),url("${url}") !important;}`,
  ];
}

/** Full-bleed fallback anchored on the Client half's remembered body attributes. */
function attrCoverLines(attr, url, scrimLight, scrimDark) {
  return [
    `html[data-ds-theme-source] body:is(${attr}){`
      + `background-image:linear-gradient(rgba(255,255,255,${scrimLight}),rgba(255,255,255,${scrimLight})),url("${url}") !important;`
      + 'background-size:cover,cover !important;background-position:center center,center !important;'
      + 'background-repeat:no-repeat,no-repeat !important;background-attachment:fixed,fixed !important;}',
    `html[data-ds-theme-source] body[data-ds-dark-theme]:is(${attr}){`
      + `background-image:linear-gradient(rgba(9,10,14,${scrimDark}),rgba(9,10,14,${scrimDark})),url("${url}") !important;}`,
  ];
}

/**
 * Same picture declarations as {@link pictureLines}, anchored on the
 * `data-ai-girl-provider` / `data-ai-girl-model` attributes the Client half keeps
 * on `body`, so the backdrop survives the composer unmounting.
 * @param attr - body attribute selector (may be an `:is()` list).
 * @param url - served picture URL.
 * @param size - pixel size of the picture, when known.
 * @param scrimLight - light-palette scrim alpha.
 * @param scrimDark - dark-palette scrim alpha.
 * @param boost - raise specificity so a saved choice beats every configured rule.
 */
function attrPictureLines(attr, url, size, scrimLight, scrimDark, boost = false) {
  const root = boost ? 'html[data-ds-theme-source]:root' : 'html[data-ds-theme-source]';
  if (size === undefined || !(size.width > 0) || !(size.height > 0)) {
    return boost
      ? attrCoverLines(attr, url, scrimLight, scrimDark).map((line) => line.replace('html[data-ds-theme-source]', root))
      : attrCoverLines(attr, url, scrimLight, scrimDark);
  }
  const [start, end] = fadeSpan(size.width);
  const box = `calc(100vh * ${(size.width / size.height).toFixed(4)}) 100%`;
  return [
    `${root} body:is(${attr}){`
      + 'background-color:#ffffff !important;'
      + 'background-image:linear-gradient(to right,'
      + `rgba(255,255,255,1) 0px,rgba(255,255,255,1) ${String(start)}px,`
      + `rgba(255,255,255,${scrimLight}) ${String(end)}px,rgba(255,255,255,${scrimLight}) 100%),url("${url}") !important;`
      + `background-size:${box},auto 100% !important;`
      + 'background-position:right center,right center !important;'
      + 'background-repeat:no-repeat,no-repeat !important;'
      + 'background-attachment:fixed,fixed !important;}',
    `${root} body[data-ds-dark-theme]:is(${attr}){`
      + 'background-color:#151517 !important;'
      + 'background-image:linear-gradient(to right,'
      + `rgba(21,21,23,1) 0px,rgba(21,21,23,1) ${String(start)}px,`
      + `rgba(9,10,14,${scrimDark}) ${String(end)}px,rgba(9,10,14,${scrimDark}) 100%),url("${url}") !important;}`,
  ];
}

/** One provider/model pair as a CSS attribute selector. */
function pairSelector(provider, model) {
  const parts = [];
  if (provider !== undefined) {
    parts.push(provider.endsWith('*')
      ? `[data-provider-id^=${cssAttr(provider.slice(0, -1))}]`
      : `[data-provider-id=${cssAttr(provider)}]`);
  }
  if (model !== undefined) {
    parts.push(model.endsWith('*')
      ? `[data-model-id^=${cssAttr(model.slice(0, -1))}]`
      : `[data-model-id=${cssAttr(model)}]`);
  }
  return parts.length === 0 ? undefined : parts.join('');
}

/** Body-attribute selector for the provider/model the Client half remembers. */
function currentAttr(provider, model) {
  const parts = [];
  const add = (key, value) => {
    if (typeof value !== 'string' || value.trim() === '') return;
    const trimmed = value.trim();
    parts.push(trimmed.endsWith('*')
      ? `[data-ai-girl-${key}^=${cssAttr(trimmed.slice(0, -1))}]`
      : `[data-ai-girl-${key}=${cssAttr(trimmed)}]`);
  };
  add('provider', provider);
  add('model', model);
  return parts.length === 0 ? undefined : parts.join('');
}

/** Resolve the row config into the values the stylesheet and the route need. */
function normalize(raw) {
  const config = raw !== null && typeof raw === 'object' ? raw : {};
  const scrimDark = alpha(config.scrimDark, DEFAULTS.scrimDark);
  const scrimLight = alpha(config.scrimLight, DEFAULTS.scrimLight);
  const rules = [];
  for (const entry of Array.isArray(config.rules) ? config.rules : []) {
    if (entry === null || typeof entry !== 'object') continue;
    const image = typeof entry.image === 'string' ? entry.image.trim() : '';
    const provider = typeof entry.provider === 'string' && entry.provider.trim() !== '' ? entry.provider.trim() : undefined;
    const model = typeof entry.model === 'string' && entry.model.trim() !== '' ? entry.model.trim() : undefined;
    const selector = pairSelector(provider, model);
    const attr = currentAttr(provider, model);
    if (selector === undefined || attr === undefined || !isSafeName(image)) continue;
    rules.push({
      selector,
      attr,
      image,
      url: `${ROUTE}/${image}`,
      scrimDark: alpha(entry.scrimDark, scrimDark),
      scrimLight: alpha(entry.scrimLight, scrimLight),
    });
  }
  const families = Array.isArray(config.families)
    ? config.families.map((entry) => String(entry).trim()).filter((entry) => entry !== '').map((entry) => (/^"|^'/.test(entry) ? entry : `"${entry.replaceAll('"', '')}"`))
    : [];
  const bundledFont = config.bundledFont !== false && existsSync(resolvePath(FONTS, FONT_FILE));
  const stack = [...families, ...(bundledFont ? [`"${FONT_FAMILY}"`] : []), ...PIXEL_FAMILIES];
  return {
    enabled: config.enabled !== false,
    dir: expandDir(config.dir),
    veilLight: alpha(config.veilLight, DEFAULTS.veilLight),
    veilDark: alpha(config.veilDark, DEFAULTS.veilDark),
    scrimDark,
    scrimLight,
    font: config.font !== false,
    bundledFont,
    stack: [...new Set(stack)].join(', '),
    rules,
  };
}

/** Read the saved per-provider choices synchronously; the index render needs them inline. */
function readPrefs(dir) {
  try {
    const raw = JSON.parse(readFileSync(resolvePath(dir, PREFS_FILE), 'utf8'));
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const out = {};
    for (const [provider, image] of Object.entries(raw)) {
      if (provider !== '' && isSafeName(image)) out[provider] = image;
    }
    return out;
  } catch {
    return {};
  }
}

/** Persist one provider choice; an empty `image` clears it. */
async function writePref(dir, provider, image) {
  const current = readPrefs(dir);
  if (image === '') delete current[provider];
  else current[provider] = image;
  await mkdir(dir, { recursive: true });
  const file = resolvePath(dir, PREFS_FILE);
  const temporary = `${file}.${String(process.pid)}.tmp`;
  await writeFile(temporary, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
  await rename(temporary, file);
  return current;
}

/** Every served picture, relative to the directory, sorted by path. */
async function listImages(dir, prefix = '', depth = 0) {
  const out = [];
  let entries;
  try {
    entries = await readdir(resolvePath(dir, prefix), { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const name = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      if (depth < 2 && !entry.name.startsWith('.')) out.push(...await listImages(dir, name, depth + 1));
      continue;
    }
    if (entry.isFile() && MEDIA_TYPES[extname(entry.name).toLowerCase()] !== undefined) out.push(name);
  }
  return out.sort();
}

/** Copy the bundled artwork into the served directory the first time it is empty. */
async function seed(dir) {
  await mkdir(dir, { recursive: true });
  for (const name of await listImages(BUNDLED)) {
    const target = resolvePath(dir, name);
    if (existsSync(target)) continue;
    await mkdir(dirname(target), { recursive: true });
    await copyFile(resolvePath(BUNDLED, name), target);
  }
}

/** Build the stylesheet this bundle contributes. */
export function buildStyle(raw, prefs = {}) {
  const options = normalize(raw);
  if (!options.enabled) return '';
  const lines = ['/* gijinka theme: typeface, veil, per-model backdrop */'];
  if (options.font && options.bundledFont) {
    lines.push(
      `@font-face{font-family:"${FONT_FAMILY}";font-style:normal;font-weight:400;font-display:swap;`
        + `src:url("${ROUTE}/fonts/${FONT_FILE}") format("woff2");}`,
    );
  }
  if (options.font) {
    lines.push(`body{--dsw-font-family:${options.stack} !important;}`);
    lines.push(`body{--ds-font-family-code:${options.stack} !important;}`);
    lines.push(`body{--dsw-font-mono:${options.stack} !important;}`);
  }
  lines.push(`html[data-ds-theme-source] body{--dsw-alias-bg-base:rgba(255,255,255,${options.veilLight}) !important;}`);
  lines.push(`html[data-ds-theme-source] body[data-ds-dark-theme]{--dsw-alias-bg-base:rgba(21,21,23,${options.veilDark}) !important;}`);
  for (const rule of AURORA_RULES) {
    const url = auroraUrl(rule.key);
    if (url === undefined) continue;
    lines.push(...pictureLines(rule.sel, url, undefined, options.scrimLight, options.scrimDark));
    if (rule.attr !== undefined) lines.push(...attrPictureLines(rule.attr, url, undefined, options.scrimLight, options.scrimDark));
  }
  for (const rule of options.rules) {
    lines.push(...pictureLines(rule.selector, rule.url, imageSize(options.dir, rule.image), rule.scrimLight, rule.scrimDark));
    lines.push(...attrPictureLines(rule.attr, rule.url, imageSize(options.dir, rule.image), rule.scrimLight, rule.scrimDark));
  }
  for (const [provider, image] of Object.entries(prefs)) {
    if (!isSafeName(image)) continue;
    lines.push(...pictureLines(
      pairSelector(provider, undefined),
      `${ROUTE}/${image}`,
      imageSize(options.dir, image),
      options.scrimLight,
      options.scrimDark,
      true,
    ));
    const attr = currentAttr(provider);
    if (attr !== undefined) {
      lines.push(...attrPictureLines(
        attr,
        `${ROUTE}/${image}`,
        imageSize(options.dir, image),
        options.scrimLight,
        options.scrimDark,
        true,
      ));
    }
  }
  return lines.join('\n');
}

/** Required service: the local HTTP carrier for the pictures and the page. */
export const inject = ['webServer'];

/** Answer one request on the theme route. */
async function serve(options, request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'POST') {
    response.writeHead(405);
    response.end();
    return;
  }
  const { dir } = options;
  let name;
  try {
    const pathname = new URL(request.url ?? '/', 'http://x').pathname;
    name = decodeURIComponent(pathname.slice(ROUTE.length).replace(/^\/+/u, ''));
  } catch {
    response.writeHead(400);
    response.end();
    return;
  }

  if (name === 'index') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify({ images: await listImages(dir) }));
    return;
  }

  if (name === 'prefs') {
    if (request.method === 'GET') {
      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify({ prefs: readPrefs(dir) }));
      return;
    }
    if (request.method !== 'POST') {
      response.writeHead(405);
      response.end();
      return;
    }
    let raw = '';
    try {
      for await (const chunk of request) {
        raw += chunk;
        if (raw.length > 64 * 1024) throw new Error('prefs payload too large');
      }
      const payload = JSON.parse(raw);
      const provider = typeof payload.provider === 'string' ? payload.provider.trim() : '';
      const image = typeof payload.image === 'string' ? payload.image.trim() : '';
      if (provider === '' || (image !== '' && !isSafeName(image))) throw new Error('invalid prefs payload');
      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify({ prefs: await writePref(dir, provider, image) }));
    } catch (error) {
      response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: String(error instanceof Error ? error.message : error) }));
    }
    return;
  }

  if (request.method === 'POST') {
    response.writeHead(405);
    response.end();
    return;
  }
  // The bundled face lives in the package, not in the user's picture directory.
  if (name.startsWith('fonts/')) {
    const suffix = name.slice('fonts/'.length);
    const file = resolvePath(FONTS, suffix);
    const fontType = FONT_TYPES[extname(file).toLowerCase()];
    if (fontType === undefined || !isSafeName(suffix) || !file.startsWith(`${FONTS}${sep}`)) {
      response.writeHead(404);
      response.end();
      return;
    }
    await sendFile(request, response, file, fontType, 'public, max-age=86400');
    return;
  }
  const type = MEDIA_TYPES[extname(name).toLowerCase()];
  const target = resolvePath(dir, name);
  if (type === undefined || !isSafeName(name) || !(target === dir || target.startsWith(`${dir}${sep}`))) {
    response.writeHead(404);
    response.end();
    return;
  }
  await sendFile(request, response, target, type, 'public, max-age=3600');
}

/**
 * Stream one file with its media type.
 * @param request - incoming request (GET or HEAD).
 * @param response - outgoing response.
 * @param file - absolute path to serve.
 * @param type - Content-Type value.
 * @param cache - Cache-Control value.
 */
async function sendFile(request, response, file, type, cache) {
  try {
    const info = await stat(file);
    if (!info.isFile()) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, {
      'Content-Type': type,
      'Content-Length': String(info.size),
      'Cache-Control': cache,
      'Last-Modified': info.mtime.toUTCString(),
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    createReadStream(file).on('error', () => response.destroy()).pipe(response);
  } catch {
    response.writeHead(404);
    response.end();
  }
}

/**
 * Host half: seed the picture directory, serve it, and publish the stylesheet
 * plus the picker's bootstrap data on every index render.
 */
export function apply(ctx, config) {
  const options = normalize(config);
  try {
    mkdirSync(options.dir, { recursive: true });
  } catch (error) {
    ctx.logger?.warn?.(error);
  }
  ctx.effect(
    () => ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE,
      handler: (request, response) => serve(options, request, response),
    }),
    'gijinka theme: picture route',
  );
  // Seeding is best effort: a failure leaves the route serving whatever exists.
  seed(options.dir).catch((error) => ctx.logger?.warn?.(error));

  ctx.on('webserver/index-inject', (table) => {
    if (!Array.isArray(table)) return;
    let prefs = {};
    let text = '';
    try {
      prefs = readPrefs(options.dir);
      text = buildStyle(config, prefs);
    } catch (error) {
      ctx.logger?.warn?.(error);
      return;
    }
    if (text === '') return;
    let providers;
    try {
      const llm = ctx.get('llm');
      if (llm !== undefined && typeof llm.listProviders === 'function') {
        providers = llm.listProviders()
          .filter((entry) => entry !== null && typeof entry === 'object')
          .map((entry) => ({ id: String(entry.id), name: String(entry.name ?? entry.id) }));
      }
    } catch (error) {
      ctx.logger?.warn?.(error);
    }
    let current;
    try {
      const defaults = ctx.get('agentDefaultModel') ?? ctx.agentDefaultModel;
      if (defaults !== undefined && typeof defaults.currentSelection === 'function') {
        const selection = defaults.currentSelection();
        if (selection !== null && typeof selection === 'object'
          && typeof selection.provider === 'string' && selection.provider !== ''
          && typeof selection.model === 'string' && selection.model !== '') {
          current = { provider: selection.provider, model: selection.model };
        }
      }
    } catch (error) {
      ctx.logger?.warn?.(error);
    }
    table.push({ kind: 'style', text });
    table.push({
      kind: 'global',
      name: GLOBAL_NAME,
      value: {
        route: ROUTE,
        ...(providers === undefined ? {} : { providers }),
        ...(current === undefined ? {} : { current }),
        prefs,
        veilLight: options.veilLight,
        veilDark: options.veilDark,
        scrimDark: options.scrimDark,
        scrimLight: options.scrimLight,
      },
    });
  });
}
