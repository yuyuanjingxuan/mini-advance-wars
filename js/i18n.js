'use strict';
// ================= 多语言（i18n） =================
// 默认中文；主菜单可选 English。所有界面文案集中在此，切换语言后重绘即可。
const I18N={
  zh:{
    title:'⚔️ 迷你高级战争',
    sub:'回合制战棋 · 致敬 GBA《高级战争》· 零依赖即开即玩',
    phaseP:'我方行动', phaseE:'敌方行动', turn:'回合',
    sound:'音效开关', help:'帮助', menu:'主菜单', endTurn:'结束回合 ⏭',
    unit:'单位', terrain:'地形', log:'战报',
    unitHint:'点击己方单位开始行动', unitHint2:'点击任意单位可查看详情',
    terrainHint:'鼠标悬停查看地形',
    wait:'⏳ 待机（原地结束行动）',
    // 菜单
    mapSize:'选择地图规模（随机对称地图）：',
    sizeS:'小 8×8', sizeSsub:'快节奏', sizeM:'中 10×10', sizeMsub:'标准', sizeL:'大 12×12', sizeLsub:'大地图',
    detailHelp:'📖 详细说明（单位 / 颜色图例）',
    langLabel:'🌐 Language:',
    // 菜单帮助段落
    m1:'🪖 <b>8 种兵种</b>：🪖步兵（多面手·可占领）· 🛡️重装兵（高攻高防·克制载具）· 🚙侦察车（高速突袭）· <i class="uicon cannon" style="display:inline-block;width:18px;height:18px;vertical-align:-3px"></i>火炮（射程 2-3）· 🔧工程师（占领×1.5+修理）· ⚕️军医（治疗）· <i class="uicon tank" style="display:inline-block;width:18px;height:18px;vertical-align:-3px"></i>坦克（突击主力）· 🚀火箭炮（射程 3-5）',
    m2:'💣 <b>目标</b>：消灭全部敌军，或占领敌方<b>总部</b>（站在敌方总部格上）！点击己方单位 → 点<b>蓝格</b>移动 → 点<b>红框敌人</b>攻击。',
    m3:'🟠<b>橙格</b>=攻击范围（虚线），🔵<b>蓝格</b>=移动范围。再点一次选中单位=取消选择；或点侧栏「⏳ 待机」原地结束行动。',
    m4:'<i class="tchip t-forest"></i>森林 / <i class="tchip t-mountain"></i>山地提供<b>防御加成</b>但移动缓慢，<i class="tchip t-water"></i>河流无法通行，<i class="tchip t-city"></i>城镇/<i class="tchip t-factory"></i>工厂在回合开始时回复 2 HP。<b>每个兵种在不同地形的移动力不同</b>（参考高级战争）：步兵擅长山地，履带单位不能进山，轮胎单位怕森林。',
    m5:'🚩<b>占领建筑</b>：只有步兵/重装兵/工程师能占领（城镇/工厂/总部，工程师 1.5 倍速度），站上建筑待机积累进度（进度=当前 HP×倍率，满 20 占领，离开进度清零）。<b>占领敌方总部直接获胜</b>！敌军同样会占领，被夺走的建筑不再为你回血。',
    m6:'🖱️ 选中单位后，鼠标悬停会显示<b>移动路径箭头</b>（绿格+箭头指示方向）；点击敌军可查看其<b>移动/攻击范围</b>。',
    m7:'💥 有命中与会心一击；⬆️ 战斗获得经验并<b>升级</b>——敌军同样会升级，速战速决！🎵 对战有 BGM：我方明快进行曲，敌方紧张小调。',
    m8:'💰 <b>经济与生产</b>：占领建筑每回合获得收入（每座 +50），初始资金 300。点击<b>己方空工厂</b>打开生产菜单，花钱生产新单位（当回合待机）。敌军也会攒钱造兵，注意扩张经济！',
    // 帮助对话框
    helpTitle:'📖 游戏说明', helpSub:'单位特性 · 颜色图例 · 地形效果',
    hUnit:'单位特性', hLegend:'颜色图例', hTerrain:'地形效果', hCap:'占领规则', hSupport:'辅助单位', hLevel:'升级规则', hView:'查看敌军', hCombat:'战斗规则', hEconomy:'经济与生产',
    thUnit:'单位', thHp:'HP', thAtk:'攻', thDef:'防', thMove:'移动', thRange:'射程', thTrait:'特性',
    uInf:'多面手，可占领建筑，山地移动力好', uHeavy:'高攻高防的近战主力，克制载具（步兵，可进山）', uRecon:'高速突袭，装甲薄弱（轮胎，不可入山地）',
    uArtillery:'远程轰击，移动后不能开火（履带）', uEngineer:'占领 1.5 倍速度，山地行军最快，修理相邻载具 +3 HP', uMedic:'治疗相邻步兵/工程师 +4 HP',
    uTank:'突击主力，平原强势（履带，不可入山地）', uRocket:'超远程轰击 3-5，移动后不能开火（轮胎）',
    lMv:'蓝格 = 可移动格子（含地形消耗）', lZone:'橙格虚线 = 攻击范围（只能打，不能停）', lAtk:'红框闪烁 = 当前可攻击的敌人',
    lSel:'金框 = 当前选中的单位', lBase:'蓝底 = 我方单位　红底 = 敌军单位',
    lActed:'灰显 = 我方已行动　虚线框 = 敌军已行动', lPath:'绿格+箭头 = 移动路径预览（悬停显示）',
    lFlag:'<i class="flag" style="display:inline-block;width:12px;height:16px;position:static;vertical-align:-3px"></i>旗帜 = 城镇归属（蓝=我方，红=敌军，灰=占领中）', lLv:'右上角 I / II / III… = 单位等级（罗马数字）',
    tForest:'<i class="tchip t-forest"></i> 森林：防御 +20%，步兵消耗 1 / 履带 2 / 轮胎 3', tMountain:'<i class="tchip t-mountain"></i> 山地：防御 +40%，步兵消耗 2 / 工程师 1 / 载具不可入',
    tWater:'<i class="tchip t-water"></i> 河流：不可通行（浅滩可过）', tCity:'<i class="tchip t-city"></i> 城镇：防御 +30%，回合开始回复 2 HP（仅限己方占领的建筑）', tPlain:'<i class="tchip t-plain"></i> 平原：无加成，所有兵种消耗 1（轮胎 2）',
    tHq:'<i class="tchip t-hq"></i> 总部：防御 +40%，占领敌方总部获胜，己方总部被占战败', tFactory:'<i class="tchip t-factory"></i> 工厂：防御 +30%，回合开始回复 2 HP，可修理驻守载具',
    capRule:'只有<b>步兵</b>、<b>重装兵</b>和<b>工程师</b>能占领建筑（城镇/工厂/总部，工程师 1.5 倍速度）。站在建筑上待机或移动结束即积累进度（进度 = 单位当前 HP×倍率，满 20 占领）。<b>离开建筑后进度清零</b>。占领后建筑插上本方旗帜，只有己方建筑才回血。敌军同样会占领，被夺走的建筑会变红旗。<b>占领敌方总部直接获胜，己方总部被占直接战败</b>。',
    supRule:'🔧 <b>工程师</b>：占领 1.5 倍速度，回合行动后自动修理<b>相邻</b>载具（侦察车/火炮/坦克/火箭炮）+3 HP（原地待机也可修理）。<br>⚕️ <b>军医</b>：回合行动后自动治疗<b>相邻</b>步兵/工程师 +4 HP（原地待机也可治疗）。两者攻击都很弱，注意保护。',
    lvlRule:'命中 +8、击毁 +25 经验。<b>辅助单位也有升级途径</b>：占领成功 +8、修理/治疗 +6 经验。升级（上限 <b>Lv.V</b>）攻 +1 防 +1 HP 上限 +2，并恢复 3 HP；升级所需经验递增（30/40/50/60），成长曲线平滑；满级后再获得经验转为恢复 3 HP。敌军同样会升级。',
    viewRule:'点击敌军单位（或已行动的我方单位）可查看其<b>移动范围（半透明蓝格）和攻击范围（橙格虚线）</b>，但不能操作。再点一次取消。',
    combatRule:'命中 90%，会心一击 12%（1.5 倍伤害）；反击伤害为 70%。单位间有克制关系（重装克步兵与载具、坦克克步兵等）。<b>火炮/火箭炮移动后不能开火，只能原地待机开火</b>；其他单位可移动后攻击。不同兵种有专属的攻击/移动音效。战报中我方消息蓝色、敌军消息红色。',
    knowBtn:'知道了',
    // 战斗文案
    atkLog:(a,d)=>`${sideName(a.side)} ${UNIT_TYPES[a.type].name} 攻击 ${sideName(d.side)} ${UNIT_TYPES[d.type].name}！`,
    counter:'反击！', dodged:'……被闪避了！', remain:(n,m)=>`${UNIT_TYPES?UNIT_TYPES[n].name:n} 剩余 ${m} HP`,
    killLog:(a,d)=>`💥 ${sideName(a.side)} ${UNIT_TYPES[a.type].name} 击毁了 ${sideName(d.side)} ${UNIT_TYPES[d.type].name}！`,
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
    incomeLog:(inc,n)=>`💵 收入 +${inc}（${n} 座建筑 × ${INCOME_PER}）`,
    buildLog:(s,t)=>`🏭 ${sideName(s)} 生产了 ${UNIT_TYPES[t].name}！`,
    prodTitle:'🏭 生产单位', prodCancel:'取消', prodHint:'点击工厂生产单位',
    prodFunds:(f)=>`💰 资金：${f}`,
    ecoRule:'💵 每回合开始时，每座己方建筑（城镇/工厂/总部）提供 <b>+50</b> 资金，初始资金 <b>300</b>。点击<b>己方空工厂</b>打开生产菜单：选择兵种并支付造价（步兵最便宜、火箭炮最贵），新单位当回合待机、下回合行动。每方场上单位上限 12。敌军同样会收入并生产单位。',
    // 结果
    winTitle:'🎉 胜利！', loseTitle:'💀 战败……',
    winText:(n,how)=>how==='hq'?`历经 ${n} 回合占领了敌方总部！`:`历经 ${n} 回合消灭了全部敌军！`, loseText:(n,how)=>how==='hq'?`己方总部于第 ${n} 回合被占领，再接再厉！`:`我军全灭于第 ${n} 回合，再接再厉！`,
    again:'再来一局', backMenu:'返回菜单', backConfirm:'返回主菜单？当前进度将丢失',
    // 单位卡
    actedP:'已行动（灰显）', actedE:'已行动（虚线框）', onTerrain:'所在地形',
    // 地形悬停
    myFlag:'🚩我方占领', enFlag:'⚠️敌军占领', capturing:'占领中', neutral:'中立', prog:'进度',
    defBonus:'防御加成', moveCost:'移动消耗', impassable:'不可通行',
    // 兵种名
    nInfantry:'步兵', nHeavy:'重装兵', nRecon:'侦察车', nArtillery:'火炮', nEngineer:'工程师', nMedic:'军医', nTank:'坦克', nRocket:'火箭炮',
    // 兵种描述
    dInfantry:'多面手，擅长山地作战，可占领建筑', dHeavy:'高攻高防的近战主力，对载具 1.5 倍伤害（步兵，可进山）', dRecon:'高速突袭，但装甲薄弱（轮胎，不可入山地）',
    dArtillery:'远程轰击，移动后不能开火（履带）', dEngineer:'占领速度×1.5，山地行军最快，修理相邻载具（+3 HP）', dMedic:'治疗相邻步兵/工程师（+4 HP），自身攻击很弱',
    dTank:'突击主力，平原强势（履带，不可入山地）', dRocket:'超远程轰击 3-5，移动后不能开火（轮胎）',
    sideP:'我方', sideE:'敌军',
  },
  en:{
    title:'⚔️ Mini Advance Wars',
    sub:'Turn-based strategy · Inspired by GBA Advance Wars · Zero dependencies',
    phaseP:'Your turn', phaseE:'Enemy turn', turn:'Turn',
    sound:'Sound', help:'Help', menu:'Menu', endTurn:'End Turn ⏭',
    unit:'Unit', terrain:'Terrain', log:'Battle Log',
    unitHint:'Click your unit to act', unitHint2:'Click any unit for details',
    terrainHint:'Hover a tile for info',
    wait:'⏳ Wait (end action in place)',
    mapSize:'Choose map size (random symmetric map):',
    sizeS:'Small 8×8', sizeSsub:'Quick', sizeM:'Medium 10×10', sizeMsub:'Standard', sizeL:'Large 12×12', sizeLsub:'Big map',
    detailHelp:'📖 Details (units / color legend)',
    langLabel:'🌐 Language:',
    m1:'🪖 <b>8 unit types</b>: 🪖Infantry (versatile, can capture) · 🛡️Heavy (high ATK/DEF, anti-vehicle) · 🚙Recon (fast raider) · <i class="uicon cannon" style="display:inline-block;width:18px;height:18px;vertical-align:-3px"></i>Cannon (range 2-3) · 🔧Engineer (1.5× capture + repair) · ⚕️Medic (heals) · <i class="uicon tank" style="display:inline-block;width:18px;height:18px;vertical-align:-3px"></i>Tank (assault main force) · 🚀Rocket (range 3-5)',
    m2:'💣 <b>Goal</b>: destroy all enemies or capture the enemy <b>HQ</b>! Click your unit → <b>blue tile</b> to move → <b>red-outlined enemy</b> to attack.',
    m3:'🟠<b>Orange</b> = attack range (dashed), 🔵<b>blue</b> = move range. Click the selected unit again to cancel; or use "⏳ Wait" to end in place.',
    m4:'<i class="tchip t-forest"></i>Forest / <i class="tchip t-mountain"></i>mountain give <b>defense bonus</b> but slow movement, <i class="tchip t-water"></i>river is impassable, <i class="tchip t-city"></i>city/<i class="tchip t-factory"></i>factory heal 2 HP at turn start. <b>Each unit type has different move costs per terrain</b> (Advance Wars style): infantry excel in mountains, treads cannot enter mountains, tires fear forests.',
    m5:'🚩<b>Capture</b>: only infantry/heavies/engineers capture (cities/factories/HQ, engineer 1.5×). Stand on a building and wait to build progress (progress = HP × multiplier, 20 to capture, <b>progress resets when leaving</b>). <b>Capturing the enemy HQ wins instantly</b>! Enemies capture too.',
    m6:'🖱️ After selecting, hover shows the <b>move path arrows</b>; click an enemy to inspect its <b>move/attack range</b>.',
    m7:'💥 Hits and crits; ⬆️ gain XP and <b>level up</b> — enemies level up too! 🎵 Battle BGM: upbeat march for you, tense minor for the enemy.',
    m8:'💰 <b>Economy & production</b>: each owned building gives income every turn (+50 each), starting funds 300. Click <b>your empty factory</b> to open the production menu and spend funds on new units (they wait this turn). The enemy saves money and builds too — expand your economy!',
    helpTitle:'📖 How to Play', helpSub:'Unit traits · Color legend · Terrain effects',
    hUnit:'Unit Traits', hLegend:'Color Legend', hTerrain:'Terrain', hCap:'Capture Rules', hSupport:'Support Units', hLevel:'Leveling', hView:'Inspect Enemies', hCombat:'Combat Rules', hEconomy:'Economy & Production',
    thUnit:'Unit', thHp:'HP', thAtk:'ATK', thDef:'DEF', thMove:'MOV', thRange:'RNG', thTrait:'Trait',
    uInf:'Versatile, can capture, good mountain mobility', uHeavy:'Strong melee main force, strong vs vehicles (infantry, can enter mountains)', uRecon:'Fast raider, weak armor (tires, no mountains)',
    uArtillery:'Long-range fire, cannot fire after moving (treads)', uEngineer:'1.5× capture, fastest in mountains, repairs adjacent vehicles +3 HP', uMedic:'Heals adjacent infantry/engineers +4 HP',
    uTank:'Assault main force, strong on plains (treads, no mountains)', uRocket:'Ultra long-range fire 3-5, cannot fire after moving (tires)',
    lMv:'Blue = movable tiles (terrain cost included)', lZone:'Orange dashed = attack range (fire only, cannot stop)', lAtk:'Red pulse = attackable enemy now',
    lSel:'Gold outline = selected unit', lBase:'Blue base = your unit　Red base = enemy unit',
    lActed:'Gray = your unit acted　Dashed = enemy acted', lPath:'Green + arrows = move path preview (hover)',
    lFlag:'<i class="flag" style="display:inline-block;width:12px;height:16px;position:static;vertical-align:-3px"></i>Flag = city owner (blue=yours, red=enemy, gray=capturing)', lLv:'Top-right I / II / III… = unit level (Roman)',
    tForest:'<i class="tchip t-forest"></i> Forest: DEF +20%, infantry 1 / treads 2 / tires 3', tMountain:'<i class="tchip t-mountain"></i> Mountain: DEF +40%, infantry 2 / engineer 1 / vehicles blocked',
    tWater:'<i class="tchip t-water"></i> River: impassable (fords passable)', tCity:'<i class="tchip t-city"></i> City: DEF +30%, heals 2 HP at turn start (owned buildings only)', tPlain:'<i class="tchip t-plain"></i> Plain: no bonus, cost 1 for all (tires 2)',
    tHq:'<i class="tchip t-hq"></i> HQ: DEF +40%, capturing the enemy HQ wins, losing yours means defeat', tFactory:'<i class="tchip t-factory"></i> Factory: DEF +30%, heals 2 HP at turn start, repairs garrisoned vehicles',
    capRule:'Only <b>infantry</b>, <b>heavies</b> and <b>engineers</b> capture buildings (cities/factories/HQ, engineer 1.5×). Standing on a building and waiting builds progress (progress = HP × multiplier, 20 to capture). <b>Progress resets to 0 when the unit leaves</b>. Captured buildings fly your flag; only owned buildings heal. Enemies capture too. <b>Capturing the enemy HQ wins instantly; losing your own HQ means defeat</b>.',
    supRule:'🔧 <b>Engineer</b>: 1.5× capture; after acting, auto-repairs <b>adjacent</b> vehicles (recon/artillery/tank/rocket) +3 HP (waiting in place works too).<br>⚕️ <b>Medic</b>: after acting, auto-heals <b>adjacent</b> infantry/engineers +4 HP (waiting in place works too). Both are weak in combat — protect them.',
    lvlRule:'Hit +8, destroy +25 XP. <b>Support units level too</b>: capture +8, repair/heal +6 XP. Level up (cap <b>Lv.V</b>) grants +1 ATK +1 DEF +2 HP and heals 3 HP; XP needed rises each level (30/40/50/60) for a smooth curve; at max level excess XP heals 3 HP. Enemies level up too.',
    viewRule:'Click an enemy (or an acted unit of yours) to inspect its <b>move range (translucent blue) and attack range (dashed orange)</b> — view only. Click again to cancel.',
    combatRule:'90% hit, 12% crit (1.5×); counterattack deals 70%. Units have type matchups (heavy beats infantry and vehicles, tank beats infantry, etc.). <b>Artillery/rocket cannot fire after moving — they must wait in place to fire</b>; other units may move then attack. Each unit type has its own attack/move sound. Player log is blue, enemy log is red.',
    knowBtn:'Got it',
    atkLog:(a,d)=>`${sideName(a.side)} ${UNIT_TYPES[a.type].name} attacks ${sideName(d.side)} ${UNIT_TYPES[d.type].name}!`,
    counter:'Counterattack!', dodged:'…dodged!', remain:(n,m)=>`${UNIT_TYPES[n].name} has ${m} HP left`,
    killLog:(a,d)=>`💥 ${sideName(a.side)} ${UNIT_TYPES[a.type].name} destroyed ${sideName(d.side)} ${UNIT_TYPES[d.type].name}!`,
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
    incomeLog:(inc,n)=>`💵 Income +${inc} (${n} buildings × ${INCOME_PER})`,
    buildLog:(s,t)=>`🏭 ${sideName(s)} built a ${UNIT_TYPES[t].name}!`,
    prodTitle:'🏭 Build Unit', prodCancel:'Cancel', prodHint:'Click factory to build',
    prodFunds:(f)=>`💰 Funds: ${f}`,
    ecoRule:'💵 At the start of each turn, every owned building (city/factory/HQ) grants <b>+50</b> funds; you start with <b>300</b>. Click <b>your empty factory</b> to open the production menu: pick a unit and pay its cost (infantry cheapest, rocket priciest); new units wait this turn and act next turn. Max 12 units per side. The enemy collects income and builds units too.',
    winTitle:'🎉 Victory!', loseTitle:'💀 Defeat…',
    winText:(n,how)=>how==='hq'?`Captured the enemy HQ in ${n} turns!`:`Destroyed all enemies in ${n} turns!`, loseText:(n,how)=>how==='hq'?`Your HQ was captured on turn ${n}. Try again!`:`Your army fell on turn ${n}. Try again!`,
    again:'Play Again', backMenu:'Main Menu', backConfirm:'Return to main menu? Current progress will be lost',
    actedP:'acted (gray)', actedE:'acted (dashed)', onTerrain:'Terrain',
    myFlag:'🚩Owned by you', enFlag:'⚠️Enemy-owned', capturing:'Capturing', neutral:'Neutral', prog:'Progress',
    defBonus:'DEF bonus', moveCost:'Move cost', impassable:'impassable',
    nInfantry:'Infantry', nHeavy:'Heavy', nRecon:'Recon', nArtillery:'Artillery', nEngineer:'Engineer', nMedic:'Medic', nTank:'Tank', nRocket:'Rocket',
    dInfantry:'Versatile, good in mountains, can capture', dHeavy:'High ATK/DEF melee main, 1.5× damage vs vehicles (infantry, can enter mountains)', dRecon:'Fast raider, weak armor (tires, no mountains)',
    dArtillery:'Long-range fire, cannot fire after moving (treads)', dEngineer:'Capture ×1.5, fastest in mountains, repairs adjacent vehicles (+3 HP)', dMedic:'Heals adjacent infantry/engineers (+4 HP), weak attack',
    dTank:'Assault main force, strong on plains (treads, no mountains)', dRocket:'Ultra long-range fire 3-5, cannot fire after moving (tires)',
    sideP:'Player', sideE:'Enemy',
  }
};
let LANG='zh';
const T=k=>I18N[LANG][k]!==undefined?I18N[LANG][k]:I18N.zh[k];
function setLang(l){
  LANG=I18N[l]?l:'zh';
  // 同步 UNIT_TYPES 名称/描述与 TERRAINS 名称（供战斗文案使用）
  const names={infantry:'nInfantry',heavy:'nHeavy',recon:'nRecon',artillery:'nArtillery',engineer:'nEngineer',medic:'nMedic',tank:'nTank',rocket:'nRocket'};
  const descs={infantry:'dInfantry',heavy:'dHeavy',recon:'dRecon',artillery:'dArtillery',engineer:'dEngineer',medic:'dMedic',tank:'dTank',rocket:'dRocket'};
  for(const k in names){UNIT_TYPES[k].name=T(names[k]);UNIT_TYPES[k].desc=T(descs[k]);}
  TERRAINS.plain.name=T('tPlain').replace(/^🟩\s*/,'');
  TERRAINS.forest.name=T('tForest').replace(/^🌲\s*/,'');
  TERRAINS.mountain.name=T('tMountain').replace(/^⛰️\s*/,'');
  TERRAINS.water.name=T('tWater').replace(/^🌊\s*/,'');
  TERRAINS.city.name=T('tCity').replace(/^🏙️\s*/,'').split('：')[0].split(':')[0];
  TERRAINS.hq.name=T('tHq').replace(/^🚩\s*/,'').split('：')[0].split(':')[0];
  TERRAINS.factory.name=T('tFactory').replace(/^🏭\s*/,'').split('：')[0].split(':')[0];
  applyStaticTexts();
  if(G)render();
}
// 静态界面文案（菜单/按钮/表头等），切换语言时刷新
function applyStaticTexts(){
  document.documentElement.lang=LANG==='zh'?'zh-CN':'en';
  document.title=T('title');
  const set=(id,txt)=>{const el=document.getElementById(id);if(el)el.textContent=txt;};
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
  const mParas=document.querySelectorAll('#menu .help p');
  const mKeys=['m1','m2','m3','m4','m5','m6','m7','m8'];
  mParas.forEach((p,i)=>{if(mKeys[i])p.innerHTML=T(mKeys[i]);});
  const sizePs=document.querySelectorAll('#menu p');
  for(const p of sizePs){if(p.textContent.includes('地图规模')||p.textContent.includes('map size')||p.textContent.includes('Choose map'))p.innerHTML=T('mapSize');}
  const sizeBtns=document.querySelectorAll('#menu button[data-size]');
  if(sizeBtns.length===3){
    sizeBtns[0].innerHTML=T('sizeS')+'<br><small>'+T('sizeSsub')+'</small>';
    sizeBtns[1].innerHTML=T('sizeM')+'<br><small>'+T('sizeMsub')+'</small>';
    sizeBtns[2].innerHTML=T('sizeL')+'<br><small>'+T('sizeLsub')+'</small>';
  }
  set('menuHelpBtn',T('detailHelp'));
  // 帮助对话框
  const hdTitle=document.querySelector('#helpDialog .dialog h1');if(hdTitle)hdTitle.textContent=T('helpTitle');
  const hdSub=document.querySelector('#helpDialog .dialog .sub');if(hdSub)hdSub.textContent=T('helpSub');
  const hdH4=document.querySelectorAll('#helpDialog h4');
  const hKeys=['hUnit','hLegend','hTerrain','hCap','hSupport','hLevel','hView','hCombat','hEconomy'];
  hdH4.forEach((h,i)=>{if(hKeys[i])h.textContent=T(hKeys[i]);});
  // 单位表
  const utable=document.querySelector('#helpDialog .utable');
  if(utable){
    const rows=utable.querySelectorAll('tr');
    if(rows.length>=9){
      const th=rows[0].querySelectorAll('th');
      if(th.length>=7){th[0].textContent=T('thUnit');th[1].textContent=T('thHp');th[2].textContent=T('thAtk');th[3].textContent=T('thDef');th[4].textContent=T('thMove');th[5].textContent=T('thRange');th[6].textContent=T('thTrait');}
      const traits=['uInf','uHeavy','uRecon','uArtillery','uEngineer','uMedic','uTank','uRocket'];
      const unames=['nInfantry','nHeavy','nRecon','nArtillery','nEngineer','nMedic','nTank','nRocket'];
      const ukeys=['infantry','heavy','recon','artillery','engineer','medic','tank','rocket'];
      for(let i=1;i<=8;i++){
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
  if(hdPs.length>=6){
    hdPs[0].innerHTML=T('tForest')+'　｜　'+T('tMountain')+'<br>'+T('tWater')+'　｜　'+T('tCity')+'　｜　'+T('tPlain')+'<br>'+T('tHq')+'　｜　'+T('tFactory');
    hdPs[1].innerHTML=T('capRule');
    hdPs[2].innerHTML=T('supRule');
    hdPs[3].innerHTML=T('lvlRule');
    hdPs[4].innerHTML=T('viewRule');
    hdPs[5].innerHTML=T('combatRule');
    if(hdPs[6])hdPs[6].innerHTML=T('ecoRule');
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
  });
}
