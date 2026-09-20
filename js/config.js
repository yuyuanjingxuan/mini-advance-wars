'use strict';
// ================= 配置 =================
const TERRAINS={
  plain:   {name:'平原', emoji:'',   cost:1, def:0   },
  forest:  {name:'森林', emoji:'🌲', cost:2, def:0.2 },
  mountain:{name:'山地', emoji:'⛰️', cost:3, def:0.4 },
  water:   {name:'河流', emoji:'🌊', cost:Infinity, def:0 },
  city:    {name:'城镇', emoji:'🏙️', cost:1, def:0.3 },
};
const UNIT_TYPES={
  infantry:{name:'步兵',  emoji:'🪖', hp:10, atk:5, def:1, move:3, minR:1, maxR:1, desc:'多面手，擅长山地作战，可占领城镇'},
  heavy:  {name:'重装兵', emoji:'🛡️', hp:10, atk:7, def:3, move:4, minR:1, maxR:1, desc:'高攻高防的近战主力'},
  recon:  {name:'侦察车', emoji:'🚙', hp:10, atk:6, def:0, move:6, minR:1, maxR:1, desc:'高速突袭，但装甲薄弱（载具）'},
  artillery:{name:'火炮', emoji:'🎯', hp:10, atk:7, def:1, move:2, minR:2, maxR:3, desc:'远程轰击，无法贴脸与反击（载具）'},
  engineer:{name:'工程师', emoji:'🔧', hp:10, atk:3, def:1, move:3, minR:1, maxR:1, desc:'占领速度×2，可修理载具（+3 HP），不能占领以外的攻击'},
  medic:  {name:'军医',   emoji:'⚕️', hp:10, atk:2, def:0, move:3, minR:1, maxR:1, desc:'治疗相邻步兵/工程师（+4 HP），自身攻击很弱'},
};
// 载具（可被工程师修理）
const VEHICLES=['recon','artillery'];
// 可占领城镇的单位
const CAPTURERS=['infantry','engineer'];
// 克制倍率：DMG_MULT[攻击方][防守方]
const DMG_MULT={
  infantry:{infantry:1.0, heavy:0.55, recon:0.9,  artillery:1.0, engineer:0.9, medic:1.0},
  heavy:   {infantry:1.3, heavy:1.0,  recon:1.2,  artillery:1.3, engineer:1.2, medic:1.3},
  recon:   {infantry:1.2, heavy:0.5,  recon:1.0,  artillery:1.2, engineer:1.1, medic:1.2},
  artillery:{infantry:1.2,heavy:1.3,  recon:1.2,  artillery:1.0, engineer:1.1, medic:1.2},
  engineer:{infantry:0.7, heavy:0.4,  recon:0.6,  artillery:0.7, engineer:1.0, medic:1.0},
  medic:   {infantry:0.5, heavy:0.3,  recon:0.5,  artillery:0.5, engineer:1.0, medic:1.0},
};
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
const HIT_CHANCE=0.9, CRIT_CHANCE=0.12, CRIT_MULT=1.5, COUNTER_MULT=0.7;
const CAP_NEED=20; // 占领城镇所需进度（进度=单位当前 HP，工程师×2）
