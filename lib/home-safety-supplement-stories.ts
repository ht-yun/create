import type { StoryChoice, StoryDetail, StoryGraph, StoryMedia, StoryNode } from "@/shared/story-contract";

export type SupplementConfig = {
  key: string;
  title: string;
  slug: string;
  summary: string;
  authorName: string;
  folder: string;
  objectName: string;
  intro: string;
  information: string;
  risk: string;
  firstStep: string;
  cards: string;
  timely: string;
  delayed: string;
  wrong: string;
  reselect: string;
  review: string;
  assetRoot?: string;
};

const root = "/story-assets/home-safety-supplement/";

const configs: SupplementConfig[] = [
  {
    key: "drain-cleaner", title: "浴室门边的管道疏通剂", slug: "home-safety-drain-cleaner", summary: "从堵住的地漏开始，学习面对陌生清洁用品时如何停下、核对信息并联系专业帮助。", authorName: "安全教育编辑部", folder: "10-drain-cleaner", objectName: "颗粒状管道疏通剂",
    intro: "傍晚，浴室地漏排水变慢。门外放着一瓶完整的颗粒状管道疏通剂，我是家里第一个发现问题的人。妹妹还在走廊里找玩具。",
    information: "我看见了原包装、浴室门、积水地漏和手机。现在最重要的不是猜它怎么用，而是确认产品信息、现场状态和家人的位置。",
    risk: "我刚想靠近浴室，忽然意识到自己并不了解现场情况。门内外的距离、原包装和妹妹的位置，必须先被保留下来。",
    firstStep: "我先让妹妹离开浴室附近，自己停在门外，并准备把看到的情况如实告诉家长或专业人员。",
    cards: "桌面上出现四张行动卡：继续尝试、进入浴室、让家人远离、联系专业帮助。请把不能靠猜的动作和需要先做的事分开。",
    timely: "我保留了完整包装和现场信息，及时联系家长说明情况。浴室暂时不再进入，后续处理交给了解产品和现场的成年人。",
    delayed: "我拖到很晚才说明经过，包装还在，但时间线已经不完整。家人不得不花更多时间重新核对现场。",
    wrong: "我试图自己把事情处理得更快，结果让现场信息变得混乱。问题没有被解决，家人只能暂停使用并重新寻求专业意见。",
    reselect: "回到决定前，我把“停止、远离、保留包装、如实说明”重新排好。看不懂时先停下，反而是最可靠的一步。",
    review: "风险复盘显示：这条路线考验的不是记住某个偏方，而是面对陌生产品时能否停止猜测、保护家人并保留关键信息。",
  },
  {
    key: "dishwasher-pod", title: "像糖果一样的洗碗凝珠", slug: "home-safety-dishwasher-pod", summary: "从儿童误认彩色凝珠开始，练习把食品、玩具和清洁用品分开管理。", authorName: "安全教育编辑部", folder: "11-dishwasher-pod", objectName: "洗碗凝珠",
    intro: "厨房洗碗机旁放着一袋彩色洗碗凝珠。妹妹指着它问我：“这个是不是软糖？”她看到的不是清洁用品，而是一个颜色鲜艳的小物件。",
    information: "我把完整包装、零食碗、儿童视线高度和收纳柜位置放在一起比较。颜色和形状会误导人，真正能说明用途的是标签和分区。",
    risk: "妹妹的手还没有碰到凝珠，我先看见了问题：它和食品放在了相近的位置。厨房里需要立刻建立清晰的儿童安全边界。",
    firstStep: "我先把妹妹带离台面，让成年人接管产品和包装，不责骂她，也不让她继续靠近确认。",
    cards: "请把洗碗凝珠、彩色糖果和清洁用品放入“儿童可接触、成人使用、需要锁闭”三个区域。看起来像食品，不代表它属于食品区。",
    timely: "家长把凝珠放入儿童无法接触的锁闭收纳区，食品回到独立位置，并用孩子能理解的话说明它们用途不同。",
    delayed: "我们晚了一步才核对产品和孩子接触的位置，家人开始反复回忆刚才发生了什么。分区不清让确认变得更困难。",
    wrong: "我把几种物品暂时塞到同一个盒子里，看起来整齐了，却让下一次误认更容易发生。错误不在于颜色，而在于没有建立可识别的分区。",
    reselect: "回到选择前，我把清洁用品放到高处锁闭位置，把食品和玩具分开，并用图标帮助孩子理解家庭分区。",
    review: "风险复盘显示：儿童安全不能依赖孩子永远不犯错，而要通过包装、位置和监护共同降低误认机会。",
  },
  {
    key: "electric-mosquito-repellent", title: "夜里的电蚊香液", slug: "home-safety-electric-mosquito-repellent", summary: "在睡前房间里判断电器、窗户、纸张和儿童活动的位置关系。", authorName: "安全教育编辑部", folder: "12-electric-mosquito-repellent", objectName: "电蚊香液",
    intro: "雨夜，客厅里的电蚊香液靠近插座，旁边还有孩子的画纸和布偶。爸爸催我们关灯，房间里的每件东西都显得比白天更难判断。",
    information: "我先看清产品原包装、插座、窗户、床铺和孩子睡前会经过的路线。夜间操作不能只靠习惯，要先确认说明和空间边界。",
    risk: "我在插座旁停住了。纸张、布料、儿童路线和电器挨得太近，继续操作并不会让问题更快消失。",
    firstStep: "我先让孩子离开电器附近，停止继续尝试，并把房间情况交给成年人核对。",
    cards: "请把“查看说明、保持通风、远离儿童、反复操作”四张卡按优先级排列。夜里越着急，越需要先看清空间。",
    timely: "家人重新安排了睡眠区和电器区的位置，确认说明后再决定下一步，孩子的夜间路线也不再穿过设备旁边。",
    delayed: "我们等到夜深才重新确认位置，家人不断回想设备是否靠近了纸张和布料。拖延让一个本来清楚的房间变得难以复盘。",
    wrong: "我只想着把设备继续放在原来的位置，忽略了周围杂物和孩子路线。房间看起来没有变化，风险边界却一直没有建立。",
    reselect: "回到决定前，我先看说明、清出设备周边、保护孩子，再把是否继续使用交给成年人确认。",
    review: "风险复盘显示：夜间安全不是把设备打开就结束，而是要同时看电器、周围物品、通风和儿童活动范围。",
  },
  {
    key: "button-battery", title: "消失的纽扣电池", slug: "home-safety-button-battery", summary: "一枚小电池不见后，玩家要学会从普通搜寻升级到立即告知成年人并寻求专业帮助。", authorName: "安全教育编辑部", folder: "13-button-battery", objectName: "纽扣电池",
    intro: "客厅遥控器的电池仓没有合好，里面少了一枚纽扣电池。妹妹刚在地毯上玩过遥控器，爸爸还不知道这件事。",
    information: "我看到原包装、遥控器、电池仓、地毯和妹妹刚才活动的范围。搜索前先确认最后一次看见它的时间，以及孩子是否仍在物品附近。",
    risk: "原包装上的数量对不上了。我不再把它当成普通小物件寻找，先让妹妹离开地毯，并把缺失事实告诉成年人。",
    firstStep: "我立即向成年人说明电池缺失和孩子所在位置，停止让孩子参与寻找，并准备提供型号、时间和现场信息。",
    cards: "请把“继续独自寻找、确认数量、记录时间和型号、联系专业帮助”排列成信息升级路线。未知不能被当成确定。",
    timely: "家人保留了包装、型号和时间线，及时向专业人员说明情况。孩子由成年人陪同在安全位置，现场没有被继续打乱。",
    delayed: "我们花了很久继续翻找，时间线变得模糊，家人只能重新确认孩子刚才去过哪里。拖延让判断更加困难。",
    wrong: "我把它当作普通丢失物，继续让孩子参与搜寻。这个决定没有提高安全性，反而让最重要的缺失信息被忽略。",
    reselect: "回到选择前，我先隔离孩子、记录缺失信息并升级求助，而不是用继续寻找或观察来替代专业判断。",
    review: "风险复盘显示：小尺寸不代表小风险。面对纽扣电池缺失，及时说清事实比把时间耗在猜测和翻找上更重要。",
  },
  {
    key: "fake-water-toy", title: "像饮料一样的假水玩具", slug: "home-safety-fake-water-toy", summary: "从儿童视角识别外观相似的假水玩具，重新设计食品与玩具的家庭分区。", authorName: "安全教育编辑部", folder: "14-fake-water-toy", objectName: "假水玩具",
    intro: "妹妹从校门口带回一瓶透明假水玩具，它被放在冰箱旁边。她问我：“可以放进冰箱吗？”它看起来像饮料，却不是饮料。",
    information: "我把玩具包装、饮料杯、冰箱、玩具箱和儿童水杯放在同一张桌面上。判断用途时，要先看标签和收纳区，而不是只看外观。",
    risk: "妹妹拿着吸管靠近瓶口，我在她碰到之前停住了动作。大人不可能时时站在旁边，所以位置必须自己能说明用途。",
    firstStep: "我先让妹妹停止游戏，把玩具和包装原样留下，并用她听得懂的话说明：它看起来像水，但不是水。",
    cards: "请把食品、玩具、儿童水杯和假水玩具放进不同区域。分类的目标不是责怪孩子，而是让下一次判断更容易。",
    timely: "假水玩具回到独立玩具区，食品和饮水区保持清楚分开，妹妹也能通过图标辨认自己的水杯。",
    delayed: "我们晚些时候才重新核对标签和摆放位置，家人发现自己已经记不清它被谁放到哪里。",
    wrong: "我把玩具塞进冰箱，还把标签撕掉，想让它看起来更像水。表面更整齐了，误认风险却被扩大。",
    reselect: "回到选择前，我把假水玩具放入玩具区，保留包装，并告诉妹妹先看自己的水杯和物品用途。",
    review: "风险复盘显示：安全收纳不能依靠成年人一直在场，外观相似的物品尤其需要通过标签、位置和图标建立区分。",
  },
  {
    key: "nail-polish-remover", title: "书桌边的洗甲水", slug: "home-safety-nail-polish-remover", summary: "通过书桌边界图，判断洗甲水、热源、纸张和儿童活动区不应如何重叠。", authorName: "安全教育编辑部", folder: "15-nail-polish-remover", objectName: "洗甲水",
    intro: "傍晚，洗甲水被临时放在卧室窗边，附近有纸巾、香薰、充电器和孩子的彩笔。妈妈去接电话前提醒我们不要乱动桌面。",
    information: "我先观察产品原包装、台灯、充电器、纸制品、窗户和孩子的座位。桌面不是越满越方便，物品之间的边界需要先画出来。",
    risk: "我发现洗甲水和纸巾、台灯太靠近，手停在桌面上方。没有必要通过实验验证风险，先停止并拉开距离。",
    firstStep: "我把孩子和画纸带到餐桌，自己退到房门边，把桌面情况告诉成年人，不再把几样物品推到一起。",
    cards: "请把热源、易燃物、产品原包装和通风位置排成“停止、隔离、确认”的顺序。桌面整齐不等于边界安全。",
    timely: "家人重新划分了桌面区域，产品原包装远离儿童活动区、纸制品和可能的热源，后续按说明确认存放方式。",
    delayed: "我们后来才想起桌面上有哪些物品，纸巾、充电器和产品的位置不断被重新回忆。信息越晚记录，越难判断。",
    wrong: "我把几样东西一起塞进收纳篮，桌面看上去空了，却把边界藏了起来。错误补救没有减少风险，只是让它更难被看见。",
    reselect: "回到选择前，我先把孩子带离，保持产品原样，清出桌面边界，再由成年人核对存放方式。",
    review: "风险复盘显示：不做实验也能学习安全。把热源、纸制品、儿童活动区和产品分开，就是一次有效的风险识别。",
  },
  {
    key: "no-nail-adhesive", title: "还没干的免钉胶", slug: "home-safety-no-nail-adhesive", summary: "装修现场不把“已经粘住”当成“已经安全”，通过日志区分已确认和未确认信息。", authorName: "安全教育编辑部", folder: "16-no-nail-adhesive", objectName: "免钉胶",
    intro: "新装修的玄关里，一个轻型置物架刚被固定到墙上。旁边放着免钉胶、卷尺和装修记录本，孩子正从客厅走向墙边。",
    information: "我看见了墙面材质、置物架、产品包装、施工时间和孩子的位置。材料、承重和等待时间都没有被完整记录。",
    risk: "置物架轻轻偏了一下，我立刻把孩子带离墙边。粘住了不代表已经完成，未确认的部分必须继续留在记录里。",
    firstStep: "我先让所有人离开墙边，保留产品包装、施工位置和时间信息，把后续确认交给家长、产品说明或专业人员。",
    cards: "请把安装时间、墙面材质、承重、产品说明分别放进“已确认”和“还不能确定”两列，不要用感觉填满空格。",
    timely: "家人保留了装修日志和产品包装，暂时不在置物架上放东西，并联系相关人员核对材料与等待条件。",
    delayed: "我们没有记录施工时间，后来只能猜测墙面和置物架是否已经稳定。家庭活动被迫暂停更久。",
    wrong: "我为了省事继续加东西、移动工具，墙边信息变得更乱。看似主动处理，实际上让未确认状态扩大了。",
    reselect: "回到选择前，我把孩子带离墙边，保留日志和包装，并接受“现在还不能确定”这个答案。",
    review: "风险复盘显示：装修安全不仅是看见物品贴住了，还要确认材料、时间、承重和家庭成员的活动范围。",
  },
];

