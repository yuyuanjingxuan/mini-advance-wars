'use strict';
// @bundle game
// ================= 状态 =================
let G=null, uid=0, aiStyleChoice='balanced'; // 主菜单选中的 AI 风格，newGame 时写入 G.aiStyle
let troopsChoice='none'; // 主菜单选中的初始部队数目档位：none/few/mid/many，newGame 时读取
let sizeChoice=10; // 主菜单选中的地图规模，默认 10（原本点击尺寸按钮即开局，现改为先选后按「开始游戏」）
let difficultyChoice='normal'; // 主菜单选中的敌方强度档位，newGame 时读取（makeUnit 按此给敌方单位 HP 加成）
const MAP_GEN_VERSION=1;
const SAVE_SCHEMA_VERSION=2;
const SAVE_KEY='mini-advance-wars-save';
const CAMPAIGN_SCHEMA_VERSION=1;
const CAMPAIGN_KEY='mini-advance-wars-campaign';
const VALID_MAP_SIZES=[8,10,12,14,16];
function createRng(seed){
  let state=seed>>>0;
  return{
    next(){state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;},
    getState(){return state>>>0;},
    setState(value){state=value>>>0;},
  };
}
function freshSeed(){
  const values=new Uint32Array(1);
  if(globalThis.crypto&&globalThis.crypto.getRandomValues)globalThis.crypto.getRandomValues(values);
  else values[0]=(Date.now()^((globalThis.performance&&performance.now?performance.now():0)*1000))>>>0;
  return values[0]>>>0;
}
function encodeMapCode(size,seed){return`MAW-M${MAP_GEN_VERSION}-${size}-${(seed>>>0).toString(16).toUpperCase().padStart(8,'0')}`;}
function decodeMapCode(code){
  const match=String(code||'').trim().toUpperCase().match(/^MAW-M(\d+)-(\d+)-([0-9A-F]{8})$/);
  if(!match||+match[1]!==MAP_GEN_VERSION||!VALID_MAP_SIZES.includes(+match[2]))return null;
  return{version:+match[1],size:+match[2],seed:parseInt(match[3],16)>>>0};
}
let mapRng=createRng(0),gameRng=createRng(0);
const mapRandom=()=>mapRng.next();
const gameRandom=()=>gameRng.next();
// 初始部队数目档位：数量 + 随机兵种池（必选步兵不计入池内数量，池内随机抽取时步兵也可能被重复抽到）
// 少=4 种非载具兵种（不含运兵车）；中=7 种（加入侦察车/火炮/运兵车，不含坦克/火箭炮）；多=全部 9 种
const TROOPS_TIERS={
  none:{count:0, pool:[]},
  few: {count:3, pool:['infantry','heavy','engineer','medic']},
  mid: {count:6, pool:['infantry','heavy','recon','artillery','engineer','medic','transport']},
  many:{count:9, pool:['infantry','heavy','recon','artillery','engineer','medic','tank','rocket','transport']},
};
// 敌方强度档位：只调敌方单位 HP 倍率，不影响我方、不影响 AI 决策风格（两者完全独立，可任意组合）
const DIFFICULTY_TIERS={
  trivial:  {hpMult:0.8, incomeMult:0.8},
  easy:     {hpMult:0.9, incomeMult:0.9},
  normal:   {hpMult:1.0, incomeMult:1.0},
  hard:     {hpMult:1.1, incomeMult:1.1},
  hell:     {hpMult:1.2, incomeMult:1.2},
  nightmare:{hpMult:1.5, incomeMult:1.5},
};
let gameModeChoice='skirmish'; // 主菜单选中的游戏模式，newGame 时写入 G.gameMode
let scenarioChoice='basics';
let missionChoice=0;
let boardFocus={x:0,y:0};
// 游戏模式：pool=null 表示遭遇战不限制兵种（沿用 TROOPS_TIERS 各档原有池子）；
// 三种对决模式限制双方（含工厂生产）只能用列出的兵种，运兵车三种对决都不开放（无战斗力，对决模式里没有意义）
const GAME_MODES={
  skirmish:      {pool:null},
  infantryDuel:  {pool:['infantry','heavy','engineer','medic']},
  armorDuel:     {pool:['recon','tank']},
  artilleryDuel: {pool:['artillery','rocket']},
  siege:         {pool:null}, // 坚守阵地不限制玩家/初始兵种池，敌方刷新兵种池单独在 SIEGE 里定义
  academy:       {pool:null},
  story:         {pool:null},
};
// 当前对局允许的兵种列表（null=不限制，返回全部 UNIT_TYPES 键）；生产菜单、初始部队随机池、AI 造兵都统一走这个函数
function allowedUnitTypes(){
  const mode=GAME_MODES[G&&G.gameMode]||GAME_MODES.skirmish;
  return mode.pool||Object.keys(UNIT_TYPES);
}
// 坚守阵地参数：敌方无 HQ/工厂（不走经济系统），每 WAVE_INTERVAL 回合按预算贪心随机刷新一波，共 TOTAL_TURNS 回合，
// 目标是活到最后；"歼灭全部敌军"在此模式下不成立（敌方会无限刷新），只能通过存活判定获胜
const SIEGE={
  totalTurns:15, waveInterval:3, budgetMin:300, budgetMax:600,
  pool:['infantry','heavy','recon','artillery','engineer','medic','tank','rocket','transport'], // 复用 many 档兵种池
  citiesByTier:{none:0,few:2,mid:3,many:4}, // 我方初始部队档位 → 额外城市数量
};
const SCENARIOS={
  basics:{title:'scBasics',objective:'scBasicsObj',size:8,seed:0xACAD0001,goal:{type:'capture',x:5,y:1},
    tiles:[[1,6,'hq'],[5,1,'city'],[3,4,'forest'],[4,4,'forest']],units:[['P','infantry',1,5],['P','infantry',2,6],['E','infantry',5,3,6]]},
  terrain:{title:'scTerrain',objective:'scTerrainObj',size:8,seed:0xACAD0002,goal:{type:'eliminate'},
    tiles:[[1,6,'hq'],[2,4,'forest'],[3,4,'forest'],[2,3,'mountain'],[4,3,'mountain']],units:[['P','heavy',1,5],['P','infantry',2,5],['E','recon',5,3],['E','tank',6,2]]},
  indirect:{title:'scIndirect',objective:'scIndirectObj',size:8,seed:0xACAD0003,goal:{type:'eliminate'},
    tiles:[[1,6,'hq'],[2,6,'forest'],[4,4,'forest']],units:[['P','artillery',1,6],['P','infantry',2,5],['E','heavy',4,6],['E','infantry',5,4],['E','tank',6,2]]},
  transport:{title:'scTransport',objective:'scTransportObj',size:8,seed:0xACAD0004,goal:{type:'capture',x:6,y:1},
    tiles:[[1,6,'hq'],[6,1,'city'],[3,5,'water'],[3,4,'plain'],[3,3,'water'],[4,2,'forest'],[5,2,'forest']],units:[['P','transport',1,5],['P','infantry',2,5],['E','infantry',5,3],['E','recon',6,2]]},
  siege:{title:'scSiege',objective:'scSiegeObj',size:8,seed:0xACAD0005,goal:{type:'survive',turns:15},
    tiles:[[1,6,'hq'],[2,6,'city'],[1,5,'factory'],[3,5,'forest'],[4,4,'forest'],[3,3,'mountain']],units:[['P','infantry',1,5],['P','heavy',2,5],['P','artillery',2,6]]},
};
const STORY_ORDER=Array.from({length:18},(_,id)=>id);
const S=(zh,en)=>({zh,en});
const MISSION_DEFS={
  0:{id:0,act:S('序章','Prologue'),title:S('第三百年的操练','The Three-Hundredth Drill'),when:S('静历三百年 三月初五 · 第七锚塔操练场','S.R. 300, Third Month, Day 5 · Anchor Seven Drill Ground'),size:8,seed:0xA5000000,aiStyle:'balanced',difficulty:'normal',economy:{income:false,playerProduction:false,enemyProduction:false},
    briefing:[["卫长庚","Wei Changgeng",S('指挥官，欢迎来到第七锚塔。按老规矩，新指挥官到任要打一场完全对等的操练。','Commander, welcome to Anchor Seven. By old custom, every new commander begins with a perfectly matched drill.')],["苏檀","Su Tan",S('档案员苏檀。提醒一句，士官长每次都说这是最后一次讲这个笑话。','Archivist Su Tan. A reminder: the sergeant major says every time that this is the last time he tells that joke.')],["卫长庚","Wei Changgeng",S('打吧。让我看看新来的指挥官会不会走路。','Let us see whether the new commander knows how to move.')]],
    objective:S('歼灭二连或占领二连总部。','Eliminate Second Company or capture its HQ.'),failure:S('我方全灭或总部被占。','All player units lost or your HQ captured.'),intel:S('二连的阵型和你完全对称。','Second Company is a perfect mirror of your formation.'),
    tiles:[[1,6,'hq','P'],[2,6,'factory','P'],[1,5,'city','P'],[6,1,'hq','E'],[5,1,'factory','E'],[6,2,'city','E'],[3,3,'forest'],[4,4,'forest']],
    units:{P:[['infantry',1,5],['infantry',2,5],['heavy',1,4],['recon',2,6]],E:'mirror'},objectives:[{kind:'eliminateOrCaptureHq'}],failures:['allDead','hqLost'],
    events:[{id:'m0-r1',on:{roundStart:1},do:[{type:'showDialog',lines:[["卫长庚","Wei Changgeng",S('蓝格可以移动，红框是当前能攻击的目标。步兵类站上建筑后可以执行占领。','Blue tiles show movement; red outlines mark targets. Foot units can capture buildings.')]]}]},{id:'m0-r3',on:{roundStart:3},do:[{type:'showDialog',lines:[["苏檀","Su Tan",S('指挥官，锚塔的钟响了。','Commander, the Anchor Tower bell is ringing.')],["卫长庚","Wei Changgeng",S('那口钟挂了三百年，从来没响过。','That bell has hung there for three hundred years. It has never rung.')]]}]}],
    debrief:S('操练结束得很快，但东边哨所报告：边境线外出现了一支没有旗帜、不回应呼叫的部队。天快亮时，那支部队开始移动了。','The drill ended quickly, but the eastern outpost reported an unmarked force beyond the border. Near dawn, it began to move.')},
  3:{id:3,act:S('第一幕 · 静默之后','Act I · After the Silence'),title:S('越界','Crossing the Line'),when:S('静历三百年 三月初八 · 衡朔边境','S.R. 300, Third Month, Day 8 · Heng–Shuo Border'),size:12,seed:0xA5000003,aiStyle:'defensive',difficulty:'normal',economy:{income:false,playerProduction:false,enemyProduction:false},
    briefing:[["严峥","Yan Zheng",S('命令：越过边境，拿下朔国第三前哨。','Orders: cross the border and take Shuo Third Outpost.')],["卫长庚","Wei Changgeng",S('元帅，越界意味着三百年来第一次对别的国家开战。','Marshal, crossing the line means the first war between nations in three hundred years.')],["严峥","Yan Zheng",S('我知道。这是命令。','I know. That is an order.')]],
    objective:S('占领朔国第三前哨总部。','Capture Shuo Third Outpost HQ.'),failure:S('我方全灭或总部被占。','All player units lost or your HQ captured.'),intel:S('朔军据险防守；第 4 回合局势可能改变。','Shuo is entrenched; the situation may change on round 4.'),
    tiles:[[1,10,'hq','P'],[2,10,'factory','P'],[10,1,'hq','E'],[9,1,'city','E'],[10,2,'city','E'],[7,1,'forest'],[8,1,'mountain'],[6,2,'forest'],[7,2,'forest'],[8,2,'mountain'],[7,3,'water'],[8,3,'plain'],[9,3,'water'],[6,3,'water'],[5,3,'water']],
    units:{P:[['infantry',1,9],['infantry',2,9],['infantry',2,10],['heavy',1,8],['heavy',2,8],['tank',3,9],['artillery',3,10]],E:[['tank',10,2,{rank:'hero',characterId:'huoLan',missionRef:'huoLan',level:3,criticalRule:'holdAtOneHp'}],['infantry',9,2],['infantry',10,3],['infantry',8,2],['artillery',9,3]]},objectives:[{kind:'captureHq'}],failures:['allDead','hqLost'],
    events:[{id:'m3-r1',on:{roundStart:1},do:[{type:'showDialog',lines:[["霍岚","Huo Lan",S('衡国的指挥官，你越界了。退回去，我不想开第一枪。','Heng commander, you crossed the line. Turn back. I do not want to fire the first shot.')]]}]},{id:'m3-r4',on:{roundStart:4},do:[{type:'removeUnits',factionTag:'shuo'},{type:'spawnMirror'},{type:'setAiStyle',value:'balanced'},{type:'setObjective',value:{kind:'eliminate'}},{type:'showDialog',lines:[["霍岚","Huo Lan",S('你也看见了？那些东西是冲着你来的。朔国撤了。','You see them too? Those things came for you. Shuo is withdrawing.')],["苏檀","Su Tan",S('协议记录了一次镜像事件。它复制的是我们。','The Accord recorded a mirror event. It copied us.')]]}]}],debrief:S('朔国撤走后，苏檀确认镜像部队出现的时刻与我军越界只差十一秒。严峥的电报只有三个字：做得好。','After Shuo withdrew, Su Tan confirmed the mirror force appeared eleven seconds after the crossing. Yan Zheng sent only three words: well done.')},
  6:{id:6,act:S('第二幕 · 镜子里的国家','Act II · The Nation in the Mirror'),title:S('第七营','The Seventh Battalion'),when:S('静历三百年 三月二十 · 第七锚塔西侧山地','S.R. 300, Third Month, Day 20 · Western Mountains'),size:14,seed:0xA5000006,aiStyle:'balanced',difficulty:'normal',economy:{income:false,playerProduction:false,enemyProduction:false},
    briefing:[["卫长庚","Wei Changgeng",S('敌人第一次打出了旗号：衡国第七营。那是三百年前的番号。','For the first time, the enemy raised a banner: Heng Seventh Battalion, a designation three centuries old.')],["苏檀","Su Tan",S('他们的指挥官叫卫苍。','Their commander calls himself Wei Cang.')],["卫长庚","Wei Changgeng",S('我家族谱第一页就是这个名字。指挥官，这一仗我得上。','That name is on the first page of my family register. Commander, I must fight this battle.')]],
    objective:S('击败卫苍。','Defeat Wei Cang.'),failure:S('卫长庚阵亡；我方全灭；总部被占。','Wei Changgeng defeated; all player units lost; or your HQ captured.'),intel:S('卫苍是卫长庚的镜像。','Wei Cang replaces Wei Changgeng in the mirrored force.'),
    tiles:[[1,12,'hq','P'],[12,1,'hq','E'],[2,12,'factory','P'],[11,1,'factory','E'],[4,4,'mountain'],[5,4,'mountain'],[6,4,'mountain'],[7,9,'mountain'],[8,9,'mountain'],[9,9,'mountain'],[3,7,'forest'],[4,7,'forest'],[9,6,'forest'],[10,6,'forest']],
    units:{P:[['heavy',1,11,{rank:'hero',characterId:'weiChanggeng',missionRef:'weiChanggeng',level:3,criticalRule:'failOnDefeat'}],['infantry',2,11],['infantry',1,10],['infantry',2,10],['heavy',3,11],['artillery',3,12],['medic',1,12],['engineer',3,10]],E:'mirror',mirrorReplace:{weiChanggeng:{type:'heavy',rank:'boss',characterId:'weiCang',missionRef:'weiCang',level:3,criticalRule:'retreatOnDefeat'}}},objectives:[{kind:'defeatUnit',unitRef:'weiCang'}],failures:[{kind:'unitDefeated',unitRef:'weiChanggeng'},'allDead','hqLost'],
    events:[{id:'m6-r1',on:{roundStart:1},do:[{type:'showDialog',lines:[["卫苍","Wei Cang",S('第七营卫苍在此。你们是哪一路的援军，为什么不回应军令？','Wei Cang of the Seventh Battalion. Which relief force are you, and why do you ignore orders?')]]}]},{id:'m6-r4',on:{roundStart:4},do:[{type:'showDialog',lines:[["卫长庚","Wei Changgeng",S('卫苍！我是卫家第十二代，卫长庚！','Wei Cang! I am Wei Changgeng, twelfth generation of the Wei family!')],["卫苍","Wei Cang",S('我没有第十二代。我儿子还不到三岁。','There is no twelfth generation. My son is not yet three.')]]}]}],debrief:S('苏檀核对了旗号与阵亡名册：他们不是复制品，而是三百年前真正的第七营。我们之所以与他们一样，是因为边境军团照着他们的手册操练了三百年。','Su Tan checked the banner and casualty rolls: they are not copies, but the true Seventh Battalion from three centuries ago. We mirror them because the Marchguard trained from their manual for three hundred years.')},
};
// Compact declarative builders keep the full campaign catalog readable while the
// resulting mission objects remain plain serializable data.
const storyEconomy=(income=false,playerProduction=false,enemyProduction=false)=>({income,playerProduction,enemyProduction});
const storyTiles=(size,extra=[])=>[[1,size-2,'hq','P'],[2,size-2,'factory','P'],[1,size-3,'city','P'],[size-2,1,'hq','E'],[size-3,1,'factory','E'],[size-2,2,'city','E'],[Math.floor(size/2)-1,Math.floor(size/2),'forest'],[Math.floor(size/2),Math.floor(size/2)-1,'forest'],...extra];
const STORY_EN={
  '第一幕 · 静默之后':'Act I · After the Silence','第二幕 · 镜子里的国家':'Act II · The Nation in the Mirror','第三幕 · 创立者手稿':'Act III · The Founder’s Manuscript','第四幕 · 灰烬之环':'Act IV · The Ashen Ring',
  '寻常的早晨':'An Ordinary Morning','对称的敌人':'The Symmetrical Enemy','截获的低语':'Intercepted Whispers','装甲条款':'The Armor Clause','镜子里的国家':'The Nation in the Mirror','坚壁':'Stonewall','两个边境':'Two Borders','创立者手稿':'The Founder’s Manuscript','叛军':'The Mutineers','誓词':'The Oath','第七阶段':'Phase Seven','十二锚点':'The Twelve Anchors','镜中人':'The Person in the Mirror','大元帅':'The Grand Marshal','灰烬之环':'The Ashen Ring',
  '指挥官，任务开始。':'Commander, the operation begins.','他们站的位置跟咱们一模一样。':'They are standing in exactly the same places as we are.','第七营……不退。':'The Seventh Battalion… does not retreat.','接上了。信号很弱，给我时间。':'Connected. The signal is weak; give me time.','协议已确认非对称。执行第七阶段。署名：闻。':'The Accord confirms the asymmetry. Execute Phase Seven. Signed: Wen.','对面比我们多两辆坦克。':'They have two more tanks than we do.','那是严峥元帅的私人旗。撤回来！':'That is Marshal Yan Zheng’s personal banner. Fall back!','我欠你一次。朔国人记账很清楚。':'I owe you one. People of Shuo keep careful accounts.','我不是来求原谅的。我只是来开门。':'I did not come to ask forgiveness. I came to open the door.','闸门到手了。让我站上去。':'The gate is ours. Let me take the watch.','那就让我看看，你想要什么结局。':'Then let me see what ending you want.'
};
const storyText=(zh)=>S(zh,STORY_EN[zh]||zh);
const storyBriefing=(speaker,english,line)=>[[speaker,english,storyText(line)]];
const storyMission=(id,act,title,size,units,extra={})=>{const localizedAct=storyText(act),localizedTitle=storyText(title);return{id,act:localizedAct,title:localizedTitle,when:S(`静历三百年 · ${title}`,`S.R. 300 · ${localizedTitle.en}`),size,seed:(0xA5000000+id)>>>0,aiStyle:'balanced',difficulty:'normal',economy:storyEconomy(),briefing:storyBriefing('卫长庚','Wei Changgeng','指挥官，任务开始。'),objective:S('完成主要目标。','Complete the primary objective.'),failure:S('我方全灭或总部被占。','All player units lost or your HQ captured.'),intel:S('任务设施和人物状态会改变战局。','Mission facilities and character state can change the battle.'),tiles:storyTiles(size),units,objectives:[{kind:'eliminateOrCaptureHq'}],failures:['allDead','hqLost'],events:[],debrief:S('战斗结束了，但灰烬之环的谜团仍在延伸。','The battle is over, but the mystery of the Ashen Ring continues.'),...extra};};
Object.assign(MISSION_DEFS,{
  1:storyMission(1,'第一幕 · 静默之后','寻常的早晨',10,{P:[['infantry',1,7],['infantry',2,7],['heavy',1,6],['artillery',2,8]],E:'mirror'},{difficulty:'trivial',tiles:storyTiles(10,[[4,0,'water'],[4,1,'water'],[4,3,'water'],[4,4,'plain'],[4,5,'water'],[4,7,'water'],[5,2,'forest'],[5,7,'forest']]),objectives:[{kind:'eliminate'}],events:[{id:'m1-r2',on:{roundStart:2},do:[{type:'showDialog',lines:storyBriefing('卫长庚','Wei Changgeng','他们站的位置跟咱们一模一样。')}]},{id:'m1-first',on:{firstEnemyDefeated:true},do:[{type:'appendBattleLog',value:S('被击毁的敌军化成了灰。','The destroyed enemy turns to ash.')}]}]}),
  2:storyMission(2,'第一幕 · 静默之后','对称的敌人',12,{P:[['infantry',1,9],['infantry',2,9],['infantry',3,9],['heavy',1,8],['recon',2,8],['medic',3,8]],E:'mirror',extraE:[['infantry',9,2,{rank:'elite',missionRef:'officer',level:3,criticalRule:'retreatOnDefeat'}]]},{difficulty:'easy',tiles:storyTiles(12,[[4,7,'city','P',{tag:'villageA'}],[5,7,'city','P',{tag:'villageB'}],[6,7,'city','P',{tag:'villageC'}],[7,4,'city','E'],[6,4,'city','E'],[5,4,'city','E'],[5,5,'mountain'],[6,5,'mountain']]),objectives:[{kind:'defeatUnit',unitRef:'officer'}],failures:[{kind:'allTagsLost',tags:['villageA','villageB','villageC']},'allDead','hqLost'],events:[{id:'m2-officer-low',on:{unitHpBelow:{unitRef:'officer',ratio:.5}},do:[{type:'showDialog',lines:storyBriefing('敌方军官','Enemy Officer','第七营……不退。')}]}]}),
  4:storyMission(4,'第一幕 · 静默之后','截获的低语',12,{P:[['engineer',1,9],['engineer',2,9],['infantry',3,9],['infantry',1,8],['heavy',2,8],['artillery',3,8],['recon',2,10]],E:'mirror'},{aiStyle:'aggressive',tiles:storyTiles(12,[[6,6,'city',null,{tag:'relay',label:'中继站',icon:'📡'}],[5,6,'forest'],[7,6,'forest']]),objectives:[{kind:'captureAndHold',tag:'relay',rounds:3}],failures:[{kind:'tagLostBeforeObjective',tag:'relay'},'allDead','hqLost'],events:[{id:'m4-cap',on:{capture:{tag:'relay',toOwner:'P'}},do:[{type:'showDialog',lines:storyBriefing('苏檀','Su Tan','接上了。信号很弱，给我时间。')}]},{id:'m4-h1',on:{tagHeldRoundEnd:{tag:'relay',count:1}},do:[{type:'appendBattleLog',value:S('……阈值……东北方向……超出……','…threshold… northeast… exceeded…')}]},{id:'m4-h2',on:{tagHeldRoundEnd:{tag:'relay',count:2}},do:[{type:'appendBattleLog',value:S('……第六阶段……锚塔七……补偿……','…phase six… Anchor Seven… compensation…')}]},{id:'m4-h3',on:{tagHeldRoundEnd:{tag:'relay',count:3}},do:[{type:'showDialog',lines:storyBriefing('苏檀','Su Tan','协议已确认非对称。执行第七阶段。署名：闻。')}]}]}),
  5:storyMission(5,'第二幕 · 镜子里的国家','装甲条款',12,{P:[['tank',1,9],['tank',2,9],['recon',1,8],['recon',2,8]],E:'mirror',extraP:[['tank',3,9,{rank:'elite',factionTag:'greyFlag'}],['tank',3,8,{rank:'elite',factionTag:'greyFlag'}]],extraE:[['tank',9,2],['tank',8,2]]},{aiStyle:'defensive',rule:{actionTypes:['tank','recon']},tiles:storyTiles(12,[[5,4,'water'],[5,5,'plain'],[5,6,'water'],[6,4,'water'],[6,6,'plain']]),events:[{id:'m5-r3',on:{roundStart:3},do:[{type:'showDialog',lines:storyBriefing('苏檀','Su Tan','对面比我们多两辆坦克。')}] }]}),
  7:storyMission(7,'第二幕 · 镜子里的国家','镜子里的国家',14,{P:[['recon',1,11,{missionRef:'reconA'}],['recon',2,11,{missionRef:'reconB'}],['transport',1,10],['infantry',2,10],['infantry',3,10],['heavy',1,9]],E:[['tank',12,2,{rank:'boss',characterId:'qiuYe',missionRef:'qiuYe',level:4}],['tank',11,2],['rocket',12,3],['infantry',10,3],['infantry',11,3],['infantry',12,4],['infantry',10,4],['heavy',11,4]]},{aiStyle:'defensive',difficulty:'hard',economy:storyEconomy(true,false,true),tiles:storyTiles(14,[[8,6,'mountain',null,{tag:'lookout',label:'观测点'}],[5,8,'water'],[6,7,'water'],[7,6,'water']]),objectives:[{kind:'unitOnTag',tag:'lookout',unitTypes:['recon']}],failures:[{kind:'allUnitsDefeated',refs:['reconA','reconB']},'allDead'],events:[{id:'m7-lookout',on:{unitEnterTag:{tag:'lookout',unitTypes:['recon']}},do:[{type:'setObjective',value:{kind:'unitOnTag',tag:'home',unitTypes:['recon']}},{type:'setAiStyle',value:'aggressive'},{type:'showDialog',lines:storyBriefing('苏檀','Su Tan','那是严峥元帅的私人旗。撤回来！')}]}]}),
  8:storyMission(8,'第二幕 · 镜子里的国家','坚壁',10,{P:[['infantry',1,7],['infantry',2,7],['heavy',1,6],['heavy',2,6],['artillery',3,8],['engineer',2,8],['medic',3,7]],E:[]},{difficulty:'hard',tiles:storyTiles(10,[[0,6,'mountain'],[0,7,'mountain'],[2,6,'mountain'],[4,5,'mountain']]),objectives:[{kind:'survive',round:15}],waves:{interval:3,spawns:[[8,1],[9,1],[8,2]],types:['infantry','heavy','recon','artillery','tank'],count:3},events:[{id:'m8-r5',on:{roundEnd:5},do:[{type:'appendBattleLog',value:S('锚塔发出一段未经授权的加密信号。','The Anchor Tower emits an unauthorized encrypted signal.')}]}]}),
  9:storyMission(9,'第二幕 · 镜子里的国家','两个边境',14,{P:[['infantry',1,11],['infantry',2,11],['heavy',1,10],['heavy',2,10],['tank',3,11],['artillery',3,10],['transport',2,12],['medic',1,12],['heavy',3,12,{rank:'hero',characterId:'weiChanggeng',missionRef:'weiChanggeng',level:3}]],E:'mirror',extraP:[['tank',7,4,{rank:'hero',characterId:'huoLan',missionRef:'huoLan',level:3,hpRatio:.6,locked:true,factionTag:'shuo'}],['tank',8,4,{hpRatio:.5,locked:true,factionTag:'shuo'}]],extraE:[['infantry',7,3,{factionTag:'oldArmyRemnants'}],['infantry',8,3,{factionTag:'oldArmyRemnants'}],['heavy',7,2,{factionTag:'oldArmyRemnants'}]]},{aiStyle:'aggressive',difficulty:'hard',tiles:storyTiles(14,[[7,4,'city','P',{tag:'rescue'}],[6,4,'plain',null,{tag:'rescue'}],[8,4,'plain',null,{tag:'rescue'}]]),objectives:[{kind:'unitOnTag',tag:'rescue'}],failures:[{kind:'unitDefeated',unitRef:'huoLan'},'allDead','hqLost'],events:[{id:'m9-rescue',on:{unitEnterTag:{tag:'rescue'}},do:[{type:'unlockUnit',unitRef:'huoLan'},{type:'setObjective',value:{kind:'eliminateOrSurvive',round:16}},{type:'showDialog',lines:storyBriefing('霍岚','Huo Lan','我欠你一次。朔国人记账很清楚。')}]}]}),
  10:storyMission(10,'第三幕 · 创立者手稿','创立者手稿',14,{P:[['infantry',1,11],['infantry',2,11],['heavy',1,10],['tank',2,10],['artillery',3,11],['recon',3,10],['transport',1,12],['heavy',2,12,{rank:'hero',characterId:'weiChanggeng',missionRef:'weiChanggeng',level:3}],['tank',3,12,{rank:'hero',characterId:'huoLan',missionRef:'huoLan',level:3}]],E:[['tank',12,2,{rank:'boss',characterId:'qiuYe',missionRef:'qiuYe',level:4}],['tank',11,2],['infantry',10,2],['infantry',11,3],['infantry',12,3],['engineer',10,3],['rocket',12,4]]},{aiStyle:'aggressive',difficulty:'hard',tiles:storyTiles(14,[[9,7,'city',null,{tag:'archive',label:'旧档案馆',icon:'📜'}],[7,7,'forest'],[8,7,'forest'],[10,7,'forest']]),objectives:[{kind:'captureAndHold',tag:'archive',rounds:1}],failures:[{kind:'deadline',round:11,tag:'archive'},'allDead','hqLost'],events:[{id:'m10-su',on:{roundStart:3},do:[{type:'spawnUnits',side:'P',units:[['engineer',6,7,{rank:'hero',characterId:'suTan',missionRef:'suTan',level:2,criticalRule:'retreatAtOneHp'}]]},{type:'showDialog',lines:storyBriefing('苏檀','Su Tan','我不是来求原谅的。我只是来开门。')}]}]}),
  11:storyMission(11,'第三幕 · 创立者手稿','叛军',14,{P:[['heavy',1,11,{rank:'hero',characterId:'weiChanggeng',missionRef:'weiChanggeng',level:3,traits:['weiChanggeng']}],['tank',2,11,{rank:'hero',characterId:'huoLan',missionRef:'huoLan',level:3}],['engineer',3,11,{rank:'hero',characterId:'suTan',missionRef:'suTan',level:2}],['infantry',1,10],['infantry',2,10],['heavy',3,10],['heavy',1,9],['artillery',2,9],['rocket',3,9],['medic',1,12]],E:[['tank',12,2,{rank:'boss',characterId:'qiuYe',missionRef:'qiuYe',level:4}],['tank',11,2],['heavy',10,2],['heavy',11,3],['infantry',12,3],['infantry',10,3],['infantry',12,4],['artillery',11,4],['artillery',10,4]]},{aiStyle:'aggressive',difficulty:'hell',economy:storyEconomy(true,true,true),objectives:[{kind:'eliminateOrSurvive',round:12}],failures:[{kind:'unitDefeated',unitRef:'weiChanggeng'},'allDead','hqLost'],events:[{id:'m11-qiu-retreat',on:{unitHpBelow:{unitRef:'qiuYe',ratio:.3}},do:[{type:'retreatUnit',unitRef:'qiuYe'},{type:'winMission',how:'retreat'}]}]}),
  12:storyMission(12,'第三幕 · 创立者手稿','誓词',14,{P:[['heavy',1,11,{rank:'hero',characterId:'weiChanggeng',missionRef:'weiChanggeng',level:3}],['infantry',2,11],['infantry',3,11],['infantry',1,10],['heavy',2,10],['medic',3,10],['medic',1,9],['artillery',2,9]],E:'mirror',mirrorReplace:{weiChanggeng:{type:'heavy',rank:'boss',characterId:'weiCang',missionRef:'weiCang',level:4,criticalRule:'protectedFailAtOneHp',locked:true}}},{aiStyle:'defensive',tiles:storyTiles(14,[[11,2,'city','E',{tag:'weiCang'}],[10,2,'plain',null,{tag:'weiCang'}],[11,3,'plain',null,{tag:'weiCang'}],[12,2,'plain',null,{tag:'weiCang'}]]),objectives:[{kind:'unitOnTag',tag:'weiCang',unitRef:'weiChanggeng'}],failures:[{kind:'unitDefeated',unitRef:'weiChanggeng'},{kind:'unitDefeated',unitRef:'weiCang'},'allDead'],events:[{id:'m12-near',on:{unitEnterTag:{tag:'weiCang',unitRef:'weiChanggeng'}},do:[{type:'winMission',how:'escort'}]}]}),
  13:storyMission(13,'第三幕 · 创立者手稿','第七阶段',16,{P:[['artillery',1,13],['artillery',2,13],['artillery',3,13],['rocket',1,12],['rocket',2,12]],E:'mirror'},{aiStyle:'defensive',difficulty:'hell',rule:{attackTypes:['artillery','rocket']},tiles:storyTiles(16,[[8,1,'water'],[8,2,'water'],[8,3,'plain'],[8,4,'water'],[8,5,'water'],[8,6,'water'],[8,7,'water'],[8,8,'water'],[8,9,'water'],[8,10,'water'],[8,11,'plain'],[8,12,'water']]),objectives:[{kind:'defeatUnit',unitRef:'qiuYe'}],events:[{id:'m13-qiu',on:{roundStart:1},do:[{type:'spawnUnits',side:'E',units:[['rocket',13,3,{rank:'boss',characterId:'qiuYe',missionRef:'qiuYe',level:4}]]}]}]}),
  14:storyMission(14,'第四幕 · 灰烬之环','十二锚点',14,{P:[['heavy',1,11,{rank:'hero',characterId:'weiChanggeng',missionRef:'weiChanggeng',level:3}],['engineer',2,11,{rank:'hero',characterId:'suTan',missionRef:'suTan',level:2}],['infantry',3,11],['infantry',1,10],['infantry',2,10],['heavy',3,10],['medic',1,9],['medic',2,9]],E:'mirror'},{aiStyle:'aggressive',difficulty:'hard',rule:{immobileTypes:['recon','tank','artillery','rocket','transport']},tiles:storyTiles(14,[[7,7,'city',null,{tag:'gate',label:'外环闸门',icon:'🚪'}],[6,7,'mountain'],[8,7,'mountain']]),objectives:[{kind:'survive',round:12}],failures:[{kind:'unitDefeated',unitRef:'weiChanggeng'},{kind:'tagLostBeforeObjective',tag:'gate'},{kind:'deadline',round:12,flag:'gateRelieved',value:true},'allDead'],events:[{id:'m14-gate',on:{capture:{tag:'gate',toOwner:'P'}},do:[{type:'showDialog',lines:storyBriefing('卫长庚','Wei Changgeng','闸门到手了。让我站上去。')}]}]}),
  15:storyMission(15,'第四幕 · 灰烬之环','镜中人',16,{P:[['engineer',1,13,{rank:'hero',characterId:'suTan',missionRef:'suTan',level:2}],['tank',2,13,{rank:'hero',characterId:'huoLan',missionRef:'huoLan',level:3}],['infantry',3,13],['infantry',1,12],['heavy',2,12],['heavy',3,12],['tank',1,11],['artillery',2,11],['rocket',3,11],['medic',1,10]],E:'mirror'},{aiStyle:'balanced',difficulty:'hell',objectives:[{kind:'eliminateOrCaptureHq'}]}),
  16:storyMission(16,'第四幕 · 灰烬之环','大元帅',16,{P:[['engineer',1,13,{rank:'hero',characterId:'suTan',missionRef:'suTan',level:2}],['tank',2,13,{rank:'hero',characterId:'huoLan',missionRef:'huoLan',level:3}],['infantry',3,13],['infantry',1,12],['infantry',2,12],['heavy',3,12],['heavy',1,11],['tank',2,11],['tank',3,11],['artillery',1,10],['rocket',2,10],['engineer',3,10]],E:[['tank',14,1,{rank:'boss',characterId:'yanZheng',missionRef:'yanZheng',level:5}],['tank',13,2],['tank',14,2],['heavy',12,2],['heavy',13,3],['rocket',14,3],['rocket',12,3],['artillery',13,4],['infantry',14,4],['infantry',12,4]]},{aiStyle:'defensive',difficulty:'hell',economy:storyEconomy(true,true,true),objectives:[{kind:'defeatUnit',unitRef:'yanZheng'}],events:[{id:'m16-half',on:{unitHpBelow:{unitRef:'yanZheng',ratio:.5}},do:[{type:'setAiStyle',value:'aggressive'},{type:'showDialog',lines:storyBriefing('严峥','Yan Zheng','那就让我看看，你想要什么结局。')}]}]}),
  17:storyMission(17,'第四幕 · 灰烬之环','灰烬之环',16,{P:[['engineer',1,13,{rank:'hero',characterId:'suTan',missionRef:'suTan',level:2}],['tank',2,13,{rank:'hero',characterId:'huoLan',missionRef:'huoLan',level:3}],['infantry',3,13],['infantry',1,12],['infantry',2,12],['heavy',3,12],['heavy',1,11],['tank',2,11],['tank',3,11],['artillery',1,10],['rocket',2,10],['medic',3,10],['engineer',1,9]],E:'mirror'},{aiStyle:'aggressive',difficulty:'nightmare',tiles:storyTiles(16,[[13,2,'hq','E',{tag:'core',label:'核心',icon:'💠'}],[12,2,'mountain'],[14,2,'mountain'],[13,1,'mountain'],[13,3,'mountain']]),objectives:[{kind:'survive',round:14,ending:'ring'}],waves:{interval:3,spawns:[[0,0],[15,0],[0,15],[15,15]],types:['infantry','heavy','tank','artillery','rocket'],count:4},events:[{id:'m17-core',on:{unitEnterTag:{tag:'core'}},do:[{type:'appendBattleLog',value:S('闻渊：你想好了吗？','Wen Yuan: Have you decided?')}]}]})
});
const txt=value=>value&&typeof value==='object'?(value[LANG]||value.zh):String(value||'');
function defaultCampaignProgress(){return{schemaVersion:CAMPAIGN_SCHEMA_VERSION,unlocked:[0],completed:[],endings:[],best:{},lastMission:0};}
function readCampaignProgress(){
  try{const p=JSON.parse(localStorage.getItem(CAMPAIGN_KEY));if(!p||p.schemaVersion!==CAMPAIGN_SCHEMA_VERSION||!Array.isArray(p.unlocked)||!Array.isArray(p.completed))return defaultCampaignProgress();return p;}catch(e){return defaultCampaignProgress();}
}
function saveCampaignProgress(p){try{localStorage.setItem(CAMPAIGN_KEY,JSON.stringify(p));}catch(e){}}
function completeCampaignMission(id,turns,losses){
  const p=readCampaignProgress();if(!p.completed.includes(id))p.completed.push(id);
  const next=STORY_ORDER[STORY_ORDER.indexOf(id)+1];if(next!==undefined&&!p.unlocked.includes(next))p.unlocked.push(next);
  const ending=G?.resultHow;
  if(id===17&&['ash','ring'].includes(ending)&&!p.endings.includes(ending))p.endings.push(ending);
  const old=p.best[id];if(!old||turns<old.turns||(turns===old.turns&&losses<old.losses))p.best[id]={turns,losses};
  p.lastMission=next===undefined?id:next;saveCampaignProgress(p);return p;
}
function updateScenarioMenu(){
  const picker=document.getElementById('scenarioPicker');if(!picker)return;
  const fixedStory=gameModeChoice==='story';
  document.getElementById('mapSettings').hidden=fixedStory;
  const advanced=document.getElementById('advancedSettings');advanced.hidden=fixedStory;if(fixedStory)advanced.open=false;
  picker.style.display=['academy','story'].includes(gameModeChoice)?'block':'none';
  if(gameModeChoice==='story'){
    const progress=readCampaignProgress();picker.setAttribute('aria-label',T('storyScenarioLabel'));
    picker.innerHTML=STORY_ORDER.map(id=>{const m=MISSION_DEFS[id],open=progress.unlocked.includes(id),done=progress.completed.includes(id);return`<option value="${id}"${id===missionChoice?' selected':''}${open?'':' disabled'}>${id}. ${txt(m.title)}${done?' — '+T('storyCompleted'):open?'':' — '+T('storyLocked')}</option>`;}).join('');
  }else{
    picker.setAttribute('aria-label',T('scenarioLabel'));
    picker.innerHTML=Object.entries(SCENARIOS).map(([id,s])=>`<option value="${id}"${id===scenarioChoice?' selected':''}>${T(s.title)} — ${T(s.objective)}</option>`).join('');
  }
}
function updateScenarioBanner(){
  const banner=document.getElementById('scenarioBanner'),s=G&&G.scenario&&SCENARIOS[G.scenario.id],m=G&&G.gameMode==='story'&&MISSION_DEFS[G.story.missionId];
  if(!banner)return;
  banner.style.display=s||m?'block':'none';
  if(s){document.getElementById('scenarioTitle').textContent=T(s.title);document.getElementById('scenarioObjective').textContent=T(s.objective);}
  if(m){document.getElementById('scenarioTitle').textContent=`${m.id}. ${txt(m.title)}`;document.getElementById('scenarioObjective').textContent=storyObjectiveText(m,G.story.objective);}
}
function storyObjectiveText(m,o){
  if(o.kind===m.objectives[0].kind)return txt(m.objective);
  if(o.kind==='eliminate')return LANG==='zh'?'歼灭镜像部队。':'Eliminate the mirror force.';
  return txt(m.objective);
}
function applyScenario(id){
  const s=SCENARIOS[id];if(!s)return;
  G.map=Array.from({length:s.size},()=>Array(s.size).fill('plain'));
  for(const[x,y,t]of s.tiles)G.map[y][x]=t;
  G.caps=new Map();
  for(const[x,y,t]of s.tiles)if(CAPTURABLE.includes(t))G.caps.set(x+','+y,{owner:t==='hq'?'P':null,prog:t==='hq'?CAP_NEED:0});
  G.units=s.units.map(([side,type,x,y,hp])=>{const u=makeUnit(side,type,x,y);if(hp)u.hp=Math.min(hp,u.maxHp);return u;});
  G.scenario={id,goal:{...s.goal}};
  G.funds={P:0,E:0};
  if(s.goal.type==='survive')G.siege={nextWaveTurn:SIEGE.waveInterval};
}
function storyUnitFrom(def,side,mirrorSize,replace){
  let[type,x,y,meta={}]=def;meta={...meta};
  const replacement=replace&&meta.missionRef&&replace[meta.missionRef];
  if(replacement){type=replacement.type||type;meta={...meta,...replacement};}
  if(mirrorSize){x=mirrorSize-1-x;y=mirrorSize-1-y;if(!replacement){meta.missionRef=meta.missionRef?`mirror-${meta.missionRef}`:null;meta.characterId=meta.characterId?`mirror-${meta.characterId}`:null;meta.rank=meta.rank==='hero'?'boss':meta.rank;}}
  return makeUnit(side,type,x,y,meta);
}
function deployStoryUnits(m){
  const pDefs=m.units.P,Gp=[...pDefs,...(m.units.extraP||[])].map(d=>storyUnitFrom(d,'P'));
  const eDefs=m.units.E==='mirror'?pDefs:m.units.E;
  const Ge=[...eDefs,...(m.units.extraE||[])].map(d=>storyUnitFrom(d,'E',m.units.E==='mirror'?m.size:0,m.units.mirrorReplace));
  if(m.id===3)Ge.forEach(u=>u.factionTag='shuo');
  G.units=[...Gp,...Ge];
}
function buildStoryMap(m){
  G.map=Array.from({length:m.size},()=>Array(m.size).fill('plain'));G.caps=new Map();G.storyTiles=new Map();
  for(const[x,y,t,owner,meta]of m.tiles){
    G.map[y][x]=t;
    if(meta)G.storyTiles.set(capKey(x,y),{...meta});
    if(CAPTURABLE.includes(t))G.caps.set(capKey(x,y),{owner:owner||null,prog:owner?CAP_NEED:0});
  }
  // Every player HQ is a valid home return area unless a mission defines a more specific tag.
  for(const[k,cap]of G.caps)if(cap.owner==='P'){
    const[x,y]=k.split(',').map(Number);if(G.map[y][x]==='hq'&&!G.storyTiles.has(k))G.storyTiles.set(k,{tag:'home'});
  }
}
function showStoryLines(lines){
  const box=$('#storyDialogueLines');box.innerHTML=lines.map(([zhName,enName,line])=>`<div class="story-line"><i class="story-badge">${(LANG==='zh'?zhName:enName).slice(0,1)}</i><div><b>${LANG==='zh'?zhName:enName}</b><span>${txt(line)}</span></div></div>`).join('');
  return new Promise(resolve=>{const btn=$('#storyDialogueContinue');btn.onclick=()=>{closeDialog($('#storyDialogue'));resolve();};openDialog($('#storyDialogue'));});
}
function showStoryBriefing(m){
  $('#storyAct').textContent=txt(m.act);$('#storyBriefingTitle').textContent=`${m.id}. ${txt(m.title)}`;$('#storyWhen').textContent=txt(m.when);
  $('#storyBriefingLines').innerHTML=m.briefing.map(([zhName,enName,line])=>`<div class="story-line"><i class="story-badge">${(LANG==='zh'?zhName:enName).slice(0,1)}</i><div><b>${LANG==='zh'?zhName:enName}</b><span>${txt(line)}</span></div></div>`).join('');
  $('#storyPrimary').textContent=txt(m.objective);$('#storyFailure').textContent=txt(m.failure);$('#storyIntel').textContent=txt(m.intel);
  closeDialog($('#menu'));openDialog($('#storyBriefing'));
}
function startStoryMission(id){
  const m=MISSION_DEFS[id];if(!m||!readCampaignProgress().unlocked.includes(id))return false;
  const seed=m.seed>>>0;mapRng=createRng(seed);gameRng=createRng((seed^0x9E3779B9)>>>0);uid=0;
  G={size:m.size,map:[],mapSeed:seed,mapCode:encodeMapCode(m.size,seed),units:[],turn:1,phase:'P',sel:null,reach:null,hover:null,mode:'idle',busy:false,over:false,caps:new Map(),funds:{P:0,E:0},aiStyle:m.aiStyle,difficulty:m.difficulty,gameMode:'story',troopsTier:'none',story:{missionId:id,objective:{...m.objectives[0]},firedEventIds:[],flags:{},holdCounts:{},initialPlayerUnits:(m.units.P||[]).length,playerLosses:0}};
  buildStoryMap(m);deployStoryUnits(m);board.style.setProperty('--n',m.size);fitBoard();
  $('#menu').classList.add('hidden');$('#storyBriefing').classList.add('hidden');$('#overlay').classList.add('hidden');$('#log').innerHTML='';
  log(T('startLog'),'phase');updateAiStyleTag();updateScenarioBanner();SFX.start();BGM.start('P');render();showInfo(null);saveGame();runStoryEvents('roundStart',{round:1});return true;
}
function storyUnit(ref){return G.units.find(u=>u.missionRef===ref);}
function storyTileAt(x,y){return G.storyTiles&&G.storyTiles.get(capKey(x,y));}
function storyTagOwner(tag){
  for(const[k,meta]of G.storyTiles||[])if(meta.tag===tag)return G.caps.get(k)?.owner||null;
  return null;
}
function storyUnitMatches(u,rule){return !!u&&(!rule.unitRef||u.missionRef===rule.unitRef)&&(!rule.unitTypes||rule.unitTypes.includes(u.type));}
function storyRule(){return G?.gameMode==='story'?MISSION_DEFS[G.story.missionId].rule:null;}
function storyUnitMayAct(u){
  const rule=storyRule();
  if(!rule||u.side!=='P')return true;
  if(rule.actionTypes&&!rule.actionTypes.includes(u.type))return false;
  if(rule.immobileTypes?.includes(u.type))return false;
  return true;
}
function storyUnitMayAttack(u){const rule=storyRule();return u.side!=='P'||!rule?.attackTypes||rule.attackTypes.includes(u.type);}
function canRelieveGate(u){return G?.gameMode==='story'&&G.story.missionId===14&&u.missionRef==='weiChanggeng'&&!G.story.flags.gateRelieved&&storyTileAt(u.x,u.y)?.tag==='gate'&&storyTagOwner('gate')==='P';}
async function relieveGate(u){
  if(!canRelieveGate(u))return;
  G.story.flags.gateRelieved=true;u.locked=true;
  await finishUnitAction(u);
  log(LANG==='zh'?'卫长庚接防外环闸门，直到战斗结束。':'Wei Changgeng relieves the Outer Ring Gate until the battle ends.','phase');
  saveGame();
}
function chooseStoryEnding(ending){
  if(!G||G.gameMode!=='story'||G.story.missionId!==17||G.over)return;
  G.story.flags.endingChoice=ending;
  closeDialog($('#storyChoice'));
  G.over=true;
  showResult(true,ending);
}
function declineCoreChoice(){closeDialog($('#storyChoice'));G.busy=false;render();}
function offerCoreChoice(){
  if(G.story.flags.coreChoiceShown||G.story.flags.endingChoice)return;
  G.story.flags.coreChoiceShown=true;
  G.busy=true;
  $('#storyChoiceText').textContent=LANG==='zh'?'闻渊：核心就在这里。占领它，将以灰烬重写秩序；封存它，则坚持到第十四回合。':'Wen Yuan: The core is here. Claim it to rewrite the order in ash, or seal it and hold until round fourteen.';
  openDialog($('#storyChoice'));
}
function matchesStoryTrigger(on,trigger,data){
  if(!Object.prototype.hasOwnProperty.call(on,trigger))return false;
  if(trigger==='roundStart')return on.roundStart===data.round;
  if(['playerPhaseEnd','enemyPhaseStart','enemyPhaseEnd','roundEnd'].includes(trigger))return on[trigger]===true||on[trigger]===data.round;
  if(['unitRetreat','unitDefeated','unitRemoved'].includes(trigger))return on[trigger]===data.unitRef;
  if(trigger==='firstEnemyDefeated')return on.firstEnemyDefeated===true&&data.first===true;
  if(trigger==='unitHpBelow'){const r=on.unitHpBelow;return r&&data.unitRef===r.unitRef&&data.ratio<=r.ratio;}
  if(trigger==='unitEnterTag'){const r=on.unitEnterTag;return r&&data.tag===r.tag&&storyUnitMatches(data.unit,r);}
  if(trigger==='tagHeldRoundEnd'){const r=on.tagHeldRoundEnd;return r&&data.tag===r.tag&&data.count===r.count;}
  if(trigger==='capture'){const c=on.capture;return c&&['x','y','terrain','toOwner','tag'].every(k=>c[k]===undefined||c[k]===data[k]);}
  return false;
}
async function runStoryEvents(trigger,data={}){
  if(!G||G.gameMode!=='story')return;
  const m=MISSION_DEFS[G.story.missionId];
  for(const event of m.events.filter(e=>!G.story.firedEventIds.includes(e.id)&&matchesStoryTrigger(e.on,trigger,data))){
    G.story.firedEventIds.push(event.id);
    saveGame();
    for(const action of event.do){
      if(action.type==='showDialog')await showStoryLines(action.lines);
      else if(action.type==='removeUnits')G.units=G.units.filter(u=>u.factionTag!==action.factionTag);
      else if(action.type==='spawnMirror'){
        const survivors=G.units.filter(u=>u.side==='P'&&!u.aboard);
        G.units.push(...survivors.map(u=>{const v=makeUnit('E',u.type,G.size-1-u.x,G.size-1-u.y,{level:u.level,rank:u.rank});v.hp=Math.min(v.maxHp,u.hp);v.missionRef=`mirror-${u.id}`;return v;}));
      }else if(action.type==='setAiStyle')G.aiStyle=action.value;
      else if(action.type==='setObjective')G.story.objective={...action.value};
      else if(action.type==='appendBattleLog')log(txt(action.value),'info');
      else if(action.type==='setMissionFlag')G.story.flags[action.key]=action.value===undefined?true:action.value;
      else if(action.type==='unlockUnit'){const u=storyUnit(action.unitRef);if(u)u.locked=false;}
      else if(action.type==='lockUnit'){const u=storyUnit(action.unitRef);if(u)u.locked=true;}
      else if(action.type==='setUnitHp'){const u=storyUnit(action.unitRef);if(u)u.hp=Math.max(1,Math.min(u.maxHp,action.hp));}
      else if(action.type==='spawnUnits')for(const def of action.units||[]){const side=action.side||'E';G.units.push(storyUnitFrom(def,side));}
      else if(action.type==='retreatUnit'){
        const u=storyUnit(action.unitRef);
        if(u)G.units=G.units.filter(v=>v.id!==u.id);
        await runStoryEvents('unitRetreat',{unitRef:action.unitRef});
      }else if(action.type==='setTileOwner'){
        const cap=G.caps.get(capKey(action.x,action.y));
        if(cap)cap.owner=action.owner;
      }
      else if(action.type==='winMission'){G.over=true;showResult(true,action.how);return;}
      else if(action.type==='failMission'){G.over=true;showResult(false,action.how);return;}
    }
    render();updateAiStyleTag();saveGame();
  }
}
function checkStoryEnd(){
  const m=MISSION_DEFS[G.story.missionId],players=G.units.filter(u=>u.side==='P'),enemy=G.units.filter(u=>u.side==='E');
  const hqOwner=owner=>[...G.caps].some(([key,c])=>{const[x,y]=key.split(',').map(Number);return G.map[y][x]==='hq'&&c.owner===owner;});
  const failed=m.failures.some(f=>{
    if(f==='allDead')return!players.length;
    if(f==='hqLost')return!hqOwner('P');
    if(f.kind==='unitDefeated')return!storyUnit(f.unitRef);
    if(f.kind==='allUnitsDefeated')return f.refs.every(ref=>!storyUnit(ref));
    if(f.kind==='tagLostBeforeObjective')return G.story.flags[`${f.tag}Captured`]===true&&storyTagOwner(f.tag)!=='P';
    if(f.kind==='allTagsLost')return f.tags.every(tag=>storyTagOwner(tag)!=='P');
    if(f.kind==='deadline'&&G.turn>=f.round){
      if(f.tag)return storyTagOwner(f.tag)!==(f.owner||'P');
      if(f.flag)return G.story.flags[f.flag]!==f.value;
      return true;
    }
    return false;
  });
  if(failed){G.over=true;showResult(false);return;}
  const o=G.story.objective;
  const onTag=(tag,types,unitRef)=>players.some(u=>storyUnitMatches(u,{unitTypes:types,unitRef})&&storyTileAt(u.x,u.y)?.tag===tag);
  const won=o.kind==='eliminateOrCaptureHq'?(!enemy.length||!hqOwner('E'))
    :o.kind==='captureHq'?!hqOwner('E')
    :o.kind==='eliminate'?!enemy.length
    :o.kind==='defeatUnit'?!storyUnit(o.unitRef)
    :o.kind==='unitOnTag'?onTag(o.tag,o.unitTypes,o.unitRef)
    :o.kind==='captureAndHold'?(G.story.holdCounts[o.tag]||0)>=o.rounds
    :o.kind==='survive'?G.story.flags[`survived-${o.round}`]===true
    :o.kind==='eliminateOrSurvive'?!enemy.length||G.story.flags[`survived-${o.round}`]===true
    :false;
  if(won){G.over=true;showResult(true,o.ending||(o.kind==='captureHq'?'hq':undefined));}
}
const $=s=>document.querySelector(s);
const board=$('#board');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// ================= 工具 =================
const ROMAN=['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];
function roman(n){return ROMAN[n]||String(n);}
// 车内乘客（u.aboard=运兵车id）不占格、不可见于棋盘查询
function unitAt(x,y){return G.units.find(u=>!u.aboard&&u.x===x&&u.y===y)||null;}
function riderOf(transport){return G.units.find(u=>u.aboard===transport.id)||null;}
function terrAt(x,y){return TERRAINS[G.map[y][x]];}
function manhattan(x1,y1,x2,y2){return Math.abs(x1-x2)+Math.abs(y1-y2);}
function sideName(s){return s==='P'?T('sideP'):T('sideE');}
function inRange(u,x,y,tx,ty){const d=manhattan(x,y,tx,ty);return d>=u.minR&&d<=u.maxR;}
function targetsFrom(u,x,y){return G.units.filter(t=>!t.aboard&&t.side!==u.side&&inRange(u,x,y,t.x,t.y));}
function calcDamage(att,dfd,fromX,fromY,luck=1){
  const dterr=TERRAINS[G.map[dfd.y][dfd.x]];
  const mult=weaponMultiplier(att.type,dfd.type);
  const raw=att.atk*mult*(att.hp/att.maxHp)*(1-dterr.def)*luck;
  return Math.max(1,Math.round(raw-dfd.def));
}
// ================= 城镇占领（高级战争式：站上建筑后选择占领动作，进度=当前 HP） =================
// G.caps: Map('x,y' -> {owner:'P'|'E', prog})，初始中立
function capKey(x,y){return x+','+y;}
function capAt(x,y){return G.caps?G.caps.get(capKey(x,y))||null:null;}
// 单位执行占领动作：积累占领进度（进度 = 单位当前 HP，工程师×1.5；步兵/重装兵/工程师可占领）
async function tryCapture(u){
  if(!CAPTURABLE.includes(G.map[u.y][u.x]))return;
  if(!CAPTURERS.includes(u.type))return;
  const k=capKey(u.x,u.y);
  const cap=G.caps.get(k);
  if(cap&&cap.owner===u.side)return; // 已是本方城镇
  const storyTile=storyTileAt(u.x,u.y);
  const storyBonus=G.gameMode==='story'&&u.characterId==='suTan'&&storyTile?.tag?1.5:1;
  const gain=Math.round(u.hp*(CAP_MULT[u.type]||1)*storyBonus); // 苏檀对任务设施额外提高 50% 效率
  // progSide 记录当前这份未完成进度是哪一方在累积；换人（被敌方开始占）才清零重算，同一方跨回合累计
  const prog=(cap&&cap.progSide===u.side?cap.prog:0)+gain;
  if(prog>=CAP_NEED){
    G.caps.set(k,{owner:u.side,prog:CAP_NEED});
    floatText(u.x,u.y,u.side==='P'?T('capFloatP'):T('capFloatE'),'capture');
    SFX.capture();
    log(`${sideName(u.side)} ${UNIT_TYPES[u.type].name} ${u.side==='P'?T('capVerb'):T('takeVerb')} (${u.x},${u.y})！`,'level');
    gainXp(u,8); // 占领成功 +8 经验（辅助单位的升级途径）
    if(G.gameMode==='story'){
      G.story.flags[`${storyTile?.tag||k}Captured`]=u.side==='P';
      if(storyTile?.tag&&u.side==='P')G.story.flags[`${storyTile.tag}CapturedRound`]=G.turn;
      await runStoryEvents('capture',{x:u.x,y:u.y,terrain:G.map[u.y][u.x],toOwner:u.side,tag:storyTile?.tag,unit:u});
    }
  }else{
    // 未完成占领：owner 保持不变（中立仍是 undefined，已属他方仍是原 owner），只记录进行中的 progSide/prog
    G.caps.set(k,{owner:cap?cap.owner:undefined,prog,progSide:u.side,by:u.id});
    floatText(u.x,u.y,`${T('prog')} ${prog}/${CAP_NEED}`,'capprog');
    log(`${sideName(u.side)} ${UNIT_TYPES[u.type].name} ${T('prog')} ${prog}/${CAP_NEED}`,'dim');
  }
}
// 离开建筑：占领进度清零（fx,fy = 单位出发格；中立/被夺回中的建筑恢复 0）
function resetCaptureOnLeave(u,fx,fy){
  if(!CAPTURABLE.includes(G.map[fy][fx]))return; // 出发格不是可占领建筑，无需处理
  const k=capKey(fx,fy);
  const cap=G.caps.get(k);
  if(cap&&cap.prog>0&&cap.prog<CAP_NEED&&cap.by===u.id){
    G.caps.set(k,{owner:cap.owner,prog:0});
    log(T('leaveLog')(u.type),'dim');
  }
}
// 可修理/可治疗目标筛选（供按钮点选目标 UI 与 AI 自动选目标共用）
function repairTargets(u){
  if(u.type!=='engineer')return[];
  return G.units.filter(v=>v.side===u.side&&VEHICLES.includes(v.type)&&v.hp<v.maxHp&&manhattan(u.x,u.y,v.x,v.y)===1);
}
function healTargets(u){
  if(u.type!=='medic')return[];
  return G.units.filter(v=>v.side===u.side&&['infantry','heavy','engineer'].includes(v.type)&&v.hp<v.maxHp&&manhattan(u.x,u.y,v.x,v.y)===1);
}
// 工程师修理相邻载具（+3 HP）；target 指定目标（玩家点选），不传则取第一个可修目标（AI 用）
function tryRepair(u,target){
  const v=target||repairTargets(u)[0];
  if(!v)return;
  v.hp=Math.min(v.maxHp,v.hp+3);
  render();floatText(v.x,v.y,'+3','repair');SFX.repair();
  log(T('repairLog')(u.side,v.type),'level');
  gainXp(u,6); // 修理 +6 经验
}
// 军医治疗相邻步兵/重装兵/工程师（+4 HP）；target 指定目标（玩家点选），不传则取第一个可治目标（AI 用）
function tryHeal(u,target){
  const v=target||healTargets(u)[0];
  if(!v)return;
  v.hp=Math.min(v.maxHp,v.hp+4);
  render();floatText(v.x,v.y,'+4','heal');SFX.heal();
  log(T('healLog')(u.side,v.type),'level');
  gainXp(u,6); // 治疗 +6 经验
}
// 以下 can* 系列为无副作用判定，仅用于原地行动按钮组的可见性检查（不修改状态）
function canCapture(u){
  if(!CAPTURABLE.includes(G.map[u.y][u.x]))return false;
  if(!CAPTURERS.includes(u.type))return false;
  const cap=capAt(u.x,u.y);
  return !(cap&&cap.owner===u.side);
}
function canRepair(u){return repairTargets(u).length>0;}
function canHeal(u){return healTargets(u).length>0;}
// 运兵车下车：列出全部相邻、乘客能通行且空闲的格子（供玩家点选，不再固定选第一个）
function unloadTargets(transport,rider){
  const costs=MOVE_COST[rider.type]||{};
  const spots=[];
  for(const[dx,dy]of DIRS){
    const nx=transport.x+dx,ny=transport.y+dy;
    if(nx<0||ny<0||nx>=G.size||ny>=G.size)continue;
    const cost=costs[G.map[ny][nx]];
    if(cost===undefined||cost===Infinity)continue;
    if(unitAt(nx,ny))continue;
    spots.push({x:nx,y:ny});
  }
  return spots;
}
function canUnload(u){
  if(u.type!=='transport')return false;
  const rider=riderOf(u);
  return !!(rider&&unloadTargets(u,rider).length);
}

// ================= 经济与生产（参考高级战争：占城→收入→工厂造兵） =================
function countOwned(side){
  let n=0;
  for(const[,cap]of G.caps)if(cap.owner===side)n++;
  return n;
}
function updateFunds(){
  const el=$('#fundsNum');
  if(el&&G)el.textContent=G.funds.P;
}
// ================= 棋盘自适应缩放 =================
// 根据浏览器视口剩余空间动态算格子像素大小，尽量铺满窗口又不会溢出需要滚动条；
// 侧栏固定 270px + gap，boardWrap 有 padding/border，board 格子间有 3px gap，这些都要从预算里扣掉
function fitBoard(){
  if(!G)return;
  const size=G.size;
  const headerH=document.querySelector('header')?.offsetHeight||60;
  const mainPad=32; // #main padding 16px×2
  const wrapPad=26; // #boardWrap padding 12px×2 + border
  const stacked=window.innerWidth<=700;
  const sideW=stacked?0:270+16; // 小屏幕侧栏换行，不再错误扣除其宽度
  const availW=window.innerWidth-sideW-mainPad-wrapPad;
  const availH=window.innerHeight-headerH-mainPad-wrapPad;
  const gapTotal=(size-1)*3; // #board 格子间 gap
  const raw=Math.floor((Math.min(availW,availH)-gapTotal)/size);
  const cell=Math.max(stacked?36:20,Math.min(64,raw)); // 小屏幕维持触控目标，棋盘容器负责滚动
  board.style.setProperty('--cell',cell+'px');
}
let fitBoardTimer=null;
window.addEventListener('resize',()=>{
  clearTimeout(fitBoardTimer);
  fitBoardTimer=setTimeout(fitBoard,150); // 防抖，避免拖拽窗口时高频重算
});
function collectIncome(side){
  if(G.gameMode==='story'&&!MISSION_DEFS[G.story.missionId].economy?.income)return;
  const n=countOwned(side);
  if(!n)return;
  // 敌方强度：难度档位同时放大敌方收入（跟 HP 倍率同一档位、同一数值），我方恒定 ×1.0
  const mult=side==='E'?(DIFFICULTY_TIERS[G&&G.difficulty]||DIFFICULTY_TIERS.normal).incomeMult:1;
  const inc=Math.round(n*INCOME_PER*mult);
  G.funds[side]+=inc;
  log(T('incomeLog')(side,inc,n,mult),'dim');
}
function healOwnedUnits(side){
  for(const u of G.units.filter(v=>v.side===side&&!v.aboard)){
    const cap=capAt(u.x,u.y);
    if(CAPTURABLE.includes(G.map[u.y][u.x])&&cap&&cap.owner===side&&u.hp<u.maxHp){
      u.hp=Math.min(u.maxHp,u.hp+2);
      render();floatText(u.x,u.y,'+2','heal');
    }
  }
}
// AI 建造：敌方回合结束时在己方空工厂造兵（新单位下回合行动）
function aiBuild(){
  if(G.gameMode==='story'&&!MISSION_DEFS[G.story.missionId].economy?.enemyProduction)return;
  if(G.units.filter(u=>u.side==='E').length>=MAX_SIDE_UNITS)return;
  const factories=[];
  for(let y=0;y<G.size;y++)for(let x=0;x<G.size;x++){
    if(G.map[y][x]!=='factory')continue;
    const cap=capAt(x,y);
    if(cap&&cap.owner==='E'&&!unitAt(x,y))factories.push({x,y});
  }
  const allowed=allowedUnitTypes();
  for(const f of factories){
    const mine=G.units.filter(u=>u.side==='E');
    const cnt=t=>mine.filter(u=>u.type===t).length;
    let pick=null;
    if(allowed.includes('infantry')&&cnt('infantry')<2&&G.funds.E>=UNIT_COSTS.infantry)pick='infantry';
    else{
      const prefs=['tank','artillery','heavy','recon','rocket','infantry','engineer','medic'].filter(t=>allowed.includes(t));
      const afford=prefs.filter(t=>UNIT_COSTS[t]<=G.funds.E);
      if(afford.length)pick=afford[Math.floor(gameRandom()*Math.min(3,afford.length))];
    }
    if(!pick)continue;
    G.funds.E-=UNIT_COSTS[pick];
    const u=makeUnit('E',pick,f.x,f.y);
    u.acted=true;
    G.units.push(u);
    log(T('buildLog')('E',pick),'e');
  }
  updateFunds();
}
// 坚守阵地：敌方无 HQ/工厂，不走经济系统，每 SIEGE.waveInterval 回合按预算贪心随机在敌方出生点附近刷新一波单位
function siegeWave(){
  const size=G.size;
  const spawnPool=[[1,size-3],[0,size-2],[2,size-2],[0,size-1],[1,size-1],[0,size-3],[2,size-1],[3,size-1],[3,size-3]]
    .map(([x,y])=>[size-1-x,size-1-y]); // 镜像到敌方半场，跟正常开局出生点是同一批已清障坐标
  const openSpots=spawnPool.filter(([x,y])=>!unitAt(x,y));
  if(!openSpots.length)return;
  const budget=SIEGE.budgetMin+Math.floor(gameRandom()*(SIEGE.budgetMax-SIEGE.budgetMin+1));
  let spent=0,placed=0;
  const pool=SIEGE.pool;
  while(spent<budget&&placed<openSpots.length&&G.units.filter(u=>u.side==='E').length<MAX_SIDE_UNITS){
    const candidates=pool.filter(t=>UNIT_COSTS[t]<=budget-spent);
    if(!candidates.length)break; // 剩余预算连最便宜的都买不起，结束这一波
    const type=candidates[Math.floor(gameRandom()*candidates.length)];
    const[x,y]=openSpots[placed];
    G.units.push(makeUnit('E',type,x,y));
    spent+=UNIT_COSTS[type];
    placed++;
  }
  if(placed>0)log(T('siegeWaveLog')(placed),'e');
}
// 玩家生产：点击己方空工厂打开生产菜单（新单位当回合待机，同高级战争）
let prodFactory=null;
let dialogTrigger=null;
function openDialog(dialog,trigger=document.activeElement){
  dialogTrigger=trigger;dialog.classList.remove('hidden');
  (window.requestAnimationFrame||setTimeout)(()=>dialog.querySelector('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')?.focus());
}
function closeDialog(dialog){dialog.classList.add('hidden');dialogTrigger?.focus?.();dialogTrigger=null;}
function openProdMenu(x,y){
  if(G.gameMode==='story'&&!MISSION_DEFS[G.story.missionId].economy?.playerProduction)return;
  prodFactory={x,y};
  $('#prodFunds').textContent=T('prodFunds')(G.funds.P);
  const list=$('#prodList');
  list.innerHTML='';
  for(const k of allowedUnitTypes()){
    const b=UNIT_TYPES[k],cost=UNIT_COSTS[k];
    const btn=document.createElement('button');
    btn.className='prodbtn';
    btn.disabled=G.funds.P<cost;
    const icon=b.icon?`<i class="uicon ${b.icon}"></i>`:b.emoji;
    btn.innerHTML=`<span class="picon">${icon}</span><span class="pname">${b.name}</span><span class="pcost">💰${cost}</span>`;
    btn.addEventListener('click',()=>buyUnit(k));
    list.appendChild(btn);
  }
  openDialog($('#prodDialog'));
}
function buyUnit(type){
  if(!prodFactory||!G||G.funds.P<UNIT_COSTS[type]||G.units.filter(u=>u.side==='P').length>=MAX_SIDE_UNITS)return;
  G.funds.P-=UNIT_COSTS[type];
  const u=makeUnit('P',type,prodFactory.x,prodFactory.y);
  u.acted=true; // 当回合待机
  G.units.push(u);
  SFX.repair();
  log(T('buildLog')('P',type),'p');
  closeDialog($('#prodDialog'));
  prodFactory=null;
  updateFunds();render();saveGame();
}

// ================= 版本化自动存档 =================
function createSaveDto(){
  if(!G||G.over)return null;
  return{
    schema:SAVE_SCHEMA_VERSION,
    savedAt:Date.now(),
    uid,
    gameRngState:gameRng.getState(),
    game:{
      size:G.size,map:G.map,mapSeed:G.mapSeed,mapCode:G.mapCode,units:G.units,turn:G.turn,phase:G.phase,
      caps:[...G.caps.entries()],funds:G.funds,aiStyle:G.aiStyle,difficulty:G.difficulty,gameMode:G.gameMode,
      troopsTier:G.troopsTier,siege:G.siege||null,scenario:G.scenario||null,story:G.story||null,
      storyTiles:G.storyTiles?[...G.storyTiles.entries()]:null,
    },
  };
}
function validateSaveDto(dto){
  const g=dto&&dto.game;
  return!!(dto&&dto.schema===SAVE_SCHEMA_VERSION&&Number.isInteger(dto.uid)&&Number.isInteger(dto.gameRngState)&&g&&
    VALID_MAP_SIZES.includes(g.size)&&Array.isArray(g.map)&&g.map.length===g.size&&g.map.every(row=>Array.isArray(row)&&row.length===g.size)&&
    Array.isArray(g.units)&&Array.isArray(g.caps)&&g.funds&&['P','E'].includes(g.phase)&&decodeMapCode(g.mapCode)&&
    (g.storyTiles===null||g.storyTiles===undefined||Array.isArray(g.storyTiles))&&
    g.mapSeed===decodeMapCode(g.mapCode).seed&&g.size===decodeMapCode(g.mapCode).size);
}
function readSave(){
  try{const dto=JSON.parse(localStorage.getItem(SAVE_KEY));return validateSaveDto(dto)?dto:null;}catch(e){return null;}
}
function saveGame(){
  const dto=createSaveDto();
  if(!dto)return;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(dto));}catch(e){}
  updateSaveActions();
}
function deleteSave(){
  try{localStorage.removeItem(SAVE_KEY);}catch(e){}
  updateSaveActions();
}
function updateSaveActions(){
  const actions=document.getElementById('saveActions');
  if(actions)actions.style.display=readSave()?'flex':'none';
}
function restoreGame(dto=readSave()){
  if(!validateSaveDto(dto))return false;
  const s=dto.game;
  G={...s,caps:new Map(s.caps),storyTiles:s.storyTiles?new Map(s.storyTiles):new Map(),sel:null,reach:null,hover:null,mode:'idle',busy:false,over:false};
  if(!G.siege)delete G.siege;
  uid=Math.max(dto.uid,...G.units.map(u=>u.id||0));
  gameRng=createRng(dto.gameRngState);
  mapRng=createRng(G.mapSeed);
  aiStyleChoice=G.aiStyle;difficultyChoice=G.difficulty;gameModeChoice=G.gameMode;troopsChoice=G.troopsTier||'none';sizeChoice=G.size;
  if(G.scenario&&SCENARIOS[G.scenario.id])scenarioChoice=G.scenario.id;
  if(G.story&&MISSION_DEFS[G.story.missionId])missionChoice=G.story.missionId;
  syncMenuChoices();
  prodFactory=null;
  board.style.setProperty('--n',G.size);fitBoard();
  $('#menu').classList.add('hidden');$('#overlay').classList.add('hidden');$('#prodDialog').classList.add('hidden');
  $('#log').innerHTML='';
  updateAiStyleTag();updateScenarioBanner();SFX.start();BGM.start(G.phase);render();showInfo(null);
  return true;
}
function syncMenuChoices(){
  const choices={size:String(sizeChoice),ai:aiStyleChoice,diff:difficultyChoice,mode:gameModeChoice,troops:troopsChoice};
  for(const key in choices)document.querySelectorAll(`#menu button[data-${key}]`).forEach(b=>b.classList.toggle('primary',b.dataset[key]===choices[key]));
  const input=document.getElementById('mapCodeInput');if(input&&G)input.value=G.mapCode;
  const hint=document.getElementById('mapCodeHint');if(hint&&G)hint.textContent=T('mapCodeReady')(G.mapCode);
  updateScenarioMenu();
}

