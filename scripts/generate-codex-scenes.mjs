import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const root = process.cwd();
const outDir = path.join(root, "assets", "generated", "scenes");
const logDir = path.join(outDir, "codex-logs");
const queuePath = path.join(outDir, "prompt-queue.json");
const manifestPath = path.join(outDir, "codex-scene-manifest.json");

const chapters = [
  ["01-strategy", "第一回", "策略模式", "河东夜议，战法纷陈", "军府夜议", ["地图案", "三卷战策", "灯下谋士"]],
  ["02-factory-method", "第二回", "工厂方法模式", "三镇募兵，各造其军", "三镇募兵", ["河东骑兵", "汴梁步军", "江淮水军"]],
  ["03-singleton", "第三回", "单例模式", "玉玺只可一握", "朝堂玉玺", ["唯一玉玺", "群臣环立", "红绸案台"]],
  ["04-builder", "第四回", "建造者模式", "边城起于图卷", "边城图卷", ["城防图", "工匠量尺", "箭楼初成"]],
  ["05-adapter", "第五回", "适配器模式", "番邦使者，不通汉令", "鸿胪转译", ["番邦使者", "通事官", "中原文书"]],
  ["06-proxy", "第六回", "代理模式", "牙门深处，不见其人", "牙门守禁", ["门前属吏", "深处主君", "层层门禁"]],
  ["07-observer", "第七回", "观察者模式", "烽火连营，一呼百应", "雁门烽火", ["烽火台", "驿马", "远处军镇"]],
  ["08-command", "第八回", "命令模式", "军令成卷，可发可收", "军令成卷", ["主帅发令", "鼓手待命", "书记归档"]],
  ["09-template-method", "第九回", "模板方法模式", "祖制不改，变通在营", "出征祖制", ["祭旗", "骑兵布阵", "水军演练"]],
  ["10-state", "第十回", "状态模式", "城门开闭，各有时辰", "边城三态", ["商路", "戒严", "围城"]],
  ["11-chain-of-responsibility", "第十一回", "责任链模式", "奏章入京，层层有司", "奏章入京", ["地方奏章", "层层批转", "京师案头"]],
  ["12-decorator", "第十二回", "装饰器模式", "战袍加身，甲上添甲", "甲上添甲", ["里甲", "护臂", "战袍"]],
  ["13-abstract-factory", "第十三回", "抽象工厂模式", "六曹分署，同出一府", "成套军械", ["骑兵甲", "骑枪", "号旗"]],
  ["14-prototype", "第十四回", "原型模式", "旧印翻刻，再造新符", "母本翻刻", ["标准文书", "旧印", "新符"]],
  ["15-facade", "第十五回", "外观模式", "中书门下，只露一门", "中书一门", ["统一窗口", "户部", "兵部"]],
  ["16-bridge", "第十六回", "桥接模式", "舟车虽异，共承其职", "水陆转运", ["江船", "车队", "驮队"]],
  ["17-composite", "第十七回", "组合模式", "大营之内，部伍成林", "部伍成林", ["大营", "都队", "什伍"]],
  ["18-flyweight", "第十八回", "享元模式", "边关小卒，名册共用", "名册共用", ["同营小卒", "共用军号", "分散驻点"]],
  ["19-iterator", "第十九回", "迭代器模式", "案卷千箱，次第检看", "次第取卷", ["千箱旧档", "书吏取卷", "查卷路径"]],
  ["20-mediator", "第二十回", "中介者模式", "群臣争语，须有居中者", "都督居中", ["兵部争语", "户部执账", "中枢调停"]],
  ["21-memento", "第二十一回", "备忘录模式", "败局可记，不可重蹈", "旧战封匣", ["旧战卷", "渡口败局", "复盘灯火"]],
  ["22-visitor", "第二十二回", "访问者模式", "巡按四方，各察其制", "巡按四方", ["巡按使", "粮仓", "军营"]],
  ["23-interpreter", "第二十三回", "解释器模式", "天下纷乱，终须立说", "江南立说", ["晚年书案", "简令词句", "水网灯影"]],
].map(([slug, chapterName, pattern, subtitle, scene, motifs], index) => ({
  slug,
  number: String(index + 1).padStart(2, "0"),
  chapterName,
  pattern,
  subtitle,
  scene,
  motifs,
  filename: `${slug}-scene.png`,
  article: `${slug}.md`,
}));

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(logDir, { recursive: true });

