# AI Girl Theme · dsh-ai-girl-theme

> **中文读者看这里 → [README.zh.md](README.zh.md)**（中文说明，含一键安装提示词）
>
> English is on this page; the Chinese version lives in the link above.

An "AI gijinka" theme pack for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): the conversation backdrop follows the model you are talking to, the whole interface switches to a pixel typeface, and every provider gets its own picture picker in *Settings → Models*.

![Preview: full window, dark palette, portrait backdrop in the conversation, pixel typeface](docs/preview.webp)

## Don't want to read this? Paste one prompt into your DSH

Copy the whole block into the chat of the DSH you are running — it installs the theme for you:

```text
Please install the "AI Girl Theme" into the current DSH profile. Install only — do not change any other configuration.

Install spec (pinned version; do not replace it with a branch name):
git+https://github.com/zhouribin/dsh-ai-girl-theme.git#v1.2.1

Steps:
1. If this DSH build exposes a plugin installer, use it with the spec above.
   Otherwise run from a terminal:
   dsh plugin --profile <current profile> add 'git+https://github.com/zhouribin/dsh-ai-girl-theme.git#v1.2.1'
   On DSH Desktop the profile is usually `desktop`; `dsh --profile desktop --dump-config` is refused by the Electron shell, but `plugin add` works.
   If the same version is already installed, do not install it again.
2. Verify:
   - `dsh plugin --profile <profile> list` shows `dsh-ai-girl-theme@1.2.1`;
   - the profile's `package.json` lists `dsh-ai-girl-theme` in `dsh.profile.bundles`;
   - `GET /ai-girl-theme/index` on the running GUI origin returns the image JSON list.
3. The bundle ships a client module: fully quit and reopen the app (on Desktop, quit from the tray — closing the window is not enough), then refresh the page.
4. Do not touch the DSH installation, the pictures or `prefs.json` under `~/.dsh/themes`, or any other plugin's configuration.

Expected: a per-model anime backdrop in conversations, the bundled pixel typeface, and a "Conversation wallpaper" row in Settings → Models for every provider.
```

Then **fully quit and reopen the app** (on Desktop, quit from the tray; closing the window is not enough — the client half is scanned at boot). After that, changing pictures or configuration only needs a page refresh.

## Manual install

Sidebar **Plugins → Install**, paste:

```
git+https://github.com/zhouribin/dsh-ai-girl-theme.git#v1.2.1
```

Or from a terminal: `dsh plugin --profile <profile> add '<the spec above>'`, then restart the app.

## What it does

- **One backdrop per model**: Claude 娘, GPT 龙娘, Gemini 娘, GLM 娘, Qwen 娘, Kimi 娘, Grok 娘, Hunyuan 娘, Wenxin 娘, MiniMax 娘, Mistral 娘, Llama 娘, Seed 娘, RWKV 娘, DeepSeek 娘 — matched by provider or model id, with a generated aurora fallback.
- **Pixel typeface everywhere, font included**: Fusion Pixel 12px (Simplified Chinese + Latin, woff2, ~940 KB, OFL) ships with the bundle, so the pixel look works out of the box. Prefer a system face? List it in `families`; set `bundledFont: false` to drop the bundled one.
- **Per-provider picker**: one row in every provider card, plus a footer row for providers without a card (the signed-in account). Choices persist and outrank the rules.
- **Self-contained and offline**: pictures are served by the plugin from `~/.dsh/themes/images`; nothing inside the DSH installation is modified.

<details>
<summary><b>Customise (pictures, contrast, fonts)</b></summary>

### Pick pictures in the UI

*Settings → Models* → **Conversation wallpaper**. It applies immediately, is written to `~/.dsh/themes/images/prefs.json`, and outranks every rule. Choosing **Default (automatic)** drops the override (the page reloads once).

Replace a picture by overwriting its file in `~/.dsh/themes/images/`; add one by dropping a new file there — it shows up in the picker. Bundled files are only copied when missing, so your versions are never overwritten.

### Rules in the profile patch

`~/.dsh/profiles/<profile>/cordis.patch.yml` — a matching row replaces the pack's whole config:

