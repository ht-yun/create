import type { StoryGraph } from "@/shared/story-contract";

export const legalLoanPausedGraph: StoryGraph = {
  version: 1,
  startNodeId: "L01",
  variables: [],
  nodes: [
    {
      id: "L01",
      type: "scene",
      title: "深夜的弹窗",
      speaker: "林晚",
      content:
        "凌晨一点，林晚坐在医院缴费窗口外。父亲突发住院，还差两万元押金。\n\n手机弹出一条广告：“无抵押、秒到账、只需认证身份。”客服很快发来链接：“点一下确认，钱马上到账。”\n\n页面上密密麻麻的文字里，林晚只看见“借款金额：20,000元”。她的手指停在确认按钮上。",
      choices: [
        { id: "L01-A", label: "直接确认，先拿到钱再说", targetNodeId: "L02-A", importance: "key", feedback: "确认前先看清合同和费用。" },
        { id: "L01-B", label: "核对费用、实际到账和还款总额", targetNodeId: "L02-B", importance: "key", feedback: "把金额和收费依据问清楚。" },
        { id: "L01-C", label: "把短信验证码发给客服代办", targetNodeId: "L02-C", importance: "key", feedback: "验证码可能让他人完成操作，不要交给陌生人。" },
      ],
      presentation: { transition: "dissolve", textReveal: "paragraph" },
    },
    {
      id: "L02-A",
      type: "scene",
      title: "确认之后",
      speaker: "旁白",
      content:
        "林晚确认后才翻到费用页：服务费、担保费、账户管理费合计3,600元，页面显示实际到账只有16,400元。\n\n她保存了合同页面、费用说明和转账记录。电子确认和聊天记录都可能成为认定交易事实的材料；若已经确认，也应先留存完整页面，再尽快联系平台核实合同和处理方式。",
      nextNodeId: "L03",
      presentation: { transition: "fade", textReveal: "paragraph" },
    },
    {
      id: "L02-B",
      type: "scene",
      title: "两万元，为什么到账一万六？",
      speaker: "周宁",
      content:
        "林晚要求客服说明实际到账金额、费用构成和还款总额，并把页面与聊天记录截图保存下来。客服却说：“行业惯例，合同写两万，到账少一点很正常。”\n\n周宁提醒她：如果利息预先从本金中扣除，发生民间借贷纠纷时，通常以实际出借金额认定本金。收费项目也要看清楚依据、算法和总额，别让模糊的说明替代合同条款。",
      nextNodeId: "L03",
      presentation: { transition: "dissolve", textReveal: "paragraph" },
    },
    {
      id: "L02-C",
      type: "scene",
      title: "验证码不是代办口令",
      speaker: "旁白",
      content:
        "林晚差点把验证码发出去。周宁马上提醒她：验证码可能用于登录、确认合同或进行其他账户操作，不要交给陌生客服。\n\n如果已经发出，应尽快联系相关平台或银行核实账户与交易情况，修改凭据并保存对话和短信记录。林晚没有继续操作，先把借款页面和客服信息留了下来。",
      nextNodeId: "L03",
      presentation: { transition: "dissolve", textReveal: "paragraph" },
    },
    {
      id: "L03",
      type: "scene",
      title: "通讯录权限",
      speaker: "林晚",
      content:
        "客服随后要求开启通讯录、相册和位置权限：“不开权限，就无法放款。”\n\n林晚发现这些权限和借款金额、还款期限一样，都值得先问清楚。她和周宁商量下一步。",
      choices: [
        { id: "L03-A", label: "全部授权，先把钱拿到手", targetNodeId: "L04-A", importance: "key", feedback: "授权前应了解收集目的、范围和必要性。" },
        { id: "L03-B", label: "拒绝非必要授权，改找正规渠道求助", targetNodeId: "L04-B", importance: "key", feedback: "先保护个人信息，再比较求助渠道。" },
        { id: "L03-C", label: "删除页面和聊天记录，免得麻烦", targetNodeId: "L04-C", importance: "key", feedback: "纠纷发生时，记录可能帮助还原事实。" },
      ],
      presentation: { transition: "dissolve", textReveal: "paragraph" },
    },
    {
      id: "L04-A",
      type: "ending",
      title: "授权之前，再看一眼",
      endingKey: "review-permissions",
      speaker: "旁白",
      content:
        "林晚暂时开启了权限，但心里仍不踏实。周宁建议她查看授权说明、收集目的和范围，能关闭的非必要权限及时关闭，并保存合同与收费页面。\n\n是否授权应结合具体用途和平台说明判断；遇到与服务明显不相称的索取，可以先暂停、询问或换一个正规渠道。拿到借款不等于所有条款和数据处理方式都无需核实。",
      presentation: { transition: "fade", textReveal: "paragraph" },
    },
    {
      id: "L04-B",
      type: "ending",
      title: "保住选择权",
      endingKey: "keep-control",
      speaker: "旁白",
      content:
        "林晚拒绝继续提交通讯录，没有把验证码交给客服，也保存了合同页面、费用明细、转账信息和聊天记录。她转向正规金融机构与亲友求助，终于补齐了住院押金。\n\n几周后，她听说这家平台被多人投诉恶意催收和不当使用通讯录。林晚庆幸那天按下了暂停键：核对信息不是放弃求助，而是为自己多留一条安全的路。",
      presentation: { transition: "dissolve", textReveal: "paragraph" },
    },
    {
      id: "L04-C",
      type: "ending",
      title: "别急着清空证据",
      endingKey: "preserve-records",
      speaker: "周宁",
      content:
        "聊天记录被删掉后，林晚一时说不清客服承诺过什么。她重新找到短信、银行流水和浏览器记录，尽量拼回事情经过。\n\n合同、费用说明、转账凭证、客服聊天和平台链接都可能帮助还原交易事实。遇到疑似诈骗、暴力催收或隐私侵害，可以向相关平台、监管部门或公安机关反映；具体争议也可以咨询律师。",
      presentation: { transition: "fade", textReveal: "paragraph" },
    },
  ],
};
