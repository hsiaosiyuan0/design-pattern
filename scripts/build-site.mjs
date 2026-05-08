import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "dist");

const publicPages = [
  { source: "README.md", output: "index.html", kind: "cover", label: "封面" },
  { source: "SERIES-BIBLE.md", output: "series-bible.html", kind: "appendix", label: "人物与势力" },
  { source: "GEO-ATLAS.md", output: "geo-atlas.html", kind: "appendix", label: "地理附录" },
];

const chapterSources = fs
  .readdirSync(path.join(root, "articles"))
  .filter((file) => file.endsWith(".md"))
  .sort()
  .map((file) => ({
    source: `articles/${file}`,
    output: `articles/${file.replace(/\.md$/, ".html")}`,
    kind: "chapter",
  }));

const pages = [...publicPages, ...chapterSources].map((page, index) => {
  const markdown = fs.readFileSync(path.join(root, page.source), "utf8");
  const title = extractTitle(markdown) || page.label || "乱世里的设计模式";
  return {
    ...page,
    index,
    title,
    navTitle: page.label || title.replace(/^第[一二三四五六七八九十百]+回：/, ""),
    markdown: filterPublicMarkdown(markdown, page.source),
  };
});

pages.forEach((page, index) => {
  page.previous = pages[index - 1];
  page.next = pages[index + 1];
});

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.join(outDir, "articles"), { recursive: true });
copyDir(path.join(root, "assets"), path.join(outDir, "assets"));
writeFile("styles/site.css", siteCss());
writeFile("scripts/site.js", siteJs());
writeFile(".nojekyll", "");

for (const page of pages) {
  writeFile(page.output, renderPage(page, pages));
}

console.log(`Built ${pages.length} pages into dist/`);

function renderPage(page, allPages) {
  const bodyClass = page.kind === "cover" ? "page-cover" : page.kind === "chapter" ? "page-chapter" : "page-appendix";
  const html = markdownToHtml(page.markdown, page.source);
  const chapterIndex = allPages.filter((item) => item.kind === "chapter");
  const currentHref = hrefFor(page.output, page.output);
  const canonicalTitle = escapeHtml(page.title);
  const homeHref = hrefFor("index.html", page.output);
  const mainContent =
    page.kind === "cover"
      ? renderCoverHome(chapterIndex, page.output)
      : renderReaderPage(page, html);

  return `<!doctype html>
<html lang="zh-Hans">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${canonicalTitle} · 乱世里的设计模式</title>
  <meta name="description" content="用历史小说笔法讲解 Java 设计模式。">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Libre+Baskerville:wght@400;700&family=Noto+Serif+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${hrefFor("styles/site.css", page.output)}">
</head>
<body class="${bodyClass}">
  <a class="skip-link" href="#content">跳到正文</a>
  <div class="reading-progress" aria-hidden="true"><span></span></div>
  <header class="site-header">
    <a class="brand" href="${homeHref}" aria-label="返回封面">
      ${bookIcon()}
      <span>乱世里的设计模式</span>
    </a>
    <nav class="topnav" aria-label="主导航">
      <a href="${homeHref}#chapters">卷目</a>
      <a href="${hrefFor("series-bible.html", page.output)}">人物</a>
      <a href="${hrefFor("geo-atlas.html", page.output)}">地理</a>
      <a href="${hrefFor("articles/01-strategy.html", page.output)}">开卷</a>
    </nav>
    <button class="toc-button" type="button" aria-controls="site-drawer" aria-expanded="false">
      ${menuIcon()}
      <span>目录</span>
    </button>
  </header>
  <div class="drawer-scrim" data-drawer-close></div>
  <div class="site-shell">
    <aside class="chapter-rail" id="site-drawer" aria-label="章节目录">
      ${renderNavMenu(chapterIndex, currentHref, page.output)}
    </aside>
    <main class="content" id="content">
      ${mainContent}
    </main>
  </div>
  ${renderSiteFooter()}
  <script src="${hrefFor("scripts/site.js", page.output)}"></script>
</body>
</html>`;
}

function renderSiteFooter() {
  return `<footer class="site-footer" aria-label="版权声明">
    <p>© ${new Date().getFullYear()} 乱世里的设计模式。保留所有权利。</p>
    <p>未经作者书面许可，禁止转载、摘编、搬运、镜像、改编或用于商业发布。</p>
  </footer>`;
}

