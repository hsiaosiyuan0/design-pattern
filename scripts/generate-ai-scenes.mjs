import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const outDir = path.join(root, "assets", "generated", "scenes");
const failurePath = path.join(outDir, "failed-scenes.json");
const manifestPath = path.join(outDir, "scene-manifest.json");

const config = {
  model: env("OPENAI_IMAGE_MODEL", "gpt-image-2"),
  size: env("OPENAI_IMAGE_SIZE", "1536x1024"),
  quality: env("OPENAI_IMAGE_QUALITY", "medium"),
  timeoutMs: numberEnv("OPENAI_IMAGE_TIMEOUT_MS", 120_000),
  maxRetries: numberEnv("OPENAI_IMAGE_MAX_RETRIES", 2),
  retryDelayMs: numberEnv("OPENAI_IMAGE_RETRY_DELAY_MS", 4_000),
  limit: numberEnv("IMAGE_LIMIT", 0),
  only: env("IMAGE_ONLY", ""),
  dryRun: process.argv.includes("--dry-run"),
  prompts: process.argv.includes("--prompts"),
  force: process.argv.includes("--force"),
};

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
  chapterName,
  pattern,
  subtitle,
  scene,
  motifs,
  filename: `${String(index + 1).padStart(2, "0")}-${slug.replace(/^\d+-/, "")}-scene.png`,
}));

await main();

async function main() {
  if (process.argv.includes("--help")) {
    printHelp();
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });

  const selected = selectChapters();
  if (config.dryRun || config.prompts || !process.env.OPENAI_API_KEY) {
    writePromptQueue(selected);
    if (!process.env.OPENAI_API_KEY && !config.dryRun && !config.prompts) {
      console.log("OPENAI_API_KEY is not set, so no API call was made.");
      console.log("Wrote prompt files instead. Use --help for API-based generation options.");
    }
    return;
  }

  const failures = [];
  const manifest = readJson(manifestPath, {});

  for (const chapter of selected) {
    const outputPath = path.join(outDir, chapter.filename);
    if (!config.force && fs.existsSync(outputPath)) {
      console.log(`SKIP ${chapter.filename}`);
      continue;
    }

    try {
      console.log(`GENERATE ${chapter.filename}`);
      const startedAt = new Date().toISOString();
      await generateWithRetries(chapter, outputPath);
      manifest[chapter.filename] = {
        model: config.model,
        size: config.size,
        quality: config.quality,
        prompt: createPrompt(chapter),
        generatedAt: new Date().toISOString(),
        startedAt,
      };
      writeJson(manifestPath, manifest);
      console.log(`DONE ${chapter.filename}`);
    } catch (error) {
      const failure = {
        filename: chapter.filename,
        chapter: chapter.chapterName,
        pattern: chapter.pattern,
        error: serializeError(error),
        failedAt: new Date().toISOString(),
      };
      failures.push(failure);
      writeJson(failurePath, failures);
      console.error(`FAIL ${chapter.filename}: ${failure.error.message}`);
    }
  }

  if (failures.length > 0) {
    process.exitCode = 1;
    console.error(`Finished with ${failures.length} failed image(s). See ${path.relative(root, failurePath)}.`);
  }
}

function selectChapters() {
  let selected = chapters;
  if (config.only) {
    const wanted = new Set(config.only.split(",").map((item) => item.trim()).filter(Boolean));
    selected = selected.filter((chapter) => wanted.has(chapter.slug) || wanted.has(chapter.filename) || wanted.has(chapter.chapterName));
  }
  if (config.limit > 0) selected = selected.slice(0, config.limit);
  return selected;
}