const selected = selectChapters(chapters, options);
if (selected.length === 0) {
  console.error("No chapters selected.");
  process.exit(1);
}

if (options.dryRun) {
  for (const chapter of selected) {
    console.log(`\n--- ${chapter.slug} -> ${outputPath(chapter)} ---\n${createImagePrompt(chapter)}\n`);
  }
  process.exit(0);
}

const manifest = readJson(manifestPath, {});
const pending = [];

for (const chapter of selected) {
  const output = outputPath(chapter);
  if (fs.existsSync(output) && !options.force) {
    const inserted = options.noInsert ? false : insertImageReference(chapter);
    recordManifest(manifest, chapter, "exists", { inserted });
    console.log(`SKIP ${chapter.filename}${inserted ? " + inserted" : ""}`);
    continue;
  }
  if (options.syncOnly) {
    console.log(`MISSING ${chapter.filename}`);
    recordManifest(manifest, chapter, "missing", {});
    continue;
  }
  pending.push(chapter);
}

if (options.syncOnly || pending.length === 0) {
  writeJson(manifestPath, manifest);
  writePromptQueue();
  process.exit(0);
}

const results = await runQueue(pending, options.concurrency, async (chapter) => {
  const result = await runCodexWorker(chapter);
  const inserted = result.ok && !options.noInsert ? insertImageReference(chapter) : false;
  recordManifest(manifest, chapter, result.ok ? "generated" : "failed", {
    inserted,
    logFile: path.relative(root, logPath(chapter)),
    error: result.error,
  });
  writeJson(manifestPath, manifest);
  return { ...result, inserted };
});

writePromptQueue();

const failed = results.filter((result) => !result.ok);
if (failed.length > 0) {
  console.error(`Finished with ${failed.length} failed image(s). Logs are in ${path.relative(root, logDir)}/`);
  process.exit(1);
}

console.log(`Generated ${results.length} image(s).`);

