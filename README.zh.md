# AI 娘化主题 · dsh-ai-girl-theme

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 换一套「AI 拟人」外观：**对话区背景跟着模型变**，整个界面换成像素字体，每张 provider 卡片里还能单独挑一张图。

![Claude 娘](wallpapers/gijinka/claude.webp)

English: [README.md](README.md)

## 特性

- **一个模型一张背景**：Claude 娘、GPT 龙娘、Gemini 娘、GLM 娘、Qwen 娘、Kimi 娘、Grok 娘、混元娘、文心娘、MiniMax 娘、Mistral 娘、Llama 娘、Seed 娘、RWKV 娘、DeepSeek 娘；按 provider 或模型 id 匹配，没匹配到就用内置极光背景。
- **全局像素字体**：界面、对话、代码块、终端统一一套字体栈；系统里没装的字体名会被 CSS 直接跳过，回落默认外观，不会把界面弄坏。
- **每个 provider 单独选图**：每张 provider 卡片底部一行，登录账号这类没有卡片的 provider 单独列在列表末尾。选择会记住，并且优先级高于规则。
- **自带素材、可离线**：图片由插件自己的路由从 `~/.dsh/themes/images` 提供，不联网、不依赖外部服务，也不改 DSH 安装目录里的任何文件。
- **装完即用**：规则随包下发，装完重启一次就有，不需要先配任何东西。

## 环境要求

- DeepSeek Harness **0.2.x** 的 Web / Desktop profile（`dsh web` 或桌面端）。
- profile 里带插件管理器（base 系的 profile 默认就有）。
- 不需要 npm 账号、token 或能访问 registry：安装地址就是一个 Git URL。