// ================= 地图生成（地理化：山脉山脊 + 河流浅滩 + 森林集群，180° 对称 + 连通性校验） =================
function genMap(size){
  for(let attempt=0;attempt<80;attempt++){
    const m=Array.from({length:size},()=>Array(size).fill('plain'));
    const half=Math.ceil(size/2);
    // --- 山脉：从地图一侧向另一侧随机游走形成山脊（地理上山脉成脉状而非散点） ---
    const ridges=size>=14?3:size>=10?2:1;
    for(let r=0;r<ridges;r++){
      let rx=Math.floor(mapRandom()*half*0.4), ry=Math.floor(mapRandom()*size*0.3);
      const len=Math.floor(size*0.55+mapRandom()*size*0.3);
      for(let i=0;i<len;i++){
        if(rx>=0&&rx<half&&ry>=0&&ry<size)m[ry][rx]='mountain';
        // 山脊走向：偏向水平延伸，偶尔上下起伏、分叉出小支脉
        const dir=mapRandom();
        if(dir<0.55)rx++;
        else if(dir<0.75)ry+=mapRandom()<0.5?1:-1;
        else if(dir<0.85){rx++;ry+=mapRandom()<0.5?1:-1;}
        if(mapRandom()<0.12&&ry+1<size)m[ry+1][Math.min(rx,half-1)]='mountain'; // 支脉
        ry=Math.max(0,Math.min(size-1,ry));
      }
    }
    // --- 河流：从上边缘流向右边缘的连通水线，中途留 1-2 处浅滩（可通行）保证两岸可达 ---
    {
      let wx=Math.floor(mapRandom()*half*0.6+half*0.2), wy=0;
      let fords=1+Math.floor(mapRandom()*2), fordAt=[];
      for(let i=0;i<fords;i++)fordAt.push(Math.floor(size*(0.3+0.4*mapRandom())));
      while(wy<size){
        if(wx>=0&&wx<half){
          m[wy][wx]=fordAt.includes(wy)?'plain':'water';
          if(fordAt.includes(wy)&&wx+1<half)m[wy][wx+1]='plain'; // 浅滩加宽
        }
        wy++;
        if(mapRandom()<0.45)wx+=mapRandom()<0.5?1:-1; // 河道蜿蜒
        wx=Math.max(0,Math.min(half-1,wx));
      }
    }
    // --- 森林：以种子点向外生长成片（林地集群，符合植被成片分布） ---
    const blobs=Math.floor(size*0.5);
    for(let b=0;b<blobs;b++){
      const bx=Math.floor(mapRandom()*half), by=Math.floor(mapRandom()*size);
      const n=2+Math.floor(mapRandom()*4);
      let cx=bx,cy=by;
      for(let i=0;i<n;i++){
        if(cx>=0&&cx<half&&cy>=0&&cy<size&&m[cy][cx]==='plain')m[cy][cx]='forest';
        const[dx,dy]=DIRS[Math.floor(mapRandom()*4)];
        cx+=dx;cy+=dy;
      }
    }
    // --- 出生点强制平原（与 newGame 的 9 个出生点完全一致，仅左半边，稍后镜像） ---
    const spawns=[[0,size-1],[1,size-1],[0,size-2],[1,size-2],[2,size-2],[0,size-3],[2,size-1],[3,size-1],[3,size-3]];
    for(const[x,y]of spawns)m[y][x]='plain';
    // --- 出生点周边清障：保证载具（不可入山地/水）出生后能移动，不被地形卡死 ---
    // 每个出生点周围 1 格内的山地/水都改为平原，确保所有兵种（含履带/轮胎）都有出路
    // 军医出生点 (1,size-3) 也纳入清障保护（仅左半边，稍后镜像）
    const clearPts=spawns.concat([[1,size-3]]);
    for(const[x,y]of clearPts){
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=x+dx,ny=y+dy;
        if(nx<0||ny<0||nx>=half)continue;
        if(ny<0||ny>=size)continue;
        if(m[ny][nx]==='mountain'||m[ny][nx]==='water')m[ny][nx]='plain';
      }
    }
    // --- 固定建筑：每方后方 1 总部 + 1 工厂 + 1 城镇（仅左半边，开局即归属我方，稍后镜像给敌方）；奇数尺寸额外在正中心放 1 座中立争夺城镇 ---
    const fixedBuilds=[[2,size-3,'city'],[1,size-2,'hq'],[3,size-2,'factory']];
    for(const[x,y,t]of fixedBuilds){if(m[y][x]==='water')m[y][x]='plain';m[y][x]=t;}
    // --- 中立建筑：数量按地图面积/10 估算，城市:工厂≈4:1，只在左半边（不含中心列）平原/森林上随机选址，避开山地/河流/已有建筑，稍后镜像 ---
    const neutralTotal=Math.max(2,Math.round(size*size/10/2)); // 除以 2 是因为只在左半边生成，镜像后总数翻倍
    const neutralFactories=Math.max(1,Math.round(neutralTotal*0.2));
    const usedPts=new Set(fixedBuilds.map(([x,y])=>x+','+y).concat(spawns.map(([x,y])=>x+','+y)));
    // 中心列（奇数尺寸时 x===half-1）自己镜像自己，任何放在这一列非正中心格的建筑都不会有对称副本，
    // 所以随机中立建筑的选址范围要严格排除中心列，只有正中心格单独处理（留给下方的中心争夺城镇）
    const placeMax=size%2===1?half-1:half;
    const isFreeSpot=(x,y)=>x>=0&&x<placeMax&&y>=0&&y<size&&(m[y][x]==='plain'||m[y][x]==='forest')&&!usedPts.has(x+','+y);
    for(let i=0;i<neutralTotal;i++){
      const type=i<neutralFactories?'factory':'city';
      let placed=false;
      for(let tries=0;tries<40&&!placed;tries++){
        const x=Math.floor(mapRandom()*placeMax),y=Math.floor(mapRandom()*size);
        if(!isFreeSpot(x,y))continue;
        m[y][x]=type;usedPts.add(x+','+y);placed=true;
      }
    }
    // --- 180° 镜像对称（双方地图完全一致，公平；地形/出生点/固定建筑/中立建筑均已就绪，统一镜像） ---
    for(let y=0;y<size;y++)for(let x=half;x<size;x++)m[y][x]=m[size-1-y][size-1-x];
    if(size%2===1)m[(size-1)/2][(size-1)/2]='city'; // 奇数尺寸正中心额外放 1 座中立争夺城镇（镜像后再放，避免被当成左半边内容错误镜像）
    if(connected(m,size))return m;
  }
  // 兜底：全平原 + 角落森林 + 基础建筑
  const m=Array.from({length:size},()=>Array(size).fill('plain'));
  m[1][1]='forest';m[size-2][size-2]='forest';
  m[2][size-3]='city';m[size-3][2]='city';
  m[1][size-2]='hq';m[size-2][1]='hq';
  m[3][size-2]='factory';m[size-2][3]='factory';
  return m;
}
function connected(m,size){
  const seen=Array.from({length:size},()=>Array(size).fill(false));
  const q=[[0,size-1]];seen[size-1][0]=true;
  while(q.length){
    const[x,y]=q.pop();
    for(const[dx,dy]of DIRS){
      const nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=size||ny>=size||seen[ny][nx])continue;
      if(m[ny][nx]==='water')continue;
      seen[ny][nx]=true;q.push([nx,ny]);
    }
  }
  return seen[0][size-1];
}