function parseArgs(argv) {
  const parsed = {
    concurrency: numberValue(process.env.CODEX_IMAGE_CONCURRENCY, 2),
    timeoutMs: numberValue(process.env.CODEX_IMAGE_TIMEOUT_MS, 240_000),
    codexBin: process.env.CODEX_BIN || "codex",
    codexModel: process.env.CODEX_MODEL || "",
    only: "",
    from: 0,
    to: 0,
    limit: 0,
    force: false,
    dryRun: false,
    syncOnly: false,
    noInsert: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--force") parsed.force = true;
    else if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--sync-only") parsed.syncOnly = true;
    else if (arg === "--no-insert") parsed.noInsert = true;
    else if (arg.startsWith("--only=")) parsed.only = valueAfterEquals(arg);
    else if (arg.startsWith("--from=")) parsed.from = numberValue(valueAfterEquals(arg), 0);
    else if (arg.startsWith("--to=")) parsed.to = numberValue(valueAfterEquals(arg), 0);
    else if (arg.startsWith("--limit=")) parsed.limit = numberValue(valueAfterEquals(arg), 0);
    else if (arg.startsWith("--concurrency=")) parsed.concurrency = Math.max(1, numberValue(valueAfterEquals(arg), 2));
    else if (arg.startsWith("--timeout-ms=")) parsed.timeoutMs = Math.max(30_000, numberValue(valueAfterEquals(arg), 240_000));
    else if (arg.startsWith("--codex-bin=")) parsed.codexBin = valueAfterEquals(arg);
    else if (arg.startsWith("--codex-model=")) parsed.codexModel = valueAfterEquals(arg);
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function selectChapters(items, opts) {
  let selected = items;
  if (opts.only) {
    const wanted = new Set(opts.only.split(",").map((item) => item.trim()).filter(Boolean));
    selected = selected.filter((chapter) =>
      wanted.has(chapter.slug) ||
      wanted.has(chapter.number) ||
      wanted.has(chapter.filename) ||
      wanted.has(chapter.chapterName)
    );
  }
  if (opts.from > 0) selected = selected.filter((chapter) => Number(chapter.number) >= opts.from);
  if (opts.to > 0) selected = selected.filter((chapter) => Number(chapter.number) <= opts.to);
  if (opts.limit > 0) selected = selected.slice(0, opts.limit);
  return selected;
}

async function runQueue(items, concurrency, worker) {
  const results = new Array(items.length);
  let next = 0;

  async function runOne() {
    while (next < items.length) {
      const index = next;
      next += 1;
      const chapter = items[index];
      console.log(`START ${chapter.filename}`);
      results[index] = await worker(chapter);
      console.log(`${results[index].ok ? "DONE" : "FAIL"} ${chapter.filename}`);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runOne());
  await Promise.all(workers);
  return results;
}

function runCodexWorker(chapter) {
  return new Promise((resolve) => {
    const logFile = logPath(chapter);
    const log = fs.createWriteStream(logFile, { flags: "w" });
    const args = [
      "--enable",
      "image_generation",
      "-c",
      "model_reasoning_effort=\"low\"",
      "-s",
      "danger-full-access",
      "-a",
      "never",
      "exec",
      "--skip-git-repo-check",
      "-C",
      root,
      "--color",
      "never",
    ];

    if (options.codexModel) args.push("-m", options.codexModel);
    args.push("-");

    let settled = false;
    const child = spawn(options.codexBin, args, {
      cwd: root,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        CODEX_IMAGE_TARGET: outputPath(chapter),
      },
    });

    child.stdout.pipe(log);
    child.stderr.pipe(log);
    child.stdin.end(createWorkerPrompt(chapter));

    const timeout = setTimeout(() => {
      if (settled) return;
      log.write(`\nTIMEOUT after ${options.timeoutMs}ms\n`);
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!settled) child.kill("SIGKILL");
      }, 5_000).unref();
    }, options.timeoutMs);

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      log.end();
      resolve({ ok: false, error: error.message });
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      log.end();
      const output = outputPath(chapter);
      const ok = code === 0 && fs.existsSync(output) && fs.statSync(output).size > 100_000;
      resolve({
        ok,
        error: ok ? "" : `codex exited ${code}; output missing or too small`,
      });
    });
  });
}

function createWorkerPrompt(chapter) {
  const output = outputPath(chapter);
  return `You are a one-shot image generation worker for this repository.

Goal:
Generate exactly one raster PNG for ${chapter.chapterName} and save it to:
${output}

Required workflow:
1. Use the built-in image generation capability / image_gen tool. Do not use SVG, canvas, placeholders, screenshots, or the OpenAI Images API.
2. Generate the image from the prompt below.
3. Copy the generated PNG reported by the image tool to the exact target path above. Leave the original generated image in CODEX_HOME.
4. Do not edit markdown, scripts, package files, or any other repository files.
5. Verify the target file exists and is a real PNG larger than 100 KB.
6. Final response must be one short line: SAVED ${output}

Image prompt:
${createImagePrompt(chapter)}
`;
}

