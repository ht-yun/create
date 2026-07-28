import type { StoryGraph, StoryMedia, StoryNode } from "@/shared/story-contract";

const image = (filename: string, alt: string): StoryMedia => ({
  kind: "image",
  url: `/story-assets/evening-breeze/${encodeURIComponent(filename)}`,
  playbackUrl: `/story-assets/optimized/evening-breeze/${encodeURIComponent(filename.replace(/\.[^.]+$/, ".webp"))}`,
  alt,
});
const mainImage = (filename: string, alt: string, extra: StoryMedia[] = []) => [image(filename, alt), ...extra];

const eveningBreezeBaseGraph: StoryGraph = {
  version: 1,
  startNodeId: "INTRO",
  variables: [
    { key: "affection", label: "好感度", type: "number", initialValue: 1, min: 0, max: 10 },
    { key: "trust", label: "信任度", type: "number", initialValue: 0, min: 0, max: 10 },
    { key: "courage", label: "表达勇气", type: "number", initialValue: 0, min: 0, max: 10 },
    { key: "future", label: "共同未来", type: "number", initialValue: 0, min: 0, max: 10 },
  ],
  nodes: [
    {
      id: "INTRO",
      type: "scene",
      title: "重逢以前",
      speaker: "旁白",
      content: "林予安在雾港旧街经营“晚风书屋”。七年前，她和沈栖曾在这里度过最亲近的一段时光；沈栖离开雾港那天，她写下一封没有寄出的信，两个人从此失去联系。\n\n如今林奶奶已经离世，独自守店的林予安决定结束营业。故事发生在书店关门前的最后一个雨夜。",
      media: mainImage("L-00 作品主封面.png", "雨夜中的晚风书屋", [image("L-P03 晚风书屋环境空镜.png", "即将结束营业的晚风书屋")]),
      nextNodeId: "N01",
      presentation: { transition: "dissolve", textReveal: "paragraph" },
    },
    { id: "N01", type: "scene", title: "书店最后一晚", speaker: "旁白", content: "晚风书屋即将结束营业。林予安站在移动木梯上，把最后一批旧书装进纸箱。\n\n窗外是海蓝色暮色，手机亮起一条陌生预约。门口的贝壳风铃在风里轻响，像有人隔着七年敲了一次门。", media: mainImage("L-01 书店最后一晚.png", "晚风书屋最后一晚", [image("L-P03 晚风书屋环境空镜.png", "晚风书屋环境参考")]), choices: [{ id: "N01-A", label: "先完成闭店，再查看预约", targetNodeId: "N02", feedback: "你让这间书店先好好结束它的一天。", changes: [{ key: "trust", operation: "add", value: 1 }] }, { id: "N01-B", label: "立刻查看手机上的预约信息", targetNodeId: "N02", feedback: "那个熟悉又陌生的名字，让你的手停了一瞬。", changes: [{ key: "courage", operation: "add", value: 1 }] }] },
    { id: "N02", type: "scene", title: "最后一位客人", speaker: "林予安", content: "门铃响起。沈栖收起深蓝长柄伞，肩上还带着雨水。他把取书凭证放在柜台边。七年后的第一次重逢，比林予安想象中更安静，也更让人无处躲藏。", media: mainImage("L-02 最后一位客人.png", "书店门口重逢"), choices: [{ id: "N02-A", label: "请他进来取书", targetNodeId: "N03", changes: [{ key: "affection", operation: "add", value: 1 }] }, { id: "N02-B", label: "先问他为什么回来", targetNodeId: "N03", changes: [{ key: "courage", operation: "add", value: 1 }] }] },
    { id: "N03", type: "scene", title: "七年后的第一句话", speaker: "沈栖", content: "两人隔着老式木柜台说话。沈栖说明自己回来是为了旧街保护项目，林予安却只听见了“书店可能会被保留”。那本无字蓝色旧书放在两人之间，像一段谁都没有先打开的旧时光。", media: mainImage("L-03 七年后的第一句话.png", "七年后第一次正式对话"), choices: [{ id: "N03-A", label: "问他是不是也记得桂花乌龙", targetNodeId: "N04", feedback: "沈栖望向饮品台，眼神终于柔和下来。", changes: [{ key: "affection", operation: "add", value: 2 }, { key: "trust", operation: "add", value: 1 }] }, { id: "N03-B", label: "直接问改造项目会不会拆掉书店", targetNodeId: "N05", feedback: "你选择把最担心的问题摆到两人之间。", changes: [{ key: "courage", operation: "add", value: 1 }] }, { id: "N03-C", label: "只谈取书，不谈七年前", targetNodeId: "N05", feedback: "柜台两侧的距离，好像又远了一点。", changes: [{ key: "trust", operation: "subtract", value: 1 }] }] },
    { id: "N04", type: "scene", title: "桂花乌龙", speaker: "林予安", content: "林予安还是替沈栖泡了一杯桂花乌龙。玻璃壶中的茶色慢慢变深，沈栖没有问她为什么还记得，只在她把杯子推过来时说：“你这里的风铃，好像比以前更安静了。”", media: mainImage("L-04 桂花乌龙.png", "桂花乌龙与重逢"), choices: [{ id: "N04-A", label: "告诉他，风铃只是断过一次", targetNodeId: "N06", changes: [{ key: "affection", operation: "add", value: 1 }, { key: "trust", operation: "add", value: 1 }] }, { id: "N04-B", label: "笑着说，旧东西都会变安静", targetNodeId: "N06", changes: [{ key: "courage", operation: "add", value: 1 }] }] },
    { id: "N05", type: "scene", title: "被送回来的旧书", speaker: "沈栖", content: "沈栖取出那本无字蓝色旧书。七年前离开雾港时，他误把它带走；这次参与旧街项目，他才决定亲自送回来。\n\n书页里露出一角深蓝信封。那是林予安当年藏进去、最终没有寄出的信。沈栖解释，他事先并不知道信的存在，也不想用一本旧书逼她回到过去。", media: mainImage("L-05 不属于谁的预约.png", "被送回书店的蓝色旧书"), choices: [{ id: "N05-A", label: "相信他的解释，继续看改造图", targetNodeId: "N06", changes: [{ key: "trust", operation: "add", value: 2 }] }, { id: "N05-B", label: "追问他为什么现在才回来", targetNodeId: "N06", changes: [{ key: "courage", operation: "add", value: 1 }, { key: "affection", operation: "add", value: 1 }] }] },
    { id: "N06", type: "scene", title: "旧街改造图", speaker: "沈栖", content: "建筑改造图铺满木地板。绿色线条圈出了晚风书屋，沈栖解释旧街保护方案：书店不会被推平，二楼会保留成公共阅读空间。林予安第一次认真看向他，也第一次相信他回来不是为了告别。", media: mainImage("L-06 旧街改造图.png", "旧街保护方案", [image("L-P04 旧街保护方案.png", "旧街改造图纸参考")]), choices: [{ id: "N06-A", label: "问他愿不愿意一起把方案做完", targetNodeId: "N07", importance: "key", feedback: "这一次，你说的是“一起”。", changes: [{ key: "future", operation: "add", value: 2 }, { key: "trust", operation: "add", value: 1 }] }, { id: "N06-B", label: "只感谢他保留书店", targetNodeId: "N07", feedback: "感谢是真的，但你仍没有谈起更远的以后。", changes: [{ key: "affection", operation: "add", value: 1 }] }] },
    { id: "N07", type: "scene", title: "台风封路", speaker: "旁白", content: "台风突然加强，石板街积水漫过鞋面，车站宣布道路暂时封闭。沈栖把改签车票压在柜台上，林予安关掉营业灯。书店像一座被雨围住的暖色孤岛，他们不得不在同一个屋檐下度过这一夜。", media: mainImage("L-07 台风封路.png", "台风夜被困在书店"), choices: [{ id: "N07-A", label: "邀请他一起整理仓库", targetNodeId: "N08", changes: [{ key: "affection", operation: "add", value: 1 }, { key: "trust", operation: "add", value: 1 }] }, { id: "N07-B", label: "各自找地方休息，保持距离", targetNodeId: "N08", changes: [{ key: "trust", operation: "add", value: 1 }] }] },
    { id: "N08", type: "scene", title: "整理仓库", speaker: "林予安", content: "仓库里的灰尘被暖色裸灯照亮。沈栖从高处递下旧书，移开的书架后露出一只褪色的蓝色铁皮信箱，信箱边缘还挂着一小段断裂的风铃绳。", media: mainImage("L-08 整理仓库.png", "整理书店仓库", [image("L-P01 蓝色信箱与信封.png", "蓝色信箱道具参考")]), choices: [{ id: "N08-A", label: "打开蓝色信箱", targetNodeId: "N09", changes: [{ key: "courage", operation: "add", value: 1 }, { key: "trust", operation: "add", value: 1 }] }, { id: "N08-B", label: "先修复断裂的贝壳风铃", targetNodeId: "N10", changes: [{ key: "affection", operation: "add", value: 2 }] }, { id: "N08-C", label: "假装没看见，继续整理书箱", targetNodeId: "N10", changes: [{ key: "courage", operation: "subtract", value: 1 }] }] },
    { id: "N09", type: "scene", title: "蓝色信封", speaker: "林予安", content: "信箱里只有一只深蓝色旧信封。林予安双手把它取出来，沈栖站在旁边没有碰。信封上的日期停在七年前，正是他离开雾港的那一天。里面不是一封完整的告白，而是一段被恐惧截断的未来。", media: mainImage("L-09 蓝色信封.png", "蓝色信封与旧信箱", [image("L-P01 蓝色信箱与信封.png", "蓝色信箱")]), choices: [{ id: "N09-A", label: "读完信，再问他为什么没有回来", targetNodeId: "N11", changes: [{ key: "courage", operation: "add", value: 2 }, { key: "trust", operation: "add", value: 1 }] }, { id: "N09-B", label: "把信交给他，让他先解释", targetNodeId: "N11", changes: [{ key: "trust", operation: "add", value: 2 }] }] },
    { id: "N10", type: "scene", title: "贝壳风铃", speaker: "沈栖", content: "两人并肩坐在木地板上，用新的麻绳修复断裂的风铃。贝壳和海蓝玻璃珠散在手边，沈栖的手指在同一个绳结上停了一下。风铃重新挂起时，林予安发现信箱钥匙藏在风铃背后的木梁缝里。", media: mainImage("L-10 修复贝壳风铃.png", "修复贝壳风铃", [image("贝壳风铃前后状态.png", "贝壳风铃修复前后")]), choices: [{ id: "N10-A", label: "拿钥匙打开信箱", targetNodeId: "N09", changes: [{ key: "courage", operation: "add", value: 2 }, { key: "trust", operation: "add", value: 1 }] }, { id: "N10-B", label: "把钥匙收好，先谈现在的生活", targetNodeId: "N11", changes: [{ key: "future", operation: "add", value: 1 }, { key: "affection", operation: "add", value: 1 }] }] },
    { id: "N11", type: "scene", title: "天台与两份邀请", speaker: "沈栖", content: "台风中心短暂停雨。两人来到书店天台，湿地反射着月光，远处是跨海大桥和海雾。沈栖的手机里有外地项目邀请，林予安也收到了一份留在本地的工作机会。他们终于开始谈论现实，而不是只谈七年前。", media: mainImage("L-11 天台与两份邀请.png", "天台上的两份未来邀请"), choices: [{ id: "N11-A", label: "问他愿不愿意一起规划距离", targetNodeId: "N12", changes: [{ key: "future", operation: "add", value: 2 }, { key: "courage", operation: "add", value: 1 }] }, { id: "N11-B", label: "只说书店需要一个新的方案", targetNodeId: "N12", changes: [{ key: "future", operation: "add", value: 1 }] }, { id: "N11-C", label: "回避工作与未来，聊起高中时的天气", targetNodeId: "N12", changes: [{ key: "courage", operation: "subtract", value: 1 }, { key: "affection", operation: "add", value: 1 }] }] },
    { id: "N12", type: "scene", title: "天亮前的坦白", speaker: "林予安", content: "修好的贝壳风铃重新挂回一楼。桌上放着蓝色信封、旧书和折过的车票。\n\n林予安终于直视沈栖，承认自己当年没有寄出那封信，不是因为不喜欢，而是害怕喜欢会让两个人都失去原来的生活。", media: mainImage("L-12 天亮前的坦白.png", "天亮前的坦白", [image("贝壳风铃前后状态.png", "修复后的贝壳风铃")]), presentation: { transition: "dissolve", textReveal: "paragraph" }, choices: [{ id: "N12-A", label: "说出当年没有寄出的原因", targetNodeId: "N13", importance: "key", feedback: "那段被藏了七年的话，终于有了听见它的人。", changes: [{ key: "courage", operation: "add", value: 3 }, { key: "trust", operation: "add", value: 2 }] }, { id: "N12-B", label: "只说现在愿意听他回答", targetNodeId: "N13", feedback: "你没有说完，但也不再把门关上。", changes: [{ key: "trust", operation: "add", value: 1 }] }, { id: "N12-C", label: "把信重新放回信箱", targetNodeId: "N13", feedback: "风铃轻响，替沉默记下了这一刻。", changes: [{ key: "courage", operation: "subtract", value: 1 }] }] },
    { id: "N13", type: "scene", title: "清晨车站", speaker: "旁白", content: "雨后清晨，栖川车站由淡蓝转向浅金。沈栖拿着折过的车票和深蓝长柄伞，林予安站在安全线内侧。列车即将进站，他们之间只剩最后一步距离，以及一个关于喜欢、离开和共同未来的选择。", media: mainImage("L-13 清晨车站.png", "清晨车站的最终选择"), presentation: { transition: "dissolve" }, choices: [{ id: "N13-A", label: "什么都不说，只陪他等车", targetNodeId: "E01", importance: "key", feedback: "广播声盖过了最后一次开口的机会。" }, { id: "N13-B", label: "告诉他：我喜欢你，但我还没准备好", targetNodeId: "E02", importance: "key", feedback: "喜欢被说出口，但未来仍需要诚实地面对。", conditions: [{ variable: "affection", operator: "gte", value: 3 }] }, { id: "N13-C", label: "邀请他共同保留晚风书屋", targetNodeId: "E03", importance: "key", feedback: "你把邀请递向了书店，也递向了两个人的以后。", conditions: [{ variable: "future", operator: "gte", value: 3 }] }, { id: "N13-D", label: "和他一起写下第八封信", targetNodeId: "E04", importance: "key", feedback: "这一次，你们决定一起写完没有寄出的未来。", conditions: [{ variable: "affection", operator: "gte", value: 4 }, { variable: "trust", operator: "gte", value: 4 }, { variable: "courage", operator: "gte", value: 3 }, { variable: "future", operator: "gte", value: 3 }] }] },
    { id: "E01", type: "ending", title: "末班车开走以后", endingKey: "missed", speaker: "旁白", content: "列车驶离站台，林予安独自站在安全线内侧，手里握着没有写完的信纸。两个人仍然喜欢彼此，却再次让沉默替他们做了决定。", media: [image("L-E01 末班车开走以后.png", "末班车开走以后的车站")] },
    { id: "E02", type: "ending", title: "把喜欢留在昨天", endingKey: "farewell", speaker: "旁白", content: "列车车门即将关闭，两人在站台进行克制而真诚的告别拥抱。他们确认了喜欢，却没有急着用承诺覆盖现实。", media: [image("L-E02 把喜欢留在昨天.png", "车站告别拥抱")] },
    { id: "E03", type: "ending", title: "留一盏灯", endingKey: "bookstore-light", speaker: "旁白", content: "两年后的晚风书屋完成了克制的修缮。一楼仍然是书店，二楼有插画和建筑工作桌。林予安准备关门时，沈栖带着图纸从街道另一端走来。", media: [image("L-E03 留一盏灯.png", "两年后的晚风书屋")] },
    { id: "E04", type: "ending", title: "第八封信", endingKey: "eighth-letter", speaker: "旁白", content: "清晨的车站长椅上，两人并肩写下第八封信。他们没有把异地、工作和书店的问题假装成浪漫的障碍，而是把它们一件件写进未来。", media: [image("L-E04 第八封信.png", "车站长椅上的第八封信")] },
  ],
};

