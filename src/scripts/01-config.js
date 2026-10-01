'use strict';
// @bundle config
// ================= 配置 =================
const TERRAINS={
  plain:   {name:'平原', emoji:'',   cost:1, def:0   },
  forest:  {name:'森林', emoji:'🌲', cost:2, def:0.2 },
  mountain:{name:'山地', emoji:'⛰️', cost:3, def:0.4 },
  water:   {name:'河流', emoji:'🌊', cost:Infinity, def:0 },
  city:    {name:'城镇', emoji:'🏙️', cost:1, def:0.3 },
  hq:      {name:'总部', emoji:'🚩', cost:1, def:0.4 },
  factory: {name:'工厂', emoji:'🏭', cost:1, def:0.3 },
};
// 可占领的建筑（城镇/工厂/总部，共用占领进度机制；总部开局即归属所在半场一方，任一方占领敌方总部即获胜，己方总部被占即战败）
const CAPTURABLE=['city','factory','hq'];
// 每兵种地形移动力（参考高级战争，并向真实地形机动性靠拢）
// 步兵/重装/工程师/军医：森林 1 山地 2（移动能力完全一致）；
// 履带重型（坦克/火炮/火箭炮）：笨重，森林 3 不可入山地；运兵车虽也履带但更轻便，森林 2；
// 轮胎（侦察车）：轻便灵活，森林 2 不可入山地；河流对所有地面单位不可通行
const MOVE_COST={
  infantry:{plain:1,forest:1,mountain:2,water:Infinity,city:1,factory:1,hq:1},
  medic:   {plain:1,forest:1,mountain:2,water:Infinity,city:1,factory:1,hq:1},
  engineer:{plain:1,forest:1,mountain:2,water:Infinity,city:1,factory:1,hq:1},
  heavy:   {plain:1,forest:1,mountain:2,water:Infinity,city:1,factory:1,hq:1},
  tank:    {plain:1,forest:3,mountain:Infinity,water:Infinity,city:1,factory:1,hq:1},
  artillery:{plain:1,forest:3,mountain:Infinity,water:Infinity,city:1,factory:1,hq:1},
  recon:   {plain:1,forest:2,mountain:Infinity,water:Infinity,city:1,factory:1,hq:1},
  rocket:  {plain:1,forest:3,mountain:Infinity,water:Infinity,city:1,factory:1,hq:1},
  transport:{plain:1,forest:2,mountain:Infinity,water:Infinity,city:1,factory:1,hq:1},
};
const UNIT_TYPES={
  infantry:{name:'步兵',  emoji:'🪖', hp:10, atk:5, def:1, move:3, minR:1, maxR:1, desc:'多面手，擅长山地作战，可占领建筑'},
  heavy:  {name:'重装兵', emoji:'🛡️', hp:10, atk:7, def:3, move:2, minR:1, maxR:1, desc:'高攻高防主力，移动迟缓，携带反装甲武器克制载具（步兵，可进山）'},
  recon:  {name:'侦察车', emoji:'🚙', hp:10, atk:5, def:0, move:7, minR:1, maxR:1, desc:'极速侦察，装甲薄弱、打不动坦克（轻甲武器，森林机动尚可，不可入山地）'},
  artillery:{name:'火炮', emoji:'', icon:'cannon', hp:10, atk:7, def:1, move:2, minR:2, maxR:3, desc:'高爆炮弹对各类目标均有效，移动后不能开火（履带笨重，不可入山地）'},
  engineer:{name:'工程师', emoji:'🔧', hp:10, atk:2, def:1, move:3, minR:1, maxR:1, desc:'占领速度×1.5，修理相邻载具（+3 HP），非战斗单位无护甲、攻击很弱'},
  medic:  {name:'军医',   emoji:'⚕️', hp:10, atk:2, def:0, move:3, minR:1, maxR:1, desc:'治疗相邻步兵/重装兵/工程师（+4 HP），非战斗单位无护甲、攻击很弱'},
  tank:   {name:'坦克',   emoji:'', icon:'tank', hp:12, atk:9, def:3, move:5, minR:1, maxR:1, desc:'重甲主力，打载具用坦克炮、打步兵类用机枪，平原强势（履带笨重，不可入山地）'},
  rocket: {name:'火箭炮', emoji:'🚀', hp:10, atk:8, def:0, move:3, minR:3, maxR:5, desc:'高爆炮弹对各类目标均有效，超远程轰击 3-5，移动力低，移动后不能开火（履带笨重）'},
  transport:{name:'运兵车', emoji:'🚚', hp:10, atk:0, def:0, move:5, minR:0, maxR:0, desc:'无武装运输车，可搭载 1 名步兵类单位提升机动性（轻装履带，不可入山地/水域），被击毁时车内乘客一同阵亡'},
};
// 载具（可被工程师修理）
const VEHICLES=['recon','artillery','tank','rocket','transport'];
// 间接打击单位：移动后不能开火、不反击
const NO_MOVE_FIRE=['artillery','rocket'];
// 可占领建筑的单位（步兵/重装/工程师）
const CAPTURERS=['infantry','heavy','engineer'];
// 可被运兵车搭载的单位（步兵类）
const RIDERS=['infantry','heavy','engineer','medic'];

