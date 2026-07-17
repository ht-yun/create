import type { StoryGraph } from "../../../shared/story-contract.js";

export const rainVisitorGraph: StoryGraph = {
  version: 1,
  startNodeId: "rain-start",
  variables: [
    { key: "trust", label: "信任", type: "number", initialValue: 0, min: -5, max: 10 },
    { key: "fear", label: "恐惧", type: "number", initialValue: 1, min: 0, max: 10 },
  ],
  nodes: [
    {
      id: "rain-start", type: "scene", title: "雨夜叩门", speaker: "旁白",
      content: "子夜，雨水把竹影压在窗纸上。第三次叩门声落下时，一个陌生人的声音从门外传来：‘我只借一盏灯。’",
      position: { x: 0, y: 80 },
      choices: [
        { id: "open", label: "打开门，让他进来", targetNodeId: "rain-room", changes: [{ key: "trust", operation: "add", value: 2 }] },
        { id: "watch", label: "先从窗缝观察", targetNodeId: "rain-watch", changes: [{ key: "fear", operation: "add", value: 2 }] },
      ],
    },
    {
      id: "rain-watch", type: "scene", title: "窗外的人", speaker: "旁白",
      content: "斗笠下是一张被雨水洗得苍白的脸。他没有兵器，怀里却护着一封写有你名字的旧信。",
      position: { x: 260, y: 220 },
      choices: [
        { id: "ask-letter", label: "隔门问那封信从何而来", targetNodeId: "rain-truth", changes: [{ key: "trust", operation: "add", value: 1 }] },
        { id: "refuse", label: "熄灯，不再回应", targetNodeId: "rain-alone", changes: [{ key: "fear", operation: "add", value: 2 }] },
      ],
    },
    {
      id: "rain-room", type: "scene", title: "借来的一盏灯", speaker: "沈砚",
      content: "‘你果然还住在这里。’陌生人把湿透的信放在桌上。信纸边缘有你失踪多年的兄长留下的暗记。",
      position: { x: 260, y: 20 },
      choices: [
        { id: "believe", label: "相信他，请他讲完", targetNodeId: "rain-truth", changes: [{ key: "trust", operation: "add", value: 3 }, { key: "fear", operation: "subtract", value: 1 }] },
        { id: "test", label: "用只有兄长知道的问题试探", targetNodeId: "rain-test", changes: [{ key: "trust", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "rain-test", type: "scene", title: "旧日暗语", speaker: "沈砚",
      content: "他准确说出埋在后院竹根下的木匣，也说出一句你从未告诉旁人的童谣。门外忽然传来整齐的马蹄声。",
      position: { x: 520, y: 20 },
      choices: [
        { id: "hide", label: "藏起他与信件", targetNodeId: "rain-truth", changes: [{ key: "trust", operation: "add", value: 3 }] },
        { id: "hand-over", label: "开门询问追兵", targetNodeId: "rain-betrayal", changes: [{ key: "trust", operation: "subtract", value: 3 }] },
      ],
    },
    {
      id: "rain-truth", type: "ending", title: "灯下真相", speaker: "旁白", endingKey: "truth",
      content: "黎明前，你终于拼起那段被藏了十年的往事。沈砚没有等你的感谢，只把灯留在桌上。雨停时，你决定循着信中的地图出发。",
      position: { x: 800, y: 100 },
    },
    {
      id: "rain-alone", type: "ending", title: "无声长夜", speaker: "旁白", endingKey: "silence",
      content: "叩门声最终被雨吞没。第二天，门槛外只剩一封泡烂的信。墨迹散去前，你看见了兄长名字的最后一笔。",
      position: { x: 520, y: 280 },
    },
    {
      id: "rain-betrayal", type: "ending", title: "错认来客", speaker: "旁白", endingKey: "betrayal",
      content: "门开的瞬间，沈砚的神情归于平静。他把信投入火盆。多年以后你才知道，那一夜被带走的不只是一个陌生人，也是唯一能证明真相的人。",
      position: { x: 800, y: 260 },
    },
  ],
};

export const eveningBreezeGraph: StoryGraph = {
  version: 1,
  startNodeId: "breeze-start",
  variables: [
    { key: "affection", label: "好感", type: "number", initialValue: 1, min: 0, max: 10 },
    { key: "courage", label: "勇气", type: "number", initialValue: 0, min: 0, max: 10 },
  ],
  nodes: [
    {
      id: "breeze-start", type: "scene", title: "夏末站台", speaker: "旁白",
      content: "返校前的最后一班电车迟迟未到。林知夏把一只耳机递给你，歌单还停在你们高中毕业那年。",
      position: { x: 0, y: 80 },
      choices: [
        { id: "listen", label: "接过耳机，和她一起听", targetNodeId: "breeze-memory", changes: [{ key: "affection", operation: "add", value: 2 }] },
        { id: "joke", label: "笑她的歌单从没更新", targetNodeId: "breeze-joke", changes: [{ key: "courage", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "breeze-memory", type: "scene", title: "同一首歌", speaker: "林知夏",
      content: "‘不是没更新，’她望着远处的灯，‘只是有一首一直舍不得删。’晚风吹乱她的发梢，也把没说完的话送到你面前。",
      position: { x: 280, y: 20 },
      choices: [
        { id: "confess", label: "告诉她，你也一直留着这首歌", targetNodeId: "breeze-together", changes: [{ key: "courage", operation: "add", value: 3 }, { key: "affection", operation: "add", value: 2 }] },
        { id: "wait", label: "先问她为什么舍不得", targetNodeId: "breeze-question", changes: [{ key: "affection", operation: "add", value: 1 }] },
      ],
    },
    {
      id: "breeze-joke", type: "scene", title: "玩笑之后", speaker: "林知夏",
      content: "她轻轻撞了下你的肩：‘有些事情更新太快，就来不及好好告别。’广播提醒列车即将进站。",
      position: { x: 280, y: 180 },
      choices: [
        { id: "ask-stay", label: "问她能不能再陪你走一段", targetNodeId: "breeze-together", changes: [{ key: "courage", operation: "add", value: 3 }, { key: "affection", operation: "add", value: 2 }] },
        { id: "goodbye", label: "把告别藏进一句‘路上小心’", targetNodeId: "breeze-missed" },
      ],
    },
    {
      id: "breeze-question", type: "scene", title: "未寄出的答案", speaker: "林知夏",
      content: "‘因为听见它，就会想起一个人。’她没有看你。列车的光已经出现在轨道尽头，你只有几秒钟决定是否追问。",
      position: { x: 560, y: 20 },
      choices: [
        { id: "say-name", label: "轻声说出自己的名字", targetNodeId: "breeze-together", changes: [{ key: "courage", operation: "add", value: 4 }] },
        { id: "silence", label: "陪她安静听完最后一段", targetNodeId: "breeze-letter" },
      ],
    },
    {
      id: "breeze-together", type: "ending", title: "晚风替我说", speaker: "旁白", endingKey: "together",
      content: "电车到站时，你们谁也没有上车。她笑着把另一只耳机塞回你手里：‘这次歌单，我们一起更新吧。’",
      position: { x: 850, y: 20 },
    },
    {
      id: "breeze-letter", type: "ending", title: "下一封信", speaker: "旁白", endingKey: "letter",
      content: "她上车后，你在耳机盒里发现一张折得很小的便签：‘如果你也想起我，就给我写信。’这一次，故事并没有停在站台。",
      position: { x: 850, y: 150 },
    },
    {
      id: "breeze-missed", type: "ending", title: "错过一站", speaker: "旁白", endingKey: "missed",
      content: "车门合上，她隔着玻璃向你挥手。多年以后，那首歌偶尔响起，你仍会想起夏末的风和一句没有说出口的话。",
      position: { x: 560, y: 260 },
    },
  ],
};
