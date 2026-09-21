'use strict';
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
// 可占领的建筑（城镇/工厂，共用占领进度机制；总部不可占领）
const CAPTURABLE=['city','factory'];
// 每兵种地形移动力（参考高级战争：步兵/机甲步行、履带、轮胎）
// 步兵：森林 1 山地 2；工程师（机甲化）：山地 1；履带（重装/坦克/火炮）：森林 2 不可入山地；
// 轮胎（侦察车/火箭炮）：平原 2 森林 3 不可入山地；河流对所有地面单位不可通行
const MOVE_COST={
  infantry:{plain:1,forest:1,mountain:2,water:Infinity,city:1,factory:1,hq:1},
  medic:   {plain:1,forest:1,mountain:2,water:Infinity,city:1,factory:1,hq:1},
  engineer:{plain:1,forest:1,mountain:1,water:Infinity,city:1,factory:1,hq:1},
  heavy:   {plain:1,forest:1,mountain:2,water:Infinity,city:1,factory:1,hq:1},
  tank:    {plain:1,forest:2,mountain:Infinity,water:Infinity,city:1,factory:1,hq:1},
  artillery:{plain:1,forest:2,mountain:Infinity,water:Infinity,city:1,factory:1,hq:1},
  recon:   {plain:2,forest:3,mountain:Infinity,water:Infinity,city:1,factory:1,hq:1},
  rocket:  {plain:2,forest:3,mountain:Infinity,water:Infinity,city:1,factory:1,hq:1},
};
const UNIT_TYPES={
  infantry:{name:'步兵',  emoji:'🪖', hp:10, atk:5, def:1, move:3, minR:1, maxR:1, desc:'多面手，擅长山地作战，可占领建筑'},
  heavy:  {name:'重装兵', emoji:'🛡️', hp:10, atk:7, def:3, move:4, minR:1, maxR:1, desc:'高攻高防主力，克制载具（步兵，可进山）'},
  recon:  {name:'侦察车', emoji:'🚙', hp:10, atk:6, def:0, move:6, minR:1, maxR:1, desc:'高速突袭，但装甲薄弱（轮胎，不可入山地）'},
  artillery:{name:'火炮', emoji:'', icon:'cannon', hp:10, atk:7, def:1, move:2, minR:2, maxR:3, desc:'远程轰击，移动后不能开火（履带）'},
  engineer:{name:'工程师', emoji:'🔧', hp:10, atk:2, def:1, move:3, minR:1, maxR:1, desc:'占领速度×1.5，山地行军最快，修理相邻载具（+3 HP）'},
  medic:  {name:'军医',   emoji:'⚕️', hp:10, atk:1, def:0, move:3, minR:1, maxR:1, desc:'治疗相邻步兵/工程师（+4 HP），自身攻击很弱'},
  tank:   {name:'坦克',   emoji:'', icon:'tank', hp:12, atk:9, def:3, move:5, minR:1, maxR:1, desc:'突击主力，平原强势（履带，不可入山地）'},
  rocket: {name:'火箭炮', emoji:'🚀', hp:10, atk:8, def:0, move:6, minR:3, maxR:5, desc:'超远程轰击 3-5，移动后不能开火（轮胎）'},
};
// 载具（可被工程师修理）
const VEHICLES=['recon','artillery','tank','rocket'];
// 间接打击单位：移动后不能开火、不反击
const NO_MOVE_FIRE=['artillery','rocket'];
// 可占领建筑的单位
const CAPTURERS=['infantry','engineer'];
// 克制倍率：DMG_MULT[攻击方][防守方]
const DMG_MULT={
  infantry:{infantry:1.0, heavy:0.55, recon:0.9,  artillery:1.0, engineer:0.9, medic:1.0, tank:0.35, rocket:0.9},
  heavy:   {infantry:1.3, heavy:1.0,  recon:1.5,  artillery:1.5, engineer:1.2, medic:1.3, tank:0.9,  rocket:1.5},
  recon:   {infantry:1.2, heavy:0.5,  recon:1.0,  artillery:1.2, engineer:1.1, medic:1.2, tank:0.4,  rocket:1.2},
  artillery:{infantry:1.2,heavy:1.3,  recon:1.2,  artillery:1.0, engineer:1.1, medic:1.2, tank:1.2,  rocket:1.3},
  engineer:{infantry:0.5, heavy:0.3,  recon:0.4,  artillery:0.5, engineer:1.0, medic:0.8, tank:0.2,  rocket:0.5},
  medic:   {infantry:0.35,heavy:0.2,  recon:0.35, artillery:0.35,engineer:0.8, medic:1.0, tank:0.15, rocket:0.35},
  tank:    {infantry:1.4, heavy:1.1,  recon:1.3,  artillery:1.4, engineer:1.3, medic:1.4, tank:1.0,  rocket:1.4},
  rocket:  {infantry:1.3, heavy:1.2,  recon:1.3,  artillery:1.3, engineer:1.2, medic:1.3, tank:1.1,  rocket:1.0},
};
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
const HIT_CHANCE=0.9, CRIT_CHANCE=0.12, CRIT_MULT=1.5, COUNTER_MULT=0.7;
const CAP_NEED=20; // 占领城镇所需进度（进度=单位当前 HP × 占领速度倍率）
const CAP_MULT={infantry:1,engineer:1.5}; // 占领速度倍率（工程师 1.5 倍）
// 火炮规则：移动后不能开火，只能原地待机开火
const ARTILLERY_MOVE_FIRE=false;
// ================= 经济与生产（参考高级战争：占城→收入→工厂造兵） =================
const START_FUNDS=300;   // 初始资金
const INCOME_PER=50;     // 每座己方建筑每回合收入
const MAX_SIDE_UNITS=12; // 每方单位上限（防止无限爆兵）
const UNIT_COSTS={ // 单位造价（参考高级战争比例缩放）
  infantry:100, engineer:120, medic:120, recon:180,
  heavy:220, artillery:280, tank:320, rocket:400,
};
