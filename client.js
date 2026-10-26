window.__ModuleLoader__.load({
  id: 'dsh-ai-girl-theme',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Page global the Host half writes on every index render. */
    const GLOBAL_NAME = '__DSH_AI_GIRL_THEME__';
    /** Locale namespace for the settings rows. */
    const NS = 'wallpaper-ui';
    /** Provider-card cells are keyed by the card's settings namespace. */
    const NAMESPACES = [
      'llm-deepseek',
      'llm-pi-ai',
      'llm-anthropic',
      'llm-openai',
      'llm-gemini',
      'llm-google',
      'llm-glm',
      'llm-zhipu',
      'llm-moonshot',
      'llm-xai',
      'llm-mistral',
      'llm-minimax',
      'llm-qwen',
      'llm-dashscope',
      'llm-tencent',
      'llm-hunyuan',
      'llm-baidu',
      'llm-seed',
      'llm-rwkv',
      'llm-perplexity',
      'llm-openrouter',
    ];
    /** Account routes that never render a provider card, listed before the Host reports providers. */
    const ACCOUNT_FALLBACK = [{ id: 'deepseek-account', name: 'DeepSeek 账号' }];

    const zh = {
      'title': '对话背景',
      'desc': '选一张图作为这个 provider 下的对话背景；「默认」表示交给插件的规则决定。',
      'default': '默认（自动匹配）',
      'loading': '读取图片…',
      'group.gijinka': 'AI 拟人',
      'group.local': '本地图片',
      'state.saved': '已保存：这个 provider 使用你选的图',
      'state.auto': '当前跟随规则（未自定义）',
      'footer.title': '登录账号 / 其它 provider',
      'footer.desc': '这些 provider 没有独立卡片，在这里单独设置背景。',
    };
    const en = {
      'title': 'Conversation wallpaper',
      'desc': 'Pick a picture for conversations on this provider; "Default" leaves it to the plugin rules.',
      'default': 'Default (automatic)',
      'loading': 'Loading images…',
      'group.gijinka': 'AI gijinka',
      'group.local': 'Local images',
      'state.saved': 'Saved: this provider uses your picture',
      'state.auto': 'Following the rules (not customised)',
      'footer.title': 'Signed-in account / other providers',
      'footer.desc': 'These providers render no card of their own; set their wallpaper here.',
    };

    const ROW_CSS = [
      '.dshwp-row{display:flex;align-items:center;gap:12px;padding:10px 12px;margin-top:8px;',
      'border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md,12px);',
      'background:var(--dsw-alias-bg-layer-1);}',
      '.dshwp-text{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;}',
      '.dshwp-title{font-size:13px;line-height:18px;font-weight:500;color:var(--dsw-alias-label-primary);}',
      '.dshwp-desc{font-size:12px;line-height:16px;color:var(--dsw-alias-label-secondary);}',
      '.dshwp-select{flex:none;max-width:220px;height:30px;padding:0 8px;',
      'border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm,8px);',
      'background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);',
      'font-family:var(--dsw-font-family);font-size:12px;}',
      '.dshwp-select:disabled{opacity:.6;}',
      '.dshwp-state{margin-top:2px;font-size:11px;line-height:15px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));}',
      '.dshwp-state-on{color:var(--dsw-alias-state-success-primary);}',
      '.dshwp-thumb{flex:none;width:44px;height:30px;object-fit:cover;',
      'border-radius:var(--dsw-radius-xs,4px);border:.5px solid var(--dsw-alias-border-l1);}',
      '.dshwp-footer{margin-top:16px;display:flex;flex-direction:column;gap:8px;}',
      '.dshwp-footer-title{font-size:12px;line-height:16px;color:var(--dsw-alias-label-secondary);}',
    ].join('');

    /** Bootstrap data the Host injected for this page. */
    function bootstrap() {
      if (typeof window === 'undefined') return undefined;
      const value = window[GLOBAL_NAME];
      return value !== null && typeof value === 'object' ? value : undefined;
    }

    /** Quote a value for a CSS attribute selector. */
    function cssAttr(value) {
      return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }

    /** Body attributes carrying the provider/model the composer last showed. */
    const PROVIDER_ATTR = 'aiGirlProvider';
    const MODEL_ATTR = 'aiGirlModel';
    const STORE_KEY = 'dsh-ai-girl-model';

    /** Write the current pair onto <body>; never cleared when the composer unmounts. */
    function setCurrent(provider, model) {
      if (typeof document === 'undefined' || document.body === null) return;
      const body = document.body;
      const nextModel = typeof model === 'string' ? model : '';
      if (body.dataset[PROVIDER_ATTR] === provider && body.dataset[MODEL_ATTR] === nextModel) return;
      body.dataset[PROVIDER_ATTR] = provider;
      body.dataset[MODEL_ATTR] = nextModel;
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify({ provider, model: nextModel }));
      } catch {
        /* storage can be unavailable; the live attribute is enough */
      }
    }

    /** Recover the last pair before the composer has rendered (reload / active turn). */
    function restoreCurrent() {
      if (typeof window === 'undefined') return;
      let restored = false;
      try {
        const saved = JSON.parse(window.localStorage.getItem(STORE_KEY) ?? 'null');
        if (saved !== null && typeof saved === 'object' && typeof saved.provider === 'string' && saved.provider !== '') {
          setCurrent(saved.provider, saved.model);
          restored = true;
        }
      } catch {
        /* ignore malformed or unavailable storage */
      }
      if (restored) return;
      const boot = bootstrap();
      const current = boot !== undefined && boot.current !== null && typeof boot.current === 'object' ? boot.current : undefined;
      if (current !== undefined && typeof current.provider === 'string' && current.provider !== '') {
        setCurrent(current.provider, current.model);
      }
    }

    /** Read the composer's model label and remember it, without touching open menus. */
    function rememberCurrent() {
      if (typeof document === 'undefined') return;
      const composer = document.querySelector('[data-conversation-region="composer"]');
      if (composer === null) return;
      const trigger = composer.querySelector('button[aria-haspopup="menu"] [data-provider-id]');
      const fallback = [...composer.querySelectorAll('[data-provider-id]')]
        .find((node) => node.closest('[role="menu"], [role="listbox"]') === null);
      const node = trigger ?? fallback;
      if (node === undefined || node === null || typeof node.dataset.providerId !== 'string' || node.dataset.providerId === '') return;
      setCurrent(node.dataset.providerId, node.dataset.modelId);
    }

    /** Distance over which the picture's near edge dissolves into the backdrop, in px. */
    function fadeSpan(width) {
      const start = Math.max(24, Math.min(96, Math.round(width * 0.05)));
      const end = Math.max(140, Math.min(420, Math.round(width * 0.22)));
      return [start, Math.max(start + 80, end)];
    }

    /**
     * Mirror of the Host rule: full-height picture against the right edge, its
     * left edge dissolved into the surface color, both palettes.
     * @param provider - provider route id.
     * @param url - served picture URL.
     * @param boot - bootstrap knobs.
     * @param size - pixel size of the picture, when known.
     */
    function ruleFor(provider, url, boot, size) {
      const attr = `[data-ai-girl-provider=${cssAttr(provider)}]`;
      const has = `html[data-ds-theme-source]:root body:is(${attr})`;
      const lightScrim = `${boot.scrimLight}`;
      const darkScrim = `${boot.scrimDark}`;
      if (size === undefined || !(size.width > 0) || !(size.height > 0)) {
        return `${has}{`
          + `background-image:linear-gradient(rgba(255,255,255,${lightScrim}),rgba(255,255,255,${lightScrim})),url("${url}") !important;`
          + 'background-size:cover,cover !important;background-position:center center,center !important;'
          + 'background-repeat:no-repeat,no-repeat !important;background-attachment:fixed,fixed !important;}\n'
          + `html[data-ds-theme-source]:root body[data-ds-dark-theme]:is(${attr}){`
          + `background-image:linear-gradient(rgba(9,10,14,${darkScrim}),rgba(9,10,14,${darkScrim})),url("${url}") !important;}`;
      }
      const span = fadeSpan(size.width);
      const box = `calc(100vh * ${(size.width / size.height).toFixed(4)}) 100%`;
      return `${has}{`
        + 'background-color:#ffffff !important;'
        + 'background-image:linear-gradient(to right,'
        + `rgba(255,255,255,1) 0px,rgba(255,255,255,1) ${span[0]}px,`
        + `rgba(255,255,255,${lightScrim}) ${span[1]}px,rgba(255,255,255,${lightScrim}) 100%),url("${url}") !important;`
        + `background-size:${box},auto 100% !important;`
        + 'background-position:right center,right center !important;'
        + 'background-repeat:no-repeat,no-repeat !important;'
        + 'background-attachment:fixed,fixed !important;}\n'
        + `html[data-ds-theme-source]:root body[data-ds-dark-theme]:is(${attr}){`
        + 'background-color:#151517 !important;'
        + 'background-image:linear-gradient(to right,'
        + `rgba(21,21,23,1) 0px,rgba(21,21,23,1) ${span[0]}px,`
        + `rgba(9,10,14,${darkScrim}) ${span[1]}px,rgba(9,10,14,${darkScrim}) 100%),url("${url}") !important;}`;
    }

    /** Read one picture's pixel size in the page, resolving `undefined` on failure. */
    function probeSize(url) {
      return new Promise((resolve) => {
        const image = new Image();
        const settle = (value) => resolve(value);
        image.onload = () => settle({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => settle(undefined);
        window.setTimeout(() => settle(undefined), 1500);
        image.src = url;
      });
    }

    /** One `<style>` per provider, replaced on every change so the page updates live. */
    const liveTags = new Map();

    /** Apply one choice without a reload. */
    function applyLive(provider, image, boot) {
      const existing = liveTags.get(provider);
      if (image === '') {
        if (existing !== undefined) {
          existing.remove();
          liveTags.delete(provider);
        }
        return;
      }
      let tag = existing;
      if (tag === undefined || !tag.isConnected) {
        tag = document.createElement('style');
        tag.dataset.plugin = 'dsh-ai-girl-theme';
        tag.dataset.provider = provider;
        document.head.append(tag);
        liveTags.set(provider, tag);
      }
      const url = `${boot.route}/${image}`;
      probeSize(url).then((size) => {
        tag.textContent = ruleFor(provider, url, boot, size);
      });
    }

    /** Remove every live tag this plugin added. */
    function dropLiveTags() {
      for (const tag of liveTags.values()) tag.remove();
      liveTags.clear();
    }

    /** Short label for one served image. */
    function labelOf(path) {
      const base = path.split('/').pop() ?? path;
      return base.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]/g, ' ');
    }

    /** Provider routes whose card already renders a picker, so the footer can skip them. */
    const cardProviders = new Set();
    const cardListeners = new Set();

    /** Record that a provider card mounted (or unmounted) its picker. */
    function noteCard(provider, present) {
      if (present) cardProviders.add(provider);
      else cardProviders.delete(provider);
      for (const listener of cardListeners) listener();
    }

    /**
     * One provider's picker: saved choice, image list, live apply and status line.
     * @param props - `providerId`, optional `name`, `t`, `boot`, `compact`.
     * @returns the row element.
     */
    function WallpaperPicker(props) {
      const { providerId, t, boot } = props;
      const initial = boot.prefs !== undefined && typeof boot.prefs[providerId] === 'string' ? boot.prefs[providerId] : '';
      const [images, setImages] = React.useState(null);
      const [value, setValue] = React.useState(initial);
      const [busy, setBusy] = React.useState(false);
      const [saved, setSaved] = React.useState(initial !== '');

      React.useEffect(() => {
        let alive = true;
        fetch(`${boot.route}/index`, { headers: { accept: 'application/json' } })
          .then((response) => (response.ok ? response.json() : { images: [] }))
          .then((data) => {
            if (alive) setImages(Array.isArray(data.images) ? data.images : []);
          })
          .catch(() => {
            if (alive) setImages([]);
          });
        // The boot snapshot is only a first-paint guess; the saved file is the truth.
        fetch(`${boot.route}/prefs`, { headers: { accept: 'application/json' } })
          .then((response) => (response.ok ? response.json() : { prefs: {} }))
          .then((data) => {
            const map = data !== null && typeof data === 'object' && data.prefs !== null && typeof data.prefs === 'object'
              ? data.prefs
              : {};
            const pick = typeof map[providerId] === 'string' ? map[providerId] : '';
            if (!alive) return;
            setValue(pick);
            setSaved(pick !== '');
          })
          .catch(() => {
            /* keep the boot value */
          });
        return () => {
          alive = false;
        };
      }, [providerId]);

      const commit = (next) => {
        if (next === value || busy) return;
        setValue(next);
        setSaved(next !== '');
        setBusy(true);
        fetch(`${boot.route}/prefs`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ provider: providerId, image: next }),
        })
          .then((response) => {
            if (!response.ok) throw new Error(`prefs ${String(response.status)}`);
            return response.json();
          })
          .then((data) => {
            const map = data !== null && typeof data === 'object' && data.prefs !== null && typeof data.prefs === 'object'
              ? data.prefs
              : {};
            const settled = typeof map[providerId] === 'string' ? map[providerId] : '';
            if (settled !== next) {
              setValue(settled);
              setSaved(settled !== '');
              throw new Error('prefs not stored');
            }
            if (next === '') {
              // The served stylesheet still carries the old choice; reload to drop it.
              window.location.reload();
              return;
            }
            applyLive(providerId, next, boot);
          })
          .catch(() => {
            /* keep the selection; the next page load reconciles with the Host */
          })
          .finally(() => setBusy(false));
      };

      const groups = [];
      if (images !== null) {
        const gijinka = images.filter((path) => path.startsWith('gijinka/'));
        const local = images.filter((path) => !path.startsWith('gijinka/'));
        if (gijinka.length > 0) {
          groups.push(h('optgroup', { key: 'gijinka', label: t('group.gijinka') }, gijinka.map((path) => h('option', { key: path, value: path }, labelOf(path)))));
        }
        if (local.length > 0) {
          groups.push(h('optgroup', { key: 'local', label: t('group.local') }, local.map((path) => h('option', { key: path, value: path }, labelOf(path)))));
        }
      }

      return h('div', { className: 'dshwp-row' }, [
        h('div', { className: 'dshwp-text', key: 'text' }, [
          h('div', { className: 'dshwp-title', key: 'title' }, typeof props.name === 'string' && props.name !== '' ? props.name : t('title')),
          h('div', { className: 'dshwp-desc', key: 'desc' }, typeof props.name === 'string' && props.name !== '' ? t('footer.desc') : t('desc')),
          h('div', { className: saved ? 'dshwp-state dshwp-state-on' : 'dshwp-state', key: 'state' }, saved ? t('state.saved') : t('state.auto')),
        ]),
        h('select', {
          key: 'select',
          className: 'dshwp-select',
          value,
          disabled: busy,
          'aria-label': t('title'),
          onChange: (event) => commit(event.currentTarget.value),
        }, [
          h('option', { key: '', value: '' }, t('default')),
          images === null ? h('option', { key: '__loading', value: '__loading', disabled: true }, t('loading')) : null,
          images !== null && value !== '' && !images.includes(value) ? h('option', { key: value, value }, value) : null,
          ...groups,
        ]),
        value === '' ? null : h('img', { key: 'thumb', className: 'dshwp-thumb', alt: '', src: `${boot.route}/${value}` }),
      ]);
    }

    /**
     * One provider card's wallpaper picker.
     * @param props - owner props (`provider`, `configured`, `keyConfigured`) plus `t`.
     * @returns the row element, or null when the card carries no provider.
     */
    function WallpaperRow(props) {
      const provider = props.provider;
      const id = provider !== null && typeof provider === 'object' && typeof provider.provider === 'string'
        ? provider.provider
        : undefined;
      React.useEffect(() => {
        if (id === undefined) return undefined;
        noteCard(id, true);
        return () => noteCard(id, false);
      }, [id]);
      const boot = bootstrap();
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      if (boot === undefined || id === undefined) return null;
      return h(WallpaperPicker, { key: id, providerId: id, t, boot });
    }

    /**
     * Picker rows for providers that render no card (the signed-in account above all).
     * @param props - composed slot props carrying `t`.
     * @returns the footer element, or null when every provider card already covers them.
     */
    function WallpaperFooter(props) {
      const boot = bootstrap();
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      const [, force] = React.useState(0);
      React.useEffect(() => {
        const listener = () => force((count) => count + 1);
        cardListeners.add(listener);
        // Cards register in their own effects; settle one tick later so the
        // footer never lists a provider whose card already has a picker.
        const tick = window.setTimeout(() => listener(), 0);
        return () => {
          cardListeners.delete(listener);
          window.clearTimeout(tick);
        };
      }, []);
      if (boot === undefined) return null;
      const reported = Array.isArray(boot.providers)
        ? boot.providers.filter((entry) => entry !== null && typeof entry === 'object' && typeof entry.id === 'string')
        : [];
      const list = reported.length > 0 ? reported : ACCOUNT_FALLBACK;
      const extra = list.filter((entry) => !cardProviders.has(entry.id));
      if (extra.length === 0) return null;
      return h('div', { className: 'dshwp-footer' }, [
        h('div', { className: 'dshwp-footer-title', key: 'title' }, t('footer.title')),
        ...extra.map((entry) => h(WallpaperPicker, {
          key: entry.id,
          providerId: entry.id,
          name: typeof entry.name === 'string' ? entry.name : entry.id,
          t,
          boot,
        })),
      ]);
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => {
          const tag = document.createElement('style');
          tag.dataset.plugin = 'dsh-ai-girl-theme';
          tag.textContent = ROW_CSS;
          document.head.append(tag);
          return () => {
            tag.remove();
            dropLiveTags();
          };
        }, 'wallpaper: picker styles');
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'wallpaper: picker copy');
        ctx.effect(() => {
          if (typeof document === 'undefined' || document.body === null) return undefined;
          restoreCurrent();
          rememberCurrent();
          const observer = new MutationObserver(rememberCurrent);
          observer.observe(document.body, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['data-provider-id', 'data-model-id'],
          });
          return () => observer.disconnect();
        }, 'wallpaper: current model');
        ctx.effect(() => {
          const boot = bootstrap();
          if (boot === undefined) return undefined;
          let alive = true;
          fetch(`${boot.route}/prefs`, { headers: { accept: 'application/json' } })
            .then((response) => (response.ok ? response.json() : { prefs: {} }))
            .then((data) => {
              if (!alive || data === null || typeof data !== 'object') return;
              const saved = data.prefs !== null && typeof data.prefs === 'object' ? data.prefs : {};
              for (const [provider, image] of Object.entries(saved)) {
                if (typeof image === 'string' && image !== '') applyLive(provider, image, boot);
              }
            })
            .catch(() => {});
          return () => {
            alive = false;
          };
        }, 'wallpaper: saved choices');
        for (const key of NAMESPACES) {
          ctx.slots.inject('settings.models.provider-card', () => ctx.slots.register({
            name: 'settings.models.provider-card',
            key,
            locale: NS,
          }, WallpaperRow));
        }
        ctx.slots.inject('settings.models.footer', () => ctx.slots.register({
          name: 'settings.models.footer',
          id: 'wallpaper',
          order: 40,
          locale: NS,
        }, WallpaperFooter));
      },
    };
  },
});