// ================= 寻路（Dijkstra，每兵种地形移动力不同，参考高级战争） =================
function bfsReach(u){
  const size=G.size,start=u.x+','+u.y;
  const costs=MOVE_COST[u.type]||{}; // 每兵种移动力表
  const dist=new Map([[start,0]]),parent=new Map(),pq=[[0,u.x,u.y]];
  while(pq.length){
    pq.sort((a,b)=>a[0]-b[0]);
    const[c,x,y]=pq.shift();
    if(c>dist.get(x+','+y))continue;
    for(const[dx,dy]of DIRS){
      const nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=size||ny>=size)continue;
      const tk=G.map[ny][nx];
      const cost=costs[tk]!==undefined?costs[tk]:TERRAINS[tk].cost;
      if(cost===Infinity)continue;
      const occ=unitAt(nx,ny);
      if(occ&&occ.side!==u.side)continue; // 敌军挡路
      const nc=c+cost;
      if(nc>u.move)continue;
      const k=nx+','+ny;
      if(!dist.has(k)||nc<dist.get(k)){dist.set(k,nc);parent.set(k,x+','+y);pq.push([nc,nx,ny]);}
    }
  }
  const stoppable=new Set();
  for(const k of dist.keys()){
    const[x,y]=k.split(',').map(Number);
    const occ=unitAt(x,y);
    if(!occ||occ.id===u.id)stoppable.add(k);
    // 步兵类可停在己方空运兵车格（上车）
    else if(occ.side===u.side&&occ.type==='transport'&&RIDERS.includes(u.type)&&!riderOf(occ))stoppable.add(k);
  }
  return{dist,parent,stoppable};
}
function pathTo(reach,x,y){
  const path=[];let k=x+','+y;
  while(k){const[px,py]=k.split(',').map(Number);path.unshift([px,py]);k=reach.parent.get(k);}
  return path;
}