function renderCoverHome(chapterIndex, fromOutput) {
  return `<section class="cover-hero" aria-label="连载封面">
    <img class="cover-visual" src="${hrefFor("assets/maps/series-atlas-final.png", fromOutput)}" alt="乱世里的设计模式总地图">
    <div class="cover-copy">
      <p class="eyebrow">Online Serial · Java Design Patterns</p>
      <h1><span>乱世里的</span><span>设计模式</span></h1>
      <p>一部把五代十国乱局、军府治理与 Java 设计模式织在一起的长篇教程。</p>
      <div class="hero-actions">
        <a class="primary-link" href="${hrefFor("articles/01-strategy.html", fromOutput)}">从第一回开始</a>
        <a class="secondary-link" href="#chapters">查看二十三回</a>
      </div>
      <dl class="cover-stats" aria-label="连载信息">
        <div><dt>卷数</dt><dd>23 回</dd></div>
        <div><dt>语言</dt><dd>Java</dd></div>
        <div><dt>读法</dt><dd>小说式教程</dd></div>
      </dl>
    </div>
  </section>
  <section class="story-brief" aria-label="作品简介">
    <div>
      <p class="section-kicker">Story Premise</p>
      <h2>沈策行于乱世，每一地都是一次系统设计。</h2>
    </div>
    <p>这套文章不把设计模式当成术语表，而是让策略、工厂、代理、观察者等模式落进军府、边城、奏章、使节和行旅之中。读者先看见冲突，再看见抽象为什么必要。</p>
  </section>
  ${renderChapterShelf(chapterIndex, fromOutput)}
  <section class="reading-guide" aria-label="阅读说明">
    <div class="guide-item">
      <h2>适合谁读</h2>
      <p>会 Java 基础语法，但总觉得设计模式只记得名字、不知道何时下手的读者。</p>
    </div>
    <div class="guide-item">
      <h2>阅读方式</h2>
      <p>按小说顺序从第一回读起，或者直接从卷目里挑一个模式进入正文。</p>
    </div>
    <div class="guide-item">
      <h2>反复讲清</h2>
      <p>问题代码为何会乱，抽象动作怎样发生，以及 Java 里最小可用的写法。</p>
    </div>
  </section>`;
}

function navLink(output, label, currentHref, fromOutput) {
  const href = hrefFor(output, fromOutput);
  const active = href === currentHref ? " active" : "";
  const parts = chapterParts(label);
  if (!parts) return `<a class="rail-link appendix-link${active}" href="${href}">${escapeHtml(label)}</a>`;
  return `<a class="rail-link${active}" href="${href}">
    <span class="rail-no">${escapeHtml(parts.number)}</span>
    <span class="rail-title">${escapeHtml(parts.story)}</span>
    <span class="rail-pattern">${escapeHtml(parts.pattern)}</span>
  </a>`;
}

function renderNavMenu(chapterIndex, currentHref, fromOutput) {
  return `<div class="rail-head">
    <div>
      <p class="rail-eyebrow">Contents</p>
      <h2>卷目</h2>
    </div>
    <button class="drawer-close" type="button" data-drawer-close aria-label="关闭目录">
      ${closeIcon()}
    </button>
  </div>
  <div class="rail-scroll">
    <section class="rail-section">
      <p class="rail-kicker">附录</p>
      ${publicPages.map((item) => navLink(item.output, item.label, currentHref, fromOutput)).join("")}
    </section>
    <section class="rail-section">
      <p class="rail-kicker">二十三回</p>
      ${chapterIndex.map((item) => navLink(item.output, item.title, currentHref, fromOutput)).join("")}
    </section>
  </div>`;
}

function renderReaderPage(page, html) {
  const parts = chapterParts(page.title);
  const intro = parts
    ? `<p class="reader-kicker">${escapeHtml(parts.number)} · ${escapeHtml(parts.pattern)}</p>`
    : `<p class="reader-kicker">${escapeHtml(page.label || "附录")}</p>`;
  return `<div class="reader-wrap">
    ${intro}
    <article class="reader-article prose">
      ${html}
    </article>
    <nav class="pager" aria-label="章节翻页">
      ${page.previous ? `<a href="${hrefFor(page.previous.output, page.output)}"><span>上一章</span>${escapeHtml(page.previous.title)}</a>` : "<span></span>"}
      ${page.next ? `<a href="${hrefFor(page.next.output, page.output)}"><span>下一章</span>${escapeHtml(page.next.title)}</a>` : "<span></span>"}
    </nav>
  </div>`;
}

function renderChapterShelf(chapterIndex, fromOutput) {
  const firstVolume = chapterIndex.slice(0, 12);
  const secondVolume = chapterIndex.slice(12);
  return `<section class="chapter-shelf" id="chapters" aria-labelledby="chapters-title">
    <div class="section-heading">
      <p class="section-kicker">Table of Contents</p>
      <h2 id="chapters-title">二十三回</h2>
      <p>每一回先讲局势与人物，再落到设计模式的工程痛点、抽象动作与 Java 示例。</p>
    </div>
    <div class="volume-grid">
      ${renderVolume("上卷", "立规矩，建军府，理对象。", firstVolume, fromOutput)}
      ${renderVolume("下卷", "结盟传讯，分权存档，解释天下局势。", secondVolume, fromOutput)}
    </div>
  </section>`;
}

