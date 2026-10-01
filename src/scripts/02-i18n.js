'use strict';
// @bundle i18n
// ================= 多语言（i18n） =================
// 默认中文；主菜单可选 English。所有界面文案集中在此，切换语言后重绘即可。
const I18N={
  zh:{
    title:'⚔️ 迷你高级战争',
    sub:'回合制战棋 · 致敬 GBA《高级战争》· 零依赖即开即玩',
    phaseP:'我方行动', phaseE:'敌方行动', turn:'回合',
    turnPrefix:'第 ', turnSuffix:' 回合',
    sound:'音效开关', help:'帮助', menu:'主菜单', endTurn:'结束回合 ⏭',
    unit:'单位', terrain:'地形', log:'战报',
    unitHint:'点击己方单位开始行动', unitHint2:'点击任意单位可查看详情',
    terrainHint:'鼠标悬停查看地形',
    wait:'⏳ 待机（原地结束行动）',
    actAttack:'⚔️ 攻击', actCapture:'🚩 占领', actRepair:'🔧 修理', actHeal:'⚕️ 治疗',
    pickRepair:'请点击绿框中的载具进行修理', pickHeal:'请点击绿框中的单位进行治疗', pickUnload:'请点击绿框中的空格作为下车位置',
    // 菜单
    mapSize:'选择地图规模（随机对称地图）：',
    sizeS:'小 8×8', sizeSsub:'快节奏', sizeM:'中 10×10', sizeMsub:'标准', sizeL:'大 12×12', sizeLsub:'大地图',
    sizeXL:'特大 14×14', sizeXLsub:'超大地图', sizeXXL:'巨型 16×16', sizeXXLsub:'史诗规模',
    gameModeLabel:'选择游戏模式：',
    modeSkirmish:'⚔️ 遭遇战', modeSkirmishSub:'标准对局，兵种不限',
    modeInfantryDuel:'🪖 步兵对决', modeInfantryDuelSub:'双方只能出非载具单位',
    modeArmorDuel:'🛡️ 装甲对决', modeArmorDuelSub:'双方只能出侦察车/坦克',
    modeArtilleryDuel:'💥 炮兵对决', modeArtilleryDuelSub:'双方只能出火炮/火箭炮',
    modeSiege:'🏰 坚守阵地', modeSiegeSub:'存活 15 回合，敌方持续刷新',
    modeAcademy:'🎓 战术学院', modeAcademySub:'五个教学与挑战场景', scenarioLabel:'教学场景',
    scBasics:'基础行动', scBasicsObj:'移动、攻击，并占领标记城镇',
    scTerrain:'地形与克制', scTerrainObj:'利用森林、山地与重装兵消灭敌军',
    scIndirect:'间接火力', scIndirectObj:'使用火炮在射程外消灭全部目标',
    scTransport:'运兵突破', scTransportObj:'搭载步兵突破防线并占领目标城镇',
    scSiege:'标准坚守', scSiegeObj:'守住总部并存活 15 回合',
    aiStyleLabel:'选择敌方 AI 风格：',
    aiBalanced:'🛡️ 稳健', aiBalancedSub:'不打亏本仗，会避险',
    aiAggressive:'🔥 激进', aiAggressiveSub:'不计代价追求击杀',
    aiDefensive:'🏰 防守', aiDefensiveSub:'占城据守，拖你犯错',
    difficultyLabel:'选择敌方强度：',
    diffTrivial:'😴 白痴', diffTrivialSub:'敌方 HP/收入 ×0.8',
    diffEasy:'🙂 简单', diffEasySub:'敌方 HP/收入 ×0.9',
    diffNormal:'⚖️ 普通', diffNormalSub:'敌方 HP/收入 ×1.0',
    diffHard:'🔥 困难', diffHardSub:'敌方 HP/收入 ×1.1',
    diffHell:'💀 地狱', diffHellSub:'敌方 HP/收入 ×1.2',
    diffNightmare:'☠️ 噩梦', diffNightmareSub:'敌方 HP/收入 ×1.5',
    troopsLabel:'选择初始部队数目：',
    troopsNone:'🚫 无', troopsNoneSub:'0 个单位，纯经济开局',
    troopsFew:'🪖 少', troopsFewSub:'3 个单位',
    troopsMid:'⚔️ 中', troopsMidSub:'6 个单位',
    troopsMany:'🎖️ 多', troopsManySub:'9 个单位',
    quick1:'① 选择模式与地图', quick2:'② 点击己方单位与蓝格移动', quick3:'③ 攻击敌军或占领敌方总部', advancedLabel:'高级对局设置',
    detailHelp:'📖 详细说明（单位 / 颜色图例）',
    startGameBtn:'⚔️ 选择好了，开始游戏！',
    mapCodeLabel:'地图码（留空则随机）：', randomMapBtn:'🎲 随机地图码', mapCodeInvalid:'地图码无效，请使用当前版本的完整地图码。',
    mapCodeReady:(code)=>`本局地图码：${code}`, continueBtn:'▶️ 继续游戏', deleteSaveBtn:'🗑️ 删除存档',
    langLabel:'🌐 Language:',
    // 菜单帮助段落
    m1:'🪖 <b>9 种兵种</b>：🪖步兵（多面手·可占领）· 🛡️重装兵（高攻高防·克制载具）· 🚙侦察车（高速突袭）· <i class="uicon cannon" style="display:inline-block;width:18px;height:18px;vertical-align:-3px"></i>火炮（射程 2-3）· 🔧工程师（占领×1.5+修理）· ⚕️军医（治疗）· <i class="uicon tank" style="display:inline-block;width:18px;height:18px;vertical-align:-3px"></i>坦克（突击主力）· 🚀火箭炮（射程 3-5）· 🚚运兵车（搭载步兵类）',
    m2:'💣 <b>目标</b>：消灭全部敌军，或占领敌方<b>总部</b>（站在敌方总部格上）！点击己方单位 → 点<b>蓝格</b>移动 → 点<b>红框敌人</b>攻击。',
    m3:'🟠<b>橙格</b>=攻击范围（虚线），🔵<b>蓝格</b>=移动范围。再点一次选中单位=取消选择；或点侧栏「⏳ 待机」原地结束行动。',
    m4:'<i class="tchip t-forest"></i>森林 / <i class="tchip t-mountain"></i>山地提供<b>防御加成</b>但移动缓慢，<i class="tchip t-water"></i>河流无法通行，<i class="tchip t-city"></i>城镇/<i class="tchip t-factory"></i>工厂在回合开始时回复 2 HP。<b>每个兵种在不同地形的移动力不同</b>（参考高级战争）：步兵擅长山地，履带单位不能进山，轮胎单位怕森林。',
    m5:'🚩<b>占领建筑</b>：只有步兵/重装兵/工程师能占领（城镇/工厂/总部，工程师 1.5 倍速度）。站上建筑后选择<b>「占领」动作</b>积累进度（进度=当前 HP×倍率，满 20 占领，离开进度清零）。<b>占领敌方总部直接获胜</b>！敌军同样会占领，被夺走的建筑不再为你回血。',
    m6:'🖱️ 选中单位后，鼠标悬停会显示<b>移动路径箭头</b>（绿格+箭头指示方向）；点击敌军可查看其<b>移动/攻击范围</b>。',
    m7:'💥 有命中与会心一击；⬆️ 战斗获得经验并<b>升级</b>——敌军同样会升级，速战速决！🎵 对战有 BGM：我方明快进行曲，敌方紧张小调。',
    m8:'💰 <b>经济与生产</b>：开局无初始资金，首回合立即按已拥有建筑结算收入（每座 +50）。点击<b>己方空工厂</b>打开生产菜单，花钱生产新单位（当回合待机）。敌军也会攒钱造兵，注意扩张经济！',
    // 帮助对话框
    helpTitle:'📖 游戏说明', helpSub:'单位特性 · 颜色图例 · 地形效果',
    hUnit:'单位特性', hLegend:'颜色图例', hTerrain:'地形效果', hCap:'占领规则', hSupport:'辅助单位', hTransport:'运输规则', hLevel:'升级规则', hView:'查看敌军', hCombat:'战斗规则', hEconomy:'经济与生产', hGameMode:'游戏模式', hSiege:'坚守阵地', hAiStyle:'敌方 AI 风格', hDifficulty:'敌方强度', hTroops:'初始部队数目',
    thUnit:'单位', thHp:'HP', thAtk:'攻', thDef:'防', thMove:'移动', thRange:'射程', thTrait:'特性',
    uInf:'多面手，可占领建筑，山地移动力好（普通枪械）', uHeavy:'高攻高防近战主力，移动迟缓，携带反装甲武器克制载具（步兵，可进山）', uRecon:'极速侦察，轻甲炮打不动坦克、装甲薄弱（森林机动尚可，不可入山地）',
    uArtillery:'高爆炮弹对各类目标均有效，移动后不能开火（履带笨重，不可入山地）', uEngineer:'占领 1.5 倍速度，修理相邻载具 +3 HP，无护甲攻击弱', uMedic:'治疗相邻步兵/重装兵/工程师 +4 HP，无护甲攻击弱',
    uTank:'重甲主力，双武器（打载具用坦克炮/打步兵用机枪），平原强势（履带笨重，不可入山地）', uRocket:'高爆炮弹超远程轰击 3-5，移动力低，移动后不能开火（履带笨重）',
    uTransport:'无武装，搭载 1 名步兵类提升机动性，被击毁乘客同死（轻装履带，不可入山地/水域）',
    lMv:'蓝格 = 可移动格子（含地形消耗）', lZone:'橙格虚线 = 攻击范围（只能打，不能停）', lAtk:'红框闪烁 = 当前可攻击的敌人',
    lSel:'金框 = 当前选中的单位', lBase:'蓝底 = 我方单位　红底 = 敌军单位',
    lActed:'灰显 = 我方已行动　虚线框 = 敌军已行动', lPath:'绿格+箭头 = 移动路径预览（悬停显示）',
    lFlag:'<i class="flag" style="display:inline-block;width:12px;height:16px;position:relative;vertical-align:-3px"></i>旗帜 = 城镇归属（蓝=我方，红=敌军，灰=占领中）', lLv:'右上角 I / II / III… = 单位等级（罗马数字）',
    tForest:'<i class="tchip t-forest"></i> 森林：防御 +20%，步兵消耗 1 / 轮胎 2 / 履带 3（履带笨重、轮胎轻便）', tMountain:'<i class="tchip t-mountain"></i> 山地：防御 +40%，步兵消耗 2 / 载具不可入',
    tWater:'<i class="tchip t-water"></i> 河流：不可通行（浅滩可过）', tCity:'<i class="tchip t-city"></i> 城镇：防御 +30%，回合开始回复 2 HP（仅限己方占领的建筑）', tPlain:'<i class="tchip t-plain"></i> 平原：无加成，所有兵种消耗均为 1',
    tHq:'<i class="tchip t-hq"></i> 总部：防御 +40%，占领敌方总部获胜，己方总部被占战败', tFactory:'<i class="tchip t-factory"></i> 工厂：防御 +30%，回合开始回复 2 HP，可修理驻守载具',
    capRule:'<b>建筑归属</b>：开局时每方后方固定的 1 座总部 + 1 座工厂 + 1 座城镇<b>已经属于该方</b>；地图上其余随机分布的城镇/工厂（数量随地图大小变化）以及大地图正中心的争夺城镇均为<b>中立</b>（灰色）。双方都可以占领<b>中立建筑</b>或<b>对方已占领的建筑（含总部）</b>，占领后归属会互相易手。<br>只有<b>步兵</b>、<b>重装兵</b>和<b>工程师</b>能占领建筑，工程师 1.5 倍速度。站在建筑上选择<b>「占领」动作</b>才会积累进度（进度 = 单位当前 HP×倍率，满 20 占领）。<b>离开建筑后进度清零</b>。占领后建筑插上本方旗帜，只有己方建筑才回血。敌军同样会占领，被夺走的建筑会变红旗。<b>占领敌方总部直接获胜，己方总部被占直接战败</b>。',
    supRule:'🔧 <b>工程师</b>：占领 1.5 倍速度，选中后若相邻有受损载具（侦察车/火炮/坦克/火箭炮/运兵车）会显示绿框，<b>直接点击绿框目标</b>即可修理 +3 HP，也可以先点"修理"按钮再选目标，两种方式等效。<br>⚕️ <b>军医</b>：选中后若相邻有受损步兵/重装兵/工程师会显示绿框，<b>直接点击绿框目标</b>即可治疗 +4 HP，同样也可以先点"治疗"按钮再选目标。相邻有多个可选目标时可自由选择要救哪一个。两者攻击都很弱，注意保护。移动或原地不动都可以发起修理/治疗，不强制先移动。',
    transRule:'🚚 <b>运兵车</b>：无武装载具，移动力 5，不可进山地/水域。移动到己方空运兵车所在格即可<b>上车</b>（步兵/重装兵/工程师/军医均可搭乘，限 1 人），上车后乘客不再单独占格、不能行动，直到下车。<br>选中运兵车后若相邻有空位，可点击"下车"按钮，棋盘上所有可用的相邻空格会显示绿框，<b>点击其中一个即可选择乘客下车的具体位置</b>，下车后当回合仍可行动；运兵车本身行动结束。<b>运兵车被击毁时，车内乘客一同阵亡</b>，注意保护。',
    lvlRule:'命中 +8、击毁 +25 经验。<b>辅助单位也有升级途径</b>：占领成功 +8、修理/治疗 +6 经验。升级（上限 <b>Lv.V</b>）攻 +1 防 +1 HP 上限 +2，并恢复 3 HP；升级所需经验递增（30/40/50/60），成长曲线平滑；满级后再获得经验转为恢复 3 HP。敌军同样会升级。',
    viewRule:'点击敌军单位（或已行动的我方单位）可查看其<b>移动范围（半透明蓝格）和攻击范围（橙格虚线）</b>，但不能操作。再点一次取消。',
    combatRule:'命中 90%，会心一击 9%（1.5 倍伤害）；反击伤害为 70%。<b>伤害浮动</b>：每次攻击的基础伤害会在 ±15% 范围内随机浮动（不含会心与反击系数），同样的兵种/血量/地形对拼，实际伤害每次会有小幅差异，这是有意为之的设计，避免数值过于死板可预测。<b>武器与护甲系统</b>：步兵/工程师/军医用普通枪械，对轻甲载具（侦察车/运兵车）伤害打六折、对重甲（坦克）只有三折；侦察车用轻甲炮，能欺负步兵和轻载具，但打不动坦克；重装兵携带反装甲武器，打载具时切换使用（对轻甲 1.5 倍、对重甲仍有 0.7 倍），打步兵类则用普通枪械；坦克配备双武器，打载具用坦克炮、打步兵类用机枪；火炮/火箭炮为高爆炮弹，对人类目标和载具都有一定杀伤但不会秒杀。军医/工程师是非战斗单位，无护甲、攻击力很弱。<b>火炮/火箭炮移动后不能开火，只能原地待机开火</b>；其他单位可移动后攻击。不同兵种有专属的攻击/移动音效。战报中我方消息蓝色、敌军消息红色。',
    knowBtn:'知道了',
    // 战斗文案
    atkLog:(a,d)=>`${sideName(a.side)} ${UNIT_TYPES[a.type].name} 攻击 ${sideName(d.side)} ${UNIT_TYPES[d.type].name}！`,
    counter:'反击！', dodged:'……被闪避了！', remain:(n,m)=>`${UNIT_TYPES?UNIT_TYPES[n].name:n} 剩余 ${m} HP`,
    killLog:(a,d)=>`💥 ${sideName(a.side)} ${UNIT_TYPES[a.type].name} 击毁了 ${sideName(d.side)} ${UNIT_TYPES[d.type].name}！`,
    cargoLostLog:(t)=>`💀 运兵车被击毁，车内的 ${UNIT_TYPES[t].name} 一同阵亡！`,
    loadLog:(t)=>`🚚 ${UNIT_TYPES[t].name} 登上了运兵车`,
    unloadLog:(t)=>`⬇️ ${UNIT_TYPES[t].name} 下车了`,
    lvlUp:(s,t,l)=>`⬆️ ${sideName(s)} ${UNIT_TYPES[t].name} 升到 Lv.${l}！（攻+1 防+1 HP+2）`,
    maxLvl:(s,t)=>`✚ ${sideName(s)} ${UNIT_TYPES[t].name} 已满级，经验转为恢复 3 HP`,
    capOk:(s)=>`${sideName(s)} ${''}占领了城镇！`,
    capFail:(s,p)=>`${sideName(s)} ${''}占领进度 ${p}/20`,
    capVerb:'占领', takeVerb:'夺取',
    capFloatP:'🚩占领!', capFloatE:'⚠️失守',
    leaveLog:(t)=>`${UNIT_TYPES[t].name} 离开城镇，占领进度清零`,
    repairLog:(s,t)=>`🔧 ${sideName(s)} 工程师修理了 ${UNIT_TYPES[t].name}（+3 HP）`,
    healLog:(s,t)=>`⚕️ ${sideName(s)} 军医治疗了 ${UNIT_TYPES[t].name}（+4 HP）`,
    waitLog:(t)=>`${UNIT_TYPES[t].name} 待机。`,
    phaseLog:(n,who)=>`—— 第 ${n} 回合：${who} ——`,
    startLog:'⚔️ 战斗开始！消灭所有敌军或占领敌方总部即可获胜。',
    // 经济与生产
    incomeLog:(s,inc,n,mult)=>`${sideName(s)} 💵 收入 +${inc}（${n} 座建筑 × ${INCOME_PER}${mult&&mult!==1?` × ${mult}`:''}）`,
    buildLog:(s,t)=>`🏭 ${sideName(s)} 生产了 ${UNIT_TYPES[t].name}！`,
    siegeWaveLog:(n)=>`🏰 敌方新增一波部队（${n} 个单位）！`,
    prodTitle:'🏭 生产单位', prodCancel:'取消', prodHint:'点击工厂生产单位',
    prodFunds:(f)=>`💰 资金：${f}`,
    ecoRule:'💵 开局无初始资金，第 1 回合就会按开局拥有的建筑数结算一次收入；此后每回合开始时，每座己方建筑（城镇/工厂/总部）提供 <b>+50</b> 资金。点击<b>己方空工厂</b>打开生产菜单：选择兵种并支付造价（步兵/工程师/军医最便宜、火箭炮最贵），新单位当回合待机、下回合行动。每方场上单位上限 12。敌军同样会收入并生产单位。',
    gameModeRule:'开局前可在主菜单选择游戏模式，限制双方（含工厂生产）能出的兵种：<br>⚔️ <b>遭遇战</b>：标准对局，不限制兵种，即本文档其它章节描述的默认玩法。<br>🪖 <b>步兵对决</b>：双方只能出非载具单位（步兵/重装兵/工程师/军医）。<br>🛡️ <b>装甲对决</b>：双方只能出侦察车/坦克。<br>💥 <b>炮兵对决</b>：双方只能出火炮/火箭炮。<br>🏰 <b>坚守阵地</b>：生存模式，规则与其它模式不同，见下方专门说明。<br>三种对决模式下运兵车均不开放（无武装，对决模式里没有战斗意义）；初始部队数目的随机池会自动按当前模式过滤。',
    siegeRule:'🏰 敌方开局<b>没有总部和工厂</b>（不参与经济系统），我方开局部队数目仍可选无/少/中/多，且我方会额外获得对应数量的城市（无=0、少=2、中=3、多=4 座，地图中立城市不足时按实际数量给）。<br>敌方每 <b>3 回合</b>刷新一波部队，直接在敌方出生点附近凭空生成，不需要经济或工厂；每波预算在 <b>300~600</b> 资金之间随机，按现有造价表贪心随机选兵直到用完预算，兵种覆盖全部 9 种（含坦克/火箭炮），出生点已满时会跳过当波刷新。每方单位数量上限 12，敌方也不例外。<br><b>目标是活到第 15 回合</b>：坚持到底即获胜，己方总部被占则立刻战败。<b>此模式下歼灭全部敌军不算获胜</b>——敌方会持续刷新，没有"消灭干净"这回事。',
    aiStyleRule:'开局前可在主菜单选择敌方风格（对局中显示在顶部）：<br>🛡️ <b>稳健</b>：不打亏本仗——打不死目标且反击代价过高时会放弃进攻；残血单位会主动撤退到更安全的格子；优先补刀能击杀的目标。<br>🔥 <b>激进</b>：几乎不考虑自身安危，一切以最大化本次伤害/击杀数为目标，即使两败俱伤也会进攻。<br>🏰 <b>防守</b>：不主动追击玩家，优先占领中立/被夺走的建筑，无仗可打时原地据守，靠国力和地形拖时间。',
    difficultyRule:'开局前可在主菜单选择敌方强度，同时放大敌方单位的 <b>HP 上限</b>和<b>每回合收入</b>（开局单位、工厂新造单位、每回合结算均生效），不影响我方、不影响 AI 决策风格，可与任意 AI 风格自由组合：<br>😴 <b>白痴</b>：敌方 HP/收入 ×0.8　｜　🙂 <b>简单</b>：敌方 HP/收入 ×0.9　｜　⚖️ <b>普通</b>：敌方 HP/收入 ×1.0（默认）<br>🔥 <b>困难</b>：敌方 HP/收入 ×1.1　｜　💀 <b>地狱</b>：敌方 HP/收入 ×1.2　｜　☠️ <b>噩梦</b>：敌方 HP/收入 ×1.5',
    troopsRule:'开局前可在主菜单选择双方的初始部队规模，四档均为双方对称配置：<br>🚫 <b>无</b>：0 个单位，双方只有 HQ+工厂+城镇，完全靠收入慢慢造兵。<br>🪖 <b>少</b>：3 个单位（1 个必选步兵 + 2 个随机，随机池：步兵/重装兵/工程师/军医）。<br>⚔️ <b>中</b>：6 个单位（1 个必选步兵 + 5 个随机，随机池：步兵/重装兵/侦察车/火炮/工程师/军医/运兵车）。<br>🎖️ <b>多</b>：9 个单位（1 个必选步兵 + 8 个随机，随机池：全部 9 种兵种，坦克/火箭炮仅此档可能出现）。<br>随机池均包含步兵自身在内，可能重复抽到步兵；出生点围绕各自 HQ 就近分布。',
    // 结果
    winTitle:'🎉 胜利！', loseTitle:'💀 战败……',
    winText:(n,how)=>how==='hq'?`历经 ${n} 回合占领了敌方总部！`:how==='survive'?`坚守 ${n} 回合，成功守住阵地！`:`历经 ${n} 回合消灭了全部敌军！`, loseText:(n,how)=>how==='hq'?`己方总部于第 ${n} 回合被占领，再接再厉！`:`我军全灭于第 ${n} 回合，再接再厉！`,
    again:'再来一局', backMenu:'返回菜单', backConfirm:'返回主菜单？当前进度将丢失',
    // 单位卡
    actedP:'已行动（灰显）', actedE:'已行动（虚线框）', onTerrain:'所在地形',
    // 地形悬停
    myFlag:'🚩我方占领', enFlag:'⚠️敌军占领', capturing:'占领中', neutral:'中立', prog:'进度',
    defBonus:'防御加成', moveCost:'移动消耗', impassable:'不可通行',
    // 兵种名
    nInfantry:'步兵', nHeavy:'重装兵', nRecon:'侦察车', nArtillery:'火炮', nEngineer:'工程师', nMedic:'军医', nTank:'坦克', nRocket:'火箭炮', nTransport:'运兵车',
    // 兵种描述
    dInfantry:'多面手，擅长山地作战，可占领建筑（普通枪械）', dHeavy:'高攻高防近战主力，移动迟缓，携带反装甲武器（对轻甲 1.5 倍、对重甲 0.7 倍伤害），打步兵类用普通枪械（步兵，可进山）', dRecon:'极速侦察，轻甲炮对人和轻甲有效但打不动坦克、装甲薄弱（森林机动尚可，不可入山地）',
    dArtillery:'高爆炮弹对各类目标均有效但不会秒杀，移动后不能开火（履带笨重，不可入山地）', dEngineer:'占领速度×1.5，修理相邻载具（+3 HP），非战斗单位无护甲、攻击很弱', dMedic:'治疗相邻步兵/重装兵/工程师（+4 HP），非战斗单位无护甲、攻击很弱',
    dTank:'重甲主力，双武器：打载具用坦克炮、打步兵类用机枪，平原强势（履带笨重，不可入山地）', dRocket:'高爆炮弹超远程轰击 3-5，移动力低，移动后不能开火（履带笨重）',
    dTransport:'无武装运输车，可搭载 1 名步兵类单位提升机动性（轻装履带，不可入山地/水域），被击毁时车内乘客一同阵亡',
    actLoad:'🚚 上车', actUnload:'⬇️ 下车', cargoLabel:'🚚 车内：',
    sideP:'我方', sideE:'敌军',
  },
  en:{
    title:'⚔️ Mini Advance Wars',
    sub:'Turn-based strategy · Inspired by GBA Advance Wars · Zero dependencies',
    phaseP:'Your turn', phaseE:'Enemy turn', turn:'Turn',
    turnPrefix:'Turn ', turnSuffix:'',
    sound:'Sound', help:'Help', menu:'Menu', endTurn:'End Turn ⏭',
    unit:'Unit', terrain:'Terrain', log:'Battle Log',
    unitHint:'Click your unit to act', unitHint2:'Click any unit for details',
    terrainHint:'Hover a tile for info',
    wait:'⏳ Wait (end action in place)',
    actAttack:'⚔️ Attack', actCapture:'🚩 Capture', actRepair:'🔧 Repair', actHeal:'⚕️ Heal',
    pickRepair:'Click a highlighted vehicle to repair it', pickHeal:'Click a highlighted unit to heal it', pickUnload:'Click a highlighted tile to disembark there',
    mapSize:'Choose map size (random symmetric map):',
    sizeS:'Small 8×8', sizeSsub:'Quick', sizeM:'Medium 10×10', sizeMsub:'Standard', sizeL:'Large 12×12', sizeLsub:'Big map',
    sizeXL:'X-Large 14×14', sizeXLsub:'Huge map', sizeXXL:'Giant 16×16', sizeXXLsub:'Epic scale',
    gameModeLabel:'Choose game mode:',
    modeSkirmish:'⚔️ Skirmish', modeSkirmishSub:'Standard match, all units allowed',
    modeInfantryDuel:'🪖 Infantry Duel', modeInfantryDuelSub:'Both sides: foot units only',
    modeArmorDuel:'🛡️ Armor Duel', modeArmorDuelSub:'Both sides: recon/tank only',
    modeArtilleryDuel:'💥 Artillery Duel', modeArtilleryDuelSub:'Both sides: artillery/rocket only',
    modeSiege:'🏰 Hold the Line', modeSiegeSub:'Survive 15 turns, enemy respawns endlessly',
    modeAcademy:'🎓 Tactics Academy', modeAcademySub:'Five guided scenarios and challenges', scenarioLabel:'Tutorial scenario',
    scBasics:'Core Actions', scBasicsObj:'Move, attack, and capture the marked city',
    scTerrain:'Terrain & Counters', scTerrainObj:'Use forests, mountains, and heavies to defeat the enemy',
    scIndirect:'Indirect Fire', scIndirectObj:'Use artillery range to destroy every target',
    scTransport:'Transport Breakthrough', scTransportObj:'Carry infantry through the line and capture the target city',
    scSiege:'Standard Holdout', scSiegeObj:'Defend your HQ and survive 15 turns',
    aiStyleLabel:'Choose enemy AI style:',
    aiBalanced:'🛡️ Balanced', aiBalancedSub:'No bad trades, plays it safe',
    aiAggressive:'🔥 Aggressive', aiAggressiveSub:'Chases kills at any cost',
    aiDefensive:'🏰 Defensive', aiDefensiveSub:'Turtles and captures, waits you out',
    difficultyLabel:'Choose enemy difficulty:',
    diffTrivial:'😴 Trivial', diffTrivialSub:'Enemy HP/income ×0.8',
    diffEasy:'🙂 Easy', diffEasySub:'Enemy HP/income ×0.9',
    diffNormal:'⚖️ Normal', diffNormalSub:'Enemy HP/income ×1.0',
    diffHard:'🔥 Hard', diffHardSub:'Enemy HP/income ×1.1',
    diffHell:'💀 Hell', diffHellSub:'Enemy HP/income ×1.2',
    diffNightmare:'☠️ Nightmare', diffNightmareSub:'Enemy HP/income ×1.5',
    troopsLabel:'Choose starting troop size:',
    troopsNone:'🚫 None', troopsNoneSub:'0 units, pure economy start',
    troopsFew:'🪖 Few', troopsFewSub:'3 units',
    troopsMid:'⚔️ Medium', troopsMidSub:'6 units',
    troopsMany:'🎖️ Many', troopsManySub:'9 units',
    quick1:'① Pick a mode and map', quick2:'② Select a unit and move on blue tiles', quick3:'③ Defeat the enemy or capture HQ', advancedLabel:'Advanced match settings',
    detailHelp:'📖 Details (units / color legend)',
    startGameBtn:'⚔️ Ready — Start Game!',
    mapCodeLabel:'Map code (blank = random):', randomMapBtn:'🎲 Random Map Code', mapCodeInvalid:'Invalid map code. Enter a complete code for the current version.',
    mapCodeReady:(code)=>`Current map code: ${code}`, continueBtn:'▶️ Continue', deleteSaveBtn:'🗑️ Delete Save',
    langLabel:'🌐 Language:',
    m1:'🪖 <b>9 unit types</b>: 🪖Infantry (versatile, can capture) · 🛡️Heavy (high ATK/DEF, anti-vehicle) · 🚙Recon (fast raider) · <i class="uicon cannon" style="display:inline-block;width:18px;height:18px;vertical-align:-3px"></i>Cannon (range 2-3) · 🔧Engineer (1.5× capture + repair) · ⚕️Medic (heals) · <i class="uicon tank" style="display:inline-block;width:18px;height:18px;vertical-align:-3px"></i>Tank (assault main force) · 🚀Rocket (range 3-5) · 🚚Transport (carries foot units)',
    m2:'💣 <b>Goal</b>: destroy all enemies or capture the enemy <b>HQ</b>! Click your unit → <b>blue tile</b> to move → <b>red-outlined enemy</b> to attack.',
    m3:'🟠<b>Orange</b> = attack range (dashed), 🔵<b>blue</b> = move range. Click the selected unit again to cancel; or use "⏳ Wait" to end in place.',
    m4:'<i class="tchip t-forest"></i>Forest / <i class="tchip t-mountain"></i>mountain give <b>defense bonus</b> but slow movement, <i class="tchip t-water"></i>river is impassable, <i class="tchip t-city"></i>city/<i class="tchip t-factory"></i>factory heal 2 HP at turn start. <b>Each unit type has different move costs per terrain</b> (Advance Wars style): infantry excel in mountains, treads cannot enter mountains, tires fear forests.',
    m5:'🚩<b>Capture</b>: only infantry/heavies/engineers capture (cities/factories/HQ, engineer 1.5×). Stand on a building and choose the <b>Capture action</b> to build progress (progress = HP × multiplier, 20 to capture, <b>progress resets when leaving</b>). <b>Capturing the enemy HQ wins instantly</b>! Enemies capture too.',
    m6:'🖱️ After selecting, hover shows the <b>move path arrows</b>; click an enemy to inspect its <b>move/attack range</b>.',
    m7:'💥 Hits and crits; ⬆️ gain XP and <b>level up</b> — enemies level up too! 🎵 Battle BGM: upbeat march for you, tense minor for the enemy.',
    m8:'💰 <b>Economy & production</b>: there are no starting funds; turn 1 immediately settles income from owned buildings (+50 each). Click <b>your empty factory</b> to open the production menu and spend funds on new units (they wait this turn). The enemy saves money and builds too — expand your economy!',
    helpTitle:'📖 How to Play', helpSub:'Unit traits · Color legend · Terrain effects',
    hUnit:'Unit Traits', hLegend:'Color Legend', hTerrain:'Terrain', hCap:'Capture Rules', hSupport:'Support Units', hTransport:'Transport Rules', hLevel:'Leveling', hView:'Inspect Enemies', hCombat:'Combat Rules', hEconomy:'Economy & Production', hGameMode:'Game Modes', hSiege:'Hold the Line', hAiStyle:'Enemy AI Style', hDifficulty:'Enemy Difficulty', hTroops:'Starting Troops',
    thUnit:'Unit', thHp:'HP', thAtk:'ATK', thDef:'DEF', thMove:'MOV', thRange:'RNG', thTrait:'Trait',
    uInf:'Versatile, can capture, good mountain mobility (small arms)', uHeavy:'Strong melee main force, sluggish, carries an anti-armor weapon vs vehicles (infantry, can enter mountains)', uRecon:'Blazing-fast scout, light-armor gun can\'t dent tanks, weak armor (decent in forest, no mountains)',
    uArtillery:'High-explosive shells hurt any target, cannot fire after moving (heavy treads, no mountains)', uEngineer:'1.5× capture, repairs adjacent vehicles +3 HP, unarmored and weak in combat', uMedic:'Heals adjacent infantry/heavies/engineers +4 HP, unarmored and weak in combat',
    uTank:'Heavy armor, dual weapons (tank gun vs vehicles / machine gun vs infantry), strong on plains (heavy treads, no mountains)', uRocket:'High-explosive shells, ultra long-range fire 3-5, low mobility, cannot fire after moving (heavy treads)',
    uTransport:'Unarmed, carries 1 foot unit for extra mobility; cargo dies with it (light treads, no mountains/water)',
    lMv:'Blue = movable tiles (terrain cost included)', lZone:'Orange dashed = attack range (fire only, cannot stop)', lAtk:'Red pulse = attackable enemy now',
    lSel:'Gold outline = selected unit', lBase:'Blue base = your unit　Red base = enemy unit',
    lActed:'Gray = your unit acted　Dashed = enemy acted', lPath:'Green + arrows = move path preview (hover)',
    lFlag:'<i class="flag" style="display:inline-block;width:12px;height:16px;position:relative;vertical-align:-3px"></i>Flag = city owner (blue=yours, red=enemy, gray=capturing)', lLv:'Top-right I / II / III… = unit level (Roman)',
    tForest:'<i class="tchip t-forest"></i> Forest: DEF +20%, infantry 1 / tires 2 / heavy treads 3 (treads are sluggish, tires are nimble)', tMountain:'<i class="tchip t-mountain"></i> Mountain: DEF +40%, infantry 2 / vehicles blocked',
    tWater:'<i class="tchip t-water"></i> River: impassable (fords passable)', tCity:'<i class="tchip t-city"></i> City: DEF +30%, heals 2 HP at turn start (owned buildings only)', tPlain:'<i class="tchip t-plain"></i> Plain: no bonus, cost 1 for every unit',
    tHq:'<i class="tchip t-hq"></i> HQ: DEF +40%, capturing the enemy HQ wins, losing yours means defeat', tFactory:'<i class="tchip t-factory"></i> Factory: DEF +30%, heals 2 HP at turn start, repairs garrisoned vehicles',
    capRule:'<b>Ownership</b>: each side\'s fixed rear HQ + factory + city already belong to that side at the start; every other city/factory scattered across the map (the count scales with map size), plus the contested city at the exact center of odd-sized maps, start <b>neutral</b> (gray). Either side can capture a <b>neutral building</b> or one <b>already held by the other side (including HQ)</b> — ownership flips on capture.<br>Only <b>infantry</b>, <b>heavies</b> and <b>engineers</b> capture buildings, engineer 1.5×. Standing on a building and choosing the <b>Capture action</b> builds progress (progress = HP × multiplier, 20 to capture). <b>Progress resets to 0 when the unit leaves</b>. Captured buildings fly your flag; only owned buildings heal. Enemies capture too. <b>Capturing the enemy HQ wins instantly; losing your own HQ means defeat</b>.',
    supRule:'🔧 <b>Engineer</b>: 1.5× capture speed; when selected, a damaged adjacent vehicle (recon/artillery/tank/rocket/transport) is highlighted green — <b>click it directly</b> to repair +3 HP, or click "Repair" first then pick a target, either works.<br>⚕️ <b>Medic</b>: when selected, a damaged adjacent infantry/heavy/engineer is highlighted green — <b>click it directly</b> to heal +4 HP, or click "Heal" first then pick a target. Pick freely when multiple targets are adjacent. Both are weak in combat — protect them. Either can act from a move or in place, moving first is not required.',
    transRule:'🚚 <b>Transport</b>: unarmed vehicle, move 5, cannot enter mountains/water. Move onto a friendly empty transport\'s tile to <b>board</b> it (infantry/heavy/engineer/medic can ride, 1 at a time); the rider then no longer occupies its own tile or acts, until it disembarks.<br>Select the transport and click "Unload" if an adjacent tile is free — every available adjacent tile is highlighted green, and <b>clicking one picks exactly where the rider disembarks</b>; the rider can still act this turn, and the transport\'s own action ends. <b>If the transport is destroyed, its cargo is destroyed too</b> — keep it protected.',
    lvlRule:'Hit +8, destroy +25 XP. <b>Support units level too</b>: capture +8, repair/heal +6 XP. Level up (cap <b>Lv.V</b>) grants +1 ATK +1 DEF +2 HP and heals 3 HP; XP needed rises each level (30/40/50/60) for a smooth curve; at max level excess XP heals 3 HP. Enemies level up too.',
    viewRule:'Click an enemy (or an acted unit of yours) to inspect its <b>move range (translucent blue) and attack range (dashed orange)</b> — view only. Click again to cancel.',
    combatRule:'90% hit, 9% crit (1.5×); counterattack deals 70%. <b>Damage variance</b>: every hit\'s base damage is randomized within ±15% (before crit/counter multipliers) — the same matchup at the same HP and terrain will deal slightly different damage each time, by design, so combat never feels perfectly predictable. <b>Weapons &amp; armor</b>: infantry/engineer/medic carry small arms — 0.6× against light-armored vehicles (recon/transport), only 0.3× against heavy armor (tank); recon\'s light-armor gun bullies infantry and light vehicles but barely scratches tanks; heavy infantry switches to an anti-armor weapon against vehicles (1.5× vs light armor, still 0.7× vs heavy armor) and small arms otherwise; tanks carry two weapons — a tank gun against vehicles, a machine gun against infantry-type units; artillery/rockets fire high-explosive shells that hurt both infantry and vehicles without one-shotting anything. Engineers/medics are unarmored non-combatants with weak attack. <b>Artillery/rocket cannot fire after moving — they must wait in place to fire</b>; other units may move then attack. Each unit type has its own attack/move sound. Player log is blue, enemy log is red.',
    knowBtn:'Got it',
    atkLog:(a,d)=>`${sideName(a.side)} ${UNIT_TYPES[a.type].name} attacks ${sideName(d.side)} ${UNIT_TYPES[d.type].name}!`,
    counter:'Counterattack!', dodged:'…dodged!', remain:(n,m)=>`${UNIT_TYPES[n].name} has ${m} HP left`,
    killLog:(a,d)=>`💥 ${sideName(a.side)} ${UNIT_TYPES[a.type].name} destroyed ${sideName(d.side)} ${UNIT_TYPES[d.type].name}!`,
    cargoLostLog:(t)=>`💀 The transport was destroyed — the ${UNIT_TYPES[t].name} aboard was lost too!`,
    loadLog:(t)=>`🚚 The ${UNIT_TYPES[t].name} boarded the transport`,
    unloadLog:(t)=>`⬇️ The ${UNIT_TYPES[t].name} disembarked`,
    lvlUp:(s,t,l)=>`⬆️ ${sideName(s)} ${UNIT_TYPES[t].name} reached Lv.${l}! (ATK+1 DEF+1 HP+2)`,
    maxLvl:(s,t)=>`✚ ${sideName(s)} ${UNIT_TYPES[t].name} is max level, XP converted to 3 HP heal`,
    capOk:(s)=>`${sideName(s)} captured the city!`,
    capFail:(s,p)=>`${sideName(s)} capture progress ${p}/20`,
    capVerb:'captured', takeVerb:'seized',
    capFloatP:'🚩Captured!', capFloatE:'⚠️Lost!',
    leaveLog:(t)=>`${UNIT_TYPES[t].name} left the city — capture progress reset`,
    repairLog:(s,t)=>`🔧 ${sideName(s)} Engineer repaired ${UNIT_TYPES[t].name} (+3 HP)`,
    healLog:(s,t)=>`⚕️ ${sideName(s)} Medic healed ${UNIT_TYPES[t].name} (+4 HP)`,
    waitLog:(t)=>`${UNIT_TYPES[t].name} waits.`,
    phaseLog:(n,who)=>`—— Turn ${n}: ${who} ——`,
    startLog:'⚔️ Battle start! Destroy all enemies or capture the enemy HQ to win.',
    incomeLog:(s,inc,n,mult)=>`${sideName(s)} 💵 Income +${inc} (${n} buildings × ${INCOME_PER}${mult&&mult!==1?` × ${mult}`:''})`,
    buildLog:(s,t)=>`🏭 ${sideName(s)} built a ${UNIT_TYPES[t].name}!`,
    siegeWaveLog:(n)=>`🏰 A new enemy wave arrived (${n} units)!`,
    prodTitle:'🏭 Build Unit', prodCancel:'Cancel', prodHint:'Click factory to build',
    prodFunds:(f)=>`💰 Funds: ${f}`,
    ecoRule:'💵 No starting funds — turn 1 immediately settles income based on the buildings you own at kickoff; after that, every owned building (city/factory/HQ) grants <b>+50</b> funds at the start of each turn. Click <b>your empty factory</b> to open the production menu: pick a unit and pay its cost (infantry/engineer/medic cheapest, rocket priciest); new units wait this turn and act next turn. Max 12 units per side. The enemy collects income and builds units too.',
    gameModeRule:'Pick a game mode before starting — it restricts which units either side (including factory production) can field:<br>⚔️ <b>Skirmish</b>: standard match, no unit restrictions — the default mode described throughout the rest of this document.<br>🪖 <b>Infantry Duel</b>: both sides limited to foot units (infantry/heavy/engineer/medic).<br>🛡️ <b>Armor Duel</b>: both sides limited to recon/tank.<br>💥 <b>Artillery Duel</b>: both sides limited to artillery/rocket.<br>🏰 <b>Hold the Line</b>: a survival mode with different rules — see the dedicated section below.<br>Transports are unavailable in all three duel modes (unarmed, no combat purpose there); the starting-troops random pool automatically filters to whatever the current mode allows.',
    siegeRule:'🏰 The enemy starts with <b>no HQ or factory</b> (no economy at all). Your own starting troop tier (None/Few/Medium/Many) still applies, and you additionally get a matching number of extra cities (None=0, Few=2, Medium=3, Many=4 — capped by however many neutral cities the map actually has). <br>Every <b>3 turns</b>, a new enemy wave spawns near the enemy\'s original spawn tiles out of thin air — no economy or factory needed. Each wave has a random budget between <b>300 and 600</b> funds, greedily filled with random units (using the normal cost table) from all 9 unit types (including tanks/rockets) until the budget runs out; a wave is skipped if there\'s no open spawn tile left. The 12-unit-per-side cap still applies to the enemy.<br><b>Your goal is to survive to turn 15</b> — hold out and you win; losing your own HQ is still an instant defeat. <b>Destroying all enemy units does NOT win this mode</b> — the enemy keeps respawning, so there\'s no such thing as "wiping them out."',
    aiStyleRule:'Pick the enemy\'s style before starting (shown at the top during the match):<br>🛡️ <b>Balanced</b>: avoids bad trades — skips an attack if it can\'t kill and the counter-risk is too high; retreats low-HP units to safer tiles; prioritizes finishing off weakened targets.<br>🔥 <b>Aggressive</b>: barely considers its own safety, always maximizes this turn\'s damage/kills even in a losing trade.<br>🏰 <b>Defensive</b>: doesn\'t chase you down, prioritizes capturing neutral/lost buildings, holds position when there\'s nothing to fight, and grinds you down with economy and terrain.',
    difficultyRule:'Pick the enemy difficulty before starting — it scales both enemy units\' <b>max HP</b> and the enemy\'s <b>per-turn income</b> (applies to the starting roster, factory-built units, and every turn\'s income settlement), doesn\'t affect your side, and doesn\'t affect AI decision-making — freely combine it with any AI style:<br>😴 <b>Trivial</b>: Enemy HP/income ×0.8　｜　🙂 <b>Easy</b>: Enemy HP/income ×0.9　｜　⚖️ <b>Normal</b>: Enemy HP/income ×1.0 (default)<br>🔥 <b>Hard</b>: Enemy HP/income ×1.1　｜　💀 <b>Hell</b>: Enemy HP/income ×1.2　｜　☠️ <b>Nightmare</b>: Enemy HP/income ×1.5',
    troopsRule:'Pick both sides\' starting troop size before the match — all four tiers are symmetric for both sides:<br>🚫 <b>None</b>: 0 units, both sides start with only HQ+factory+city and build up purely from income.<br>🪖 <b>Few</b>: 3 units (1 mandatory infantry + 2 random, pool: infantry/heavy/engineer/medic).<br>⚔️ <b>Medium</b>: 6 units (1 mandatory infantry + 5 random, pool: infantry/heavy/recon/artillery/engineer/medic/transport).<br>🎖️ <b>Many</b>: 9 units (1 mandatory infantry + 8 random, pool: all 9 unit types — tanks/rockets can only appear at this tier).<br>The random pool always includes infantry itself, so it may be picked more than once; spawn points cluster near each side\'s own HQ.',
    winTitle:'🎉 Victory!', loseTitle:'💀 Defeat…',
    winText:(n,how)=>how==='hq'?`Captured the enemy HQ in ${n} turns!`:how==='survive'?`Held the line for ${n} turns!`:`Destroyed all enemies in ${n} turns!`, loseText:(n,how)=>how==='hq'?`Your HQ was captured on turn ${n}. Try again!`:`Your army fell on turn ${n}. Try again!`,
    again:'Play Again', backMenu:'Main Menu', backConfirm:'Return to main menu? Current progress will be lost',
    actedP:'acted (gray)', actedE:'acted (dashed)', onTerrain:'Terrain',
    myFlag:'🚩Owned by you', enFlag:'⚠️Enemy-owned', capturing:'Capturing', neutral:'Neutral', prog:'Progress',
    defBonus:'DEF bonus', moveCost:'Move cost', impassable:'impassable',
    nInfantry:'Infantry', nHeavy:'Heavy', nRecon:'Recon', nArtillery:'Artillery', nEngineer:'Engineer', nMedic:'Medic', nTank:'Tank', nRocket:'Rocket', nTransport:'Transport',
    dInfantry:'Versatile, good in mountains, can capture (small arms)', dHeavy:'High ATK/DEF melee main, sluggish, carries an anti-armor weapon (1.5× vs light armor, 0.7× vs heavy armor), small arms vs infantry-type (infantry, can enter mountains)', dRecon:'Blazing-fast scout, light-armor gun hurts infantry and light vehicles but can\'t dent tanks, weak armor (decent in forest, no mountains)',
    dArtillery:'High-explosive shells hurt any target without one-shotting it, cannot fire after moving (heavy treads, no mountains)', dEngineer:'Capture ×1.5, repairs adjacent vehicles (+3 HP), unarmored non-combatant with weak attack', dMedic:'Heals adjacent infantry/heavies/engineers (+4 HP), unarmored non-combatant with weak attack',
    dTank:'Heavy armor main force, dual weapons: tank gun vs vehicles, machine gun vs infantry-type, strong on plains (heavy treads, no mountains)', dRocket:'High-explosive shells, ultra long-range fire 3-5, low mobility, cannot fire after moving (heavy treads)',
    dTransport:'Unarmed transport, carries 1 foot unit for extra mobility (light treads, no mountains/water); cargo dies if the transport is destroyed',
    actLoad:'🚚 Load', actUnload:'⬇️ Unload', cargoLabel:'🚚 Cargo: ',
    sideP:'Player', sideE:'Enemy',
  }
};
let LANG='zh';
const T=k=>I18N[LANG][k]!==undefined?I18N[LANG][k]:I18N.zh[k];
function setLang(l){
  LANG=I18N[l]?l:'zh';
  // 同步 UNIT_TYPES 名称/描述与 TERRAINS 名称（供战斗文案使用）
  const names={infantry:'nInfantry',heavy:'nHeavy',recon:'nRecon',artillery:'nArtillery',engineer:'nEngineer',medic:'nMedic',tank:'nTank',rocket:'nRocket',transport:'nTransport'};
  const descs={infantry:'dInfantry',heavy:'dHeavy',recon:'dRecon',artillery:'dArtillery',engineer:'dEngineer',medic:'dMedic',tank:'dTank',rocket:'dRocket',transport:'dTransport'};
  for(const k in names){UNIT_TYPES[k].name=T(names[k]);UNIT_TYPES[k].desc=T(descs[k]);}
  // 先剥离 tchip HTML 前缀（v 图标同步后 t* 键以 <i class="tchip..."> 开头），再兼容旧 emoji 前缀
  const stripChip=s=>s.replace(/^<i class="tchip t-\w+"><\/i>\s*/,'');
  TERRAINS.plain.name=stripChip(T('tPlain')).replace(/^🟩\s*/,'');
  TERRAINS.forest.name=stripChip(T('tForest')).replace(/^🌲\s*/,'');
  TERRAINS.mountain.name=stripChip(T('tMountain')).replace(/^⛰️\s*/,'');
  TERRAINS.water.name=stripChip(T('tWater')).replace(/^🌊\s*/,'');
  TERRAINS.city.name=stripChip(T('tCity')).replace(/^🏙️\s*/,'').split('：')[0].split(':')[0];
  TERRAINS.hq.name=stripChip(T('tHq')).replace(/^🚩\s*/,'').split('：')[0].split(':')[0];
  TERRAINS.factory.name=stripChip(T('tFactory')).replace(/^🏭\s*/,'').split('：')[0].split(':')[0];
  applyStaticTexts();
  if(G)render();
}
// 静态界面文案（菜单/按钮/表头等），切换语言时刷新
function applyStaticTexts(){
  document.documentElement.lang=LANG==='zh'?'zh-CN':'en';
  document.title=T('title');
  const set=(id,txt)=>{const el=document.getElementById(id);if(el)el.textContent=txt;};
  set('gameTitle',T('title'));
  // 顶栏"第 N 回合"：数字保留在 <b id="turnNum">，前后缀按语言重建（不能整段 textContent 覆盖，会连数字一起冲掉）
  const tl=document.getElementById('turnLabel');
  if(tl){
    const numEl=document.getElementById('turnNum');
    const n=numEl?numEl.textContent:'1';
    tl.innerHTML='';
    tl.appendChild(document.createTextNode(T('turnPrefix')));
    const b=document.createElement('b');b.id='turnNum';b.textContent=n;
    tl.appendChild(b);
    tl.appendChild(document.createTextNode(T('turnSuffix')));
  }
  set('sndBtn',muted?'🔇':'🔊');
  set('menuBtn',T('menu'));set('endTurn',T('endTurn'));
  set('helpBtn','❓ '+T('help'));
  const pl=document.getElementById('phaseLabel');if(pl&&G)pl.textContent=G.phase==='P'?T('phaseP'):T('phaseE');
  // 侧栏卡片标题
  const h3s=document.querySelectorAll('#side .card h3');
  if(h3s.length>=3){h3s[0].textContent=T('unit');h3s[1].textContent=T('terrain');h3s[2].textContent=T('log');}
  set('waitBtn',T('wait'));
  // 菜单
  const menuTitle=document.querySelector('#menu .dialog h1');if(menuTitle)menuTitle.textContent=T('title');
  const menuSub=document.querySelector('#menu .dialog .sub');if(menuSub)menuSub.textContent=T('sub');
  const quickGuide=document.querySelectorAll('#menu .quick-guide span');
  ['quick1','quick2','quick3'].forEach((key,i)=>{if(quickGuide[i])quickGuide[i].textContent=T(key);});
  set('mapSizeLabel',T('mapSize'));set('advancedLabel',T('advancedLabel'));
  const sizeBtns=document.querySelectorAll('#menu button[data-size]');
  if(sizeBtns.length===5){
    sizeBtns[0].innerHTML=T('sizeS')+'<br><small>'+T('sizeSsub')+'</small>';
    sizeBtns[1].innerHTML=T('sizeM')+'<br><small>'+T('sizeMsub')+'</small>';
    sizeBtns[2].innerHTML=T('sizeL')+'<br><small>'+T('sizeLsub')+'</small>';
    sizeBtns[3].innerHTML=T('sizeXL')+'<br><small>'+T('sizeXLsub')+'</small>';
    sizeBtns[4].innerHTML=T('sizeXXL')+'<br><small>'+T('sizeXXLsub')+'</small>';
  }
  set('gameModeLabel',T('gameModeLabel'));
  const modeBtns=document.querySelectorAll('#menu button[data-mode]');
  if(modeBtns.length===6){
    modeBtns[0].innerHTML=T('modeSkirmish')+'<br><small>'+T('modeSkirmishSub')+'</small>';
    modeBtns[1].innerHTML=T('modeInfantryDuel')+'<br><small>'+T('modeInfantryDuelSub')+'</small>';
    modeBtns[2].innerHTML=T('modeArmorDuel')+'<br><small>'+T('modeArmorDuelSub')+'</small>';
    modeBtns[3].innerHTML=T('modeArtilleryDuel')+'<br><small>'+T('modeArtilleryDuelSub')+'</small>';
    modeBtns[4].innerHTML=T('modeSiege')+'<br><small>'+T('modeSiegeSub')+'</small>';
    modeBtns[5].innerHTML=T('modeAcademy')+'<br><small>'+T('modeAcademySub')+'</small>';
  }
  updateScenarioMenu();updateScenarioBanner();
  set('aiStyleLabel',T('aiStyleLabel'));
  const aiBtns=document.querySelectorAll('#menu button[data-ai]');
  if(aiBtns.length===3){
    aiBtns[0].innerHTML=T('aiBalanced')+'<br><small>'+T('aiBalancedSub')+'</small>';
    aiBtns[1].innerHTML=T('aiAggressive')+'<br><small>'+T('aiAggressiveSub')+'</small>';
    aiBtns[2].innerHTML=T('aiDefensive')+'<br><small>'+T('aiDefensiveSub')+'</small>';
  }
  updateAiStyleTag();
  set('difficultyLabel',T('difficultyLabel'));
  const diffBtns=document.querySelectorAll('#menu button[data-diff]');
  if(diffBtns.length===6){
    diffBtns[0].innerHTML=T('diffTrivial')+'<br><small>'+T('diffTrivialSub')+'</small>';
    diffBtns[1].innerHTML=T('diffEasy')+'<br><small>'+T('diffEasySub')+'</small>';
    diffBtns[2].innerHTML=T('diffNormal')+'<br><small>'+T('diffNormalSub')+'</small>';
    diffBtns[3].innerHTML=T('diffHard')+'<br><small>'+T('diffHardSub')+'</small>';
    diffBtns[4].innerHTML=T('diffHell')+'<br><small>'+T('diffHellSub')+'</small>';
    diffBtns[5].innerHTML=T('diffNightmare')+'<br><small>'+T('diffNightmareSub')+'</small>';
  }
  set('troopsLabel',T('troopsLabel'));
  const troopsBtns=document.querySelectorAll('#menu button[data-troops]');
  if(troopsBtns.length===4){
    troopsBtns[0].innerHTML=T('troopsNone')+'<br><small>'+T('troopsNoneSub')+'</small>';
    troopsBtns[1].innerHTML=T('troopsFew')+'<br><small>'+T('troopsFewSub')+'</small>';
    troopsBtns[2].innerHTML=T('troopsMid')+'<br><small>'+T('troopsMidSub')+'</small>';
    troopsBtns[3].innerHTML=T('troopsMany')+'<br><small>'+T('troopsManySub')+'</small>';
  }
  set('menuHelpBtn',T('detailHelp'));
  set('startGameBtn',T('startGameBtn'));
  set('mapCodeLabel',T('mapCodeLabel'));set('randomMapBtn',T('randomMapBtn'));
  set('continueBtn',T('continueBtn'));set('deleteSaveBtn',T('deleteSaveBtn'));
  const mapCodeHint=document.getElementById('mapCodeHint');
  if(mapCodeHint&&G?.mapCode)mapCodeHint.textContent=T('mapCodeReady')(G.mapCode);
  updateSaveActions();
  // 帮助对话框
  const hdTitle=document.querySelector('#helpDialog .dialog h1');if(hdTitle)hdTitle.textContent=T('helpTitle');
  const hdSub=document.querySelector('#helpDialog .dialog .sub');if(hdSub)hdSub.textContent=T('helpSub');
  const hdH4=document.querySelectorAll('#helpDialog h4');
  const hKeys=['hUnit','hLegend','hTerrain','hCap','hSupport','hTransport','hLevel','hView','hCombat','hEconomy','hGameMode','hSiege','hAiStyle','hDifficulty','hTroops'];
  hdH4.forEach((h,i)=>{if(hKeys[i])h.textContent=T(hKeys[i]);});
  // 单位表
  const utable=document.querySelector('#helpDialog .utable');
  if(utable){
    const rows=utable.querySelectorAll('tr');
    if(rows.length>=10){
      const th=rows[0].querySelectorAll('th');
      if(th.length>=7){th[0].textContent=T('thUnit');th[1].textContent=T('thHp');th[2].textContent=T('thAtk');th[3].textContent=T('thDef');th[4].textContent=T('thMove');th[5].textContent=T('thRange');th[6].textContent=T('thTrait');}
      const traits=['uInf','uHeavy','uRecon','uArtillery','uEngineer','uMedic','uTank','uRocket','uTransport'];
      const unames=['nInfantry','nHeavy','nRecon','nArtillery','nEngineer','nMedic','nTank','nRocket','nTransport'];
      const ukeys=['infantry','heavy','recon','artillery','engineer','medic','tank','rocket','transport'];
      for(let i=1;i<=9;i++){
        const tds=rows[i].querySelectorAll('td');
        if(tds.length>=7){
          const b=UNIT_TYPES[ukeys[i-1]];
          tds[0].innerHTML=(b.icon?`<i class="uicon ${b.icon}" style="display:inline-block;width:18px;height:18px;vertical-align:-3px"></i>`:b.emoji)+' '+T(unames[i-1]);
          tds[6].textContent=T(traits[i-1]);
        }
      }
    }
  }
  // 图例
  const legendRows=document.querySelectorAll('#helpDialog .legend .row');
  const lKeys=['lMv','lZone','lAtk','lSel','lBase','lActed','lPath','lFlag'];
  legendRows.forEach((r,i)=>{if(lKeys[i]&&i!==5&&i!==6)r.innerHTML='<span class="chip"></span>'+T(lKeys[i]);});
  // 特殊图例行（保留自定义 chip）
  if(legendRows[5])legendRows[5].innerHTML='<span class="chip acted"></span>'+T('lActed');
  if(legendRows[6])legendRows[6].innerHTML='<span class="chip" style="background:rgba(120,220,160,.45);border:2px solid rgba(150,240,180,.9)"></span>'+T('lPath');
  if(legendRows[7])legendRows[7].innerHTML='<span class="chip" style="background:#4da3ff;clip-path:polygon(0 0,100% 50%,0 100%)"></span>'+T('lFlag');
  if(legendRows[8])legendRows[8].textContent=T('lLv');
  // 地形/规则段落（帮助对话框中 h4 之后的 p）
  const hdPs=document.querySelectorAll('#helpDialog .help > p');
  // 顺序：地形 p、占领 p、辅助 p、升级 p、查看 p、战斗 p
  const pKeys=['terrainPs','capRule','supRule','lvlRule','viewRule','combatRule'];
  let pi=0;
  hdPs.forEach(p=>{
    // 跳过第一个（地形行内 br 分隔的）
  });
  if(hdPs.length>=7){
    hdPs[0].innerHTML=T('tForest')+'　｜　'+T('tMountain')+'<br>'+T('tWater')+'　｜　'+T('tCity')+'　｜　'+T('tPlain')+'<br>'+T('tHq')+'　｜　'+T('tFactory');
    hdPs[1].innerHTML=T('capRule');
    hdPs[2].innerHTML=T('supRule');
    hdPs[3].innerHTML=T('transRule');
    hdPs[4].innerHTML=T('lvlRule');
    hdPs[5].innerHTML=T('viewRule');
    hdPs[6].innerHTML=T('combatRule');
    if(hdPs[7])hdPs[7].innerHTML=T('ecoRule');
    if(hdPs[8])hdPs[8].innerHTML=T('gameModeRule');
    if(hdPs[9])hdPs[9].innerHTML=T('siegeRule');
    if(hdPs[10])hdPs[10].innerHTML=T('aiStyleRule');
    if(hdPs[11])hdPs[11].innerHTML=T('difficultyRule');
    if(hdPs[12])hdPs[12].innerHTML=T('troopsRule');
  }
  set('helpClose',T('knowBtn'));
  set('prodTitle',T('prodTitle'));set('prodClose',T('prodCancel'));
  // 结果对话框
  set('againBtn',T('again'));set('toMenuBtn',T('backMenu'));
  const rt=document.getElementById('resultTitle');if(rt&&G&&G.over)rt.textContent=G.resultWin?T('winTitle'):T('loseTitle');
  const rx=document.getElementById('resultText');if(rx&&G&&G.over)rx.textContent=G.resultWin?T('winText')(G.turn):T('loseText')(G.turn);
  // 语言按钮状态
  document.querySelectorAll('.langBtn').forEach(b=>{
    b.classList.toggle('primary',b.dataset.lang===LANG);
    b.setAttribute('aria-pressed',String(b.dataset.lang===LANG));
  });
}