// ================= 战斗 =================
async function doAttack(att,dfd){
  G.busy=true;
  log(T('atkLog')(att,dfd),'info');
  SFX.attack(att.type);
  await resolveHit(att,dfd,1);
  if(!G.over&&dfd.hp>0&&canCounter(dfd,att)){
    await sleep(260);
    log(T('counter'),'dim');
    SFX.attack(dfd.type);
    await resolveHit(dfd,att,COUNTER_MULT);
  }
  checkEnd();
  G.busy=false;
}
function canCounter(d,att){
  if(NO_MOVE_FIRE.includes(d.type))return false; // 火炮/火箭炮不反击
  return inRange(d,d.x,d.y,att.x,att.y);
}
async function resolveHit(a,d,counterMult){
  if(gameRandom()>HIT_CHANCE){
    floatText(d.x,d.y,'MISS','miss');SFX.miss();
    log(T('dodged'),'dim');
    return;
  }
  const crit=gameRandom()<CRIT_CHANCE;
  let dmg=Math.round(calcDamage(a,d,a.x,a.y,0.85+gameRandom()*0.3)*counterMult);
  if(crit)dmg=Math.round(dmg*CRIT_MULT);
  dmg=Math.max(1,dmg);
  if(G.gameMode==='story'&&d.traits?.includes('weiChanggeng')&&d.side==='P'&&G.phase==='E'){
    const cap=capAt(d.x,d.y),onFriendlyBuilding=CAPTURABLE.includes(G.map[d.y][d.x])&&cap?.owner==='P';
    if(onFriendlyBuilding&&!G.story.flags.weiChanggengBraced){dmg=Math.max(1,dmg-1);G.story.flags.weiChanggengBraced=true;}
  }
  const storyRule=G.gameMode==='story'&&d.criticalRule;
  const protectedRule=['holdAtOneHp','retreatAtOneHp','protectedFailAtOneHp'].includes(storyRule);
  d.hp=Math.max(protectedRule?1:0,d.hp-dmg);
  render();
  floatText(d.x,d.y,'-'+dmg+(crit?` ${T('crit')}`:''),crit?'crit':'dmg');
  crit?SFX.crit():SFX.hit();
  await sleep(320);
  gainXp(a,8);
  if(G.gameMode==='story'&&d.missionRef)await runStoryEvents('unitHpBelow',{unitRef:d.missionRef,ratio:d.hp/d.maxHp,unit:d});
  if(storyRule==='protectedFailAtOneHp'&&d.hp===1){
    await runStoryEvents('unitRetreat',{unitRef:d.missionRef});
    G.over=true;showResult(false,'protected');
  }else if(storyRule==='retreatAtOneHp'&&d.hp===1){
    G.units=G.units.filter(u=>u.id!==d.id);render();
    await runStoryEvents('unitRetreat',{unitRef:d.missionRef});
  }else if(d.hp<=0){
    log(T('killLog')(a,d),'kill');
    SFX.destroy();
    gainXp(a,25);
    const rider=riderOf(d); // 运兵车被击毁：车内乘客一同阵亡
    G.units=G.units.filter(u=>u.id!==d.id&&(!rider||u.id!==rider.id));
    if(G.gameMode==='story'&&d.side==='P')G.story.playerLosses++;
    if(G.gameMode==='story'&&rider?.side==='P')G.story.playerLosses++;
    if(rider)log(T('cargoLostLog')(rider.type),'kill');
    render();
    if(G.gameMode==='story'){
      const first=d.side==='E'&&!G.story.flags.firstEnemyDefeated;
      if(first)G.story.flags.firstEnemyDefeated=true;
      await runStoryEvents('firstEnemyDefeated',{first,unitRef:d.missionRef,unit:d});
      await runStoryEvents(storyRule==='retreatOnDefeat'?'unitRetreat':'unitDefeated',{unitRef:d.missionRef});
      await runStoryEvents('unitRemoved',{unitRef:d.missionRef});
    }
  }else{
    log(T('remain')(d.type,d.hp),'dim');
  }
}
function gainXp(u,n){
  if(G&&G.gameMode==='story')return;
  u.xp+=n;
  let need=30+(u.level-1)*10;
  while(u.xp>=need){
    u.xp-=need;
    if(u.level<5){ // 等级上限 V
      u.level++;
      u.atk+=1;u.def+=1;u.maxHp+=2;u.hp=Math.min(u.maxHp,u.hp+3);
      render();
      floatText(u.x,u.y,'⬆️ Lv'+u.level,'levelup');SFX.level();
      log(T('lvlUp')(u.side,u.type,u.level),'level');
    }else{ // 满级：经验转为 HP 恢复
      u.hp=Math.min(u.maxHp,u.hp+3);
      render();
      floatText(u.x,u.y,'+3','maxheal');SFX.maxheal();
      log(T('maxLvl')(u.side,u.type),'dim');
    }
    need=30+(u.level-1)*10;
  }
}
function checkEnd(){
  if(G.gameMode==='story'){checkStoryEnd();return;}
  const p=G.units.some(u=>u.side==='P');
  const e=G.units.some(u=>u.side==='E');
  if(!p){G.over=true;showResult(false);return;} // 我方全灭永远直接战败，坚守阵地也不例外
  if(G.scenario){
    const goal=G.scenario.goal;
    const home=[...G.caps].find(([key])=>{const[x,y]=key.split(',').map(Number);return G.map[y][x]==='hq';});
    if(home&&home[1].owner==='E'){G.over=true;showResult(false,'hq');return;}
    if(goal.type==='eliminate'&&!e){G.over=true;showResult(true);return;}
    if(goal.type==='capture'){
      const cap=G.caps.get(goal.x+','+goal.y);
      if(cap&&cap.owner==='P'){G.over=true;showResult(true,'hq');return;}
    }
    return;
  }
  // 歼灭全部敌军获胜：坚守阵地模式下敌方会无限刷新（含开局 0 部队的初始状态），这条路径必须禁用，否则要么开局即判胜、要么永远打不完
  if(G.gameMode!=='siege'&&!e){G.over=true;showResult(true);return;}
  // 总部占领：占领敌方总部直接获胜，己方总部被占直接战败（坚守阵地下敌方没有 HQ，这段自然不会触发）
  for(const[k,cap]of G.caps){
    const[x,y]=k.split(',').map(Number);
    if(G.map[y][x]!=='hq'||!cap.owner)continue;
    if(cap.owner==='P'&&x>Math.floor(G.size/2)-1){G.over=true;showResult(true,'hq');return;}
    if(cap.owner==='E'&&x<Math.floor(G.size/2)){G.over=true;showResult(false,'hq');return;}
  }
}