type InterludeSpec = {
  id: string;
  title: string;
  content: string;
  images: Array<[string, string]>;
};

const dailyInterludes: Record<string, InterludeSpec> = {
  "N01->N02": {
    id: "bridge-name-on-booking",
    title: "预约上的名字",
    content: "预约人写的是沈栖。七年前离开雾港以后，他从未再来过书店，也没有解释为什么突然断掉联系。\n\n林予安还没有想好见面时该说什么，门口的贝壳风铃已经响了。",
    images: [["L-01 书店最后一晚.png", "亮起预约信息的手机"], ["L-02 最后一位客人.png", "雨夜里推门而入的最后一位客人"]],
  },
  "N02->N03": {
    id: "bridge-seven-years",
    title: "七年的空白",
    content: "高中时，沈栖常在晚风书屋帮忙整理旧书，林予安会给他留一杯桂花乌龙。后来沈栖跟随家人离开，两个人都以为对方会先联系。\n\n七年过去，他们隔着同一张柜台重逢。谁也不知道，应该先谈旧街改造，还是先谈那场没有告别的离开。",
    images: [["L-03 七年后的第一句话.png", "隔着柜台重逢的两个人"], ["L-04 桂花乌龙.png", "记忆里的桂花乌龙"]],
  },
  "N04->N06": {
    id: "bridge-back-to-present",
    title: "回到现在",
    content: "一杯茶让气氛稍微缓和，却没有解决书店即将关门的问题。沈栖这次回到雾港，是因为他参与了旧街保护项目。\n\n他带来的图纸，决定了这栋老房子会被拆除、保留，还是换一种方式继续存在。",
    images: [["L-04 桂花乌龙.png", "柜台边渐渐冷却的桂花乌龙"], ["L-06 旧街改造图.png", "铺在木地板上的旧街保护图纸"]],
  },
  "N05->N06": {
    id: "bridge-back-to-present-alt",
    title: "回到现在",
    content: "旧书、预约号码和七年前的信都还没有解释清楚。但今晚最现实的问题，是晚风书屋还能不能留下。\n\n沈栖展开保护方案，第一次把自己回来的理由完整地放到林予安面前。",
    images: [["L-05 不属于谁的预约.png", "旧书旁的预约信息"], ["L-06 旧街改造图.png", "被完整展开的旧街保护方案"]],
  },
  "N06->N07": {
    id: "bridge-plan-explained",
    title: "图纸说明以后",
    content: "方案能够保留书店的一楼和二楼，但建筑留下来，不代表晚风书屋会自动继续营业。\n\n林予安仍要决定自己是否愿意留下；沈栖也没有说明，项目结束以后会不会再次离开。就在这时，台风警报升级了。",
    images: [["L-06 旧街改造图.png", "标记着书店保留区域的图纸"], ["L-07 台风封路.png", "雨势迅速增强的旧街"]],
  },
  "N07->N08": {
    id: "bridge-trapped-night",
    title: "被雨留下的一夜",
    content: "道路封闭，末班车停运，沈栖只能留在书店等到天亮。\n\n为了避免一直坐在柜台两侧沉默，他们决定整理后仓。那里存放着林奶奶留下的旧物，也藏着两个人七年前都没有处理好的东西。",
    images: [["L-07 台风封路.png", "被台风包围的晚风书屋"], ["L-08 整理仓库.png", "暖灯下堆满旧物的书店仓库"]],
  },
  "N09->N11": {
    id: "bridge-letter-truth",
    title: "信封里的七年前",
    content: "蓝色信封是林予安七年前写下、却始终没有寄出的信。她当时喜欢沈栖，却害怕异地和未来会让两个人失去原来的生活。\n\n沈栖直到今晚才知道，自己等待的回答其实一直留在书店里。旧事已经说开一半，他们还必须谈清现在准备去往哪里。",
    images: [["L-09 蓝色信封.png", "终于被打开的七年前信封"], ["L-11 天台与两份邀请.png", "天台上摆在一起的两份工作邀请"]],
  },
  "N10->N11": {
    id: "bridge-present-before-past",
    title: "先谈现在",
    content: "林予安暂时没有打开信箱。她不想让一封旧信替现在的两个人作决定。\n\n台风中心带来短暂的平静，他们来到天台，准备先谈工作、城市和书店——这些才是天亮以后仍然存在的问题。",
    images: [["L-10 修复贝壳风铃.png", "重新响起的贝壳风铃"], ["L-11 天台与两份邀请.png", "天台上的两份现实选择"]],
  },
  "N12->N13": {
    id: "bridge-before-station",
    title: "天亮以前",
    content: "雨停以后，沈栖仍要乘早班车离开雾港。林予安可以承认喜欢，也可以继续经营书店，但这两件事都不能自动解决距离和工作。\n\n他们带着车票、旧信和刚刚说开的真相走向车站。最后要决定的不是七年前发生了什么，而是天亮以后愿意怎样继续。",
    images: [["L-12 天亮前的坦白.png", "桌上的车票、旧书与信封"], ["L-13 清晨车站.png", "雨后逐渐亮起的清晨车站"]],
  },
};

