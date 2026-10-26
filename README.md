# AI Girl Theme · dsh-ai-girl-theme

An "AI gijinka" theme pack for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): the conversation backdrop follows the model you are talking to, the whole interface switches to a pixel typeface, and every provider gets its own picture picker in *Settings → Models*.

![Claude 娘](wallpapers/gijinka/claude.webp)

中文说明见 [README.zh.md](README.zh.md)。

## Features

- **One backdrop per model.** Claude 娘, GPT 龙娘, Gemini 娘, GLM 娘, Qwen 娘, Kimi 娘, Grok 娘, Hunyuan 娘, Wenxin 娘, MiniMax 娘, Mistral 娘, Llama 娘, Seed 娘, RWKV 娘, DeepSeek 娘 — matched by provider or model id, with a generated aurora fallback for anything else.
- **Pixel typeface everywhere.** Interface, conversation, code blocks and terminal read one font stack; a missing face is skipped by CSS and the shipped look returns instead of breaking.
- **Per-provider picker.** One row in every provider card, plus a footer row for providers that render no card (the signed-in account). Choices persist and outrank the YAML rules.
- **Self-contained.** Pictures are served by the plugin from `~/.dsh/themes/images`; no network calls, no external service, no change to the DSH installation.
- **Nothing to configure to try it.** Install, restart once, done — the rules ship with the pack.

## Requirements

- DeepSeek Harness **0.2.x** Web / Desktop profile (`dsh web` or the Desktop app).
- The profile's plugin manager (present in base-backed profiles) to install a bundle.
- No npm account, token or registry access is needed: the install spec is a Git URL.

