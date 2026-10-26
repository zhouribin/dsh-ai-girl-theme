# AI 娘化主题 · dsh-ai-girl-theme

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 换一套「AI 拟人」外观：**对话区背景跟着模型变**，整个界面换成像素字体，每张 provider 卡片里还能单独挑一张图。

![效果预览：整窗截图，深色主题 + 对话区右侧竖版立绘 + 全局像素字体](docs/preview.webp)

## 不想研究？直接把下面这段丢给你的 DSH

复制整段，粘贴到你正在用的 DSH 对话框里，它自己会装：

```text
请帮我把「AI 娘化主题」装到当前这个 DSH profile 上，只需要装，不用改配置。

安装地址（固定版本，不要替我改成分支名）：
git+https://github.com/zhouribin/dsh-ai-girl-theme.git#v1.1.0

步骤：
1. 用 plugin_manager 的 install_bundle，target 直接用上面这串地址。如果返回 already-installed，就跳过安装、不要重复装。
   如果 install_bundle 不接受这种 git 地址，改用命令行：dsh plugin --profile <当前 profile> add '<上面那串>'，然后把包名加进该 profile 的 dsh.profile.bundles。
2. 看返回里的 application：applied 才算成功；有 warnings 就原样念给我听。
3. 用 cordis_inspect_query（platform=host、provider=Config、method=listConfigs、name=dsh-ai-girl-theme）确认出现 include 开头的 entry 行。
4. 这个插件带客户端模块，必须重启 App 才生效：装完提醒我退出重开，然后刷新页面。
5. 不要改 DSH 安装目录，不要动 ~/.dsh/themes 里已有的图片和 prefs.json，不要改我其它插件的配置。

装好后的效果：对话区按模型换二次元立绘、全局像素字体、设置 → 模型里每个 provider 多一行「对话背景」。
```

装完**重启一次 App**（客户端模块只在启动时扫描），之后换图改配置只需要刷新页面。

## 手动安装（不想用 AI 的话）

侧栏 **「插件」→ 安装**，粘贴：

```
git+https://github.com/zhouribin/dsh-ai-girl-theme.git#v1.1.0
```

或者终端：`dsh plugin --profile <profile> add '<上面那串>'`，然后重启 App。

## 它做了什么

- **一个模型一张背景**：Claude 娘、GPT 龙娘、Gemini 娘、GLM 娘、Qwen 娘、Kimi 娘、Grok 娘、混元娘、文心娘、MiniMax 娘、Mistral 娘、Llama 娘、Seed 娘、RWKV 娘、DeepSeek 娘…… 没匹配到就用内置极光。
- **全局像素字体**：界面、对话、代码块、终端统一一套字体栈；系统里没装的字体名会被跳过，回落默认外观，不会把界面弄坏。
  > 字体文件**不在包里**（授权和体积原因），用的是系统已安装的像素字体——上面截图里的中文像素字来自 `brew install --cask font-zpix`。没装字体时界面保持官方外观。
- **每张 provider 卡片可单独选图**：登录账号这种没有卡片的 provider 单独列在底部。选择会记住，优先级高于规则。
- **自带素材、可离线**：图片由插件自己的路由从 `~/.dsh/themes/images` 提供，不联网、不改 DSH 安装目录。

<details>
<summary><b>自定义（选图、调浓淡、换字体）</b></summary>

### 界面里选图

*设置 → 模型* → 「对话背景」→ 选一张。立刻生效，写进 `~/.dsh/themes/images/prefs.json`，优先级高于所有规则。选「默认（自动匹配）」会清掉这条覆盖（会刷新一次页面）。

想换图：直接在 `~/.dsh/themes/images/` 里同名覆盖；想加图：丢新文件进去，下拉里就会多一项（包内原图只在缺失时补，不覆盖你改过的）。

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
    families: ['Zpix']   # 优先尝试的字体名
    rules:
      - { provider: 'anthropic*', image: gijinka/claude.webp }
      - { model: 'my-local-model*', image: gijinka/qwen.webp }
      - { provider: 'openai*', model: 'o4*', image: gijinka/gpt.webp, scrimDark: 0.5 }