function addDailyInterludes(graph: StoryGraph): StoryGraph {
  const nodes = graph.nodes.map((node) => ({ ...node }));
  const interludeNodes: StoryNode[] = [];
  const imageFor = (entry: [string, string]) => image(entry[0], entry[1]);

  for (const node of nodes) {
    const rewriteTarget = (targetNodeId: string, choiceId?: string) => {
      const spec = dailyInterludes[`${node.id}->${targetNodeId}`];
      if (!spec) return targetNodeId;
      const id = choiceId ? `${spec.id}-${choiceId}` : spec.id;
      interludeNodes.push({
        id,
        type: "scene",
        title: spec.title,
        speaker: "旁白",
        content: spec.content,
        media: spec.images.map(imageFor),
        nextNodeId: targetNodeId,
        presentation: { transition: "dissolve", textReveal: "instant" },
      });
      return id;
    };
    if (node.nextNodeId) node.nextNodeId = rewriteTarget(node.nextNodeId);
    if (node.choices) node.choices = node.choices.map((choice) => ({ ...choice, targetNodeId: rewriteTarget(choice.targetNodeId, choice.id) }));
  }
  return { ...graph, nodes: [...nodes, ...interludeNodes] };
}

export const eveningBreezeWebGraph: StoryGraph = addDailyInterludes(eveningBreezeBaseGraph);
