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
  infantry:{name:'步兵',  emoji:'🪖', hp:10, atk:5, def:1, move:3, minR:1, maxR:1, desc:'多面手，擅长山地作战'},
  heavy:  {name:'重装兵', emoji:'🛡️', hp:10, atk:7, def:3, move:4, minR:1, maxR:1, desc:'高攻高防的近战主力'},
  recon:  {name:'侦察车', emoji:'🚙', hp:10, atk:6, def:0, move:6, minR:1, maxR:1, desc:'高速突袭，但装甲薄弱'},
  artillery:{name:'火炮', emoji:'🎯', hp:10, atk:7, def:1, move:2, minR:2, maxR:3, desc:'远程轰击，无法贴脸与反击'},
};
// 克制倍率：DMG_MULT[攻击方][防守方]
const DMG_MULT={
  infantry:{infantry:1.0, heavy:0.55, recon:0.9,  artillery:1.0},
  heavy:   {infantry:1.3, heavy:1.0,  recon:1.2,  artillery:1.3},
  recon:   {infantry:1.2, heavy:0.5,  recon:1.0,  artillery:1.2},
  artillery:{infantry:1.2,heavy:1.3,  recon:1.2,  artillery:1.0},
};
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
const HIT_CHANCE=0.9, CRIT_CHANCE=0.12, CRIT_MULT=1.5, COUNTER_MULT=0.7;