> 桌面端走 **nightly** 通道，更新比较频繁。插件不会阻塞客户端更新；失效判定见[兼容性](#兼容性)。

## 安装

侧栏 **「插件」→ 安装**，粘贴：

```
git+https://github.com/zhouribin/dsh-ai-girl-theme.git#v1.1.0
```

或者在终端：

```sh
dsh plugin --profile <profile> add 'git+https://github.com/zhouribin/dsh-ai-girl-theme.git#v1.1.0'
```

装完**重启一次 App**：插件的客户端模块只在启动时扫描。之后改配置、换图只需要刷新页面。

地址请固定到 tag 或 commit（`#v1.1.0`、`#8624a36…`），写分支名会跟着后续提交走。

## 装上之后

| 位置 | 变化 |
| --- | --- |
| 对话区 | 换模型就换背景；图片高度铺满视口、按原图比例取宽、贴右对齐，左边缘渐隐进界面底色。 |
| 侧栏 | 不变，仍是实色——保证列表可读性。 |
| 设置 → 模型 | 每张 provider 卡片底部多一行「对话背景」，末尾多一块「登录账号 / 其它 provider」。每行有缩略图和「已保存 / 跟随规则」状态。 |
| `~/.dsh/themes/images/` | 图片（首次激活从包里复制过来）和 `prefs.json`（你选过的 provider → 图片）。 |

想换图：直接在该目录同名覆盖；想加图：丢新文件进去，下拉里就会多一项。包内的原图只在缺失时补，不会覆盖你改过的版本。

## 工作原理

全部实现只有两样东西：**一段注入到页面 bootstrap 的 `<style>`** 和一个只读路由，不碰任何插件的 DOM。

| 依赖的约定 | 用途 |
| --- | --- |
| 模型选择器标签上的 `data-provider-id` / `data-model-id`，配合 `:has(button[aria-haspopup="menu"] …)` | 按当前模型铺背景，且只在输入框触发器上生效（打开模型菜单浏览别的模型时背景不动） |
| `--dsw-alias-bg-base`、`data-ds-dark-theme`、`data-ds-theme-source` | 让主区和对话列透出背景，浅色/深色各一套 |
| `--dsw-font-family`、`--ds-font-family-code`、`--dsw-font-mono` | 像素字体 |
| `webserver/index-inject` | 注入样式表，以及给选择器用的全局变量 `__DSH_AI_GIRL_THEME__` |
| `webServer.register('/ai-girl-theme')` | `GET /index`（图片列表）、`GET\|POST /prefs`（保存的选择）、`GET /<file>`（图片） |
| `settings.models.provider-card`、`settings.models.footer` | 选择器所在的两处插槽 |

渐隐距离是从图片文件头读出来的（JPEG SOF、WebP 的 VP8/VP8L/VP8X 三种），按每张图自己的宽度算，所以竖版立绘的左边缘过渡始终贴合。

## 自定义

### 在界面里选图

*设置 → 模型* → 「对话背景」→ 选一张。立刻生效，写入 `~/.dsh/themes/images/prefs.json`，优先级高于所有规则。选「默认（自动匹配）」会清掉这条覆盖（会刷新一次页面，让服务端下发的样式表同步）。

### 用 patch 写规则

`~/.dsh/profiles/<profile>/cordis.patch.yml`——同 id 的行会**整段替换**包里自带的 config：

```yaml
- id: ai-girl-theme
  name: 'dsh-ai-girl-theme'
  config:
    dir: '~/.dsh/themes/images'
    veilDark: 0.4        # 深色下底色不透明度（1 = 完全挡住壁纸）
    veilLight: 0.6
    scrimDark: 0.68      # 盖在图片上的蒙版（越小越亮）
    scrimLight: 0.88
    font: true           # false = 保持官方字体
    families: ['Zpix']   # 优先尝试的字体名，排在内置列表前
    rules:
      - { provider: 'anthropic*', image: gijinka/claude.webp }
      - { model: 'my-local-model*', image: gijinka/qwen.webp }
      - { provider: 'openai*', model: 'o4*', image: gijinka/gpt.webp, scrimDark: 0.5 }
```

规则按顺序生效，后面的覆盖前面的；`provider` / `model` 结尾写 `*` 表示前缀匹配，两者可以同时写。

### 像素字体

字体不在包里（避免体积和授权问题），用系统已装的：

```sh
brew install --cask font-zpix            # 最像素，中文 + 英文
brew install --cask font-fusion-pixel    # 方舟像素，OFL
brew install --cask font-vt323           # VT323，纯英文
```

macOS 上装完字体要**重启 App** 才会被页面识别。一个像素字体都没装时，界面就是官方默认字体。

## 常见问题

| 现象 | 原因 |
| --- | --- |
| 装了但没任何变化 | App 没重启，客户端模块没加载。退出重开。 |
| 设置里没有「对话背景」 | 插件在「插件」页被禁用了，或者这个 profile 里没有 `@deepseek-ai/dsh-client-ui-settings-models`。 |
| 某个模型没有背景 | 那个 provider 没有命中规则；在界面里选一张，或补一条 `rules`。没命中时用的是极光背景。 |
| 图片发白 / 太暗 | 调 `scrimDark`（主开关）和 `veilDark`。 |
| 字体不是像素字 | 没装像素字体，或装完没重启 App。 |
| 客户端更新后全失效 | [工作原理](#工作原理)表里的某个名字被官方改了。要改的文件：`index.js`（CSS 变量、路由、图片复制）和 `client.js`（选择器、全局变量名）。 |

## 卸载

在「插件」里禁用或删除这个 bundle；想连图片一起清掉再删 `~/.dsh/themes/`。DSH 安装目录里的文件没有被改过。

## 仓库结构

```
index.js            Host 端：图片复制、图片路由、样式表、bootstrap 全局变量
client.js           客户端：选择器行、即时生效、保存状态
cordis.patch.yml    默认的 provider/model → 图片规则
locale/{en,zh}.json 插件列表里的标题和描述
wallpapers/gijinka/ 21 张竖版立绘（第三方作品，见 LICENSE-ART.md）
```

## 授权

- **代码**：MIT，见 [LICENSE](LICENSE)。
- **`wallpapers/gijinka/` 里的图片**：第三方作品，作者 **ZipZipPipe**（DeepSeek 系列为「**上善无形**」原角色二创），图库中标为 **CC BY-NC-SA 4.0**——必须署名、**不能商用**、衍生需同协议。逐文件清单见 [LICENSE-ART.md](LICENSE-ART.md)。
- 所以分发这个包 = 分发非商业素材。如果想要一个纯 MIT、可随意分发的版本：`git rm -r wallpapers/gijinka` 后提交即可，插件仍然可用，只是退回内置极光背景。

素材出处：[genderswapai.com · AI 娘化形象图库](https://genderswapai.com/zh-CN/ai-gijinka/gallery)。

## 兼容性

本插件依赖 DSH 的若干内部命名：上面列出的 CSS 变量、模型标签上的两个 `data-*` 属性、两个设置插槽、以及 `webserver/index-inject` 事件。官方某次更新改了其中一个，对应功能会**静默失效**——DSH 本体不受影响。

升级后按[工作原理](#工作原理)那张表逐项核对即可；欢迎 PR 适配新名字。