// ================= 特效 =================
function floatText(x,y,text,cls){
  const cell=board.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  if(!cell)return;
  const el=document.createElement('div');
  el.className='float '+cls;el.textContent=text;
  cell.appendChild(el);
  setTimeout(()=>el.remove(),1100);
}
async function animateMove(u,path){
  for(let i=1;i<path.length;i++){
    u.x=path[i][0];u.y=path[i][1];
    render();
    await sleep(70);
  }
}

// ================= 玩家操作 =================
function select(u){
  if(u.locked||!storyUnitMayAct(u))return;
  G.sel=u;G.mode='selected';G.reach=bfsReach(u);SFX.select();render();showInfo(u);
}
function deselect(){G.sel=null;G.reach=null;G.mode='idle';render();}
// 查看模式：点击敌军（或已行动单位）查看其移动/攻击范围，不能操作
function viewUnit(u){G.sel=u;G.mode='view';G.reach=bfsReach(u);SFX.select();render();showInfo(u);}
// 结束当前单位行动并收尾（可选执行一个原地动作：占领/修理/治疗）
async function finishUnitAction(u,action){
  u.acted=true;
  if(action)await action(u);
  else log(T('waitLog')(u.type),'dim');
  G.sel=null;G.reach=null;G.mode='idle';
  checkEnd();
  if(!G.over){render();showInfo(null);saveGame();}
}
async function waitUnit(){ if(G.sel)await finishUnitAction(G.sel); }
async function captureAction(){ if(G.sel)await finishUnitAction(G.sel,tryCapture); }
// 修理/治疗/下车都需要玩家点选目标：进入专属选择模式，棋盘高亮可选目标，点击后才真正执行
function repairAction(){ if(G.sel){G.mode='repair';render();showInfo(G.sel);} }
function healAction(){ if(G.sel){G.mode='heal';render();showInfo(G.sel);} }
function unloadAction(){ if(G.sel){G.mode='unload';render();showInfo(G.sel);} }
// 运兵车下车：乘客落到玩家点选的相邻空格，本回合仍可行动；运兵车结束本次行动
function doUnload(u,spot){
  const rider=riderOf(u);
  if(!rider||!spot)return;
  rider.aboard=null;rider.x=spot.x;rider.y=spot.y;
  rider.acted=false; // 上车时乘客的 acted 被置 true（视为"已用掉本回合行动去上车"），下车后应恢复可行动
  log(T('unloadLog')(rider.type),'dim');
}
// 原地行动按钮组：根据选中单位当前格子能做的事动态生成按钮
function updateActionBtns(){
  const box=$('#actionBtns'),waitBtn=$('#waitBtn');
  const active=G.sel&&(G.mode==='selected'||G.mode==='acting')&&G.phase==='P'&&!G.busy&&!G.over;
  if(!box||!waitBtn)return;
  if(!active){box.style.display='none';box.innerHTML='';waitBtn.style.display='none';return;}
  const u=G.sel;
  let html='';
  if(storyUnitMayAttack(u)&&targetsFrom(u,u.x,u.y).length&&(!NO_MOVE_FIRE.includes(u.type)||ARTILLERY_MOVE_FIRE))
    html+=`<button data-act="attack">${T('actAttack')}</button>`;
  if(canRelieveGate(u))html+=`<button data-act="relieve">${T('actRelieveGate')}</button>`;
  if(canCapture(u))html+=`<button data-act="capture">${T('actCapture')}</button>`;
  if(canRepair(u))html+=`<button data-act="repair">${T('actRepair')}</button>`;
  if(canHeal(u))html+=`<button data-act="heal">${T('actHeal')}</button>`;
  if(canUnload(u))html+=`<button data-act="unload">${T('actUnload')}</button>`;
  box.innerHTML=html;
  box.style.display=html?'flex':'none';
  waitBtn.style.display='block';
}
$('#actionBtns').addEventListener('click',async e=>{
  const btn=e.target.closest('button[data-act]');
  if(!btn||!G||!G.sel||G.busy||G.over||G.phase!=='P')return;
  const act=btn.dataset.act;
  if(act==='attack'){G.mode='attack';render();showInfo(G.sel);}
  else if(act==='relieve')await relieveGate(G.sel);
  else if(act==='capture')await captureAction();
  else if(act==='repair')repairAction();
  else if(act==='heal')healAction();
  else if(act==='unload')unloadAction();
});
async function playerMove(u,x,y){
  if(!storyUnitMayAct(u))return;
  G.busy=true;
  const fx=u.x,fy=u.y; // 记录出发格（用于离开城镇时清零占领进度）
  const path=pathTo(G.reach,x,y);
  G.reach=null;G.mode='idle';render();
  SFX.move(u.type);
  await animateMove(u,path);
  G.busy=false;
  resetCaptureOnLeave(u,fx,fy); // 离开城镇：占领进度清零
  if(G.gameMode==='story'){
    const tag=storyTileAt(u.x,u.y)?.tag;
    await runStoryEvents('unitEnterTag',{tag,unit:u});
    if(tag==='core')offerCoreChoice();
  }
  // 落点是己方空运兵车：直接上车，乘客不再单独占格、不能再行动
  const carrier=G.units.find(v=>v.id!==u.id&&v.type==='transport'&&v.side===u.side&&v.x===u.x&&v.y===u.y);
  if(carrier&&RIDERS.includes(u.type)){
    await finishUnitAction(u,v=>{v.aboard=carrier.id;log(T('loadLog')(v.type),'dim');});
    return;
  }
  // 移动后不自动执行占领/修理/治疗/攻击，交由动作按钮组给玩家选择；若无可选动作则直接待机结束
  G.mode='acting';G.sel=u;G.reach=null;render();showInfo(u);
  const hasAction=storyUnitMayAttack(u)&&targetsFrom(u,u.x,u.y).length&&(!NO_MOVE_FIRE.includes(u.type)||ARTILLERY_MOVE_FIRE)
    ||canCapture(u)||canRepair(u)||canHeal(u)||canUnload(u);
  if(!hasAction)await finishUnitAction(u);
}
async function playerAttack(a,d){
  if(!storyUnitMayAct(a)||!storyUnitMayAttack(a))return;
  G.busy=true;G.reach=null;G.mode='idle';render();
  await doAttack(a,d);
  if(a.hp>0)a.acted=true;
  G.sel=null;G.busy=false;
  render();showInfo(a.hp>0?a:null);
  if(!G.over)saveGame();
}
board.addEventListener('click',async e=>{
  if(!G||G.busy||G.over||G.phase!=='P')return;
  const cellEl=e.target.closest('.cell');if(!cellEl)return;
  const x=+cellEl.dataset.x,y=+cellEl.dataset.y;
  const u=unitAt(x,y);
  if(G.mode==='repair'||G.mode==='heal'){
    const sel=G.sel,isRepair=G.mode==='repair';
    if(u&&u.id===sel.id){G.mode='acting';render();showInfo(u);return;} // 再点自己=取消选择目标，回到动作按钮组
    const targets=isRepair?repairTargets(sel):healTargets(sel);
    if(u&&targets.includes(u)){finishUnitAction(sel,v=>isRepair?tryRepair(v,u):tryHeal(v,u));return;}
    return; // 点了非法目标：忽略，保持选择状态
  }
  if(G.mode==='unload'){
    const sel=G.sel;
    if(u&&u.id===sel.id){G.mode='acting';render();showInfo(u);return;} // 再点自己=取消选择落点，回到动作按钮组
    const targets=unloadTargets(sel,riderOf(sel));
    const spot=targets.find(t=>t.x===x&&t.y===y);
    if(!u&&spot){finishUnitAction(sel,v=>doUnload(v,spot));return;}
    return; // 点了非法落点：忽略，保持选择状态
  }
  if(G.mode==='selected'||G.mode==='attack'||G.mode==='acting'||G.mode==='view'){
    const sel=G.sel;
    if(u&&u.id===sel.id){deselect();showInfo(u);return;} // 再点一次=取消选择（可继续查看）
    if((G.mode==='selected'||G.mode==='attack'||G.mode==='acting')&&storyUnitMayAttack(sel)&&u&&u.side==='E'&&targetsFrom(sel,sel.x,sel.y).includes(u)){await playerAttack(sel,u);return;}
    // 工程师/军医选中后直接点相邻己方可修/可治单位＝快捷触发修理/治疗（无需先点"修理"/"治疗"按钮）
    if((G.mode==='selected'||G.mode==='acting')&&u&&u.side===sel.side&&u.id!==sel.id){
      if(sel.type==='engineer'&&repairTargets(sel).includes(u)){finishUnitAction(sel,v=>tryRepair(v,u));return;}
      if(sel.type==='medic'&&healTargets(sel).includes(u)){finishUnitAction(sel,v=>tryHeal(v,u));return;}
    }
    if(G.mode==='selected'&&G.reach.stoppable.has(x+','+y)&&(!u||u.id===sel.id||(u.type==='transport'&&u.side===sel.side))){await playerMove(sel,x,y);return;}
    if(u&&u.side==='P'&&!u.acted){select(u);return;}
    if(u&&u.side==='E'){viewUnit(u);return;} // 点敌军=查看其范围
    deselect();return;
  }
  if(!u&&G.map[y][x]==='factory'){
    const cap=capAt(x,y);
    if(cap&&cap.owner==='P'){openProdMenu(x,y);return;} // 点击己方空工厂：生产单位
  }
  if(u&&u.side==='P'&&!u.acted)select(u);
  else if(u)viewUnit(u); // 敌军/已行动单位=查看模式
});
board.addEventListener('mousemove',e=>{
  if(!G)return;
  const c=e.target.closest('.cell');if(!c)return;
  const x=+c.dataset.x,y=+c.dataset.y,t=terrAt(x,y);
  // 路径预览：悬停格变化时重渲染（仅选中状态下）
  const hv=G.hover;
  if(!G.hover||G.hover.x!==x||G.hover.y!==y){
    G.hover={x,y};
    if(G.sel&&G.mode==='selected')render();
  }
  const cap=capAt(x,y);
  const capTxt=cap?(cap.owner?`｜${cap.owner==='P'?T('myFlag'):T('enFlag')}`+(cap.prog<CAP_NEED?`（${T('prog')} ${cap.prog}/${CAP_NEED}）`:''):(cap.prog>0?`｜${T('capturing')} ${cap.prog}/${CAP_NEED}`:`｜${T('neutral')}`)):'';
  // 地形小图标：与棋盘 CSS 地形同款色块（统一显示，不再用 emoji）
  const chip=`<i class="tchip t-${G.map[y][x]}"></i>`;
  // 若选中单位，显示该兵种在此地形的移动力
  let mvTxt='';
  if(G.sel&&MOVE_COST[G.sel.type]&&MOVE_COST[G.sel.type][G.map[y][x]]!==undefined){
    const mc=MOVE_COST[G.sel.type][G.map[y][x]];
    mvTxt=` ｜ ${G.sel.type==='?'?'':T('moveCost')} ${mc===Infinity?T('impassable'):mc}`;
  }
  let prodHint='';
  if(G.map[y][x]==='factory'&&cap&&cap.owner==='P'&&!unitAt(x,y)&&G.phase==='P'&&!G.busy)prodHint=`｜<b>${T('prodHint')}</b>`;
  $('#tileInfo').innerHTML=`<b>${chip} ${t.name}</b><br>${T('defBonus')} +${Math.round(t.def*100)}%${mvTxt}${CAPTURABLE.includes(G.map[y][x])?capTxt:''}${prodHint}`;
});

