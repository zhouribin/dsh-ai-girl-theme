# AI 拟人主题包 · dsh-ai-girl-theme

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 换一套「AI 拟人」外观：

- **对话区按模型换立绘**：Claude 娘、GPT 龙娘、GLM 娘、Qwen 娘、Kimi 娘、Grok 娘、混元娘、文心娘、MiniMax 娘、Mistral 娘、Llama 娘、Seed 娘、RWKV 娘、DeepSeek 娘…… 没匹配到就用内置极光背景。
- **全局像素字体**：界面、对话、代码块、终端一起换（用系统里已安装的像素字体，没装会自动回落）。
- **每个 provider 单独选图**：「设置 → 模型」每张卡片底部多一行「对话背景」，登录账号这类没有卡片的 provider 在列表底部单独列出来。选择会记住，优先级高于规则。

## 安装

需要 DSH 0.2.x 的 Web/Desktop 客户端（插件走 profile，不改进程本体）。

**方式一：GUI** — 侧栏「插件」→ 安装 → 粘贴：

```
git+https://github.com/<你>/dsh-ai-girl-theme.git#<commit>
```

**方式二：命令行**

```sh
dsh plugin --profile <profile> add 'git+https://github.com/<你>/dsh-ai-girl-theme.git#<commit>'
# 然后在 设置 → 插件 里启用这个（bundle 会自动加入 profile）
```

装完**重启一次 App**（客户端模块只在启动时扫描），之后改配置/换图只需刷新页面。

## 它做了什么

| 能力 | 实现 |
| --- | --- |
| 按模型换背景 | 读输入框模型控件上的 `data-provider-id` / `data-model-id`，用 `:has()` 只认触发器（打开模型菜单时背景不会乱跳） |
| 图片铺法 | 高度铺满视口、宽度按原图比例、贴右对齐；左边缘按图片宽度自适应渐隐进界面底色 |
| 透出背景 | 把 `--dsw-alias-bg-base` 叠一层 alpha（浅/深色各一套），主区、对话列一起半透明 |
| 像素字体 | 重声明 `--dsw-font-family` / `--ds-font-family-code` / `--dsw-font-mono` |
| 手动选图 | `settings.models.provider-card` 与 `settings.models.footer` 两个插槽 + `/ai-girl-theme/prefs` 读写 |

所有样式都是**单一 `<style>` 注入**，不改任何插件的 DOM。

## 换图 / 加图

首次启动会把包内 `wallpapers/gijinka/` 复制到 `~/.dsh/themes/images/`（`prefs.json` 也在这里）。之后：

- 同名覆盖 = 换图；新增文件 = 下拉里多一项；
- 想加别的模型：编辑 profile 的 `cordis.patch.yml` 里 `ai-girl-theme` 的 `rules`，例如

```yaml
- id: ai-girl-theme
  name: 'dsh-ai-girl-theme'
  config:
    rules:
      - { model: 'my-model*', image: gijinka/claude-wallpaper.webp }
```

## 字体

默认优先 `Zpix`、`Fusion Pixel`、`Ark Pixel` 等中文像素字体，再退到 VT323 / Press Start 2P 等英文像素字体，最后是系统字体。装一个字库即可：

```sh
brew install --cask font-zpix            # 中文 + 英文
brew install --cask font-fusion-pixel    # OFL 开源
```

没装也**不会坏**：字体列表里不存在的名字会被 CSS 跳过，界面回到默认字体。

## 卸载

插件管理里禁用或删除这个 bundle；`~/.dsh/themes/` 是纯数据，删掉即恢复默认外观。

## 授权

- **代码**：MIT（`LICENSE`）
- **立绘**：第三方作品（作者 ZipZipPipe 等，CC BY-NC-SA 4.0 系列），**非商业**，详见 [`LICENSE-ART.md`](LICENSE-ART.md)。不想带图就把 `wallpapers/gijinka/` 删掉，插件会退回内置极光背景。

## 已知边界

- 依赖 DSH 的几处内部约定（CSS 变量名、`data-provider-id` 属性、两个设置插槽）。官方改名后会静默失效，不会影响 DSH 本体。
- 壁纸作用于主区所有面板（对话、设置、插件页），不只是聊天页。
- 夜间通道（nightly）更新频繁，升级后如有失效，对照上表重新核对变量名即可。
