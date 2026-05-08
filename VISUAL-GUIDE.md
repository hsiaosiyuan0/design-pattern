# 章节配图生成指南

这份文档不再面向 Mermaid 或代码图工具，而是面向 Codex 直接生图。

用途很明确：

- 给整套《乱世里的设计模式》生成统一风格的小说配图
- 给每一回生成一张“技术图解海报”
- 给每一回生成一张“地理位置图”或“行动路线图”
- 后续如果你要做公众号头图、课程插图、专栏封面，可以直接复用这里的提示词

## 建议资产结构

建议后续把生成结果落在这些目录：

- `assets/covers/`：整套系列封面
- `assets/scenes/`：每一回的历史小说场景图
- `assets/diagrams/`：每一回的技术图解海报
- `assets/maps/`：每一回的章节位置图或路线图

## 稳定批量生图

Codex / ChatGPT Pro 订阅不等于 OpenAI API key；本地脚本不能直接使用 Pro 订阅额度调用图片接口。

仓库提供了一个提示词队列脚本，用来把 23 回的生图任务拆成可逐张处理的小任务：

```bash
npm run ai-scenes
```

没有 `OPENAI_API_KEY` 时，脚本只会生成：

- `assets/generated/scenes/prompts/*.txt`
- `assets/generated/scenes/prompt-queue.json`

这样可以逐张把提示词交给当前 Codex / ChatGPT 的生图能力处理，避免一次性批量任务卡住后无限重试。

如果你另外有 OpenAI API key，也可以启用自动断点续跑：

```bash
OPENAI_API_KEY=... npm run ai-scenes
```

API 模式默认行为：

- 输出到 `assets/generated/scenes/`
- 已存在的 PNG 自动跳过
- 单张图默认 120 秒超时
- 单张图最多重试 2 次
- 失败项写入 `assets/generated/scenes/failed-scenes.json`
- 成功项写入 `assets/generated/scenes/scene-manifest.json`

常用控制：

```bash
# 只看提示词，不调用 API
npm run ai-scenes -- --dry-run

# 写入提示词队列，不调用 API
npm run ai-scenes -- --prompts

# 只生成前 3 张缺失图
IMAGE_LIMIT=3 OPENAI_API_KEY=... npm run ai-scenes

# 只补某一回
IMAGE_ONLY=07-observer OPENAI_API_KEY=... npm run ai-scenes

# 强制重生成已有图片
OPENAI_API_KEY=... npm run ai-scenes -- --force
```

可调参数：

- `OPENAI_IMAGE_MODEL`，默认 `gpt-image-2`
- `OPENAI_IMAGE_SIZE`，默认 `1536x1024`
- `OPENAI_IMAGE_QUALITY`，默认 `medium`
- `OPENAI_IMAGE_TIMEOUT_MS`，默认 `120000`
- `OPENAI_IMAGE_MAX_RETRIES`，默认 `2`
- `OPENAI_IMAGE_RETRY_DELAY_MS`，默认 `4000`

## 统一视觉设定

为了让 23 回看起来像同一套作品，建议统一以下方向。

### 小说场景图风格

- 类型：国风历史叙事插画
- 质感：电影感、长卷感、轻微颗粒、纸本与墨色质感并存
- 色调：赭石、黛青、乌金、灰白为主，少量朱砂点题
- 人物：写意但克制，不做夸张游戏风，不做二次元夸饰
- 构图：横版优先，保留标题留白
- 背景：军府、城门、官署、江船、档案库、书案、山河地图

### 技术图解海报风格

- 类型：信息图式插画海报
- 风格：古代制度图 + 现代架构图混合
- 视觉元素：卷轴、箭头、印信、木牌、城池、官署节点、流程路径
- 要求：画面中尽量少文字，必要文字只保留模式名中文标题
- 目的：一眼看出模式中的“角色关系”与“信息流”

## 生图总原则

- 同一回至少可出三张图：一张小说场景图，一张技术图解图，一张位置图
- 场景图负责情绪和连载感
- 技术图负责教学理解
- 位置图负责空间感和章节之间的地理连续性
- 如果只出一张，优先技术图解海报；如果出两张，优先补位置图而不是只补第二张剧情图

## 地图图原则

