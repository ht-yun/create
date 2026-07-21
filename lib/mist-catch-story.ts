import type { StoryGraph, StoryMedia } from "@/shared/story-contract";

const mistImage = (filename: string, alt: string): StoryMedia => ({
  kind: "image",
  url: `/story-assets/mist-catch/${encodeURIComponent(filename)}`,
  playbackUrl: `/story-assets/optimized/mist-catch/${encodeURIComponent(filename.replace(/\.[^.]+$/, ".webp"))}`,
  alt,
});

const sceneMedia = (filename: string, alt: string, extras: StoryMedia[] = []) => [mistImage(filename, alt), ...extras];
const environment = (filename: string, alt: string) => mistImage(filename, alt);
const evidence = (filename: string, alt: string) => mistImage(filename, alt);

export const mistCatchGraph: StoryGraph = {
  version: 1,
  startNodeId: "N01",
  variables: [
    { key: "justice", label: "正义判断", type: "number", initialValue: 0, min: 0, max: 10 },
    { key: "responsibility", label: "责任心", type: "number", initialValue: 0, min: 0, max: 10 },
    { key: "evidence", label: "证据完整度", type: "number", initialValue: 0, min: 0, max: 10 },
    { key: "deception_exposure", label: "识破骗局", type: "number", initialValue: 0, min: 0, max: 10 },
    { key: "public_risk", label: "公共风险", type: "number", initialValue: 0, min: 0, max: 10 },
  ],
  nodes: [
    {
      id: "N01", type: "scene", title: "雨夜失窃", speaker: "林峥",
      content: "凌晨一点四十分，雾港下着大雨。临江里弄17号发生入室盗窃，现金、药品和一只手提箱不见了。门锁没有损坏，玄关却留着一只沾满黑泥、明显不合脚的运动鞋。赵敏蹲在门边提醒你：真正的线索，往往不是嫌疑人想让我们看到的那一条。",
      media: sceneMedia("N01 雨夜失窃.png", "雨夜的失窃现场", [environment("L07 临江里弄17号失窃住宅.png", "临江里弄17号失窃住宅"), evidence("P02 假鞋印与真实脚印.png", "假鞋印与真实脚印")]),
      choices: [
        { id: "N01-A", label: "先检查整套房屋和门锁，保护现场", targetNodeId: "N02", changes: [{ key: "justice", operation: "add", value: 1 }, { key: "responsibility", operation: "add", value: 1 }] },
        { id: "N01-B", label: "先调取小区监控", targetNodeId: "N03", changes: [{ key: "evidence", operation: "add", value: 2 }, { key: "deception_exposure", operation: "add", value: 1 }] },
        { id: "N01-C", label: "沿着湿脚印立刻追出去", targetNodeId: "N04", changes: [{ key: "evidence", operation: "add", value: 1 }, { key: "public_risk", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N02", type: "scene", title: "没有被破坏的门锁", speaker: "赵敏",
      content: "门锁没有撬痕，猫眼内侧也没有被遮挡。书房抽屉被打开，却没有翻乱其他房间。你让秦阿姨先离开现场，逐件记录物品位置。赵敏在门框上找到一层新鲜的蜡状残留，像是有人提前复制过钥匙。",
      media: sceneMedia("L07 临江里弄17号失窃住宅.png", "没有被破坏的失窃住宅", [evidence("P02 假鞋印与真实脚印.png", "门口遗留的假鞋印"), environment("N04 邻居的灯.png", "仍亮着灯的邻居窗口")]),
      choices: [
        { id: "N02-A", label: "保留门框残留，送回所里检验", targetNodeId: "N05", changes: [{ key: "evidence", operation: "add", value: 2 }, { key: "justice", operation: "add", value: 1 }] },
        { id: "N02-B", label: "先询问秦阿姨最近见过哪些陌生人", targetNodeId: "N05", changes: [{ key: "evidence", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N03", type: "scene", title: "监控里的空白", speaker: "林峥",
      content: "监控画面里，灰色雨衣的人从后门进入。他经过垃圾房时停了很久，随后把一只鞋塞进垃圾桶，又换上另一双鞋。你把画面放大，发现他进入小区时根本没有穿案发现场留下的那只鞋。",
      media: sceneMedia("N02 监控里的空白.png", "监控中的换鞋画面", [evidence("P02 假鞋印与真实脚印.png", "用于误导警方的鞋印")]),
      choices: [
        { id: "N03-A", label: "放大垃圾房画面，追查鞋套包装", targetNodeId: "N05", changes: [{ key: "evidence", operation: "add", value: 2 }, { key: "deception_exposure", operation: "add", value: 1 }] },
        { id: "N03-B", label: "追查他进入小区前的路线", targetNodeId: "N05", changes: [{ key: "evidence", operation: "add", value: 1 }] },
        { id: "N03-C", label: "把嫌疑人照片立刻发到工作群", targetNodeId: "N05", changes: [{ key: "responsibility", operation: "add", value: 1 }, { key: "public_risk", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N04", type: "scene", title: "雨里的脚印", speaker: "林峥",
      content: "湿脚印在后巷排水沟旁中断。巷口的电动三轮车轮上沾着同样的黑泥。卖菜老人说看见一个灰雨衣的人上了车，但他不确定对方是不是警察要找的小偷。你没有让老人冒险带路，而是先记录时间、方向和原话。",
      media: sceneMedia("N03 雨里的脚印.png", "雨巷中断的脚印", [environment("L01 雾港老城区环境.png", "雾港老城区雨夜")]),
      choices: [
        { id: "N04-A", label: "保护老人隐私，完整记录证词", targetNodeId: "N05", changes: [{ key: "justice", operation: "add", value: 1 }, { key: "responsibility", operation: "add", value: 1 }, { key: "evidence", operation: "add", value: 1 }] },
        { id: "N04-B", label: "让老人马上带路", targetNodeId: "N05", changes: [{ key: "public_risk", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N05", type: "scene", title: "旧码头发现目标", speaker: "赵敏",
      content: "旧码头的雾比城区更浓。小卖部监控拍到周骁脱下灰雨衣，换上深色外套，手里提着与失窃手提箱相似的袋子。他把一辆自行车推倒在路中央，又把纸箱放到巷口，像是在给追捕准备障碍。",
      media: sceneMedia("N05 旧码头发现目标.png", "雾中的旧码头目标", [environment("L02 旧码头环境.png", "雾港旧码头"), evidence("P01 被盗手提箱.png", "被盗手提箱")]),
      choices: [
        { id: "N05-A", label: "立即追赶，不能让他消失", targetNodeId: "N06", changes: [{ key: "evidence", operation: "add", value: 1 }, { key: "public_risk", operation: "add", value: 2 }] },
        { id: "N05-B", label: "呼叫支援并封锁出口", targetNodeId: "N07", changes: [{ key: "justice", operation: "add", value: 1 }, { key: "responsibility", operation: "add", value: 2 }] },
        { id: "N05-C", label: "先疏散附近群众", targetNodeId: "N08", changes: [{ key: "responsibility", operation: "add", value: 2 }, { key: "public_risk", operation: "subtract", value: 1 }] },
      ],
    },
    {
      id: "N06", type: "scene", title: "翻倒的摊车", speaker: "林峥",
      content: "你冲进巷子，周骁回头看了一眼，立刻掀翻路边水果摊。橘子滚进积水，摊主扑过去护住孩子。周骁没有攻击任何人，他只是回头确认你是否停下——他在控制追捕的节奏。",
      media: sceneMedia("N06 翻倒的摊车.png", "被掀翻的水果摊") ,
      choices: [
        { id: "N06-A", label: "继续追，不让他拉开距离", targetNodeId: "N09", changes: [{ key: "public_risk", operation: "add", value: 2 }] },
        { id: "N06-B", label: "先扶起摊主和孩子", targetNodeId: "N09", changes: [{ key: "responsibility", operation: "add", value: 2 }, { key: "evidence", operation: "add", value: 1 }] },
        { id: "N06-C", label: "让赵敏追踪，自己疏散人群", targetNodeId: "N09", changes: [{ key: "responsibility", operation: "add", value: 1 }, { key: "justice", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N07", type: "scene", title: "封锁线", speaker: "陈队长",
      content: "你没有冲进人群，而是让支援警力从东、西、南三个方向封锁出口。周骁把塑料布盖在头上，混进鱼市搬运工中。你没有喊抓小偷，只让群众停在安全区域，再逐个确认身份。周骁隔着人群对你笑了一下。",
      media: sceneMedia("N07 封锁线.png", "旧码头的封锁线", [environment("L02 旧码头环境.png", "鱼市旁的旧码头")]),
      choices: [
        { id: "N07-A", label: "按顺序核对所有人员", targetNodeId: "N09", changes: [{ key: "justice", operation: "add", value: 2 }, { key: "responsibility", operation: "add", value: 1 }] },
        { id: "N07-B", label: "命令所有人蹲下，立刻控制现场", targetNodeId: "N09", changes: [{ key: "public_risk", operation: "add", value: 1 }] },
        { id: "N07-C", label: "观察周骁的鞋和手部动作", targetNodeId: "N09", changes: [{ key: "deception_exposure", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N08", type: "scene", title: "先亮起的警灯", speaker: "林峥",
      content: "你先让摊贩和路人退出巷口，再把警灯停在两个出口之间。周骁躲进废弃公交车，拨通陌生人的电话，故意大声说：“妈，你别怕，我马上回去。”这是你第一次听见“母亲”这个词。",
      media: sceneMedia("N08 先亮起的警灯.png", "巷口先亮起的警灯") ,
      choices: [
        { id: "N08-A", label: "记录通话内容，继续观察", targetNodeId: "N09", changes: [{ key: "evidence", operation: "add", value: 1 }, { key: "deception_exposure", operation: "add", value: 1 }] },
        { id: "N08-B", label: "等支援到位再靠近", targetNodeId: "N09", changes: [{ key: "responsibility", operation: "add", value: 2 }, { key: "public_risk", operation: "subtract", value: 1 }] },
      ],
    },
    {
      id: "N09", type: "scene", title: "废弃车站的背包", speaker: "赵敏",
      content: "周骁逃入停用多年的旧车站，只留下一个黑色背包。里面有旧车票、碎屏手机、“妈，对不起”的纸条和一张医院缴费单。赵敏没有马上碰它，只用相机记录位置。你发现背包底部的灰尘被刚刚擦开，周骁可能故意把它留在这里。",
      media: sceneMedia("N09 废弃车站的背包.png", "废弃车站中的黑色背包", [environment("L03 废弃车站环境.png", "停用多年的废弃车站"), evidence("P03 假线索背包.png", "周骁留下的假线索背包")]),
      choices: [
        { id: "N09-A", label: "相信纸条和缴费单，先判断动机", targetNodeId: "N10", changes: [{ key: "justice", operation: "subtract", value: 1 }, { key: "deception_exposure", operation: "subtract", value: 1 }] },
        { id: "N09-B", label: "检查缴费单真伪", targetNodeId: "N11", changes: [{ key: "evidence", operation: "add", value: 2 }] },
        { id: "N09-C", label: "封锁出口，再分析损坏手机", targetNodeId: "N12", changes: [{ key: "responsibility", operation: "add", value: 1 }, { key: "evidence", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N10", type: "scene", title: "纸条上的母亲", speaker: "林峥",
      content: "纸条只有一句话：“妈，对不起，我很快就回来。”你想起小时候母亲在雨夜里给你买药的样子，短暂地对周骁产生同情。赵敏却提醒：“同情可以保留，但证据不能因为同情变软。”",
      media: sceneMedia("N10 纸条上的“妈”.png", "写着母亲的纸条", [evidence("P03 假线索背包.png", "装着纸条的背包")]),
      choices: [
        { id: "N10-A", label: "把周骁判断为被生活逼迫的人", targetNodeId: "N13", changes: [{ key: "justice", operation: "subtract", value: 1 }, { key: "deception_exposure", operation: "subtract", value: 1 }] },
        { id: "N10-B", label: "记录纸条，不对真实性下结论", targetNodeId: "N13", changes: [{ key: "justice", operation: "add", value: 1 }, { key: "responsibility", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N11", type: "scene", title: "假缴费单", speaker: "赵敏",
      content: "医院回复：单据上的科室确实存在，但当天没有这名患者，也没有这笔缴费记录。右下角流水号属于两年前的一批旧票据。周骁提前准备了这些材料，专门等警方把他和母亲联系起来。",
      media: sceneMedia("N11 假缴费单.png", "存在矛盾的医院缴费单", [environment("L06 临江派出所与监控室.png", "临江派出所监控与证据分析室")]),
      choices: [
        { id: "N11-A", label: "把假缴费单列为重点证据", targetNodeId: "N13", changes: [{ key: "evidence", operation: "add", value: 2 }, { key: "deception_exposure", operation: "add", value: 2 }] },
        { id: "N11-B", label: "暂不公开核查结果，继续观察", targetNodeId: "N13", changes: [{ key: "deception_exposure", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N12", type: "scene", title: "损坏的手机", speaker: "赵敏",
      content: "手机里有七个来自不同号码的未接来电。恢复出的短信写着：“你母亲根本没有住院，你不要再拿她说事。”手机相册还有一张居民楼消防通道的照片，拍摄时间就在盗窃案发生前。",
      media: sceneMedia("N12 损坏的手机.png", "正在恢复数据的损坏手机", [evidence("P03 假线索背包.png", "背包中的关键物证")]),
      choices: [
        { id: "N12-A", label: "继续恢复手机数据", targetNodeId: "N13", changes: [{ key: "evidence", operation: "add", value: 2 }, { key: "deception_exposure", operation: "add", value: 2 }] },
        { id: "N12-B", label: "先派人封锁消防通道", targetNodeId: "N13", changes: [{ key: "responsibility", operation: "add", value: 2 }, { key: "public_risk", operation: "subtract", value: 1 }] },
      ],
    },
    {
      id: "N13", type: "scene", title: "楼顶的抓捕", speaker: "林峥",
      content: "凌晨三点二十分，周骁出现在居民楼楼顶。你和赵敏从两侧接近，他没有跳，也没有拿出武器，只举起双手。周骁说：“东西我可以交，但你们得先听我说。”他的目光一直盯着你的手，像是在计算控制距离。",
      media: sceneMedia("N13 楼顶的抓捕.png", "居民楼顶的抓捕", [environment("L04 居民楼楼顶与消防通道.png", "居民楼顶与消防通道")]),
      choices: [
        { id: "N13-A", label: "立即上前控制周骁", targetNodeId: "N14", changes: [{ key: "responsibility", operation: "add", value: 1 }, { key: "public_risk", operation: "subtract", value: 1 }] },
        { id: "N13-B", label: "保持距离，让他先说", targetNodeId: "N14", changes: [{ key: "justice", operation: "add", value: 1 }] },
        { id: "N13-C", label: "先让他把手提箱推到地上", targetNodeId: "N15", changes: [{ key: "evidence", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N14", type: "scene", title: "重病母亲的请求", speaker: "周骁",
      content: "周骁坐在水箱旁，脸色苍白。他说自己不是为了享受才偷东西，只是母亲快不行了。随后他低声请求：“我妈就在前面的老房子里。把我押去派出所之前，让我回去看她一眼，好不好？我看完就跟你们走。”",
      media: sceneMedia("N14 重病母亲的请求.png", "周骁请求回家探望母亲", [environment("L08 何桂兰家与老楼楼道.png", "何桂兰家所在的旧楼楼道"), evidence("P04 何桂兰家的门.png", "何桂兰家的门")]),
      choices: [
        { id: "N14-A", label: "同意周骁回家看看母亲", targetNodeId: "N17", changes: [{ key: "justice", operation: "subtract", value: 1 }, { key: "public_risk", operation: "add", value: 2 }] },
        { id: "N14-B", label: "拒绝放行，但承诺依法联系母亲", targetNodeId: "N16", changes: [{ key: "justice", operation: "add", value: 2 }, { key: "responsibility", operation: "add", value: 2 }] },
        { id: "N14-C", label: "先核实母亲是否真的病重", targetNodeId: "N15", changes: [{ key: "evidence", operation: "add", value: 2 }, { key: "deception_exposure", operation: "add", value: 3 }] },
      ],
    },
    {
      id: "N15", type: "scene", title: "楼顶的边界", speaker: "林峥",
      content: "你没有答应周骁的请求，让赵敏联系社区和医院，同时保持安全距离。“你可以申请见家属，也可以让我们联系她。但你不能在没有安全措施的情况下离开。”周骁的表情第一次变冷，他的右手拇指不断摩擦食指，等待一个突然行动的机会。",
      media: sceneMedia("N15 楼顶的边界.png", "楼顶上保持的安全边界", [environment("L04 居民楼楼顶与消防通道.png", "可供逃离的消防通道")]),
      choices: [
        { id: "N15-A", label: "继续解释程序，让他坐到安全位置", targetNodeId: "N16", changes: [{ key: "justice", operation: "add", value: 2 }, { key: "responsibility", operation: "add", value: 1 }] },
        { id: "N15-B", label: "告诉他再闹就别想见母亲", targetNodeId: "N17", changes: [{ key: "justice", operation: "subtract", value: 1 }, { key: "public_risk", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N16", type: "scene", title: "没有住院的母亲", speaker: "何桂兰",
      content: "社区和医院先后回电：何桂兰没有住院，也没有急诊记录。电话接通后，她疲惫地问：“是不是周骁又闯祸了？”她完全不知道儿子正在逃亡，只知道他前几天拿走了身份证，说要去找工作。周骁的谎言被当场拆穿。",
      media: sceneMedia("N16 没有住院的母亲.png", "何桂兰得知真相", [environment("L08 何桂兰家与老楼楼道.png", "何桂兰的家"), evidence("P04 何桂兰家的门.png", "被借用身份信息的住处")]),
      choices: [
        { id: "N16-A", label: "揭穿谎言，但不羞辱周骁", targetNodeId: "N17", changes: [{ key: "deception_exposure", operation: "add", value: 3 }, { key: "justice", operation: "add", value: 1 }] },
        { id: "N16-B", label: "先告诉何桂兰警方会保护她", targetNodeId: "N17", changes: [{ key: "responsibility", operation: "add", value: 2 }, { key: "justice", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N17", type: "scene", title: "谎言逃亡", speaker: "林峥",
      content: "如果你允许周骁回家，他会故意放慢脚步，声称钥匙在邻居那里，又说母亲可能已经晕倒。当你靠近房门时，他突然用肩膀撞开消防通道门，翻过低矮围墙，跳到下一栋楼的雨棚上。他没有攻击你，只留下一句：“我真的只是想回去看她。”",
      media: sceneMedia("N17 谎言逃亡.png", "周骁从消防通道逃离", [environment("L04 居民楼楼顶与消防通道.png", "雨夜的消防通道")]),
      choices: [
        { id: "N17-A", label: "独自翻墙追下去", targetNodeId: "N18", changes: [{ key: "public_risk", operation: "add", value: 2 }] },
        { id: "N17-B", label: "封锁下方道路并通知支援", targetNodeId: "N19", changes: [{ key: "responsibility", operation: "add", value: 2 }, { key: "public_risk", operation: "subtract", value: 1 }] },
        { id: "N17-C", label: "留在楼道保护何桂兰和居民", targetNodeId: "N20", changes: [{ key: "responsibility", operation: "add", value: 2 }, { key: "evidence", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N18", type: "scene", title: "重新检查背包", speaker: "陈队长",
      content: "追捕暂时中断。陈队长没有责骂你，只让你重新整理线索：“他逃跑不是因为你善良，是因为他提前知道你会怎样善良。”你回到废弃车站，发现背包底部夹着一张仓库平面图，标记着旧码头7号仓库和货运线。",
      media: sceneMedia("N18 重新检查背包.png", "在车站重新检查背包", [environment("L03 废弃车站环境.png", "废弃车站证据现场"), evidence("P03 假线索背包.png", "背包底部的仓库平面图")]),
      choices: [
        { id: "N18-A", label: "把平面图列为重点线索", targetNodeId: "N21", changes: [{ key: "evidence", operation: "add", value: 2 }, { key: "deception_exposure", operation: "add", value: 1 }] },
        { id: "N18-B", label: "认为它可能是假线索，继续核对", targetNodeId: "N21", changes: [{ key: "evidence", operation: "add", value: 1 }, { key: "deception_exposure", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N19", type: "scene", title: "重新询问旧码头目击者", speaker: "赵敏",
      content: "卖菜老人补充说，周骁没有直接进入车站，而是把一个金属盒交给了鱼市搬运工。监控显示金属盒后来被放进一辆货车。真正的赃物和假线索可能从一开始就被分开转移。",
      media: sceneMedia("N19 重新询问旧码头目击者.png", "旧码头的目击者复询", [environment("L02 旧码头环境.png", "运货车辆经过的旧码头")]),
      choices: [
        { id: "N19-A", label: "调取货车出入记录", targetNodeId: "N21", changes: [{ key: "evidence", operation: "add", value: 2 }] },
        { id: "N19-B", label: "先保护目击老人，避免他被报复", targetNodeId: "N21", changes: [{ key: "responsibility", operation: "add", value: 2 }] },
      ],
    },
    {
      id: "N20", type: "scene", title: "何桂兰的生活轨迹", speaker: "何桂兰",
      content: "何桂兰坚持说儿子不是坏人，只是总觉得别人欠他一点。你在她家发现一张快递单，收件地址是旧码头7号仓库附近，寄件人正是周骁。她这才意识到，儿子一直在借她的名字租房、收货，把她当成逃跑时的挡箭牌。",
      media: sceneMedia("N20 何桂兰的生活轨迹.png", "何桂兰发现自己被利用", [environment("L08 何桂兰家与老楼楼道.png", "何桂兰的住处"), evidence("P04 何桂兰家的门.png", "被周骁利用的住址")]),
      choices: [
        { id: "N20-A", label: "告诉何桂兰如何保护身份证信息", targetNodeId: "N21", changes: [{ key: "responsibility", operation: "add", value: 2 }, { key: "justice", operation: "add", value: 1 }] },
        { id: "N20-B", label: "让她打电话劝周骁投降", targetNodeId: "N21", changes: [{ key: "responsibility", operation: "add", value: 1 }, { key: "deception_exposure", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N21", type: "scene", title: "七号仓库", speaker: "陈队长",
      content: "凌晨四点，警方在旧码头7号仓库发现周骁。一名货运工人被捆在柱子旁，意识清醒。周骁站在货架后，手里握着一把拆下来的铁钩：“别进来。我不想伤他，但你们逼我，我就不敢保证了。”",
      media: sceneMedia("N21.png", "七号仓库中的人质危机", [environment("L05 七号仓库环境.png", "旧码头七号仓库"), evidence("P01 被盗手提箱.png", "藏在仓库中的手提箱")]),
      choices: [
        { id: "N21-A", label: "立即冲入仓库抓捕", targetNodeId: "N22", changes: [{ key: "public_risk", operation: "add", value: 3 }] },
        { id: "N21-B", label: "先谈判拖延时间", targetNodeId: "N23", changes: [{ key: "responsibility", operation: "add", value: 1 }, { key: "deception_exposure", operation: "add", value: 1 }] },
        { id: "N21-C", label: "让救援人员和谈判员就位", targetNodeId: "N23", changes: [{ key: "responsibility", operation: "add", value: 2 }, { key: "public_risk", operation: "subtract", value: 1 }] },
        { id: "N21-D", label: "优先确认人质是否受伤", targetNodeId: "N24", changes: [{ key: "responsibility", operation: "add", value: 2 }, { key: "justice", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N22", type: "scene", title: "贸然冲入", speaker: "林峥",
      content: "你冲进仓库，周骁立刻推倒货架。铁架砸在地面上，灰尘和碎玻璃遮住视线。你抓住了周骁的衣领，但人质的脸被碎玻璃擦伤。抓捕成功，却留下了本可以避免的风险。",
      media: sceneMedia("N22 贸然冲入.png", "贸然冲入仓库的风险") ,
      choices: [
        { id: "N22-A", label: "先处理人质伤口", targetNodeId: "N25", changes: [{ key: "responsibility", operation: "add", value: 2 }, { key: "public_risk", operation: "subtract", value: 1 }] },
        { id: "N22-B", label: "先把周骁押上警车", targetNodeId: "N25", changes: [{ key: "justice", operation: "add", value: 1 }, { key: "public_risk", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "N23", type: "scene", title: "仓库谈判", speaker: "林峥",
      content: "你站在门外，保持声音平稳：“你可以要求见律师，也可以要求医疗检查。但你必须先让人质离开危险位置。”周骁冷笑：“你们抓了我，我妈怎么办？”你回答：“她不是你的罪证，也不是你的筹码。她会被保护，也会被如实询问。”",
      media: sceneMedia("N23 仓库谈判.png", "仓库门外的谈判") ,
      choices: [
        { id: "N23-A", label: "明确告知依法处理，不承诺免罪", targetNodeId: "N25", changes: [{ key: "justice", operation: "add", value: 2 }, { key: "responsibility", operation: "add", value: 1 }] },
        { id: "N23-B", label: "让何桂兰通过电话劝他投降", targetNodeId: "N25", changes: [{ key: "responsibility", operation: "add", value: 2 }, { key: "deception_exposure", operation: "add", value: 1 }] },
        { id: "N23-C", label: "承诺只要放人就尽量宽大处理", targetNodeId: "N25", changes: [{ key: "justice", operation: "subtract", value: 1 }] },
      ],
    },
    {
      id: "N24", type: "scene", title: "先救出人质", speaker: "赵敏",
      content: "你让赵敏从侧面接近人质，用谈判拖住周骁。救援人员从仓库后方进入，人质被安全带出。周骁失去最后的掩护，转身逃向码头边缘，手提箱从货架后掉下来，药品散落在地。",
      media: sceneMedia("N24 先救出人质.png", "救援人员先带出人质", [evidence("P01 被盗手提箱.png", "跌落在地的被盗手提箱")]),
      choices: [
        { id: "N24-A", label: "让支援封锁码头，先确认赃物和人质安全", targetNodeId: "N25", changes: [{ key: "responsibility", operation: "add", value: 2 }, { key: "evidence", operation: "add", value: 1 }] },
        { id: "N24-B", label: "先安排周骁进行医疗检查", targetNodeId: "N25", changes: [{ key: "responsibility", operation: "add", value: 2 }] },
      ],
    },
    {
      id: "N25", type: "scene", title: "最后一盏灯", speaker: "周骁",
      content: "天快亮了，旧码头只剩一盏黄色吊灯。周骁站在湿滑石阶边缘，举起双手却没有放下铁钩：“你们再往前一步，我就跳下去。只有你一个人过来，我才愿意投降。”陈队长在耳机里说：“林峥，别让他把最后的选择也变成你的责任。”",
      media: sceneMedia("N25 最后一盏灯.png", "旧码头边的最后对峙", [environment("L02 旧码头环境.png", "即将天亮的旧码头")]),
      choices: [
        { id: "N25-A", label: "保持距离，让谈判员配合", targetNodeId: "E01", conditions: [{ variable: "evidence", operator: "gte", value: 6 }, { variable: "justice", operator: "gte", value: 6 }, { variable: "responsibility", operator: "gte", value: 6 }, { variable: "public_risk", operator: "lte", value: 5 }] },
        { id: "N25-B", label: "承认他的恐惧，但要求他放下铁钩", targetNodeId: "E04", conditions: [{ variable: "deception_exposure", operator: "gte", value: 5 }, { variable: "responsibility", operator: "gte", value: 7 }] },
        { id: "N25-C", label: "先确认水面和救援条件，再行动", targetNodeId: "E05", conditions: [{ variable: "responsibility", operator: "gte", value: 8 }] },
        { id: "N25-D", label: "独自靠近，赌他不敢跳", targetNodeId: "E02", conditions: [{ variable: "public_risk", operator: "gte", value: 5 }] },
        { id: "N25-E", label: "公开揭穿他关于母亲的谎言", targetNodeId: "E03", conditions: [{ variable: "evidence", operator: "lte", value: 3 }, { variable: "justice", operator: "lte", value: 4 }] },
        { id: "N25-F", label: "继续谈判，等待所有支援到位", targetNodeId: "E04" },
      ],
    },
    {
      id: "E01", type: "ending", title: "依法归案", endingKey: "lawful-arrest", speaker: "旁白",
      content: "林峥没有独自走向周骁。谈判员持续保持对话，救援人员确认水面安全，支援警力封锁所有出口。周骁终于把铁钩放到地上。何桂兰拒绝替儿子撒谎，但愿意在合法范围内探视。林峥明白，正义不是愤怒地抓住一个人，而是把每一步都做对。",
      media: sceneMedia("E01 依法归案.png", "周骁依法归案的结局画面"),
    },
    {
      id: "E02", type: "ending", title: "谎言下的逃亡", endingKey: "escape-by-lie", speaker: "旁白",
      content: "周骁利用楼道、消防通道和林峥的迟疑逃出居民楼。警方只找到一件丢在公交站的外套。所谓病重的母亲正在厨房煮粥，桌上却留着周骁的纸条：“谢谢你相信我。”案件暂时失败，但旧码头监控仍保存着他的身影，下一次追捕终会开始。",
      media: sceneMedia("E02 谎言下的逃亡.png", "周骁利用谎言逃亡的结局画面"),
    },
    {
      id: "E03", type: "ending", title: "错误判断", endingKey: "wrong-judgement", speaker: "陈队长",
      content: "林峥抓住了被误认为同伙的无辜邻居，却让周骁趁混乱转移了赃物。陈队长没有替他解释，只要求他当面道歉、补全证据链：“你的问题不是心软，而是没有用事实保护别人。”周骁再次消失在雾港以外。",
      media: sceneMedia("E03 错误判断.png", "错误判断后的结局画面"),
    },
    {
      id: "E04", type: "ending", title: "暗夜回头", endingKey: "turn-back", speaker: "周骁",
      content: "周骁承认，母亲重病的故事完全是谎言。他主动交代其他盗窃案和销赃地点。林峥没有告诉他“你其实是个好人”，也没有把经历当成免罪理由：“你做过的事需要承担。你之后怎么活，是另一件事。”这是悔悟的结局，不是免罪的结局。",
      media: sceneMedia("E04 暗夜回头.png", "周骁选择回头的结局画面"),
    },
    {
      id: "E05", type: "ending", title: "码头边的救援", endingKey: "rescue-at-dock", speaker: "旁白",
      content: "周骁制造跳水假象，真正目标是让同伙带走货车底部的赃物。林峥识破了调虎离山，却先确认落水工人的位置，让救援人员下水，再由支援警力封锁货车和码头出口。周骁被依法抓获，林峥把功劳归给整个警组和救援人员。码头尽头那盏灯，照着所有人回家的路。",
      media: sceneMedia("E05 码头边的救援.png", "码头边优先救援的结局画面"),
    },
  ],
};