// ================= 敌方 AI =================
// 某格子对单位 u 的危险度：玩家单位中能打到该格的，预期伤害直接累加（未加权，调用方各自按 dangerW 折算，撤退/占领逻辑则直接用原始值比较）
function dangerAt(x,y,u,players){
  let danger=0;
  for(const p of players){
    const pd=manhattan(x,y,p.x,p.y);
    const canReach=NO_MOVE_FIRE.includes(p.type)?(pd>=p.minR&&pd<=p.maxR):(pd<=p.move+p.maxR);
    if(canReach)danger+=calcDamage(p,u,p.x,p.y,1);
  }
  return danger;
}
function aiPlan(u){
  const style=AI_STYLES[G.aiStyle]||AI_STYLES.balanced;
  const reach=bfsReach(u);
  const players=G.units.filter(v=>v.side==='P');
  if(!players.length)return null;
  let best=null;
  for(const k of reach.stoppable){
    const[x,y]=k.split(',').map(Number);
    // 间接火力移动后不能攻击：攻击方案只能从当前格规划，避免选出执行时必然失效的目标。
    if(NO_MOVE_FIRE.includes(u.type)&&!ARTILLERY_MOVE_FIRE&&(x!==u.x||y!==u.y))continue;
    for(const t of players){
      const d=manhattan(x,y,t.x,t.y);
      if(d<u.minR||d>u.maxR)continue;
      const dmg=calcDamage(u,t,x,y,1);
      const willKill=dmg>=t.hp;
      const danger=dangerAt(x,y,u,players); // 该落点会被玩家造成的预期总伤害（未加权，各调用方按自己的权重折算）
      // 亏本交易回避：打不死对方、且受到的预期伤害明显超过造成的伤害时，这个方案直接不考虑（稳健/防守风格）
      if(style.badTradeAvoid&&!willKill&&danger>dmg*style.badTradeMult)continue;
      let score=dmg+(willKill?style.killBonus:0)+terrAt(x,y).def*15;
      score-=danger*style.dangerW;
      if(!best||score>best.score)best={x,y,target:t,score,reach};
    }
  }
  if(best)return best;
  // 无攻击机会：残血且原地危险度高时优先撤退到危险度更低的格子（原地不算撤退，必须真的挪窝）
  const curDanger=dangerAt(u.x,u.y,u,players);
  if(style.retreatHpRatio>0&&u.hp/u.maxHp<=style.retreatHpRatio&&curDanger>0){
    let safe=null;
    for(const k of reach.stoppable){
      const[x,y]=k.split(',').map(Number);
      if(x===u.x&&y===u.y)continue; // 排除原地
      const dg=dangerAt(x,y,u,players);
      const sc=-dg+terrAt(x,y).def*8;
      if(!safe||sc>safe.sc)safe={x,y,sc,reach};
    }
    if(safe&&-safe.sc<curDanger)return{x:safe.x,y:safe.y,target:null,reach:safe.reach,score:0};
  }
  // 防守风格：不主动靠近玩家，能占领的兵种优先靠向可占领的中立/敌占建筑；否则原地待机防守
  if(!style.idleAdvance){
    let cap=null;
    if(CAPTURERS.includes(u.type)){
      for(const k of reach.stoppable){
        const[x,y]=k.split(',').map(Number);
        if(!CAPTURABLE.includes(G.map[y][x]))continue;
        const c=capAt(x,y);
        if(c&&c.owner==='E')continue;
        const dg=dangerAt(x,y,u,players);
        const sc=style.capturePriority-dg+terrAt(x,y).def*8;
        if(!cap||sc>cap.sc)cap={x,y,sc,reach};
      }
    }
    if(cap)return{x:cap.x,y:cap.y,target:null,reach:cap.reach,score:0};
    return{x:u.x,y:u.y,target:null,reach,score:0};
  }
  // 向最近玩家推进（火炮保持距离 ~3，火箭炮保持距离 ~4）
  const ideal=u.type==='rocket'?4:u.type==='artillery'?3:0;
  let mv=null;
  for(const k of reach.stoppable){
    const[x,y]=k.split(',').map(Number);
    let nd=Infinity;
    for(const p of players)nd=Math.min(nd,manhattan(x,y,p.x,p.y));
    const dg=dangerAt(x,y,u,players);
    const sc=-Math.abs(nd-ideal)*10+terrAt(x,y).def*5-dg*style.dangerW;
    if(!mv||sc>mv.sc)mv={x,y,sc,reach};
  }
  return{x:mv.x,y:mv.y,target:null,reach:mv.reach,score:0};
}
function aiMainActionKind(u,target,canFire=true){
  if(target&&target.hp>0&&G.units.includes(target)&&inRange(u,u.x,u.y,target.x,target.y)&&canFire)return'attack';
  if(canCapture(u))return'capture';
  if(canRepair(u))return'repair';
  if(canHeal(u))return'heal';
  return'wait';
}
async function aiAct(u){
  if(u.locked||!storyUnitMayAct(u)){u.acted=true;return;}
  G.sel=u;render();showInfo(u);
  await sleep(200);
  const plan=aiPlan(u);
  if(plan){
    const fx=u.x,fy=u.y; // 记录出发格
    if(plan.x!==u.x||plan.y!==u.y){
      const path=pathTo(plan.reach,plan.x,plan.y);
      SFX.move(u.type);
      await animateMove(u,path);
      resetCaptureOnLeave(u,fx,fy); // 离开城镇：占领进度清零
      if(G.gameMode==='story'){
        const tag=storyTileAt(u.x,u.y)?.tag;
        await runStoryEvents('unitEnterTag',{tag,unit:u});
      }
    }
    const t=plan.target;
    // 间接打击单位（火炮/火箭炮）移动后不能开火，只能原地开火；注意 u.x/u.y 此时已是移动后坐标，须与出发格 fx/fy 比较
    const canFire=!(NO_MOVE_FIRE.includes(u.type)&&!ARTILLERY_MOVE_FIRE&&(fx!==u.x||fy!==u.y));
    const action=aiMainActionKind(u,t,canFire);
    if(action==='attack'&&storyUnitMayAttack(u)){
      await doAttack(u,t);
    }
    // 与玩家一致：攻击、占领、修理、治疗每回合只能选择一个主动作。
    else if(action==='capture')await tryCapture(u);
    else if(action==='repair')tryRepair(u);
    else if(action==='heal')tryHeal(u);
  }
  u.acted=true;G.sel=null;
  checkEnd();
  if(G.over)return;
  render();
}
async function startEnemyPhase(){
  G.busy=true;deselect();
  await runStoryEvents('playerPhaseEnd',{round:G.turn});
  if(G.over)return;
  G.phase='E';
  if(G.gameMode==='story')G.story.flags.weiChanggengBraced=false;
  BGM.setSide('E'); // 敌方回合切换为敌方主题
  render();updateTop();
  log(T('phaseLog')(G.turn,T('phaseE')),'phase');
  SFX.turn();
  collectIncome('E');updateFunds(); // 敌方建筑收入
  healOwnedUnits('E'); // 敌方同样在自己回合开始时由所属建筑回复 2 HP
  await runStoryEvents('enemyPhaseStart',{round:G.turn});
  await sleep(450);
  for(const u of G.units.filter(v=>v.side==='E'&&!v.aboard)){
    if(u.hp<=0||G.over)continue;
    u.acted=false;
    await aiAct(u);
    if(G.over)return;
    await sleep(220);
  }
  aiBuild(); // 敌方回合结束：在己方空工厂造兵（下回合行动，坚守阵地模式下敌方没有工厂，自然跳过）
  await runStoryEvents('enemyPhaseEnd',{round:G.turn});
  await runStoryEvents('roundEnd',{round:G.turn});
  if(G.gameMode==='story'){
    for(const[k,meta]of G.storyTiles||[]){
      if(!meta.tag)continue;
      const cap=G.caps.get(k);
      const capturedRound=G.story.flags[`${meta.tag}CapturedRound`];
      const held=cap?.owner==='P'&&(capturedRound===undefined||G.turn>capturedRound);
      G.story.holdCounts[meta.tag]=held?(G.story.holdCounts[meta.tag]||0)+1:0;
      await runStoryEvents('tagHeldRoundEnd',{tag:meta.tag,count:G.story.holdCounts[meta.tag]});
    }
    const objective=G.story.objective;
    if(objective.kind==='survive'||objective.kind==='eliminateOrSurvive'){
      const coreSecure=G.story.missionId!==17||storyTagOwner('core')!=='P';
      const playerHqIntact=[...G.caps].some(([key,cap])=>{const[x,y]=key.split(',').map(Number);return G.map[y][x]==='hq'&&cap.owner==='P';});
      G.story.flags[`survived-${objective.round}`]=G.turn>=objective.round&&coreSecure&&playerHqIntact;
    }
    const mission=MISSION_DEFS[G.story.missionId];
    if(mission.waves&&G.turn%mission.waves.interval===0){
      const spots=mission.waves.spawns.filter(([x,y])=>!unitAt(x,y));
      const types=mission.waves.types||SIEGE.pool;
      spots.slice(0,mission.waves.count||spots.length).forEach(([x,y],i)=>G.units.push(makeUnit('E',types[i%types.length],x,y)));
    }
    checkStoryEnd();
    if(G.over)return;
  }
  // 坚守阵地：每 waveInterval 回合刷新一波敌方单位，达到总回合数后即存活获胜
  if((G.gameMode==='siege'||G.scenario?.goal.type==='survive')&&G.siege){
    if(G.turn>=G.siege.nextWaveTurn){
      siegeWave();
      G.siege.nextWaveTurn+=SIEGE.waveInterval;
    }
    const total=G.scenario?.goal.turns||SIEGE.totalTurns;
    if(G.turn+1>total){G.over=true;showResult(true,'survive');return;}
  }
  // 新回合：本方建筑回血（只有己方占领的建筑才回血）
  G.turn++;G.phase='P';
  BGM.setSide('P'); // 我方回合切换回我方主题
  collectIncome('P');updateFunds(); // 我方建筑收入
  for(const u of G.units.filter(v=>v.side==='P'))u.acted=false;
  healOwnedUnits('P');
  // 敌军 acted 标记清零（不带入我方回合，避免敌军显示"已行动"样式）
  for(const u of G.units.filter(v=>v.side==='E'))u.acted=false;
  log(T('phaseLog')(G.turn,T('phaseP')),'phase');
  SFX.turn();
  render();updateTop();
  await runStoryEvents('roundStart',{round:G.turn});
  G.busy=false;render();
  saveGame();
}