function renderVolume(title, description, items, fromOutput) {
  return `<section class="volume">
    <div class="volume-head">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(description)}</p>
    </div>
    <div class="chapter-grid">
      ${items.map((item) => renderChapterCard(item, fromOutput)).join("")}
    </div>
  </section>`;
}

function renderChapterCard(item, fromOutput) {
  const parts = chapterParts(item.title);
  const index = chapterIndexNumber(item.output);
  return `<a class="chapter-card" href="${hrefFor(item.output, fromOutput)}">
    <span class="chapter-index">${escapeHtml(index)}</span>
    <span class="chapter-card-title">${escapeHtml(parts?.story || item.title)}</span>
    <span class="chapter-card-pattern">${escapeHtml(parts?.pattern || "正文")}</span>
  </a>`;
}

function chapterParts(title) {
  const match = /^第(.+?)回：(.+?)：(.+)$/.exec(title);
  if (!match) return null;
  return {
    number: `第${match[1]}回`,
    story: match[2],
    pattern: match[3],
  };
}

function chapterIndexNumber(output) {
  const match = /(?:^|\/)(\d+)-/.exec(output);
  return match?.[1] || "";
}

function bookIcon() {
  return `<svg class="brand-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 5.5c0-1.1.9-2 2-2H20v15H6.5a2 2 0 0 0-2 2v-15Z"/><path d="M4.5 20.5c0-1.1.9-2 2-2H20"/><path d="M8 7h8M8 10h6"/></svg>`;
}

function menuIcon() {
  return `<svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;
}

function closeIcon() {
  return `<svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`;
}

function filterPublicMarkdown(markdown, source) {
  if (source !== "README.md") return markdown;
  const hiddenHeadings = new Set(["统一写作要求", "继续扩展的方向", "本地预览", "发布到 GitHub Pages"]);
  const lines = markdown.split(/\r?\n/);
  const kept = [];
  let hiddenLevel = 0;
  let skippedCoverTitle = false;
  let skippedCoverImage = false;

  for (const line of lines) {
    if (!skippedCoverTitle && /^#\s+乱世里的设计模式\s*$/.test(line)) {
      skippedCoverTitle = true;
      continue;
    }
    if (!skippedCoverImage && /^!\[乱世里的设计模式总地图\]/.test(line)) {
      skippedCoverImage = true;
      continue;
    }
    const match = /^(#{2,6})\s+(.+?)\s*$/.exec(line);
    if (match) {
      const level = match[1].length;
      const title = match[2].trim();
      if (hiddenHeadings.has(title)) {
        hiddenLevel = level;
        continue;
      }
      if (hiddenLevel && level <= hiddenLevel) hiddenLevel = 0;
    }
    if (!hiddenLevel && !/TODO\.md|待办清单/.test(line) && !/VISUAL-GUIDE\.md|章节配图/.test(line)) {
      kept.push(line);
    }
  }

  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function markdownToHtml(markdown, source) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let paragraph = [];
  let list = null;
  let code = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inline(paragraph.join(" "), source)}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (!list) return;
    html.push(`</${list}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const fence = /^```([A-Za-z0-9_+-]+)?/.exec(line);
    if (fence) {
      if (code) {
        html.push(renderCodeBlock(code.lang, code.lines.join("\n")));
        code = null;
      } else {
        flushParagraph();
        closeList();
        code = { lang: fence[1] || "text", lines: [] };
      }
      continue;
    }
    if (code) {
      code.lines.push(raw);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }
    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2], source)}</h${level}>`);
      continue;
    }
    const image = /^!\[(.*?)\]\((.*?)\)$/.exec(line.trim());
    if (image) {
      flushParagraph();
      closeList();
      html.push(`<figure><img src="${rewriteLink(image[2], source)}" alt="${escapeHtml(image[1])}"></figure>`);
      continue;
    }
    const bullet = /^-\s+(.+)$/.exec(line);
    const ordered = /^\d+\.\s+(.+)$/.exec(line);
    if (bullet || ordered) {
      flushParagraph();
      const type = bullet ? "ul" : "ol";
      if (list && list !== type) closeList();
      if (!list) {
        list = type;
        html.push(`<${type}>`);
      }
      html.push(`<li>${inline((bullet || ordered)[1], source)}</li>`);
      continue;
    }
    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  return html.join("\n");
}

function inline(text, source) {
  let escaped = escapeHtml(text);
  escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => `<a href="${rewriteLink(href, source)}">${label}</a>`);
  return escaped;
}