```yaml
- id: ai-girl-theme
  name: 'dsh-ai-girl-theme'
  config:
    dir: '~/.dsh/themes/images'
    veilDark: 0.4        # surface alpha in the dark palette (1 = opaque, hides the picture)
    veilLight: 0.6
    scrimDark: 0.68      # scrim over the picture (lower = brighter)
    scrimLight: 0.88
    font: true           # false keeps the shipped typeface
    families: ['Zpix']   # extra families tried first
    rules:
      - { provider: 'anthropic*', image: gijinka/claude.webp }
      - { model: 'my-local-model*', image: gijinka/qwen.webp }
      - { provider: 'openai*', model: 'o4*', image: gijinka/gpt.webp, scrimDark: 0.5 }
```

Rules are evaluated in order and the last match wins; a provider or model ending in `*` matches as a prefix, and both may be combined.

### Pixel fonts

**Fusion Pixel 12px Proportional (Simplified Chinese)** is bundled under `fonts/` as woff2 plus `OFL.txt` (SIL Open Font License 1.1, by TakWolf) — nothing to install.

To prefer another face already on the system (Zpix, VT323, …):

```yaml
config:
  families: ['Zpix']       # tried before the bundled face
  # bundledFont: false      # stop using the bundled face entirely
```

```sh
brew install --cask font-zpix            # Zpix — Chinese + Latin
brew install --cask font-vt323           # VT323 — Latin only
```

macOS exposes a newly installed system font to the app after a restart.

</details>

<details>
<summary><b>How it works (read this when an update breaks it)</b></summary>

Everything is one `<style>` row on the page bootstrap plus one read-only route — no other plugin's DOM is touched.

| Hook | Used for |
| --- | --- |
| `sessions.binding(sessionId).session.projections.faceOf('modelSelection')` | Reading the current provider/model from the session's durable projection — the same source the composer's model seat uses, so the backdrop survives the composer being unmounted |
| `body[data-ai-girl-provider]` / `body[data-ai-girl-model]` | The stable anchor the host stylesheet paints from; the client mirrors the projection onto it |
| `--dsw-alias-bg-base`, `--dsw-specific-sidebar-fill` (Windows titlebar frame), `data-ds-dark-theme`, `data-ds-theme-source` | Making the frame and conversation column translucent, with separate light/dark values |
| `--dsw-font-family`, `--ds-font-family-code`, `--dsw-font-mono` | The pixel typeface |
| `webserver/index-inject` | The stylesheet, `current` (the host default selection) and the picker's global (`__DSH_AI_GIRL_THEME__`) |
| `webServer.register('/ai-girl-theme')` | `/index` (picture list), `/prefs` (saved choices), `/<file>` (pictures) |
| `settings.models.provider-card`, `settings.models.footer` | The picker rows |

The picture's pixel size is read from its file header (JPEG SOF, WebP VP8/VP8L/VP8X), so the fade distance follows each picture's own width. If a release renames any name in this table, the matching feature stops silently; the app itself is unaffected — this table is the checklist.

</details>

<details>
<summary><b>Troubleshooting</b></summary>

| Symptom | Likely cause |
| --- | --- |
| Installed but nothing changed | The app was not restarted, so the client module never loaded. Full quit and reopen (Desktop: tray → Quit). |
| Font works but the wallpaper never appears | v1.2.0 anchored the backdrop on the composer's model button; while a turn is generating (or after restarting into a running session) that button is not in the DOM. v1.2.1 reads the session's `modelSelection` projection instead. Upgrade. |
| Wallpaper flashes once at startup and disappears (Windows) | The titlebar frame paints with `--dsw-specific-sidebar-fill`, which is opaque; v1.2.0 only overrode `--dsw-alias-bg-base`, so the frame covered the body backdrop. v1.2.1 also overrides `--dsw-specific-sidebar-fill`. Upgrade. |
| Picker rows missing | The plugin is disabled in *Plugins*, or `@deepseek-ai/dsh-client-ui-settings-models` is not in this profile. |
| Picture missing for one model | That provider has no rule; pick one in the UI or add a `rules` entry. Unmatched models fall back to the aurora. |
| Picture washed out / too dark | Tune `scrimDark` (main knob) and `veilDark`. |
| Font is not pixel | The bundled face failed to load; check that `/ai-girl-theme/fonts/fusion-pixel-12px-proportional-zh_hans.woff2` returns 200, then restart. |
| Everything broke after an app update | See the table above; rename the corresponding identifiers in `index.js` / `client.js`. |