- 地图图不追求精密史学地图风格，但要清楚、克制、有方向感
- 每张地图尽量同时标古名和今名
- 地图图要让读者一眼知道“这一回在天下哪一块”
- 地图图适合放在每一回开篇引句后或楔子前
- 地图骨架不能只靠几个孤立地标，而要同时考虑水系、山脉、区域、节点、故事线
- 只要画幅范围允许，黄河、长江、淮河、大运河、太行山等骨架元素不要省略
- 对于系列总地图，主要水系、主要山脉、区域板块、政治节点、故事线都默认视为必须出现

更详细的地理锚点和章节分配见：

- [地理附录：古今地名与行旅路线](./GEO-ATLAS.md)

## 地图出图检查清单

每次出地图前，都用这份清单检查，不再凭感觉补点。

### 系列总地图

至少检查：

- 是否有主要水系：黄河、长江、淮河、大运河
- 是否有主要山脉或地形骨架：太行山、必要时的秦岭和蜀地山势
- 是否有区域板块：河东、中原、江淮、淮南、吴越、蜀地、江南
- 是否有关键节点：太原 / 晋阳、汴梁 / 开封、雁门、潞州等
- 是否有清楚的故事推进线

### 章节位置图

至少检查：

- 当前章节核心地点是否清楚
- 所属区域板块是否明确
- 最近的水系或山脉是否出现
- 与前一章节的空间关系是否可感知

### 路线图

至少检查：

- 起点终点是否清楚
- 经过区域是否清楚
- 方向是否清楚
- 路线是否和地形、水路、山口产生关系

## 封面图提示词

### 系列总封面

用途：专栏首页、README 顶图、公众号专栏封面

建议提示词：

```text
Use case: historical-scene
Asset type: series cover
Primary request: 为《乱世里的设计模式》生成一张历史叙事感很强的系列总封面
Scene/backdrop: 五代十国乱世，中景是一张展开的天下地图，地图上有河东、汴梁、江淮、蜀地、江南等地理意象，并能隐约辨认黄河、长江、淮河、大运河、太行山等骨架地理元素；前景是一张书案，案上摆着兵书、官印、竹简、城防图卷、军令卷轴
Subject: 主角沈策背身立于书案前，像一位在乱世中整理秩序的谋士，不要正脸特写
Style/medium: cinematic historical illustration, Chinese ink-and-painting mixed with detailed editorial concept art
Composition/framing: wide horizontal composition, center-left main figure, enough empty space for title on upper right
Lighting/mood: low warm lamplight with cold dusk background, tense but restrained
Color palette: dark teal, burnt umber, muted gold, ink black, touches of vermilion
Materials/textures: parchment, silk scroll, lacquer, worn wood, brushed ink texture
Text (verbatim): ""
Constraints: no watermark, no western armor, no fantasy monsters, no modern objects
Avoid: anime style, game UI, glossy fantasy armor, chaotic typography
```

## 每回出图模板

每一回都提供三组提示词：

- `场景图`：更像小说插画
- `技术图解图`：更像教程传播图
- `位置图`：更像章回地图

---

## 第 1 回 策略模式

### 场景图

```text
Use case: historical-scene
Asset type: chapter scene illustration
Primary request: 河东节度使府深夜议事，主帅与谋士在灯下讨论三种不同战法
Scene/backdrop: 深夜军府大堂，案上摊开地图、木简和三卷不同颜色的战策卷轴，堂外隐约有夜色与城墙
Subject: 老节度使坐于主位，年轻谋士沈策立于案侧，众将环立沉思
Style/medium: cinematic Chinese historical illustration
Composition/framing: horizontal composition, table in foreground, characters around map, clear focal point on three strategy scrolls
Lighting/mood: warm lamplight, tense deliberation
Color palette: burnt umber, ink black, dark teal
Constraints: no fantasy, no exaggerated armor, no text overlay
Avoid: cartoon style, busy crowd, modern props
```

### 技术图解图

```text
Use case: infographic-diagram
Asset type: chapter teaching poster
Primary request: 生成一张“策略模式”技术图解海报，用古代军议隐喻展示 Commander 选择不同策略
Scene/backdrop: 古代军议卷轴背景
Subject: 中间是主帅节点，向下分出三条分支，分别对应奔袭、固守、离间三种策略卷轴
Style/medium: historical infographic poster
Composition/framing: centered poster layout, clear hierarchy, minimal text
Lighting/mood: calm, intellectual, structured
Color palette: parchment beige, dark ink, muted red accents
Text (verbatim): "策略模式"
Constraints: only show the Chinese title text, other content use icons and relationship graphics
Avoid: mermaid style, code screenshot, dense text paragraphs
```