async function generateWithRetries(chapter, outputPath) {
  let lastError;
  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    try {
      const image = await generateImage(createPrompt(chapter));
      const tempPath = `${outputPath}.${process.pid}.tmp`;
      fs.writeFileSync(tempPath, image);
      fs.renameSync(tempPath, outputPath);
      return;
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error) || attempt >= config.maxRetries) break;
      const delay = config.retryDelayMs * (attempt + 1);
      console.warn(`RETRY ${chapter.filename}: attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastError;
}

async function generateImage(prompt) {
  const response = await fetchWithTimeout("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
      "X-Client-Request-Id": `design-pattern-scenes-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    },
    body: JSON.stringify({
      model: config.model,
      prompt,
      size: config.size,
      quality: config.quality,
      n: 1,
    }),
  }, config.timeoutMs);

  const text = await response.text();
  const body = parseJson(text);

  if (!response.ok) {
    const message = body?.error?.message || text || `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.type = body?.error?.type;
    error.code = body?.error?.code;
    throw error;
  }

  const base64 = body?.data?.[0]?.b64_json;
  if (!base64) {
    throw new Error("Image API response did not include data[0].b64_json.");
  }
  return Buffer.from(base64, "base64");
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error(`Timed out after ${timeoutMs}ms.`);
      timeoutError.code = "timeout";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function shouldRetry(error) {
  if (error.code === "timeout") return true;
  if ([408, 409, 429, 500, 502, 503, 504].includes(error.status)) return true;
  return false;
}

function createPrompt(chapter) {
  return [
    "Use case: historical-scene",
    "Asset type: chapter illustration",
    `Primary request: 为《乱世里的设计模式》${chapter.chapterName}生成一张统一风格的历史叙事插图`,
    `Scene/backdrop: ${chapter.scene}，围绕“${chapter.subtitle}”展开，画面隐喻 ${chapter.pattern}`,
    `Required motifs: ${chapter.motifs.join("、")}`,
    "Style/medium: cinematic Chinese historical editorial illustration, ink-and-painting texture mixed with detailed concept art",
    "Composition/framing: wide horizontal composition, readable at article-header size, leave quiet negative space for title overlay",
    "Lighting/mood: restrained low warm lamplight, cold dusk background, tense but not chaotic",
    "Color palette: dark teal, burnt umber, muted gold, ink black, small touches of vermilion",
    "Materials/textures: parchment, silk scroll, lacquered wood, worn paper, brushed ink grain",
    "Text: no visible text, no captions, no watermark",
    "Constraints: no modern objects, no western armor, no fantasy elements, no anime style, no game UI, no chaotic typography",
  ].join("\n");
}

function writePromptQueue(selected) {
  const promptDir = path.join(outDir, "prompts");
  fs.mkdirSync(promptDir, { recursive: true });

  const queue = [];
  for (const chapter of selected) {
    const prompt = createPrompt(chapter);
    const outputPath = path.join(outDir, chapter.filename);
    const promptFilename = chapter.filename.replace(/\.png$/, ".txt");
    const promptPath = path.join(promptDir, promptFilename);

    fs.writeFileSync(promptPath, `${prompt}\n`);
    queue.push({
      filename: chapter.filename,
      promptFile: path.relative(root, promptPath),
      outputFile: path.relative(root, outputPath),
      status: fs.existsSync(outputPath) ? "exists" : "missing",
    });

    if (config.dryRun) {
      console.log(`DRY ${chapter.filename}\n${prompt}\n`);
    }
  }

  const queuePath = path.join(outDir, "prompt-queue.json");
  writeJson(queuePath, queue);
  console.log(`Wrote ${queue.length} prompt file(s) to ${path.relative(root, promptDir)}/`);
  console.log(`Wrote queue to ${path.relative(root, queuePath)}`);
}

function env(name, fallback) {
  return process.env[name] || fallback;
}

function numberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function serializeError(error) {
  return {
    message: error.message,
    status: error.status,
    type: error.type,
    code: error.code,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printHelp() {
  console.log(`Generate chapter scene PNGs with bounded retries and resumable output.

Usage:
  npm run ai-scenes
  OPENAI_API_KEY=... npm run ai-scenes

Options:
  --dry-run      Print prompts without calling the API.
  --prompts      Write prompt files and a queue without calling the API.
  --force        Regenerate files that already exist.
  --help         Show this help.

Without OPENAI_API_KEY, this script only writes prompt files. ChatGPT/Codex Pro
subscriptions do not provide API credentials to local scripts.

Environment:
  OPENAI_IMAGE_MODEL            Default: gpt-image-2
  OPENAI_IMAGE_SIZE             Default: 1536x1024
  OPENAI_IMAGE_QUALITY          Default: medium
  OPENAI_IMAGE_TIMEOUT_MS       Default: 120000
  OPENAI_IMAGE_MAX_RETRIES      Default: 2
  OPENAI_IMAGE_RETRY_DELAY_MS   Default: 4000
  IMAGE_LIMIT                   Generate only the first N selected chapters.
  IMAGE_ONLY                    Comma-separated slugs, filenames, or chapter names.
`);
}