function renderCodeBlock(lang, source) {
  const safeLang = escapeHtml(lang || "text");
  const highlighted = highlightCode(lang, source);
  return `<pre><code class="language-${safeLang}">${highlighted}</code></pre>`;
}

function languageKeywordsFor(lang) {
  const keywords = {
    java: [
    "interface", "class", "enum", "abstract", "extends", "implements", "public", "private", "protected",
    "static", "final", "void", "return", "new", "if", "else", "for", "while", "try", "catch", "throw",
    "throws", "import", "package", "this", "super", "boolean", "int", "long", "double", "float", "char",
    "byte", "short", "true", "false", "null"
    ],
    javascript: [
    "const", "let", "var", "function", "class", "extends", "import", "export", "default", "return",
    "new", "if", "else", "for", "while", "switch", "case", "break", "continue", "try", "catch",
    "throw", "async", "await", "this", "super", "true", "false", "null", "undefined"
    ],
    python: [
    "def", "class", "return", "if", "elif", "else", "for", "while", "in", "try", "except", "raise",
    "with", "as", "import", "from", "lambda", "None", "True", "False", "self", "pass", "break",
    "continue", "yield", "async", "await", "global", "nonlocal"
    ],
    swift: [
    "let", "var", "func", "class", "struct", "enum", "protocol", "extension", "import", "if", "else",
    "for", "while", "switch", "case", "default", "return", "throw", "throws", "try", "catch", "guard",
    "where", "in", "as", "is", "nil", "true", "false", "self", "super", "static", "private", "public",
    "internal", "fileprivate", "open", "final", "override", "init", "deinit", "associatedtype",
    "typealias", "mutating", "nonmutating", "async", "await"
    ],
    rust: [
    "let", "mut", "fn", "struct", "enum", "trait", "impl", "for", "where", "use", "pub", "crate", "mod",
    "match", "if", "else", "loop", "while", "return", "Self", "self", "super", "true", "false", "None",
    "Some", "Ok", "Err", "async", "await", "move", "const", "static", "ref", "type", "as", "in", "dyn"
    ],
    objectivec: [
    "id", "instancetype", "void", "int", "BOOL", "YES", "NO", "nil", "self", "super", "return", "if",
    "else", "for", "while", "typedef", "enum", "struct", "static", "const", "strong", "weak", "copy",
    "nonatomic", "atomic", "readonly", "readwrite"
    ]
  };
  return keywords[lang];
}

function highlightCode(lang, source) {
  const normalized = normalizeCodeLang(lang);
  const keywords = languageKeywordsFor(normalized);
  if (!keywords) return escapeHtml(source);

  const escaped = escapeHtml(source);
  const placeholders = [];
  const store = (html) => {
    const token = `\uE000${String.fromCharCode(0xE100 + placeholders.length)}\uE001`;
    placeholders.push(html);
    return token;
  };

  let highlighted = escaped
    .replace(/(`(?:\\.|[^`\\])*`)/g, (match) => store(`<span class="tok-string">${match}</span>`))
    .replace(/(&quot;(?:\\.|[^&])*?&quot;)/g, (match) => store(`<span class="tok-string">${match}</span>`))
    .replace(/('(?:\\.|[^'\\])*')/g, (match) => store(`<span class="tok-string">${match}</span>`));

  if (normalized === "python") {
    highlighted = highlighted.replace(/(#[^\n]*)/g, (match) => store(`<span class="tok-comment">${match}</span>`));
  } else {
    highlighted = highlighted
      .replace(/(\/\*[\s\S]*?\*\/)/g, (match) => store(`<span class="tok-comment">${match}</span>`))
      .replace(/(\/\/[^\n]*)/g, (match) => store(`<span class="tok-comment">${match}</span>`));
  }

  const keywordPattern = new RegExp(`\\b(${keywords.map(escapeRegExp).join("|")})\\b`, "g");
  highlighted = highlighted
    .replace(keywordPattern, '<span class="tok-keyword">$1</span>')
    .replace(/@(interface|implementation|end|protocol|property|class|selector|autoreleasepool|synthesize|dynamic)\b/g, '<span class="tok-keyword">@$1</span>')
    .replace(/\b([A-Z][A-Za-z0-9_]*)\b/g, '<span class="tok-type">$1</span>')
    .replace(/\b([a-z][A-Za-z0-9_]*)\s*(?=\()/g, '<span class="tok-method">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-number">$1</span>');

  return restoreCodePlaceholders(highlighted, placeholders);
}

function normalizeCodeLang(lang) {
  const languageAliases = {
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    py: "python",
    rs: "rust",
    objc: "objectivec",
    "objective-c": "objectivec",
    objective_c: "objectivec",
    objectivec: "objectivec",
    m: "objectivec",
    mm: "objectivec"
  };
  const normalized = String(lang || "text").toLowerCase();
  return languageAliases[normalized] || normalized;
}

function restoreCodePlaceholders(value, placeholders) {
  const marker = /\uE000([\uE100-\uEFFF])\uE001/g;
  let restored = value;
  let previous;
  do {
    previous = restored;
    restored = restored.replace(marker, (_, token) => placeholders[token.charCodeAt(0) - 0xE100]);
  } while (restored !== previous);
  return restored;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rewriteLink(href, source) {
  if (/^(https?:|mailto:|#)/.test(href)) return href;
  const clean = href.replace(/^\.\//, "");
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(source), clean));
  const mapped = outputForSource(resolved.replace(/#.*/, ""));
  const hash = resolved.includes("#") ? `#${resolved.split("#").slice(1).join("#")}` : "";
  const fromOutput = outputForSource(source);
  return hrefFor(mapped + hash, fromOutput);
}