### 位置图

```text
Use case: infographic-diagram
Asset type: chapter location map
Primary request: 为第一回生成一张简洁的五代十国风格章节地图，标明河东军府所在位置，并帮助读者理解故事发生在北方边地
Scene/backdrop: 古地图卷轴风格的中国北方示意图
Subject: 突出标出河东、太原 / 晋阳、潞州、雁门的位置关系，弱化其他区域
Style/medium: historical map illustration, parchment texture, restrained ink-and-wash cartographic style
Composition/framing: centered map with north China focus, simple directional layout, enough blank margin for chapter caption if needed
Lighting/mood: calm, strategic, geographic
Color palette: parchment beige, dark ink, muted cinnabar, dusty blue-green
Text (verbatim): ""
Constraints: label ancient names with modern names in smaller annotation style, no dense paragraphs, no modern political map styling
Avoid: satellite map, modern infographic neon style, crowded labels
```

---

## 第 2 回 工厂方法模式

### 场景图

```text
Use case: historical-scene
Asset type: chapter scene illustration
Primary request: 三镇募兵，不同军营招募出不同兵种
Scene/backdrop: 画面分成河东、汴梁、江淮三处军营，各自的募兵场景不同
Subject: 河东骑兵、汴梁步军、江淮水军形成鲜明对比，沈策居中观察
Style/medium: panoramic historical illustration
Composition/framing: triptych-like composition, three camps in one wide frame
Lighting/mood: busy but controlled
Color palette: earthy browns, muted blue-green, iron gray
Constraints: no modern banners, no fantasy uniforms
Avoid: overcrowded frame, game splash art
```

### 技术图解图

```text
Use case: infographic-diagram
Asset type: chapter teaching poster
Primary request: 用三座军营生成不同兵种的意象，表现工厂方法模式
Scene/backdrop: 卷轴式制度图背景
Subject: 一个抽象募兵入口，向下连接三个军营，再连接不同士兵类型
Style/medium: historical architecture diagram poster
Composition/framing: top-down flowchart composition
Text (verbatim): "工厂方法模式"
Constraints: minimal text, only title remains visible
Avoid: software UI style, mermaid arrows
```

### 位置图

```text
Use case: infographic-diagram
Asset type: chapter comparison map
Primary request: 为第二回生成一张三镇对照地图，显示河东、汴梁、江淮三地的位置，用来表现同一募兵制度在不同地区造出不同兵种
Scene/backdrop: 古代卷轴地图，重点是中原与华北、江淮区域
Subject: 三个高亮区域分别为河东、汴梁、江淮，并用不同军事图标标示骑兵、步军、水军倾向
Style/medium: elegant historical cartographic infographic
Composition/framing: wide map with three highlighted regions, clear comparative balance
Lighting/mood: orderly, analytical
Color palette: parchment, dark brown ink, muted military blue and red markers
Constraints: ancient names primary, modern names secondary, minimal text
Avoid: fantasy map, modern GIS interface, cluttered statistics
```

---

## 第 3 回 单例模式

### 场景图

```text
Use case: historical-scene
Asset type: chapter scene illustration
Primary request: 玉玺置于朝堂中央，群臣环立，强调“只能有一枚”
Scene/backdrop: 汴梁宫廷偏殿，案上红绸托起玉玺
Subject: 玉玺是视觉中心，四周群臣神色凝重，沈策站在边缘观察
Style/medium: solemn historical illustration
Composition/framing: centered composition with strong symmetry
Lighting/mood: solemn, authoritative, tense
Color palette: dark gold, crimson, ink black, stone gray
Constraints: no emperor face close-up, no fantasy glow effects
Avoid: magical relic vibe, ornate fantasy throne room
```

### 技术图解图

```text
Use case: infographic-diagram
Asset type: chapter teaching poster
Primary request: 用“唯一玉玺”意象表现单例模式
Scene/backdrop: parchment with official seal motifs
Subject: 画面中央只有一个玉玺，周围多个调用路径汇聚到同一对象
Style/medium: elegant technical poster with historical motifs
Composition/framing: centralized radial layout
Text (verbatim): "单例模式"
Constraints: emphasize one unique core object
Avoid: code blocks, many duplicate seals
```