// ================= 渲染 =================
function updateTop(){
  $('#turnNum').textContent=G.turn;
  const pl=$('#phaseLabel');
  pl.textContent=G.phase==='P'?T('phaseP'):T('phaseE');
  pl.className='phase '+(G.phase==='P'?'p':'e');
  $('#endTurn').disabled=G.phase!=='P'||G.busy||G.over;
}
function render(){
  if(!G)return;
  updateTop();updateFunds();updateScenarioBanner();
  const moveSet=G.reach?G.reach.stoppable:null;
  // 选中时：攻击范围（从移动范围内任意落点可达的攻击格）；view 模式同样显示
  let zoneSet=null,atkSet=null;
  if(G.sel&&(G.mode==='selected'||G.mode==='attack'||G.mode==='acting'||G.mode==='view')){
    atkSet=new Set(targetsFrom(G.sel,G.sel.x,G.sel.y).map(t=>t.id));
    if(G.mode!=='attack'&&G.mode!=='acting'){
      zoneSet=new Set();
      const u=G.sel;
      // 间接打击单位（火炮/火箭炮）移动后不能开火，攻击范围只能按当前位置显示，不能按"移动后落点"展开
      const noMoveFire=NO_MOVE_FIRE.includes(u.type)&&!ARTILLERY_MOVE_FIRE;
      const spots=(G.mode==='selected'&&!noMoveFire)?[...G.reach.stoppable].map(k=>k.split(',').map(Number)):[[u.x,u.y]];
      for(const[sx,sy]of spots){
        for(let dy=-(u.maxR);dy<=u.maxR;dy++)for(let dx=-(u.maxR);dx<=u.maxR;dx++){
          const d=Math.abs(dx)+Math.abs(dy);
          if(d<u.minR||d>u.maxR)continue;
          const tx=sx+dx,ty=sy+dy;
          if(tx<0||ty<0||tx>=G.size||ty>=G.size)continue;
          const occ=unitAt(tx,ty);
          if(occ&&occ.side===u.side)continue;
          zoneSet.add(tx+','+ty);
        }
      }
      // 从攻击范围中去掉纯移动格（蓝橙不重叠，橙=只能打不能停）
      for(const k of[...zoneSet])if(moveSet&&moveSet.has(k))zoneSet.delete(k);
    }
  }
  // 修理/治疗选目标模式：高亮可选目标单位；选中工程师/军医时（selected/acting）同样提示可快捷点选的目标
  let supportSet=null;
  if(G.sel&&(G.mode==='repair'||G.mode==='heal'||((G.mode==='selected'||G.mode==='acting')&&(G.sel.type==='engineer'||G.sel.type==='medic')))){
    const isRepair=G.mode==='repair'||G.sel.type==='engineer';
    const targets=isRepair?repairTargets(G.sel):healTargets(G.sel);
    supportSet=new Set(targets.map(t=>t.id));
  }
  // 运兵车下车选落点模式：高亮可选的相邻空格（按坐标而非单位 id，因为落点本身没有单位）
  let unloadSet=null;
  if(G.sel&&G.mode==='unload'){
    unloadSet=new Set(unloadTargets(G.sel,riderOf(G.sel)).map(t=>t.x+','+t.y));
  }
  updateActionBtns();
  // 移动路径预览：鼠标悬停在可停留格上时，显示从选中单位到该格的路径箭头
  let pathSet=null,pathDirs=null;
  if(G.sel&&G.mode==='selected'&&G.hover&&G.reach.stoppable.has(G.hover.x+','+G.hover.y)){
    const p=pathTo(G.reach,G.hover.x,G.hover.y);
    pathSet=new Set(p.map(([px,py])=>px+','+py));
    pathDirs=new Map();
    for(let i=0;i<p.length;i++){
      const[px,py]=p[i];
      let d='end';
      if(i<p.length-1){const[nx,ny]=p[i+1];d=nx>px?'r':nx<px?'l':ny>py?'d':'u';}
      pathDirs.set(px+','+py,d);
    }
  }
  let html='';
  for(let y=0;y<G.size;y++)for(let x=0;x<G.size;x++){
    const tk=G.map[y][x],t=TERRAINS[tk];
    let cls='cell t-'+tk;
    // 建筑三色：中立/我方/敌军（城镇/工厂/总部统一显示归属）
    let hasCapbar=false;
    if(CAPTURABLE.includes(tk)){
      const c0=G.caps.get(capKey(x,y));
      cls+=c0&&c0.owner?(c0.owner==='P'?' cap-p':' cap-e'):' cap-neutral';
      if(c0&&c0.prog>0&&(!c0.owner||c0.prog<CAP_NEED))hasCapbar=true;
    }
    if(hasCapbar)cls+=' has-capbar';
    const u=unitAt(x,y);
    const isSel=u&&G.sel&&u.id===G.sel.id;
    if(isSel)cls+=' sel'+(G.mode==='view'?' view':'');
    if(moveSet&&moveSet.has(x+','+y)&&!isSel)cls+=' mv'+(G.mode==='view'?' view':'');
    if(zoneSet&&zoneSet.has(x+','+y))cls+=' atkzone';
    if(atkSet&&u&&atkSet.has(u.id))cls+=' atk';
    if(supportSet&&u&&supportSet.has(u.id))cls+=' support';
    if(unloadSet&&unloadSet.has(x+','+y))cls+=' support';
    if(pathSet&&pathSet.has(x+','+y)&&!isSel)cls+=' path';
    const owner=CAPTURABLE.includes(tk)?G.caps.get(capKey(x,y))?.owner:null;
    const cellLabel=[`${t.name} ${x+1},${y+1}`,owner?(owner==='P'?T('myFlag'):T('enFlag')):'',u?`${sideName(u.side)} ${UNIT_TYPES[u.type].name} HP ${u.hp}/${u.maxHp}`:''].filter(Boolean).join('，').replace(/"/g,'&quot;');
    const focused=x===boardFocus.x&&y===boardFocus.y;
    html+=`<div class="${cls}" role="gridcell" tabindex="${focused?0:-1}" aria-label="${cellLabel}"${isSel?' aria-selected="true"':''} data-x="${x}" data-y="${y}">`;
    if(CAPTURABLE.includes(tk)){
      const cap=G.caps.get(capKey(x,y));
      if(cap&&cap.owner)html+=`<span class="flag ${cap.owner==='P'?'fp':'fe'}"></span>`;
      else if(cap&&cap.prog>0)html+=`<span class="flag fc"></span>`; // 占领中：灰色旗
      if(cap&&cap.prog>0&&(!cap.owner||cap.prog<CAP_NEED))html+=`<i class="capbar"><b style="width:${Math.round(cap.prog/CAP_NEED*100)}%"></b></i>`;
    }
    if(u){
      const ratio=u.hp/u.maxHp;
      const hc=ratio>0.6?'':ratio>0.3?' mid':' low';
      const b=UNIT_TYPES[u.type];
      const icon=b.icon?`<i class="uicon ${b.icon}"></i>`:b.emoji;
      const cargo=u.type==='transport'&&riderOf(u)?'<i class="cargo"></i>':'';
      html+=`<span class="unit ${u.side==='P'?'p':'e'}${u.acted?' acted':''}">${icon}${cargo}`
          +`<i class="hpbar"><b class="${hc.trim()}" style="width:${Math.round(ratio*100)}%"></b></i>`
          +(u.level>1?`<em class="lv">${roman(u.level)}</em>`:'')
          +`</span>`;
    }
    if(pathDirs&&pathDirs.has(x+','+y))html+=`<span class="arrow a-${pathDirs.get(x+','+y)}"></span>`;
    html+='</div>';
  }
  const restoreFocus=board.contains?.(document.activeElement);
  board.innerHTML=html;
  if(restoreFocus)board.querySelector(`.cell[data-x="${boardFocus.x}"][data-y="${boardFocus.y}"]`)?.focus();
}
function showInfo(u){
  const el=$('#unitInfo');
  if(!u){
    el.innerHTML=T('unitHint')+'<br><span style="color:var(--dim);font-size:12px">'+T('unitHint2')+'</span>';
    return;
  }
  const b=UNIT_TYPES[u.type],t=terrAt(u.x,u.y),tKey=G.map[u.y][u.x];
  const ratio=u.hp/u.maxHp,hc=ratio>0.6?'':ratio>0.3?'mid':'low';
  const uicon=b.icon?`<i class="uicon ${b.icon}"></i>`:b.emoji;
  const tchip=`<i class="tchip t-${tKey}"></i>`;
  el.innerHTML=`
    <div class="uhead"><span class="uemoji">${uicon}</span>
      <span><span class="uname">${b.name}</span><span class="uside ${u.side==='P'?'p':'e'}">${sideName(u.side)} Lv.${u.level}</span></span>
    </div>
    <div style="font-size:12px;color:var(--dim)">HP ${u.hp}/${u.maxHp}${G.gameMode==='story'?'':`　${T('xp')} ${u.xp}/${30+(u.level-1)*10}`}</div>
    <div class="statbar"><b class="${hc}" style="width:${Math.round(ratio*100)}%"></b></div>
    <div class="stats">
      <span>${T('thAtk')} <b>${u.atk}</b></span><span>${T('thDef')} <b>${u.def}</b></span>
      <span>${T('thMove')} <b>${u.move}</b></span><span>${T('thRange')} <b>${u.minR===u.maxR?u.maxR:u.minR+'-'+u.maxR}</b></span>
    </div>
    <div style="font-size:12px;color:var(--dim);margin-top:6px">${b.desc}<br>${T('onTerrain')}：${tchip} ${t.name}（+${Math.round(t.def*100)}%）${riderOf(u)?`<br>${T('cargoLabel')}${UNIT_TYPES[riderOf(u).type].name}`:''}${u.acted?`<br><b style="color:var(--dim)">${u.side==='P'?T('actedP'):T('actedE')}</b>`:''}${(G.mode==='repair'||G.mode==='heal')&&G.sel&&G.sel.id===u.id?`<br><b style="color:#8ef0ac">${T(G.mode==='repair'?'pickRepair':'pickHeal')}</b>`:''}${G.mode==='unload'&&G.sel&&G.sel.id===u.id?`<br><b style="color:#8ef0ac">${T('pickUnload')}</b>`:''}</div>`;
}
function log(msg,cls='info'){
  const el=$('#log');
  const d=document.createElement('div');
  // 战报敌我着色：消息以"我方"开头用蓝色，以"敌军"开头用红色
  if(cls==='info'||cls==='dim'||cls==='level'||cls==='kill'){
    if(msg.startsWith('我方')||msg.startsWith(T('sideP')))cls='p';
    else if(msg.startsWith('敌军')||msg.startsWith(T('sideE')))cls='e';
  }
  d.className=cls;d.textContent=msg;
  el.appendChild(d);
  el.scrollTop=el.scrollHeight;
}

// ================= 流程 =================
function makeUnit(side,type,x,y,meta={}){
  const b=UNIT_TYPES[type];
  // 敌方强度：只放大敌方单位的 HP 上限（我方恒定 ×1.0），四舍五入且最低 1，避免出现 0/负数 HP
  const mult=side==='E'?(DIFFICULTY_TIERS[G&&G.difficulty]||DIFFICULTY_TIERS.normal).hpMult:1;
  const maxHp=Math.max(1,Math.round(b.hp*mult));
    const level=Math.max(1,meta.level||1),bonus=level-1,storyMaxHp=maxHp+bonus*2;
    const hp=Math.max(1,Math.min(storyMaxHp,meta.hp||Math.round(storyMaxHp*(meta.hpRatio||1))));
    return{id:++uid,side,type,x,y,hp,maxHp:storyMaxHp,atk:b.atk+bonus,def:b.def+bonus,
      move:b.move,minR:b.minR,maxR:b.maxR,level,xp:0,acted:false,rank:meta.rank||'regular',characterId:meta.characterId||null,missionRef:meta.missionRef||null,criticalRule:meta.criticalRule||null,factionTag:meta.factionTag||null,locked:!!meta.locked,traits:meta.traits||[],aiOrder:meta.aiOrder||null};
}
function newGame(size,seed=freshSeed()){
    if(gameModeChoice==='story'){startStoryMission(missionChoice);return;}
  if(gameModeChoice==='academy'){
    const scenario=SCENARIOS[scenarioChoice]||SCENARIOS.basics;
    size=scenario.size;seed=scenario.seed;
  }
  seed=seed>>>0;
  mapRng=createRng(seed);
  gameRng=createRng((seed^0x9E3779B9)>>>0);
  const map=genMap(size);
  G={size,map,mapSeed:seed,mapCode:encodeMapCode(size,seed),units:[],turn:1,phase:'P',sel:null,reach:null,mode:'idle',busy:false,over:false,caps:new Map(),funds:{P:START_FUNDS,E:START_FUNDS},aiStyle:aiStyleChoice,difficulty:difficultyChoice,gameMode:gameModeChoice,troopsTier:troopsChoice};
  uid=0;
  // 出生点按与己方 HQ([1,size-2]) 的距离升序排列，数量少的档位优先使用离 HQ 最近的点，
  // 保证"少/中"档的部队围绕 HQ 分布而不是散落到边缘（原 8 个固定坐标点 + 1 个军医点，合并后统一排序）
  const spawnPool=[[1,size-3],[0,size-2],[2,size-2],[0,size-1],[1,size-1],[0,size-3],[2,size-1],[3,size-1],[3,size-3]];
  const tier=TROOPS_TIERS[troopsChoice]||TROOPS_TIERS.none;
  const spawns=spawnPool.slice(0,tier.count);
  // 兵种池按当前游戏模式过滤：对决模式下原有档位兵种池可能跟模式允许兵种交集为空（例如装甲对决 vs 少档），
  // 这种情况直接退回模式允许的全部兵种，不跟原档位池子取交集；遭遇战（无模式限制）沿用原档位池子
  const allowed=allowedUnitTypes();
  const modePool=GAME_MODES[gameModeChoice]&&GAME_MODES[gameModeChoice].pool?allowed:tier.pool;
  const types=[];
  if(tier.count>0){
    types.push(allowed.includes('infantry')?'infantry':modePool[Math.floor(gameRandom()*modePool.length)]);
    for(let i=1;i<tier.count;i++)types.push(modePool[Math.floor(gameRandom()*modePool.length)]);
  }
  const isSiege=gameModeChoice==='siege';
  spawns.forEach((p,i)=>{
    G.units.push(makeUnit('P',types[i],p[0],p[1]));
    if(!isSiege)G.units.push(makeUnit('E',types[i],size-1-p[0],size-1-p[1])); // 坚守阵地：敌方开局 0 部队，完全靠后续波次刷新
  });
  // 建筑归属：每方固定的 1 总部+1 工厂+1 城镇开局即归属该方（坐标须与 genMap 的 fixedBuilds 公式一致）；
  // 地图上随机分布的中立建筑、奇数尺寸的中心争夺城镇均开局中立
  const fixedCoords=[[2,size-3],[1,size-2],[3,size-2]]; // 左半场（我方）三座固定建筑
  const ownFixed=new Set(fixedCoords.map(([x,y])=>x+','+y));
  const enemyFixed=new Set(fixedCoords.map(([x,y])=>(size-1-x)+','+(size-1-y)));
  // 坚守阵地：敌方没有 HQ/工厂（不走经济系统，"占领敌方总部获胜"和"敌方工厂造兵"因此自然失效），
  // 敌方固定建筑格子改成中立城市；同时按我方初始部队档位在我方半场附近额外放几座固定归属玩家的城市
  if(isSiege){
    for(const[fx,fy]of fixedCoords){
      const[ex,ey]=[size-1-fx,size-1-fy];
      map[ey][ex]='city';
    }
    enemyFixed.clear(); // 敌方固定建筑已改成城市，不再赋予敌方归属，保持中立（敌方在此模式下不需要任何固定资产）
    // 额外城市数量按我方初始部队档位定（少/中/多 → 2/3/4），不新建坐标，
    // 而是从 genMap 已生成的中立城市里挑离己方 HQ([1,size-2]) 最近的几座直接改归属——
    // 这些格子本来就避开了山地/河流/建筑冲突，比额外设计新坐标更安全，且不受初始部队数量多少的影响
    const extraCities=SIEGE.citiesByTier[troopsChoice]||0;
    const [hqX,hqY]=[1,size-2];
    const neutralCities=[];
    for(let y=0;y<size;y++)for(let x=0;x<Math.ceil(size/2);x++){
      if(map[y][x]==='city'&&!ownFixed.has(x+','+y))neutralCities.push([x,y]);
    }
    neutralCities.sort((a,b)=>(Math.abs(a[0]-hqX)+Math.abs(a[1]-hqY))-(Math.abs(b[0]-hqX)+Math.abs(b[1]-hqY)));
    for(const[cx,cy]of neutralCities.slice(0,extraCities))ownFixed.add(cx+','+cy);
  }
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    if(!CAPTURABLE.includes(map[y][x]))continue;
    const k=x+','+y;
    const owner=ownFixed.has(k)?'P':enemyFixed.has(k)?'E':null;
    G.caps.set(k,{owner,prog:owner?CAP_NEED:0});
  }
  if(gameModeChoice==='academy')applyScenario(scenarioChoice);
  if(isSiege)G.siege={nextWaveTurn:SIEGE.waveInterval}; // 下一次刷怪发生在第几回合的敌方阶段
  board.style.setProperty('--n',size);
  fitBoard();
  $('#menu').classList.add('hidden');
  $('#overlay').classList.add('hidden');
  $('#log').innerHTML='';
  log(T('startLog'),'phase');
  collectIncome('P');collectIncome('E');updateFunds(); // 开局无资金，首回合立即按已拥有建筑数结算一次收入
  updateAiStyleTag();updateScenarioBanner();
  SFX.start();
  BGM.start('P'); // 开局播放我方主题 BGM
  render();showInfo(null);saveGame();
}
// header 显示当前对局的敌方 AI 风格（切换语言时也要刷新，故独立成函数供 applyStaticTexts 调用）
function updateAiStyleTag(){
  const el=$('#aiStyleTag');
  if(!el||!G)return;
  const nameKey={balanced:'aiBalanced',aggressive:'aiAggressive',defensive:'aiDefensive'}[G.aiStyle]||'aiBalanced';
  el.textContent=`🤖 ${T(nameKey)}`;
  const mapTag=$('#mapCodeTag');if(mapTag)mapTag.textContent=G.mapCode;
}
function showResult(win,how){
  G.busy=true;G.resultWin=win;G.resultHow=how;
  if(G.gameMode==='story'&&win){
    const losses=G.story.playerLosses||0;
    completeCampaignMission(G.story.missionId,G.turn,losses);
    updateScenarioMenu();
  }
  deleteSave();
  BGM.stop(); // 结束时停止 BGM
  win?SFX.win():SFX.lose();
  renderResult();
  openDialog($('#overlay'));
}
function renderResult(){
  if(!G||!G.over)return;
  const story=G.gameMode==='story',next=story&&G.resultWin?STORY_ORDER[STORY_ORDER.indexOf(G.story.missionId)+1]:undefined;
  $('#resultTitle').textContent=story?(G.resultWin?T('storyDebrief'):T('loseTitle')):(G.resultWin?T('winTitle'):T('loseTitle'));
  $('#resultText').textContent=story&&G.resultWin?`${txt(MISSION_DEFS[G.story.missionId].debrief)} ${T('storyLosses')(G.story.playerLosses||0)}`:(G.resultWin?T('winText')(G.turn,G.resultHow):T('loseText')(G.turn,G.resultHow));
  $('#againBtn').textContent=story?(G.resultWin&&next!==undefined?T('storyNext'):T('storyRetry')):T('again');
}
function toMenu(){
  BGM.stop(); // 返回菜单停止 BGM
  closeDialog($('#overlay'));
  syncMenuChoices();
  openDialog($('#menu'));
  const banner=document.getElementById('scenarioBanner');if(banner)banner.style.display='none';
}