const nodeImage = (assetRoot: string, folder: string, nodeId: string, alt: string): StoryMedia => ({
  kind: "image",
  role: "scene",
  url: `${assetRoot}${folder}/${nodeId}.png`,
  playbackUrl: `${assetRoot.replace("/story-assets/", "/story-assets/optimized/")}${folder}/${nodeId}.webp`,
  alt,
});

const makeGraph = (config: SupplementConfig): StoryGraph => {
  const id = (suffix: string) => `${config.key}-${suffix}`;
  const assetRoot = config.assetRoot ?? root;
  const image = (suffix: string, alt: string) => [nodeImage(assetRoot, config.folder, suffix, alt)];
  const base = (suffix: string, title: string, content: string, nextNodeId?: string): StoryNode => ({
    id: id(suffix), type: "scene", title, speaker: "我", content, media: image(suffix, `${config.objectName}：${title}`), nextNodeId,
    presentation: { transition: "dissolve", textReveal: "paragraph" },
  });
  const choice = (choiceId: string, label: string, targetNodeId: string, feedback: string): StoryChoice => ({ id: id(choiceId), label, targetNodeId, feedback, importance: "key" });
  const nodes: StoryNode[] = [
    base("C01", "事情从这里开始", config.intro, id("C02")),
    base("C02", "先看见什么", config.information, id("C03")),
    { ...base("C03", "事故发生前", "我需要在继续行动、先核对信息和保护家人之间作出决定。"), choices: [
      choice("C03-A", "先核对信息并让家人远离", id("C04"), "我先把现场和家人的位置看清楚。"),
      choice("C03-B", "凭经验马上处理", id("C04"), "我意识到，陌生物品不能只靠经验判断。"),
    ] },
    base("C04", "风险被看见", config.risk, id("R01")),
    base("R01", "第一步", config.firstStep, id("R02")),
    { ...base("R02", "排列补救步骤", config.cards), choices: [
      choice("R02-A", "先停止、远离并保留信息", id("R03"), "我先把现场交给成年人确认。"),
      choice("R02-B", "继续自己处理，之后再说", id("R04"), "我把时间花在了猜测上。"),
      choice("R02-C", "把物品藏起来当作解决", id("R05"), "表面整理没有消除未知风险。"),
    ] },
    base("R03", "及时处理", config.timely, id("R06")),
    base("R04", "延迟求助", config.delayed, id("R06")),
    base("R05", "错误补救", config.wrong, id("R06")),
    { ...base("R06", "回到事故前", config.reselect), choices: [
      choice("R06-A", "重新选择安全处理", id("R07"), "我把安全步骤重新排在了第一位。"),
    ] },
    { ...base("R07", "风险复盘", config.review), type: "ending", endingKey: id("R07"), nextNodeId: undefined },
  ];
  return { version: 1, startNodeId: id("C01"), variables: [], nodes };
};

export const createHomeSafetyStory = (config: SupplementConfig): StoryDetail => ({
  id: `demo-home-safety-${config.key}`,
  slug: config.slug,
  title: config.title,
  summary: config.summary,
  authorName: config.authorName,
  tags: ["安全教育", "家庭", "互动学习"],
  visibility: "public",
  status: "published",
  estimatedMinutes: 8,
  endingCount: 1,
  favoriteCount: 0,
  playCount: 0,
  score: 0,
  updatedAt: "2026-08-02T00:00:00.000Z",
  coverUrl: `${(config.assetRoot ?? root).replace("/story-assets/", "/story-assets/optimized/")}${config.folder}/C01.webp`,
  graph: makeGraph(config),
});

export const homeSafetySupplementStories: StoryDetail[] = configs.map(createHomeSafetyStory);