### 位置图

```text
Use case: infographic-diagram
Asset type: chapter location map
Primary request: 为第三回生成一张以汴梁为中心的章节地图，强调中枢与天下的关系
Scene/backdrop: 古代中原地图，汴梁居中
Subject: 突出汴梁 / 开封，周边以较弱方式点出河东、淮南、吴越等地，表现中枢号令辐射四方
Style/medium: refined historical map poster
Composition/framing: central capital layout, radial influence feeling
Lighting/mood: solemn, ordered
Color palette: parchment, black ink, muted gold, faint vermilion
Constraints: emphasize the capital as unique center, ancient-modern labels where appropriate
Avoid: crowded route lines, fantasy empire map
```

---

## 第 4 回 建造者模式

### 场景图

```text
Use case: historical-scene
Asset type: chapter scene illustration
Primary request: 边城图卷逐层展开，工匠与谋士讨论修城步骤
Scene/backdrop: 边地工部营帐，桌上摊开大型城防图卷
Subject: 城墙、箭楼、粮仓、护城河以分步骤构建的方式呈现在图卷上
Style/medium: historical concept art
Composition/framing: diagonal composition from blueprint to finished fortress
Lighting/mood: methodical, tense, constructive
Color palette: parchment, gray stone, muted bronze
Constraints: no modern blueprint grid
Avoid: sci-fi city planning look
```

### 技术图解图

```text
Use case: infographic-diagram
Asset type: chapter teaching poster
Primary request: 用边城逐层建造隐喻建造者模式
Scene/backdrop: scroll blueprint background
Subject: 左侧是 Builder 分步骤部件，右侧是完整 Fortress
Style/medium: architectural teaching poster with historical flavor
Composition/framing: left-to-right assembly flow
Text (verbatim): "建造者模式"
Constraints: clear step-by-step build metaphor
Avoid: CAD software style, English labels
```

### 位置图

```text
Use case: infographic-diagram
Asset type: frontier location map
Primary request: 为第四回生成一张河东北境筑城位置图，表现边地、关口与防线关系
Scene/backdrop: 古代北方边境地图，山势与关口明显
Subject: 标出河东北境、边城、雁门方向与主要防线关系，强调这是修城守边而非内地建设
Style/medium: frontier military map illustration
Composition/framing: north-facing border map, strong terrain sense
Lighting/mood: austere, strategic, defensive
Color palette: dry parchment, slate gray, dark ink, muted brown-red
Constraints: mountain silhouettes and border tension should be visible, keep labels sparse
Avoid: modern contour maps, busy icon overload
```

---

## 第 5 回 适配器模式

### 场景图

```text
Use case: historical-scene
Asset type: chapter scene illustration
Primary request: 鸿胪寺通事官在中原文书与番邦使者之间做转译
Scene/backdrop: 汴梁鸿胪寺，左边是番邦使者和异域文书，右边是中原官员和汉字奏牍
Subject: 中间的通事官成为连接两边制度的人
Style/medium: refined historical narrative illustration
Composition/framing: bilateral composition, translator centered
Lighting/mood: diplomatic, intelligent, controlled
Color palette: parchment white, ink black, muted turquoise, cinnabar
Constraints: no caricature ethnic stereotypes
Avoid: cartoon diplomacy scene
```

### 技术图解图

```text
Use case: infographic-diagram
Asset type: chapter teaching poster
Primary request: 用“通事官转译番文”的意象表现适配器模式
Scene/backdrop: split-format scroll background
Subject: 左侧异构文书接口，中央适配官节点，右侧朝廷标准接口
Style/medium: elegant diagrammatic poster
Composition/framing: left-adapter-right
Text (verbatim): "适配器模式"
Constraints: emphasize translation and interface conversion
Avoid: lots of text, software screenshot feel
```

### 位置图

```text
Use case: infographic-diagram
Asset type: diplomatic route map
Primary request: 为第五回生成一张从吴越到汴梁的使节路线图，体现两套制度之间的距离感
Scene/backdrop: 古代东南至中原路线地图
Subject: 标出吴越与汴梁，使用一条清晰路线连接两地，弱化其余区域
Style/medium: historical envoy route map
Composition/framing: southeast-to-central route emphasis
Lighting/mood: diplomatic, measured, elegant
Color palette: parchment, muted teal waterways, dark ink route line, cinnabar markers
Constraints: show both ancient names and modern references, no dense annotation blocks
Avoid: travel brochure style, colorful cartoon map
```