</details>

<details>
<summary><b>Let others find it in Discover (plugin index)</b></summary>

DSH has no "submit to the official library" entry point; the **Discover** tab reads *index URLs*. `market-index.json` at the repository root is a format-1 index, validated with DSH's own validator on every push.

**Host the index** (either works):

| Option | Index URL |
| --- | --- |
| GitHub Pages (recommended) | `https://zhouribin.github.io/dsh-ai-girl-theme/market-index.json` |
| Public proxy | `https://gh-proxy.com/https://raw.githubusercontent.com/zhouribin/dsh-ai-girl-theme/main/market-index.json` |

Enable Pages: repository → Settings → Pages → Source: `Deploy from a branch` → `main` / `/ (root)` → Save.

**How someone installs from it**:

1. Plugins → Add plugin → `@deepseek-ai/dsh-experimental-plugin-market-bundle`, then restart the app;
2. Discover → add the index URL above;
3. Search "AI Girl Theme" → install.

When you release a version, update `market-index.json` as well (`version`, `source.commit`, `publishTimestamp`) — CI fails when it disagrees with `package.json`. Check locally with:

```sh
npm install --no-save @deepseek-ai/dsh-plugin-market-index@next
node scripts/validate-market-index.mjs
```

</details>

<details>
<summary><b>Uninstall / layout / licences / compatibility</b></summary>

### Uninstall

Disable or remove the bundle in **Plugins**, then delete `~/.dsh/themes/` if you also want to drop the pictures. Nothing inside the DSH installation was modified.

### Repository layout

```
index.js             Host half: seeding, picture route, stylesheet, bootstrap global
client.js            Client half: picker rows, live apply, saved state
cordis.patch.yml     Default provider/model → picture rules (48)
locale/{en,zh}.json  Bundle title and description for the Plugins list
fonts/               Bundled pixel face (Fusion Pixel 12px zh_hans, OFL 1.1)
wallpapers/gijinka/  21 portrait pictures (third-party artwork — see LICENSE-ART.md)
```

### Licence

- **Code**: MIT — see [LICENSE](LICENSE).
- **Font**: `fonts/` ships Fusion Pixel by **TakWolf** under the **SIL Open Font License 1.1** — see [`fonts/OFL.txt`](fonts/OFL.txt).
- **Artwork**: third-party work by **ZipZipPipe** (the DeepSeek series derives from **上善无形**'s original character), tagged **CC BY-NC-SA 4.0** in the source gallery — attribution required, **non-commercial**, share-alike. Per-file list in [LICENSE-ART.md](LICENSE-ART.md).
- For a fully MIT, freely redistributable plugin, drop the pictures: `git rm -r wallpapers/gijinka` — the pack keeps working and falls back to the generated aurora backgrounds.

Artwork source: [genderswapai.com · AI gijinka gallery](https://genderswapai.com/zh-CN/ai-gijinka/gallery).

### Requirements and compatibility

- DeepSeek Harness **0.2.x** Web / Desktop profile. The install path does not assume a built-in plugin-manager tool: `dsh plugin --profile <profile> add '<spec>'` is the supported fallback.
- DSH Desktop: `plugin add` works for the `desktop` profile; `dsh --profile desktop --dump-config` is refused by the Electron shell (expected, not a failure).
- No npm account, token or registry access: the install spec is a Git URL.
- The Desktop app is on the nightly channel and updates often; the plugin never blocks an app update.
- v1.2.1 reads the current model from the session's `modelSelection` projection, so the backdrop survives the composer being unmounted. v1.2.0 read the composer DOM and can lose the backdrop during a turn.
- The internal names it relies on are listed above; if one is renamed, the feature stops silently and the app is unaffected.

</details>
