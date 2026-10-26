# dsh-ai-girl-theme

An "AI gijinka" theme pack for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness):

- **Per-model backdrop** — the composer's provider/model switches the picture (Claude, GPT, Gemini, GLM, Qwen, Kimi, Grok, Hunyuan, Wenxin, MiniMax, Mistral, Llama, Seed, RWKV, DeepSeek…), with a generated aurora fallback.
- **Pixel typeface everywhere** — interface, conversation, code blocks, terminal; falls back gracefully when no pixel font is installed.
- **Per-provider picker** in *Settings → Models* (including the signed-in account row), remembered in `~/.dsh/themes/images/prefs.json` and taking precedence over the rules.

## Install

```
git+https://github.com/<you>/dsh-ai-girl-theme.git#<commit>
```

Paste it into the Plugins page's install dialog (or `dsh plugin --profile <profile> add '<spec>'`), then **restart the app once** so the client module is scanned in. Afterwards a page refresh is enough.

The first activation copies the bundled artwork into `~/.dsh/themes/images/`; replace or add files there and they show up in the picker.

## Layout

- `index.js` — Host half: seeds the picture directory, serves `/ai-girl-theme/{index,prefs,<file>}`, emits one `<style>` row plus the picker's bootstrap global.
- `client.js` — Client half: the picker rows, live application, saved-state line.
- `wallpapers/gijinka/` — the artwork (**not** MIT; see `LICENSE-ART.md`).
- `cordis.patch.yml` — the default provider/model → picture rules.

## License

MIT for the code. The artwork is third-party, attribution + non-commercial terms apply — see [`LICENSE-ART.md`](LICENSE-ART.md). Removing `wallpapers/gijinka/` leaves a fully redistributable code-only plugin.