> The Desktop app is on the **nightly** channel and updates often. A plugin never blocks the app update; see [Compatibility](#compatibility).

## Install

Paste this into **Plugins → Install** in the sidebar:

```
git+https://github.com/zhouribin/dsh-ai-girl-theme.git#v1.1.0
```

or from a terminal:

```sh
dsh plugin --profile <profile> add 'git+https://github.com/zhouribin/dsh-ai-girl-theme.git#v1.1.0'
```

Then **restart the app once** — the client half of a plugin is scanned at boot. After that, configuration and picture changes only need a page refresh.

Pin a tag or a commit (`#v1.1.0`, `#8624a36…`); a bare branch name would follow whatever is pushed next.

## What you get after installing

| Where | What |
| --- | --- |
| Conversation | The backdrop switches as you change model; the picture fills the viewport height, keeps its aspect ratio, sits against the right edge and dissolves into the surface colour on its left edge. |
| Sidebar | Untouched — it keeps its opaque fill, so the picture never hurts readability there. |
| Settings → Models | A **Conversation wallpaper** row in every provider card, and a **Signed-in account / other providers** block at the bottom. Each row shows a thumbnail and a saved-state line. |
| `~/.dsh/themes/images/` | The pictures (copied from the package on first activation) and `prefs.json`, which stores your per-provider choices. |

Replace or add pictures in that directory: the same file name overwrites, a new file shows up in the picker. Bundled files are only copied when missing, so your versions are never overwritten.

## How it works

Everything is one `<style>` row on the page bootstrap plus one read-only route — no other plugin's DOM is touched.

| Hook | Used for |
| --- | --- |
| `data-provider-id` / `data-model-id` on the composer's model label, scoped with `:has(button[aria-haspopup="menu"] …)` | Painting the backdrop for the selected model without reacting to the open model menu |
| `--dsw-alias-bg-base` (plus `data-ds-dark-theme`, `data-ds-theme-source`) | Making the frame and conversation column translucent enough for the picture to show through, with separate light/dark values |
| `--dsw-font-family`, `--ds-font-family-code`, `--dsw-font-mono` | The pixel typeface |
| `webserver/index-inject` | The stylesheet and the picker's bootstrap global (`__DSH_AI_GIRL_THEME__`) |
| `webServer.register('/ai-girl-theme')` | `GET /index` (picture list), `GET\|POST /prefs` (saved choices), `GET /<file>` (pictures) |
| `settings.models.provider-card`, `settings.models.footer` | The picker rows |

The picture's pixel size is read from its file header (JPEG SOF, WebP VP8/VP8L/VP8X), so the fade distance follows each picture's own width.

## Customise

### Pick pictures in the UI

*Settings → Models* → **Conversation wallpaper** → choose a picture. It applies immediately, is written to `~/.dsh/themes/images/prefs.json`, and takes precedence over every rule. Choosing **Default (automatic)** drops the override (the page reloads so the served stylesheet matches again).

### Rules in the profile patch

`~/.dsh/profiles/<profile>/cordis.patch.yml` — a matching row replaces the pack's whole config:

```yaml
- id: ai-girl-theme
  name: 'dsh-ai-girl-theme'
  config:
    dir: '~/.dsh/themes/images'
    veilDark: 0.4        # surface alpha in the dark palette (1 = opaque, hides the picture)
    veilLight: 0.6
    scrimDark: 0.68      # scrim over the picture in the dark palette (lower = brighter)
    scrimLight: 0.88
    font: true           # false keeps the shipped typeface
    families: ['Zpix']   # extra families tried before the built-in stack
    rules:
      - { provider: 'anthropic*', image: gijinka/claude.webp }
      - { model: 'my-local-model*', image: gijinka/qwen.webp }
      - { provider: 'openai*', model: 'o4*', image: gijinka/gpt.webp, scrimDark: 0.5 }
```

Rules are evaluated in order and the last match wins. A provider or model ending in `*` matches as a prefix; `provider` and `model` may be used together.

### Pixel fonts

The pack uses fonts already installed on the system, so nothing is downloaded:

```sh
brew install --cask font-zpix            # Zpix — Chinese + Latin
brew install --cask font-fusion-pixel    # Fusion Pixel — OFL
brew install --cask font-vt323           # VT323 — Latin only
```

macOS exposes a newly installed font to the app after a restart. Without any pixel font the interface simply stays in its shipped typeface.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Installed but nothing changed | The app was not restarted, so the client module never loaded. Quit and reopen. |
| Picker rows missing | The plugin is disabled in *Plugins*, or `@deepseek-ai/dsh-client-ui-settings-models` is not part of this profile. |
| Picture missing for one model | That provider has no rule; set one in the picker or the patch. Unmatched models fall back to the aurora. |
| Picture is washed out / too dark | Tune `scrimDark` (main knob) and `veilDark`. |
| Font is not pixel | No pixel font installed, or the app was not restarted after installing one. |
| Everything broke after an app update | A hook in [How it works](#how-it-works) was renamed upstream. Files to touch: `index.js` (CSS variables, route, seeding) and `client.js` (picker, global name). |

## Uninstall

Disable or remove the bundle in **Plugins**, then delete `~/.dsh/themes/` if you also want to drop the pictures. Nothing inside the DSH installation is modified.

## Repository layout

```
index.js             Host half: seeding, picture route, stylesheet, bootstrap global
client.js            Client half: picker rows, live apply, saved state
cordis.patch.yml     Default provider/model → picture rules
locale/{en,zh}.json  Bundle title and description for the Plugins list
wallpapers/gijinka/  21 portrait pictures (third-party artwork — see LICENSE-ART.md)
```

## License

- **Code**: MIT — see [LICENSE](LICENSE).
- **Artwork** in `wallpapers/gijinka/`: third-party work by **ZipZipPipe** (the DeepSeek series is a derivative of **上善无形**'s original character), tagged **CC BY-NC-SA 4.0** in the source gallery — attribution, **non-commercial**, share-alike. Details and the per-file list are in [LICENSE-ART.md](LICENSE-ART.md).
- Distributing the pack therefore means distributing non-commercial artwork. For a fully redistributable, MIT-only plugin, delete the pictures: `git rm -r wallpapers/gijinka` — the pack keeps working and falls back to the generated aurora backgrounds.

Artwork source: [genderswapai.com · AI gijinka gallery](https://genderswapai.com/zh-CN/ai-gijinka/gallery).

## Compatibility

The pack depends on internal names that DSH may rename between releases: the CSS variables listed above, the two `data-*` attributes on the model label, the two settings slots, and the `webserver/index-inject` event. If an update renames one of them, the affected feature stops silently — the app itself is unaffected. The table under [How it works](#how-it-works) is the checklist to re-verify after an update, and a pull request that adapts to a new name is welcome.
