# 美术素材授权 / Artwork attribution

本仓库的**代码**是 MIT（见 `LICENSE`）。`wallpapers/gijinka/` 下的**图片不是**，它们是第三方作品：

- 出处：[genderswapai.com · AI 娘化形象图库](https://genderswapai.com/zh-CN/ai-gijinka/gallery)
- 作者：**ZipZipPipe**；其中 DeepSeek 系列为「**上善无形**」原角色二创
- 授权：图库中 DeepSeek 系列标注 **CC BY-NC-SA 4.0**；其余作品以原帖声明为准
- 原帖：作者发布于 Bilibili 动态（图库每张图下方可点「查看发布原帖」）

## 这意味着什么

1. **署名**：转发或再分发时必须保留作者与出处（本文件即署名）。
2. **非商业**：**包含这些图片的整包不得用于商业用途**。代码可以商用，图不行。
3. **相同方式共享**：修改这些图片后再分发，需以 CC BY-NC-SA 4.0 或兼容协议发布。
4. 图库站点自身的服务条款可能另有约束；**公开分发前请自行确认**，或把这些图片从仓库中移除（删掉 `wallpapers/gijinka/` 即可，插件会在没有图片时退回内置极光背景）。

## 清单

| 文件 | 角色 | 作者 |
| --- | --- | --- |
| `wallpapers/gijinka/claude.webp` | Claude 娘 | ZipZipPipe |
| `wallpapers/gijinka/deepseek.webp` | DeepSeek 娘（上善无形 原角色 · 二创） | ZipZipPipe |
| `wallpapers/gijinka/deepseek-v4flash.webp` | DeepSeek · 小肥鱼 V4F（上善无形 原角色 · 二创） | ZipZipPipe |
| `wallpapers/gijinka/deepseek-harness.webp` | DeepSeek Harness | ZipZipPipe |
| `wallpapers/gijinka/gpt.webp` | GPT 娘 | ZipZipPipe |
| `wallpapers/gijinka/gpt-image2.webp` | GPT Image 2 黑龙娘 | ZipZipPipe |
| `wallpapers/gijinka/gpt-astra.webp` | GPT Astra 娘 | ZipZipPipe |
| `wallpapers/gijinka/gemini.webp` | Gemini 娘 | ZipZipPipe |
| `wallpapers/gijinka/glm.webp` | GLM 娘 | ZipZipPipe |
| `wallpapers/gijinka/qwen.webp` | Qwen 娘 | ZipZipPipe |
| `wallpapers/gijinka/kimi.webp` | Kimi 娘 | ZipZipPipe |
| `wallpapers/gijinka/grok.webp` | Grok 娘 | ZipZipPipe |
| `wallpapers/gijinka/llama.webp` | Llama 娘 | ZipZipPipe |
| `wallpapers/gijinka/mistral.webp` | Mistral 娘 | ZipZipPipe |
| `wallpapers/gijinka/minimax.webp` | MiniMax 娘 | ZipZipPipe |
| `wallpapers/gijinka/hunyuan.webp` | 混元娘 | ZipZipPipe |
| `wallpapers/gijinka/wenxin.webp` | 文心娘 | ZipZipPipe |
| `wallpapers/gijinka/seed.webp` | Seed 娘 | ZipZipPipe |
| `wallpapers/gijinka/rwkv.webp` | RWKV 娘 | ZipZipPipe |
| `wallpapers/gijinka/perplexity.webp` | Perplexity 娘 | ZipZipPipe |
| `wallpapers/gijinka/jev.webp` | JEV 娘 | ZipZipPipe |

如果你只想分发代码：`git rm -r wallpapers/gijinka` 后重新提交，插件依然可以工作（`config.rules` 里指向缺失文件的规则会被跳过，自动使用极光背景）。
