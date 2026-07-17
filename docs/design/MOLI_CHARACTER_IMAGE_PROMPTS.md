# 墨璃角色图像提示词

这份文档保存墨璃的角色锁定词、网站助手母版提示词和状态差分规范。它面向通用的文生图、图生图与约稿沟通流程，不绑定某一家生成平台。

## 角色定位

- 身份：居住在 INK.SPIRIT 数字档案馆中的电子女仆与引路人
- 气质：冷静、温和、严谨，略带神秘感；年轻成人，不幼态
- 视觉关键词：赛博武侠、数字藏书阁、克制的中式女仆轮廓、墨色、冷白、暗青、少量朱红
- 禁止方向：咖啡厅女仆、猫耳、幼态、暴露服装、夸张卖萌、霓虹堆砌、重型科幻装甲

## 角色身份锁定词

后续所有状态图都应重复这一段，并优先使用同一张母版进行图生图或局部编辑。

```text
Preserve the same recognizable adult woman named Moli: an intelligent and restrained electronic archive maid from a cyber-wuxia digital library. Long ink-black hair with a subtle cool-blue sheen, calm warm eyes, refined metal-and-jade hairpin with one muted cinnabar tassel. Her outfit combines a Chinese crossed or standing collar, narrow layered sleeves, and a restrained maid-inspired silhouette. The palette is ink black, cool white, dark teal, restrained emerald, with only a tiny cinnabar accent. Keep the same facial identity, adult proportions, hairstyle, hairpin, costume structure, body proportions, and rendering style in every image.
```

## 网站助手母版

建议先生成有纯色背景的干净母版，确认身份和轮廓后再抠图或转交画师分层。不要在母版中加入粒子、场景光或漂浮道具。

```text
Use case: clean production character asset for a website AI assistant.

Create Moli as a clean half-body mother portrait for a small floating website assistant and later expression variants. Show one young adult woman from head to waist in a front three-quarter view. She stands upright with relaxed shoulders. Keep her full hair silhouette and hairpin inside the frame. Both hands are anatomically clear near the lower torso, one resting lightly over the other.

Use a perfectly plain, uniform, removable studio background with no gradient, texture, scenery, particles, floor or cast shadow. Use soft neutral frontal illumination and only a minimal cool rim light. Keep the silhouette crisp and readable at 160 pixels.

Preserve the Chinese crossed or standing collar and restrained maid-inspired shoulder language. Simplify tiny embroidery, straps, buckles and sleeve layers. Use clean black, cool-white and dark-teal color blocks. Keep one jade bookmark ornament and the metal-and-jade hairpin as identity anchors.

Premium clean 2D anime-inspired character asset, refined painterly cel rendering, controlled hair strands, smooth but not plastic face, professional visual-novel production art. Calm, intelligent, subtly welcoming expression.

Vertical 4:5 composition, generous padding above the hair and beside the sleeves, symmetrical safe crop, face large enough to remain readable in a compact UI.

No text, logo or watermark. No floating props. No dramatic environmental lighting. No cropped hands or hairpin.
```

## 状态差分

状态图必须以母版为编辑目标，每次只修改列出的局部。不要重新生成整个人物。

### 待机

```text
Keep the mother portrait unchanged. Neutral relaxed mouth, steady gentle gaze, hands resting together. Change nothing else.
```

### 欢迎

```text
Keep identity, clothing, framing and lighting unchanged. Add only a restrained small smile and a subtle open-palm welcoming gesture close to the torso. Do not make the expression excited or cute.
```

### 思考

```text
Keep identity, clothing, framing and lighting unchanged. Shift only the eyes slightly toward the upper side and relax the mouth into a thoughtful neutral expression. Keep both hands inside the original safe area.
```

### 找到档案

```text
Keep identity, clothing, framing and lighting unchanged. Add one small jade-like luminous archive bookmark hovering above her open palm. Use a restrained emerald glow that does not spill onto the hair silhouette.
```

### 无法确认

```text
Keep identity, clothing, framing and lighting unchanged. Lower the gaze slightly and add a subtle apologetic expression. No crying, panic, exaggerated sadness or comedic symbols.
```

## 负面提示词

```text
generic cafe maid, frilly apron overload, cat ears, animal features, childlike proportions, loli, sexualized pose, exposed cleavage, exaggerated chest, short skirt, neon overload, busy science-fiction armor, weapons, cosplay photo, glossy plastic face, generic AI face, inconsistent identity, different hairstyle, cropped hairpin, cropped hands, hidden hands, extra fingers, fused fingers, asymmetrical eyes, cluttered background, scenery, particles, bloom, lens flare, text, logo, watermark
```

## 交付规格

- 母版比例：4:5，建议不低于 2048 × 2560
- 网页半身像：透明 PNG 或 WebP，保留完整发梢、发簪、袖口和双手
- 悬浮头像：1:1，从头顶到胸口，建议 512 × 512 与 256 × 256
- 状态图：画布、人物位置和尺寸完全一致，不允许每张重新构图
- 分层需求：后发、身体、脸、眼睛、嘴、前发、手部、档案道具、辉光分别交付
- 动效边界：眨眼、轻微呼吸、发梢摆动和档案亮起；不使用持续大幅漂浮
- 无障碍：动画应提供静止版本，并支持 `prefers-reduced-motion`

## 网站预留位置

当前悬浮入口中的 `#ai-model-host` 是未来角色资源挂载位。正式素材完成前，它显示墨印档案核心；之后可在不改变聊天开关与面板行为的前提下替换为立绘、分层动画或 Live2D。