---

## 第 6 回 代理模式

### 场景图

```text
Use case: historical-scene
Asset type: chapter scene illustration
Primary request: 牙门深处主君未露面，来访者先被门前属吏与牙将拦检
Scene/backdrop: 淮南藩镇牙门外，层层守卫与文吏把守
Subject: 门前代理者忙于筛选请求，真正的节度使隐于深处
Style/medium: dramatic historical illustration
Composition/framing: foreground gatekeepers, background hidden authority
Lighting/mood: controlled, hierarchical, guarded
Color palette: dark wood, muted red, iron gray
Constraints: emphasize access control
Avoid: palace fantasy, crowded chaos
```

### 技术图解图

```text
Use case: infographic-diagram
Asset type: chapter teaching poster
Primary request: 用牙门和门前属吏的意象表现代理模式
Scene/backdrop: official gate motif on parchment
Subject: 外部请求先到门前代理，再进入后方真实主君
Style/medium: structured historical process poster
Composition/framing: front gate, proxy layer, inner chamber
Text (verbatim): "代理模式"
Constraints: show access control and delegation
Avoid: too much textual annotation
```

### 位置图

```text
Use case: infographic-diagram
Asset type: chapter location map
Primary request: 为第六回生成一张淮南藩镇位置图，突出其相对于汴梁和江淮交通的地理位置
Scene/backdrop: 中原至江淮过渡区域古地图
Subject: 标出淮南、汴梁、江淮水路陆路关系，用于表现借粮与门禁权力的地理背景
Style/medium: historical administrative map illustration
Composition/framing: regional focus with clear directional flow
Lighting/mood: restrained, political, guarded
Color palette: aged paper, dark umber, muted blue river systems
Constraints: labels should be sparse and legible, focus on relation not full accuracy atlas detail
Avoid: modern province borders, GPS-style interface
```

---

## 第 7 回到第 23 回的出图原则

后续章节继续遵守同一个模板，只是把隐喻对象替换掉。下面把第 7 回到第 23 回的位置图提示词全部补全；场景图和技术图解图先保留核心说明，后续可再单独展开。

### 第 7 回 观察者模式

- 场景图核心：烽火台点烟，诸镇与驿站同步响应
- 技术图核心：一个信号源，多个响应节点
- 位置图核心：雁门边关与周边军镇分布图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: frontier signal map
Primary request: 为第七回生成一张雁门边关章节地图，显示烽火台、军镇、驿站与周边防线的位置关系
Scene/backdrop: 北方边关古地图，带山势、关口和防线意象
Subject: 标出雁门、附近军镇、驿站与烽火台联动线路，表现“一处示警，多处响应”
Style/medium: historical border map illustration
Composition/framing: map centered on雁门区域，节点和连线清晰但不过密
Lighting/mood: alert, austere, strategic
Color palette: parchment, ink black, smoky gray, muted cinnabar signal markers
Constraints: label ancient names with modern references where needed, avoid dense text blocks
Avoid: modern military map UI, neon lines, crowded labels
```

### 第 8 回 命令模式

- 场景图核心：军令成卷，主帅发令，鼓手执行，书记归档
- 技术图核心：发令者、命令卷轴、执行者三层结构
- 位置图核心：河东前线行营位置图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: campaign camp map
Primary request: 为第八回生成一张河东前线行营位置图，表现主帅中军、前营、后营与传令路径
Scene/backdrop: 河东前线古战地图，带营盘、道路和地形简图
Subject: 中军大帐、前营、后营和传令路线清晰可见，突出军令如何沿营地结构传下去
Style/medium: military route map in historical scroll style
Composition/framing: center camp with outward command routes
Lighting/mood: disciplined, tense, operational
Color palette: parchment beige, dark umber, muted red route seals
Constraints: emphasize camp hierarchy and communication routes, labels sparse
Avoid: satellite style battlefield map, video game minimap look
```

### 第 9 回 模板方法模式