```

规则按顺序生效，后面的覆盖前面的；`provider` / `model` 结尾写 `*` 表示前缀匹配，两者可同时写。

### 像素字体

字体不在包里，用系统已装的（macOS 装完字体要重启 App 才会被页面识别）：

```sh
brew install --cask font-zpix            # 最像素，中文 + 英文
brew install --cask font-fusion-pixel    # 方舟像素，OFL
brew install --cask font-vt323           # VT323，纯英文
```

一个像素字体都没装时，界面就是官方默认字体。

</details>

<details>
<summary><b>工作原理（升级后失效时看这里）</b></summary>

全部实现只有两样东西：**一段注入到页面 bootstrap 的 `<style>`** 和一个只读路由，不碰任何插件的 DOM。

| 依赖的约定 | 用途 |
| --- | --- |
| 模型选择器标签上的 `data-provider-id` / `data-model-id`，配合 `:has(button[aria-haspopup="menu"] …)` | 按当前模型铺背景，且只在输入框触发器上生效（打开模型菜单时背景不动） |
| `--dsw-alias-bg-base`、`data-ds-dark-theme`、`data-ds-theme-source` | 让主区和对话列透出背景，浅色/深色各一套 |
| `--dsw-font-family`、`--ds-font-family-code`、`--dsw-font-mono` | 像素字体 |
| `webserver/index-inject` | 注入样式表和全局变量 `__DSH_AI_GIRL_THEME__` |
| `webServer.register('/ai-girl-theme')` | `/index`（图片列表）、`/prefs`（保存的选择）、`/<file>`（图片） |
| `settings.models.provider-card`、`settings.models.footer` | 选择器所在的两处插槽 |

图片像素尺寸从文件头读（JPEG SOF、WebP 的 VP8/VP8L/VP8X），所以渐隐距离按每张图自己的宽度算。官方某次更新改了上表任意一个名字，对应功能会静默失效，DSH 本体不受影响——按这张表逐项核对即可。

</details>

<details>
<summary><b>常见问题</b></summary>

| 现象 | 原因 |
| --- | --- |
| 装了但没任何变化 | App 没重启，客户端模块没加载。退出重开。 |
| 设置里没有「对话背景」 | 插件在「插件」页被禁用了，或这个 profile 里没有 `@deepseek-ai/dsh-client-ui-settings-models`。 |
| 某个模型没有背景 | 那个 provider 没命中规则；界面里选一张，或补一条 `rules`。没命中时是极光背景。 |
| 图片发白 / 太暗 | 调 `scrimDark`（主开关）和 `veilDark`。 |
| 字体不是像素字 | 没装像素字体，或装完没重启 App。 |
| 客户端更新后全失效 | 见「工作原理」表，改 `index.js` / `client.js` 里对应的名字。 |

</details>

<details>
<summary><b>卸载 / 仓库结构 / 授权 / 兼容性</b></summary>

### 卸载

「插件」里禁用或删除这个 bundle；想连图片一起清掉再删 `~/.dsh/themes/`。DSH 安装目录里的文件没有被改过。

### 仓库结构

```
index.js            Host 端：图片复制、图片路由、样式表、bootstrap 全局变量
client.js           客户端：选择器行、即时生效、保存状态
cordis.patch.yml    默认的 provider/model → 图片规则（48 条）
locale/{en,zh}.json 插件列表里的标题和描述
wallpapers/gijinka/ 21 张竖版立绘（第三方作品，见 LICENSE-ART.md）
```

### 授权

- **代码**：MIT，见 [LICENSE](LICENSE)。
- **图片**：第三方作品，作者 **ZipZipPipe**（DeepSeek 系列为「**上善无形**」原角色二创），图库中标为 **CC BY-NC-SA 4.0**——必须署名、**不能商用**、衍生需同协议。逐文件清单见 [LICENSE-ART.md](LICENSE-ART.md)。
- 想要纯 MIT、可随意分发的版本：`git rm -r wallpapers/gijinka` 后提交，插件仍可用，只是退回内置极光背景。

素材出处：[genderswapai.com · AI 娘化形象图库](https://genderswapai.com/zh-CN/ai-gijinka/gallery)。

### 环境与兼容性

- DeepSeek Harness **0.2.x** 的 Web / Desktop profile（base 系 profile 自带插件管理器）。
- 不需要 npm 账号、token 或 registry：安装地址是 Git URL。
- 桌面端走 nightly，更新频繁；插件不阻塞客户端更新。
- 依赖的内部命名见「工作原理」，官方改名后功能静默失效、不影响本体。

</details>