function createImagePrompt(chapter) {
  return [
    "Use case: historical-scene",
    "Asset type: chapter illustration for an online novel tutorial",
    `Primary request: 为《乱世里的设计模式》${chapter.chapterName}生成一张统一风格的历史叙事插图。`,
    `Scene/backdrop: ${chapter.scene}，围绕“${chapter.subtitle}”展开，画面隐喻${chapter.pattern}。`,
    `Required motifs: ${chapter.motifs.join("、")}。`,
    "Subject: 沈策或相关官吏、将校处在章回故事的核心场景中，画面要先像小说插画，再隐约表现设计模式的结构关系。",
    "Style/medium: cinematic Chinese historical editorial illustration, ink-and-painting texture mixed with detailed concept art.",
    "Composition/framing: wide horizontal composition, readable at article-header size, clear focal point, quiet negative space for title overlay.",
    "Lighting/mood: restrained low warm lamplight, cold dusk background, tense but not chaotic.",
    "Color palette: dark teal, burnt umber, muted gold, ink black, small touches of vermilion.",
    "Materials/textures: parchment, silk scroll, lacquered wood, worn paper, brushed ink grain.",
    "Text: no visible text, no captions, no watermark.",
    "Constraints: no modern objects, no western armor, no fantasy elements, no anime style, no game UI, no chaotic typography.",
  ].join("\n");
}

function insertImageReference(chapter) {
  const articlePath = path.join(root, "articles", chapter.article);
  if (!fs.existsSync(articlePath)) return false;
  let markdown = fs.readFileSync(articlePath, "utf8");
  const href = `../assets/generated/scenes/${chapter.filename}`;
  if (markdown.includes(href)) return false;
  const imageLine = `![${chapter.chapterName}：${chapter.subtitle}：${chapter.pattern}小说场景图](${href})`;
  markdown = markdown.replace(/^(# .+\n)/, `$1\n${imageLine}\n`);
  fs.writeFileSync(articlePath, markdown);
  return true;
}

function writePromptQueue() {
  const promptDir = path.join(outDir, "prompts");
  fs.mkdirSync(promptDir, { recursive: true });
  const queue = chapters.map((chapter) => {
    const promptPath = path.join(promptDir, chapter.filename.replace(/\.png$/, ".txt"));
    fs.writeFileSync(promptPath, `${createImagePrompt(chapter)}\n`);
    return {
      filename: chapter.filename,
      promptFile: path.relative(root, promptPath),
      outputFile: path.relative(root, outputPath(chapter)),
      status: fs.existsSync(outputPath(chapter)) ? "exists" : "missing",
    };
  });
  writeJson(queuePath, queue);
}

function recordManifest(manifest, chapter, status, extra) {
  manifest[chapter.filename] = {
    status,
    chapter: chapter.chapterName,
    pattern: chapter.pattern,
    outputFile: path.relative(root, outputPath(chapter)),
    updatedAt: new Date().toISOString(),
    ...extra,
  };
}

function outputPath(chapter) {
  return path.join(outDir, chapter.filename);
}

function logPath(chapter) {
  return path.join(logDir, `${chapter.slug}.log`);
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function valueAfterEquals(arg) {
  return arg.slice(arg.indexOf("=") + 1);
}

function numberValue(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function printHelp() {
  console.log(`Generate chapter PNG scene images through parallel codex exec workers.

Usage:
  node scripts/generate-codex-scenes.mjs [options]

Options:
  --from=N             First chapter number to process.
  --to=N               Last chapter number to process.
  --only=A,B           Slugs, numbers, filenames, or chapter names to process.
  --limit=N            Limit selected chapters.
  --concurrency=N      Parallel codex workers. Default: CODEX_IMAGE_CONCURRENCY or 2.
  --timeout-ms=N       Per-image worker timeout. Default: CODEX_IMAGE_TIMEOUT_MS or 240000.
  --codex-bin=PATH     Codex executable. Default: CODEX_BIN or codex.
  --codex-model=MODEL  Optional model for codex exec workers. Default: CODEX_MODEL or config default.
  --force              Regenerate existing PNG files.
  --sync-only          Only insert existing PNG references and update prompt queue.
  --no-insert          Do not edit article markdown after image generation.
  --dry-run            Print image prompts without launching codex.
  --help               Show this help.

Examples:
  npm run codex-scenes -- --from=15 --to=23 --concurrency=3
  npm run codex-scenes -- --only=18-flyweight,19-iterator
  npm run codex-scenes -- --sync-only
`);
}