- 场景图核心：同一出征祖制下，不同兵种在局部步骤分岔
- 技术图核心：固定骨架流程，中间两个步骤可变化
- 位置图核心：河东军营或宿将驻地示意图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: military camp location map
Primary request: 为第九回生成一张河东宿将驻地与军营布置示意图，表现同一军制下不同营种的分布
Scene/backdrop: 河东军营古地图，营盘和校场清楚
Subject: 标出主帐、骑兵营、步兵营、水军训练区或演练区，体现共同军制下的不同营法
Style/medium: historical camp planning map
Composition/framing: ordered camp layout with clear zones
Lighting/mood: severe, methodical, disciplined
Color palette: dry parchment, black ink, muted brown-red
Constraints: show one shared camp structure with sub-areas, avoid text overload
Avoid: modern barracks blueprint, game strategy overlay
```

### 第 10 回 状态模式

- 场景图核心：同一座城在太平、戒严、围城三种状态切换
- 技术图核心：中心是城，外围是不同状态环
- 位置图核心：北境边城位置图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: frontier city map
Primary request: 为第十回生成一张北境边城位置图，表现城池、关道、周边村镇和敌军来路
Scene/backdrop: 北方边地城防地图，地势略显荒寒
Subject: 一座边城位于要道之上，周边有商路、烽火台、关道和潜在敌军方向，强调城门状态变化与局势相关
Style/medium: historical defensive map illustration
Composition/framing: city as center with routes radiating outward
Lighting/mood: tense, defensive, watchful
Color palette: muted gray-brown, ink black, faint vermilion threat arrows
Constraints: keep map readable and sparse, emphasize the city as strategic choke point
Avoid: sci-fi fortress map, over-detailed terrain rendering
```

### 第 11 回 责任链模式

- 场景图核心：奏章从县衙逐层递进到京师
- 技术图核心：多个官署节点串成一条处理链
- 位置图核心：地方到汴梁的递送路线图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: document relay map
Primary request: 为第十一回生成一张地方奏章入京路线图，显示县、州、节度使幕府到汴梁的递送路径
Scene/backdrop: 中原官道古地图
Subject: 奏章从地方逐层北上或东行至汴梁，沿途经过多个制度节点
Style/medium: elegant administrative route map
Composition/framing: linear relay map with staged checkpoints
Lighting/mood: procedural, formal, orderly
Color palette: parchment, dark ink, muted cinnabar route markers
Constraints: focus on relay order, not exact mileage; ancient names primary
Avoid: modern postal map, dense route mesh
```

### 第 12 回 装饰器模式

- 场景图核心：武士一层层披甲
- 技术图核心：核心对象外套多层增强结构
- 位置图核心：南征行营总图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: campaign staging map
Primary request: 为第十二回生成一张南征行营总图，表现出征路线、主营位置和军器监所在区域
Scene/backdrop: 中原向江淮南下的行军地图
Subject: 标出主力行营、军器监、辎重区和南下方向，让“层层加装”有明确军事背景
Style/medium: historical campaign logistics map
Composition/framing: main camp plus southward route emphasis
Lighting/mood: martial, organized, anticipatory
Color palette: parchment, muted bronze, black ink, deep red waypoints
Constraints: keep the route clear and the camp roles distinct
Avoid: modern supply chain infographic style, cluttered map labels
```

### 第 13 回 抽象工厂模式

- 场景图核心：同一军营成套领用甲胄与兵器
- 技术图核心：一个工厂同时产出多类相关对象
- 位置图核心：大行营或汴梁后方供给示意图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: supply system map
Primary request: 为第十三回生成一张大行营后方供给地图，表现不同营制从同一制度中心领用成套军械
Scene/backdrop: 汴梁至大行营之间的后勤供给地图
Subject: 中央供给地连接骑兵营、水师营、辎重营等不同营制区域，突出“成套配置”
Style/medium: historical logistics infographic map
Composition/framing: central depot with multiple coordinated outputs
Lighting/mood: organized, systemic, authoritative
Color palette: parchment, ink black, muted gold, restrained red stamps
Constraints: show product-family logic through geography, labels minimal
Avoid: warehouse management dashboard style, excess arrows
```

### 第 14 回 原型模式

- 场景图核心：书吏按母本翻刻旧印和调兵符
- 技术图核心：母本复制，再局部修改
- 位置图核心：蜀地位置图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: regional location map
Primary request: 为第十四回生成一张蜀地位置图，帮助读者理解平蜀后文书复制工作发生在四川盆地
Scene/backdrop: 古代西南地图，山川阻隔明显
Subject: 突出蜀地、成都平原与入蜀路径，弱化外部区域
Style/medium: historical regional map with scroll texture
Composition/framing: southwest regional focus, basin clearly framed by mountains
Lighting/mood: enclosed, archival, post-campaign
Color palette: parchment, dusty green, brown-gray mountains, black ink
Constraints: ancient place naming with modern references where useful
Avoid: modern topographic atlas look, saturated travel map colors
```