// ================= 武器与护甲系统 =================
// 护甲类型：unarmored 无护甲（工程师/军医）、light 轻防护（步兵/重装兵）、
// lightArmor 轻甲（侦察车/运兵车）、heavyArmor 重甲（坦克）、support 支援无甲载具（火炮/火箭炮）
const ARMOR_OF={infantry:'light',heavy:'light',engineer:'unarmored',medic:'unarmored',
  recon:'lightArmor',transport:'lightArmor',tank:'heavyArmor',artillery:'support',rocket:'support'};
// 护甲防御系数：伤害 = 武器基础倍率 × 护甲防御系数（越低越抗打）
const ARMOR_DEF={unarmored:1.04, light:1.0, lightArmor:0.6, heavyArmor:0.3, support:1.04};
// 武器基础倍率（对护甲走 ARMOR_DEF 换算的通用武器）
const WEAPON_BASE={smallArms:1.0, lightArmorGun:1.17, heavyArmorGun:1.35, highExplosive:1.3};
// 单位使用的武器：值为函数时按防守方类型动态选择（重装/坦克对载具切换武器）
const WEAPON_OF={
  infantry:'smallArms', heavy:d=>VEHICLES.includes(d.type)?'antiArmor':'smallArms',
  engineer:'smallArms', medic:'smallArms',
  recon:'lightArmorGun',
  tank:d=>VEHICLES.includes(d.type)?'heavyArmorGun':'smallArms',
  artillery:'highExplosive', rocket:'highExplosive',
  transport:'smallArms', // 运兵车 atk:0/minR:0/maxR:0，targetsFrom 恒空，实际不会真正开火，这里只是防御性兜底避免查表 NaN
};
// 特殊武器：不走 ARMOR_DEF 公式，对护甲类型直接指定最终倍率（对不含目标的护甲类型回退到 WEAPON_BASE×ARMOR_DEF 公式）
const WEAPON_OVERRIDE={
  antiArmor:{lightArmor:1.5, heavyArmor:0.7, support:1.3}, // 重装反装甲：打载具专属，威胁轻甲远超重甲
  highExplosive:{lightArmor:1.2, heavyArmor:0.8}, // 高爆对载具走专属值，对人类目标仍用公式（见 WEAPON_BASE.highExplosive）
};
function weaponMultiplier(attType,dfdType){
  const armor=ARMOR_OF[dfdType];
  let weapon=WEAPON_OF[attType];
  if(typeof weapon==='function')weapon=weapon({type:dfdType});
  const override=WEAPON_OVERRIDE[weapon];
  if(override&&override[armor]!==undefined)return override[armor];
  return WEAPON_BASE[weapon]*ARMOR_DEF[armor];
}
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
const HIT_CHANCE=0.9, CRIT_CHANCE=0.09, CRIT_MULT=1.5, COUNTER_MULT=0.7;
const CAP_NEED=20; // 占领城镇所需进度（进度=单位当前 HP × 占领速度倍率）
const CAP_MULT={infantry:1,heavy:1,engineer:1.5}; // 占领速度倍率（工程师 1.5 倍）
// 火炮规则：移动后不能开火，只能原地待机开火
const ARTILLERY_MOVE_FIRE=false;
// ================= 经济与生产（参考高级战争：占城→收入→工厂造兵） =================
const START_FUNDS=0;     // 初始资金：开局无资金，首回合立即结算一次收入，资金完全取决于开局拥有的建筑数
const INCOME_PER=50;     // 每座己方建筑每回合收入
const MAX_SIDE_UNITS=12; // 每方单位上限（防止无限爆兵）
const UNIT_COSTS={ // 单位造价（参考高级战争造价比例，压缩极端值后按步兵=100 缩放）
  infantry:100, engineer:100, medic:100, recon:230,
  heavy:190, artillery:290, tank:320, rocket:510, transport:260,
};
// ================= 敌方 AI 风格（主菜单可选，决定 aiPlan 的评分权重） =================
// dangerW：危险度（玩家单位对该格造成的预期总伤害）扣分权重，越高越怕死，0.35 约等于旧版固定权重
// killBonus：能击杀目标的额外加分；badTradeAvoid：是否拒绝"净亏损"的进攻（伤害不够击杀且危险度超过造成伤害的倍数阈值时放弃进攻，转为待机/撤退）
// retreatHpRatio：残血低于此比例、且当前格危险度不为 0 时尝试撤退到危险度更低的格子；capturePriority：占领动作的评分加成（用于防守型优先占城）
// idleAdvance：无攻击机会时是否主动靠近玩家（防守型为 false，原地防守/占城）
const AI_STYLES={
  balanced:{name:'稳健',dangerW:0.35,killBonus:60,badTradeAvoid:true,badTradeMult:1.3,retreatHpRatio:0.4,capturePriority:10,idleAdvance:true},
  aggressive:{name:'激进',dangerW:0.05,killBonus:90,badTradeAvoid:false,badTradeMult:0,retreatHpRatio:0,capturePriority:0,idleAdvance:true},
  defensive:{name:'防守',dangerW:0.6,killBonus:50,badTradeAvoid:true,badTradeMult:1.0,retreatHpRatio:0.5,capturePriority:40,idleAdvance:false},
};