// ================= 事件绑定 =================
// 地图规模选择按钮（主菜单，默认 10；不再点击即开局，改为先选后按「开始游戏」）
document.querySelectorAll('#menu button[data-size]').forEach(b=>{
  b.addEventListener('click',()=>{
    sizeChoice=+b.dataset.size;
    document.querySelectorAll('#menu button[data-size]').forEach(x=>x.classList.toggle('primary',x===b));
  });
});
$('#startGameBtn').addEventListener('click',()=>{
  if(gameModeChoice==='story'){showStoryBriefing(MISSION_DEFS[missionChoice]);return;}
  if(gameModeChoice==='academy'){
    const scenario=SCENARIOS[scenarioChoice]||SCENARIOS.basics;
    newGame(scenario.size,scenario.seed);return;
  }
  const input=$('#mapCodeInput'),raw=input.value.trim();
  const parsed=raw?decodeMapCode(raw):{size:sizeChoice,seed:freshSeed()};
  if(!parsed){$('#mapCodeHint').textContent=T('mapCodeInvalid');return;}
  sizeChoice=parsed.size;input.value=encodeMapCode(parsed.size,parsed.seed);
  $('#mapCodeHint').textContent=T('mapCodeReady')(input.value);
  newGame(parsed.size,parsed.seed);
});
$('#randomMapBtn').addEventListener('click',()=>{
  const code=encodeMapCode(sizeChoice,freshSeed());
  $('#mapCodeInput').value=code;$('#mapCodeHint').textContent=T('mapCodeReady')(code);
});
$('#continueBtn').addEventListener('click',()=>restoreGame());
$('#deleteSaveBtn').addEventListener('click',deleteSave);
$('#endTurn').addEventListener('click',()=>{
  if(G&&!G.busy&&!G.over&&G.phase==='P')startEnemyPhase();
});
$('#waitBtn').addEventListener('click',()=>{
  if(G&&G.sel&&!G.busy&&!G.over&&G.phase==='P')waitUnit();
});
$('#menuBtn').addEventListener('click',()=>{
  if(G&&!G.over&&!confirm(T('backConfirm')))return;
  toMenu();
});
// 语言切换按钮（主菜单）
document.querySelectorAll('.langBtn').forEach(b=>{
  b.addEventListener('click',()=>{setLang(b.dataset.lang);saveSettings();});
});
// AI 风格选择按钮（主菜单）
document.querySelectorAll('#menu button[data-ai]').forEach(b=>{
  b.addEventListener('click',()=>{
    aiStyleChoice=b.dataset.ai;
    document.querySelectorAll('#menu button[data-ai]').forEach(x=>x.classList.toggle('primary',x===b));
  });
});
// 初始部队数目选择按钮（主菜单，默认"无"）
document.querySelectorAll('#menu button[data-troops]').forEach(b=>{
  b.addEventListener('click',()=>{
    troopsChoice=b.dataset.troops;
    document.querySelectorAll('#menu button[data-troops]').forEach(x=>x.classList.toggle('primary',x===b));
  });
});
// 敌方强度选择按钮（主菜单，默认"普通"）
document.querySelectorAll('#menu button[data-diff]').forEach(b=>{
  b.addEventListener('click',()=>{
    difficultyChoice=b.dataset.diff;
    document.querySelectorAll('#menu button[data-diff]').forEach(x=>x.classList.toggle('primary',x===b));
  });
});
// 游戏模式选择按钮（主菜单，默认"遭遇战"）
document.querySelectorAll('#menu button[data-mode]').forEach(b=>{
  b.addEventListener('click',()=>{
    gameModeChoice=b.dataset.mode;
    document.querySelectorAll('#menu button[data-mode]').forEach(x=>x.classList.toggle('primary',x===b));
    updateScenarioMenu();
  });
});
$('#scenarioPicker').addEventListener('change',e=>{if(gameModeChoice==='story')missionChoice=+e.target.value;else scenarioChoice=e.target.value;});
$('#storyBriefingBack').addEventListener('click',()=>{closeDialog($('#storyBriefing'));openDialog($('#menu'));});
$('#storyBriefingStart').addEventListener('click',()=>startStoryMission(missionChoice));
$('#storyChoiceAsh').addEventListener('click',()=>chooseStoryEnding('ash'));
$('#storyChoiceRing').addEventListener('click',declineCoreChoice);
$('#againBtn').addEventListener('click',()=>{
  if(G.gameMode!=='story'){newGame(G.size);return;}
  const current=G.story.missionId,next=STORY_ORDER[STORY_ORDER.indexOf(current)+1];
  if(G.resultWin&&next!==undefined){missionChoice=next;closeDialog($('#overlay'));showStoryBriefing(MISSION_DEFS[next]);}
  else startStoryMission(current);
});
$('#toMenuBtn').addEventListener('click',toMenu);
$('#sndBtn').addEventListener('click',()=>{
  muted=!muted;
  $('#sndBtn').textContent=muted?'🔇':'🔊';
  $('#sndBtn').setAttribute('aria-pressed',String(muted));
  saveSettings();
  BGM.refresh(); // 同步 BGM 静音状态
});
function updateAudioSettings(){
  settings.bgm=+$('#bgmVolume').value/100;settings.sfx=+$('#sfxVolume').value/100;
  saveSettings();BGM.refresh();
}
$('#bgmVolume').addEventListener('input',updateAudioSettings);
$('#sfxVolume').addEventListener('input',updateAudioSettings);
$('#bgmVolume').value=Math.round(settings.bgm*100);
$('#sfxVolume').value=Math.round(settings.sfx*100);
$('#sndBtn').textContent=muted?'🔇':'🔊';
$('#sndBtn').setAttribute('aria-pressed',String(muted));
$('#helpBtn').addEventListener('click',()=>{
  openDialog($('#helpDialog'));
});
$('#helpClose').addEventListener('click',()=>{
  closeDialog($('#helpDialog'));
});
$('#prodClose').addEventListener('click',()=>{
  closeDialog($('#prodDialog'));
  prodFactory=null;
});
$('#menuHelpBtn').addEventListener('click',()=>{
  openDialog($('#helpDialog'));
});
board.addEventListener('focusin',e=>{
  const c=e.target.closest('.cell');if(!c)return;
  boardFocus={x:+c.dataset.x,y:+c.dataset.y};G.hover={...boardFocus};
  c.dispatchEvent(new MouseEvent('mousemove',{bubbles:true}));
});
board.addEventListener('keydown',e=>{
  if(!G)return;
  const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  if(moves[e.key]){
    e.preventDefault();const[dx,dy]=moves[e.key];
    boardFocus={x:Math.max(0,Math.min(G.size-1,boardFocus.x+dx)),y:Math.max(0,Math.min(G.size-1,boardFocus.y+dy))};
    board.querySelectorAll('.cell').forEach(c=>c.tabIndex=-1);
    const next=board.querySelector(`.cell[data-x="${boardFocus.x}"][data-y="${boardFocus.y}"]`);if(next){next.tabIndex=0;next.focus();}
  }else if(e.key==='Enter'||e.key===' '){e.preventDefault();e.target.closest('.cell')?.click();}
  else if(e.key==='Escape'){deselect();}
});
document.addEventListener('keydown',e=>{
  const dialog=[...document.querySelectorAll('.overlay:not(.hidden)')].pop();if(!dialog)return;
  if(e.key==='Escape'&&dialog.id!=='menu'){
    e.preventDefault();const close=dialog.querySelector('#helpClose,#prodClose,#toMenuBtn');close?.click();return;
  }
  if(e.key==='Tab'){
    const items=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')];if(!items.length)return;
    const first=items[0],last=items[items.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
});
document.querySelectorAll('[data-size],[data-ai],[data-troops],[data-diff],[data-mode],.langBtn').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('primary'))));
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-size],[data-ai],[data-troops],[data-diff],[data-mode],.langBtn');if(!b)return;
  const key=b.dataset.size?'size':b.dataset.ai?'ai':b.dataset.troops?'troops':b.dataset.diff?'diff':b.dataset.mode?'mode':'lang';
  document.querySelectorAll(key==='lang'?'.langBtn':`[data-${key}]`).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
});
// 启动时应用静态文案（默认中文）
setLang(settings.lang);