### 第 15 回 外观模式

- 场景图核心：中书门下作为统一外门，背后联通多部司
- 技术图核心：调用方只见一个入口，后面接多个子系统
- 位置图核心：汴梁官署位置图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: capital office map
Primary request: 为第十五回生成一张汴梁官署位置图，表现中书门下作为统一入口，背后联通户部、兵部、仓曹等衙署
Scene/backdrop: 汴梁城内官署布局示意图
Subject: 中书门下居于显眼入口位置，其他衙署分布在其后方或两侧
Style/medium: elegant capital administrative map
Composition/framing: city-office layout with one dominant gateway node
Lighting/mood: orderly, official, centralized
Color palette: parchment ivory, ink black, muted gold accents
Constraints: convey simplification of access, keep map stylized not literal city archaeology
Avoid: crowded city street map, modern urban plan aesthetics
```

### 第 16 回 桥接模式

- 场景图核心：舟、车、驮队分别运送不同货物
- 技术图核心：运输方式与货物类型双维分离
- 位置图核心：江淮水陆转运图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: transport network map
Primary request: 为第十六回生成一张江淮水陆转运地图，表现河道、陆路和山道分别承载不同运输方式
Scene/backdrop: 江淮地区古代交通地图，河网清晰
Subject: 船运、水路节点、车运官道、山路驮队三种路径并列出现，体现双维度分离
Style/medium: historical transport map infographic
Composition/framing: map with distinct route types and cargo symbols
Lighting/mood: practical, logistical, dynamic
Color palette: parchment, muted blue waterways, brown roads, black ink
Constraints: route types visually distinct but overall restrained
Avoid: subway map style, brightly colored logistics dashboard
```

### 第 17 回 组合模式

- 场景图核心：营、都、队、伍层层展开
- 技术图核心：树状结构统一抽象
- 位置图核心：大营驻地图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: camp hierarchy map
Primary request: 为第十七回生成一张大营驻地图，表现营、都、队、伍层层分布在同一军营空间内
Scene/backdrop: 大型行营平面示意与周边驻防地带
Subject: 从主帅大营向下分出多个层级分区，空间上形成树状军制
Style/medium: historical camp structure map
Composition/framing: top-down camp layout with nested subdivisions
Lighting/mood: structured, regimented, orderly
Color palette: dry parchment, ink lines, muted military red-brown
Constraints: visually express nested hierarchy through space
Avoid: CAD blueprint look, modern military zoning map
```

### 第 18 回 享元模式

- 场景图核心：大批小卒共用一套营制模板
- 技术图核心：共享内部状态，外部状态后置传入
- 位置图核心：北境军镇分布图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: garrison distribution map
Primary request: 为第十八回生成一张北境军镇分布图，表现大量小卒分布在不同驻点却共用同一营制模板
Scene/backdrop: 北方防区地图，多个军镇和驻守点散布其上
Subject: 地图上突出军镇模板、驻守点和共用制式的关系，个体节点很多但制度来源统一
Style/medium: historical garrison map infographic
Composition/framing: broad northern defense spread with repeated unit markers
Lighting/mood: economical, systemic, controlled
Color palette: parchment, gray ink, muted red-brown markers
Constraints: convey repetition without clutter, avoid too many distinct labels
Avoid: noisy icon repetition, gamified troop map
```

### 第 19 回 迭代器模式