function hrefFor(target, from) {
  const fromDir = path.posix.dirname(from);
  let relative = path.posix.relative(fromDir === "." ? "" : fromDir, target);
  if (!relative.startsWith(".")) relative = `./${relative}`;
  return relative;
}

function outputForSource(source) {
  if (source === "README.md") return "index.html";
  if (source === "SERIES-BIBLE.md") return "series-bible.html";
  if (source === "GEO-ATLAS.md") return "geo-atlas.html";
  return source.replace(/\.md$/, ".html");
}

function extractTitle(markdown) {
  const match = /^#\s+(.+)$/m.exec(markdown);
  return match?.[1]?.trim();
}

function writeFile(relative, content) {
  const file = path.join(outDir, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    if (entry.name === "codex-logs" || entry.name === "prompts") continue;
    if (entry.isFile() && entry.name.endsWith(".json")) continue;
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function siteJs() {
  return `const progressBar = document.querySelector(".reading-progress span");
const drawer = document.querySelector(".chapter-rail");
const drawerButton = document.querySelector(".toc-button");
const drawerCloseTargets = document.querySelectorAll("[data-drawer-close]");
const mobileQuery = window.matchMedia("(max-width: 980px)");

function updateProgress() {
  if (!progressBar) return;
  const height = document.documentElement.scrollHeight - window.innerHeight;
  const progress = height > 0 ? window.scrollY / height : 0;
  progressBar.style.transform = "scaleX(" + Math.min(1, Math.max(0, progress)) + ")";
}

function setDrawer(open) {
  drawer?.classList.toggle("open", open);
  document.body.classList.toggle("drawer-open", open);
  drawerButton?.setAttribute("aria-expanded", String(open));
  drawerButton?.setAttribute("aria-label", open ? "关闭目录" : "打开目录");
}

window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

drawerButton?.addEventListener("click", () => {
  setDrawer(!drawer?.classList.contains("open"));
});

drawerCloseTargets.forEach((target) => {
  target.addEventListener("click", () => setDrawer(false));
});

drawer?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    if (mobileQuery.matches) setDrawer(false);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setDrawer(false);
});

mobileQuery.addEventListener?.("change", (event) => {
  if (!event.matches) setDrawer(false);
});
`;
}

function siteCss() {
  return `:root {
  --bg: #f6f8f5;
  --paper: #fffdf8;
  --paper-strong: #ffffff;
  --ink: #18212f;
  --ink-soft: #334155;
  --muted: #64748b;
  --line: #d8e0da;
  --jade: #0f766e;
  --jade-dark: #115e59;
  --cinnabar: #c2410c;
  --gold: #a97718;
  --mist: #e7f3ef;
  --code-bg: #101828;
  --code-ink: #e5e7eb;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  color: var(--ink);
  background:
    linear-gradient(180deg, #f7fbf8 0%, #fffdf8 42%, #f6f8f5 100%);
  font-family: "Noto Serif SC", "Libre Baskerville", Georgia, serif;
  letter-spacing: 0;
}
body.drawer-open { overflow: hidden; }
a { color: inherit; }
img { max-width: 100%; display: block; }
button,
a { -webkit-tap-highlight-color: transparent; }
button { font: inherit; }
svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
::selection {
  color: #ffffff;
  background: var(--jade-dark);
}

.skip-link {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 100;
  transform: translateY(-140%);
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--ink);
  color: #ffffff;
  text-decoration: none;
}
.skip-link:focus { transform: translateY(0); }

.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 90;
  background: transparent;
}
.reading-progress span {
  display: block;
  height: 100%;
  background: var(--cinnabar);
  transform: scaleX(0);
  transform-origin: left;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 70;
  height: 72px;
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 0 32px;
  border-bottom: 1px solid rgba(216, 224, 218, 0.86);
  background: rgba(247, 251, 248, 0.9);
  backdrop-filter: blur(18px);
}
.brand {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  font-weight: 700;
  text-decoration: none;
}
.brand-icon {
  width: 30px;
  height: 30px;
  color: var(--jade-dark);
  flex: 0 0 auto;
}
.brand span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topnav {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 24px;
  color: var(--ink-soft);
  font-size: 15px;
}
.topnav a {
  text-decoration: none;
  transition: color 180ms ease;
}
.topnav a:hover { color: var(--jade-dark); }
.toc-button,
.drawer-close {
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--ink);
  cursor: pointer;
  transition: border-color 180ms ease, color 180ms ease, background-color 180ms ease;
}
.toc-button {
  display: none;
  min-height: 42px;
  padding: 0 13px;
  gap: 8px;
  font-weight: 700;
}
.drawer-close {
  display: none;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
}
.button-icon {
  width: 20px;
  height: 20px;
}
.toc-button:hover,
.drawer-close:hover {
  border-color: var(--jade);
  color: var(--jade-dark);
  background: #ffffff;
}
a:focus-visible,
button:focus-visible {
  outline: 3px solid rgba(15, 118, 110, 0.28);
  outline-offset: 3px;
}

.drawer-scrim { display: none; }
.site-shell {
  width: min(1440px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(220px, 286px) minmax(0, 1fr);
  gap: 44px;
  padding: 34px 32px 92px;
}
.page-cover .site-shell {
  width: 100%;
  max-width: none;
  display: block;
  padding: 0 0 96px;
}
.page-cover .chapter-rail { display: none; }
.content { min-width: 0; }

.chapter-rail {
  position: sticky;
  top: 96px;
  height: calc(100vh - 120px);
  min-width: 0;
  overflow: auto;
  padding: 2px 18px 24px 0;
  border-right: 1px solid var(--line);
}
.rail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin: 0 0 22px;
}
.rail-eyebrow,
.section-kicker,
.eyebrow,
.reader-kicker {
  margin: 0 0 10px;
  color: var(--jade-dark);
  font-family: "Libre Baskerville", "Noto Serif SC", serif;
  font-size: 12px;
  font-weight: 700;
}
.rail-head h2 {
  margin: 0;
  font-size: 30px;
  line-height: 1.1;
}
.rail-section + .rail-section { margin-top: 28px; }
.rail-kicker {
  margin: 0 0 10px;
  color: var(--gold);
  font-size: 13px;
  font-weight: 700;
}
.rail-link {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 5px 10px;
  padding: 11px 12px;
  border-left: 3px solid transparent;
  border-radius: 0 8px 8px 0;
  color: var(--ink-soft);
  text-decoration: none;
  transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
}
.rail-link:hover,
.rail-link.active {
  border-color: var(--cinnabar);
  background: rgba(255, 255, 255, 0.78);
  color: var(--ink);
}
.rail-no {
  grid-row: span 2;
  color: var(--jade-dark);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}
.rail-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}
.rail-pattern {
  color: var(--muted);
  font-size: 12px;
}
.appendix-link {
  display: block;
  font-size: 14px;
}

.cover-hero {
  position: relative;
  min-height: calc(100svh - 116px);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  isolation: isolate;
  border-bottom: 1px solid var(--line);
}
.cover-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(90deg, rgba(246, 248, 245, 0.98) 0%, rgba(246, 248, 245, 0.9) 42%, rgba(246, 248, 245, 0.34) 100%),
    linear-gradient(0deg, rgba(24, 33, 47, 0.1), rgba(24, 33, 47, 0));
}
.cover-visual {
  position: absolute;
  inset: 0;
  z-index: -2;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.cover-copy {
  width: min(760px, calc(100% - 64px));
  margin-left: max(32px, calc((100vw - 1240px) / 2));
  padding: 72px 0 58px;
}
.eyebrow { color: var(--cinnabar); }
.cover-copy h1 {
  margin: 0;
  color: var(--ink);
  font-size: 112px;
  line-height: 0.95;
  font-weight: 700;
}
.cover-copy h1 span { display: block; }
.cover-copy p {
  max-width: 640px;
  margin: 26px 0 0;
  color: var(--ink-soft);
  font-size: 22px;
  line-height: 1.72;
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}
.primary-link,
.secondary-link {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border-radius: 8px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease, color 180ms ease;
}
.primary-link {
  background: var(--cinnabar);
  color: #ffffff;
}
.primary-link:hover { background: #9a3412; }
.secondary-link {
  border: 1px solid var(--jade);
  color: var(--jade-dark);
  background: rgba(255, 255, 255, 0.58);
}
.secondary-link:hover {
  border-color: var(--jade-dark);
  background: #ffffff;
}
.cover-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
  margin: 36px 0 0;
  padding: 0;
}
.cover-stats div { min-width: 96px; }
.cover-stats dt {
  color: var(--muted);
  font-size: 13px;
}
.cover-stats dd {
  margin: 6px 0 0;
  color: var(--ink);
  font-size: 18px;
  font-weight: 700;
}

.story-brief,
.chapter-shelf,
.reading-guide {
  width: min(1180px, calc(100% - 64px));
  margin: 76px auto 0;
}
.story-brief {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 46px;
  padding-bottom: 52px;
  border-bottom: 1px solid var(--line);
}
.story-brief h2,
.section-heading h2 {
  margin: 0;
  color: var(--ink);
  font-size: 44px;
  line-height: 1.18;
}
.story-brief > p,
.section-heading p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 19px;
  line-height: 1.76;
}
.section-heading {
  max-width: 760px;
  margin-bottom: 34px;
}
.section-heading p { margin-top: 14px; }
.volume-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 42px;
}
.volume {
  padding-top: 24px;
  border-top: 1px solid var(--line);
}
.volume-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
}
.volume-head h3 {
  margin: 0;
  font-size: 28px;
}
.volume-head p {
  margin: 0;
  color: var(--muted);
  font-size: 15px;
}
.chapter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.chapter-card {
  min-height: 142px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 17px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  text-decoration: none;
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease, transform 180ms ease;
}
.chapter-card:hover {
  border-color: var(--jade);
  background: #ffffff;
  transform: translateY(-2px);
}
.chapter-index {
  color: var(--cinnabar);
  font-family: "Libre Baskerville", serif;
  font-size: 13px;
  font-weight: 700;
}
.chapter-card-title {
  margin-top: 18px;
  color: var(--ink);
  font-size: 19px;
  font-weight: 700;
  line-height: 1.36;
}
.chapter-card-pattern {
  margin-top: 12px;
  color: var(--jade-dark);
  font-size: 14px;
}
.reading-guide {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}
.guide-item {
  padding-top: 22px;
  border-top: 2px solid var(--jade);
}
.guide-item h2 {
  margin: 0;
  font-size: 25px;
}
.guide-item p {
  margin: 14px 0 0;
  color: var(--ink-soft);
  font-size: 17px;
  line-height: 1.72;
}

.reader-wrap {
  width: min(820px, 100%);
  margin: 0 auto;
  padding: 24px 0 0;
}
.reader-kicker {
  margin-bottom: 16px;
  color: var(--cinnabar);
}
.reader-article {
  max-width: 780px;
  margin: 0 auto;
}
.prose h1 {
  margin: 0 0 28px;
  color: var(--ink);
  font-size: 52px;
  line-height: 1.16;
  font-weight: 700;
}
.prose h2 {
  margin: 58px 0 18px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  color: var(--ink);
  font-size: 30px;
  line-height: 1.32;
}
.prose h3 {
  margin: 36px 0 12px;
  color: var(--ink);
  font-size: 23px;
  line-height: 1.4;
}
.prose p,
.prose li {
  color: var(--ink-soft);
  font-size: 18px;
  line-height: 1.78;
}
.prose p { margin: 18px 0; }
.prose ul,
.prose ol {
  padding-left: 1.35em;
  margin: 18px 0;
}
.prose li + li { margin-top: 8px; }
.prose a {
  color: var(--jade-dark);
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
}
.prose code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9em;
}
.prose p code,
.prose li code {
  padding: 2px 6px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #ffffff;
  color: #0f172a;
}
.prose pre {
  overflow: auto;
  margin: 28px 0;
  padding: 22px;
  border-radius: 8px;
  background: var(--code-bg);
  color: var(--code-ink);
  line-height: 1.68;
}
.prose pre code {
  color: inherit;
  font-size: 14px;
}
.tok-comment { color: #94a3b8; }
.tok-string { color: #fbbf24; }
.tok-keyword { color: #60a5fa; font-weight: 700; }
.tok-type { color: #34d399; }
.tok-method { color: #f472b6; }
.tok-number { color: #c4b5fd; }
.prose figure {
  margin: 32px 0;
}
.prose figure img {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
}

.pager {
  max-width: 780px;
  margin: 64px auto 0;
  padding-top: 24px;
  border-top: 1px solid var(--line);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.pager a {
  min-height: 96px;
  padding: 17px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.76);
  color: var(--ink);
  text-decoration: none;
  transition: border-color 180ms ease, background-color 180ms ease;
}
.pager a:hover {
  border-color: var(--jade);
  background: #ffffff;
}
.pager a:last-child { text-align: right; }
.pager span {
  display: block;
  margin-bottom: 9px;
  color: var(--muted);
  font-size: 13px;
}

.site-footer {
  width: min(780px, calc(100% - 64px));
  margin: 0 auto;
  padding: 30px 0 52px;
  border-top: 1px solid var(--line);
  text-align: center;
}
.site-footer p {
  margin: 0;
  color: #475569;
  font-size: 16px;
  line-height: 1.75;
}
.site-footer p:first-child {
  color: var(--ink-soft);
  font-weight: 700;
}
.site-footer p + p {
  margin-top: 8px;
}

@media (min-width: 1280px) {
  .cover-copy h1 { font-size: 128px; }
}

@media (max-width: 1100px) {
  .chapter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cover-copy h1 { font-size: 92px; }
}

@media (max-width: 980px) {
  .site-header {
    height: 64px;
    padding: 0 18px;
  }
  .topnav { display: none; }
  .toc-button { display: inline-flex; margin-left: auto; }
  .site-shell {
    display: block;
    padding: 0 20px 72px;
  }
  .page-cover .site-shell { padding-bottom: 78px; }
  .chapter-rail,
  .page-cover .chapter-rail {
    display: block;
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 85;
    width: min(86vw, 380px);
    height: 100svh;
    padding: 22px 18px 32px;
    border-right: 1px solid var(--line);
    background: rgba(255, 253, 248, 0.98);
    box-shadow: 24px 0 60px rgba(15, 23, 42, 0.18);
    transform: translateX(-104%);
    transition: transform 220ms ease-out;
  }
  .chapter-rail.open { transform: translateX(0); }
  .drawer-close { display: inline-flex; }
  .drawer-scrim {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: block;
    pointer-events: none;
    background: rgba(15, 23, 42, 0);
    transition: background-color 220ms ease-out;
  }
  body.drawer-open .drawer-scrim {
    pointer-events: auto;
    background: rgba(15, 23, 42, 0.38);
  }
  .rail-head {
    position: sticky;
    top: 0;
    z-index: 1;
    margin: -22px -18px 18px;
    padding: 22px 18px 14px;
    background: rgba(255, 253, 248, 0.98);
    border-bottom: 1px solid var(--line);
  }
  .cover-hero { min-height: calc(100svh - 104px); }
  .cover-copy {
    width: min(680px, calc(100% - 40px));
    margin-left: 20px;
    padding: 58px 0 46px;
  }
  .cover-copy h1 { font-size: 74px; }
  .cover-copy p { font-size: 19px; }
  .story-brief,
  .chapter-shelf,
  .reading-guide {
    width: calc(100% - 40px);
    margin-top: 58px;
  }
  .story-brief {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .story-brief h2,
  .section-heading h2 { font-size: 36px; }
  .volume-head {
    display: block;
  }
  .volume-head p { margin-top: 8px; }
  .reading-guide {
    grid-template-columns: 1fr;
  }
  .reader-wrap { padding-top: 34px; }
  .prose h1 { font-size: 42px; }
  .prose p,
  .prose li { font-size: 17px; }
}

@media (max-width: 600px) {
  .brand span { max-width: 12em; }
  .toc-button span { display: none; }
  .toc-button {
    width: 42px;
    padding: 0;
  }
  .cover-hero { min-height: calc(100svh - 96px); }
  .cover-hero::after {
    background:
      linear-gradient(180deg, rgba(246, 248, 245, 0.92) 0%, rgba(246, 248, 245, 0.82) 48%, rgba(246, 248, 245, 0.98) 100%);
  }
  .cover-copy h1 { font-size: 58px; }
  .cover-copy p {
    font-size: 17px;
    line-height: 1.68;
  }
  .hero-actions { align-items: stretch; }
  .primary-link,
  .secondary-link {
    width: 100%;
  }
  .cover-stats { display: none; }
  .story-brief h2,
  .section-heading h2 { font-size: 30px; }
  .story-brief > p,
  .section-heading p { font-size: 17px; }
  .chapter-grid { grid-template-columns: 1fr; }
  .chapter-card { min-height: 120px; }
  .reader-wrap { padding-top: 28px; }
  .prose h1 { font-size: 34px; }
  .prose h2 { font-size: 25px; }
  .prose h3 { font-size: 21px; }
  .prose pre {
    margin-left: -4px;
    margin-right: -4px;
    padding: 18px;
  }
  .pager { grid-template-columns: 1fr; }
  .pager a:last-child { text-align: left; }
  .site-footer {
    width: calc(100% - 36px);
    padding: 24px 0 40px;
  }
  .site-footer p {
    text-align: left;
  }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  * { transition: none !important; }
}
`;
}