- 场景图核心：书吏沿库房次第取卷
- 技术图核心：集合不暴露内部结构，只暴露访问顺序
- 位置图核心：蜀地档案库位置图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: archive location map
Primary request: 为第十九回生成一张蜀地档案库位置图，帮助读者理解查卷与库房结构所在的地理背景
Scene/backdrop: 蜀地府库与城内官署示意地图
Subject: 标出旧档库、官署、搬运路线和查卷路径，强调“按顺序访问”的空间隐喻
Style/medium: archival city map with historical style
Composition/framing: city compound focus with internal pathways
Lighting/mood: quiet, methodical, documentary
Color palette: parchment, faded ink, muted brown shelving tones
Constraints: more about access order than exact building plan
Avoid: modern library floor plan, sterile blueprint visuals
```

### 第 20 回 中介者模式

- 场景图核心：都督府居中调停各部争执
- 技术图核心：所有部门统一向中介者通信
- 位置图核心：汴梁中枢官署图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: central office map
Primary request: 为第二十回生成一张汴梁中枢官署图，显示都督府居中协调兵部、户部、工部、枢密院等机构
Scene/backdrop: 汴梁城内中枢机构布局图
Subject: 都督府置于中心，其余官署围绕分布，所有联系线收束于中央
Style/medium: historical administrative coordination map
Composition/framing: centralized nodal layout
Lighting/mood: political, tense, controlled
Color palette: parchment, black ink, muted cinnabar coordination lines
Constraints: central node must dominate visually; labels sparse and dignified
Avoid: network diagram overload, modern org-chart look
```

### 第 21 回 备忘录模式

- 场景图核心：战卷封匣，复盘时再启
- 技术图核心：对象保存历史快照并可恢复
- 位置图核心：南征旧战场路线回溯图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: retrospective route map
Primary request: 为第二十一回生成一张南征旧战场路线回溯图，表现失败战役的行军、渡口与关键节点
Scene/backdrop: 南征战区回忆地图，带河道与渡口
Subject: 标出旧战场、渡口、前军路线和事后复盘的重点节点，形成“回看过去”的地图感
Style/medium: somber historical campaign retrospective map
Composition/framing: route traced backward with highlighted failure point
Lighting/mood: reflective, heavy, cautionary
Color palette: faded parchment, gray ink, dark crimson emphasis on key failure site
Constraints: should feel like archived military review material, not a live battle map
Avoid: flashy battle arrows, colorful action map styling
```

### 第 22 回 访问者模式

- 场景图核心：巡按使巡视粮仓与军营
- 技术图核心：稳定对象结构 + 多种巡视动作
- 位置图核心：巡按四方路线图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: inspection route map
Primary request: 为第二十二回生成一张巡按四方路线图，表现巡按使在多个州郡、粮仓和军营之间往返巡视
Scene/backdrop: 多地区古地图，跨越汴梁、军镇、粮仓与州县
Subject: 一条或多条巡按路线串联不同类型机构，突出“结构稳定，检查动作变化”
Style/medium: historical travel-and-inspection map
Composition/framing: multi-stop route map with differentiated destination icons
Lighting/mood: observant, methodical, expansive
Color palette: parchment, muted blue-green, dark ink, restrained red waypoints
Constraints: destinations should visually differ by function, not by dense text
Avoid: tourist route map, overly decorative fantasy travel scroll
```

### 第 23 回 解释器模式

- 场景图核心：晚年沈策整理简令，把规则拆成词句和语法
- 技术图核心：终结符与组合表达式拼出规则
- 位置图核心：江南晚年居所位置图

位置图提示词：

```text
Use case: infographic-diagram
Asset type: late-life location map
Primary request: 为第二十三回生成一张江南晚年居所位置图，表现沈策退居江南、整理旧制与规则的空间背景
Scene/backdrop: 江南区域古地图，带水网、书院或宅院意象
Subject: 标出江南居所、周边城镇与水路，氛围偏收束与整理，而非战争前线
Style/medium: poetic historical regional map
Composition/framing: intimate regional map with calm waterways
Lighting/mood: reflective, quiet, autumnal, conclusive
Color palette: parchment, muted moss green, ink black, faint warm lamplight tones
Constraints: map should feel like the closing chapter of a long journey, labels sparse
Avoid: bright commercial map, fantasy retirement village aesthetic
```

## 推荐生成顺序

如果要批量出图，不建议一口气画完 46 张。建议这样做：

1. 先出 `系列总封面` 1 张
2. 再出前 6 回的 `位置图`
3. 接着出前 6 回的 `技术图解图`
4. 选其中视觉最稳的一套风格，再补前 6 回 `场景图`
5. 确认风格后，再扩到 7 到 23 回

## 下一步怎么做

如果你确认要直接出图，我建议我下一轮做这两件事：

1. 先把第 7 到第 23 回的完整位置图提示词补全
2. 然后直接为你批量生成第一批图片资产，先从 `系列总封面 + 前 6 回位置图 + 前 6 回技术图解图` 开始
