'use strict';
// ================= 状态 =================
let G=null, uid=0;
const $=s=>document.querySelector(s);
const board=$('#board');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// ================= 工具 =================
const ROMAN=['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];
function roman(n){return ROMAN[n]||String(n);}
function unitAt(x,y){return G.units.find(u=>u.x===x&&u.y===y)||null;}
function terrAt(x,y){return TERRAINS[G.map[y][x]];}
function manhattan(x1,y1,x2,y2){return Math.abs(x1-x2)+Math.abs(y1-y2);}
function sideName(s){return s==='P'?T('sideP'):T('sideE');}
function inRange(u,x,y,tx,ty){const d=manhattan(x,y,tx,ty);return d>=u.minR&&d<=u.maxR;}
function targetsFrom(u,x,y){return G.units.filter(t=>t.side!==u.side&&inRange(u,x,y,t.x,t.y));}
function calcDamage(att,dfd,fromX,fromY,luck=1){
  const dterr=TERRAINS[G.map[dfd.y][dfd.x]];
  const mult=DMG_MULT[att.type][dfd.type];
  const raw=att.atk*mult*(att.hp/att.maxHp)*(1-dterr.def)*luck;
  return Math.max(1,Math.round(raw-dfd.def));
}
// ================= 城镇占领（高级战争式：站上去待机积累进度，进度=当前 HP） =================
// G.caps: Map('x,y' -> {owner:'P'|'E', prog})，初始中立
function capKey(x,y){return x+','+y;}
function capAt(x,y){return G.caps?G.caps.get(capKey(x,y))||null:null;}
// 单位在建筑上待机/移动结束：积累占领进度（进度 = 单位当前 HP，工程师×1.5；仅步兵/工程师可占领）
function tryCapture(u){
  if(!CAPTURABLE.includes(G.map[u.y][u.x]))return;
  if(!CAPTURERS.includes(u.type))return; // 只有步兵/工程师能占领
  const k=capKey(u.x,u.y);
  const cap=G.caps.get(k);
  if(cap&&cap.owner===u.side)return; // 已是本方城镇
  const gain=Math.round(u.hp*(CAP_MULT[u.type]||1)); // 占领速度倍率（工程师 1.5）
  const prog=(cap&&cap.owner!==u.side?0:cap?cap.prog:0)+gain;
  if(prog>=CAP_NEED){
    G.caps.set(k,{owner:u.side,prog:CAP_NEED});
    floatText(u.x,u.y,u.side==='P'?T('capFloatP'):T('capFloatE'),'capture');
    SFX.capture();
    log(`${sideName(u.side)} ${UNIT_TYPES[u.type].name} ${u.side==='P'?T('capVerb'):T('takeVerb')} (${u.x},${u.y})！`,'level');
    gainXp(u,8); // 占领成功 +8 经验（辅助单位的升级途径）
  }else{
    G.caps.set(k,{owner:u.side,prog,by:u.id});
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
// 工程师修理相邻载具（+3 HP）；原地待机也可修理
function tryRepair(u){
  if(u.type!=='engineer')return;
  for(const v of G.units){
    if(v.side!==u.side||!VEHICLES.includes(v.type)||v.hp>=v.maxHp)continue;
    if(manhattan(u.x,u.y,v.x,v.y)!==1)continue;
    v.hp=Math.min(v.maxHp,v.hp+3);
    render();floatText(v.x,v.y,'+3','repair');SFX.repair();
    log(T('repairLog')(u.side,v.type),'level');
    gainXp(u,6); // 修理 +6 经验
    return; // 每回合只修一辆
  }
}
// 军医治疗相邻步兵/工程师（+4 HP）；原地待机也可治疗
function tryHeal(u){
  if(u.type!=='medic')return;
  for(const v of G.units){
    if(v.side!==u.side||!['infantry','engineer'].includes(v.type)||v.hp>=v.maxHp)continue;
    if(manhattan(u.x,u.y,v.x,v.y)!==1)continue;
    v.hp=Math.min(v.maxHp,v.hp+4);
    render();floatText(v.x,v.y,'+4','heal');SFX.heal();
    log(T('healLog')(u.side,v.type),'level');
    gainXp(u,6); // 治疗 +6 经验
    return; // 每回合只治一个
  }
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
function collectIncome(side){
  const n=countOwned(side);
  if(!n)return;
  const inc=n*INCOME_PER;
  G.funds[side]+=inc;
  log(T('incomeLog')(inc,n),'dim');
}
// AI 建造：敌方回合结束时在己方空工厂造兵（新单位下回合行动）
function aiBuild(){
  if(G.units.filter(u=>u.side==='E').length>=MAX_SIDE_UNITS)return;
  const factories=[];
  for(let y=0;y<G.size;y++)for(let x=0;x<G.size;x++){
    if(G.map[y][x]!=='factory')continue;
    const cap=capAt(x,y);
    if(cap&&cap.owner==='E'&&!unitAt(x,y))factories.push({x,y});
  }
  for(const f of factories){
    const mine=G.units.filter(u=>u.side==='E');
    const cnt=t=>mine.filter(u=>u.type===t).length;
    let pick=null;
    if(cnt('infantry')<2&&G.funds.E>=UNIT_COSTS.infantry)pick='infantry';
    else{
      const prefs=['tank','artillery','heavy','recon','rocket','infantry','engineer','medic'];
      const afford=prefs.filter(t=>UNIT_COSTS[t]<=G.funds.E);
      if(afford.length)pick=afford[Math.floor(Math.random()*Math.min(3,afford.length))];
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
// 玩家生产：点击己方空工厂打开生产菜单（新单位当回合待机，同高级战争）
let prodFactory=null;
function openProdMenu(x,y){
  prodFactory={x,y};
  $('#prodFunds').textContent=T('prodFunds')(G.funds.P);
  const list=$('#prodList');
  list.innerHTML='';
  for(const k of Object.keys(UNIT_TYPES)){
    const b=UNIT_TYPES[k],cost=UNIT_COSTS[k];
    const btn=document.createElement('button');
    btn.className='prodbtn';
    btn.disabled=G.funds.P<cost;
    const icon=b.icon?`<i class="uicon ${b.icon}"></i>`:b.emoji;
    btn.innerHTML=`<span class="picon">${icon}</span><span class="pname">${b.name}</span><span class="pcost">💰${cost}</span>`;
    btn.addEventListener('click',()=>buyUnit(k));
    list.appendChild(btn);
  }
  $('#prodDialog').classList.remove('hidden');
}
function buyUnit(type){
  if(!prodFactory||!G||G.funds.P<UNIT_COSTS[type])return;
  G.funds.P-=UNIT_COSTS[type];
  const u=makeUnit('P',type,prodFactory.x,prodFactory.y);
  u.acted=true; // 当回合待机
  G.units.push(u);
  SFX.repair();
  log(T('buildLog')('P',type),'p');
  $('#prodDialog').classList.add('hidden');
  prodFactory=null;
  updateFunds();render();
}

// ================= 地图生成（地理化：山脉山脊 + 河流浅滩 + 森林集群，180° 对称 + 连通性校验） =================
function genMap(size){
  for(let attempt=0;attempt<80;attempt++){
    const m=Array.from({length:size},()=>Array(size).fill('plain'));
    const half=Math.ceil(size/2);
    // --- 山脉：从地图一侧向另一侧随机游走形成山脊（地理上山脉成脉状而非散点） ---
    const ridges=size>=10?2:1;
    for(let r=0;r<ridges;r++){
      let rx=Math.floor(Math.random()*half*0.4), ry=Math.floor(Math.random()*size*0.3);
      const len=Math.floor(size*0.55+Math.random()*size*0.3);
      for(let i=0;i<len;i++){
        if(rx>=0&&rx<half&&ry>=0&&ry<size)m[ry][rx]='mountain';
        // 山脊走向：偏向水平延伸，偶尔上下起伏、分叉出小支脉
        const dir=Math.random();
        if(dir<0.55)rx++;
        else if(dir<0.75)ry+=Math.random()<0.5?1:-1;
        else if(dir<0.85){rx++;ry+=Math.random()<0.5?1:-1;}
        if(Math.random()<0.12&&ry+1<size)m[ry+1][Math.min(rx,half-1)]='mountain'; // 支脉
        ry=Math.max(0,Math.min(size-1,ry));
      }
    }
    // --- 河流：从上边缘流向右边缘的连通水线，中途留 1-2 处浅滩（可通行）保证两岸可达 ---
    {
      let wx=Math.floor(Math.random()*half*0.6+half*0.2), wy=0;
      let fords=1+Math.floor(Math.random()*2), fordAt=[];
      for(let i=0;i<fords;i++)fordAt.push(Math.floor(size*(0.3+0.4*Math.random())));
      while(wy<size){
        if(wx>=0&&wx<half){
          m[wy][wx]=fordAt.includes(wy)?'plain':'water';
          if(fordAt.includes(wy)&&wx+1<half)m[wy][wx+1]='plain'; // 浅滩加宽
        }
        wy++;
        if(Math.random()<0.45)wx+=Math.random()<0.5?1:-1; // 河道蜿蜒
        wx=Math.max(0,Math.min(half-1,wx));
      }
    }
    // --- 森林：以种子点向外生长成片（林地集群，符合植被成片分布） ---
    const blobs=Math.floor(size*0.5);
    for(let b=0;b<blobs;b++){
      const bx=Math.floor(Math.random()*half), by=Math.floor(Math.random()*size);
      const n=2+Math.floor(Math.random()*4);
      let cx=bx,cy=by;
      for(let i=0;i<n;i++){
        if(cx>=0&&cx<half&&cy>=0&&cy<size&&m[cy][cx]==='plain')m[cy][cx]='forest';
        const[dx,dy]=DIRS[Math.floor(Math.random()*4)];
        cx+=dx;cy+=dy;
      }
    }
    // --- 180° 镜像对称（双方地图完全一致，公平） ---
    for(let y=0;y<size;y++)for(let x=half;x<size;x++)m[y][x]=m[size-1-y][size-1-x];
    // --- 出生点强制平原（与 newGame 的 8 个出生点完全一致，含镜像） ---
    const spawns=[[0,size-1],[1,size-1],[0,size-2],[1,size-2],[2,size-2],[0,size-3],[2,size-1],[3,size-1]];
    for(const[x,y]of spawns){m[y][x]='plain';m[size-1-y][size-1-x]='plain';}
    // --- 出生点周边清障：保证载具（不可入山地/水）出生后能移动，不被地形卡死 ---
    // 每个出生点周围 1 格内的山地/水都改为平原，确保所有兵种（含履带/轮胎）都有出路
    // 军医出生点 (1,size-3)/(size-2,2) 也纳入清障保护
    const clearPts=spawns.concat([[1,size-3],[size-2,2]]);
    for(const[x,y]of clearPts){
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=x+dx,ny=y+dy;
        if(nx<0||ny<0||nx>=size||ny>=size)continue;
        if(m[ny][nx]==='mountain'||m[ny][nx]==='water')m[ny][nx]='plain';
        // 镜像侧同步清障
        const mx=size-1-x+dx,my=size-1-y+dy;
        if(mx<0||my<0||mx>=size||my>=size)continue;
        if(m[my][mx]==='mountain'||m[my][mx]==='water')m[my][mx]='plain';
      }
    }
    // --- 建筑：每方后方 1 总部 + 1 工厂，中路 1 对城镇，奇数尺寸加中心城镇 ---
    const builds=[[2,size-3,'city'],[size-3,2,'city'],[1,size-2,'hq'],[size-2,1,'hq'],[3,size-2,'factory'],[size-2,3,'factory']];
    if(size%2===1)builds.push([(size-1)/2,(size-1)/2,'city']);
    for(const[x,y,t]of builds){if(m[y][x]==='water')m[y][x]='plain';m[y][x]=t;}
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
  if(Math.random()>HIT_CHANCE){
    floatText(d.x,d.y,'MISS','miss');SFX.miss();
    log(T('dodged'),'dim');
    return;
  }
  const crit=Math.random()<CRIT_CHANCE;
  let dmg=Math.round(calcDamage(a,d,a.x,a.y,0.85+Math.random()*0.3)*counterMult);
  if(crit)dmg=Math.round(dmg*CRIT_MULT);
  dmg=Math.max(1,dmg);
  d.hp=Math.max(0,d.hp-dmg);
  render();
  floatText(d.x,d.y,'-'+dmg+(crit?' 会心!':''),crit?'crit':'dmg');
  crit?SFX.crit():SFX.hit();
  await sleep(320);
  gainXp(a,8);
  if(d.hp<=0){
    log(T('killLog')(a,d),'kill');
    SFX.destroy();
    gainXp(a,25);
    G.units=G.units.filter(u=>u.id!==d.id);
    render();
  }else{
    log(T('remain')(d.type,d.hp),'dim');
  }
}
function gainXp(u,n){
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
  const p=G.units.some(u=>u.side==='P');
  const e=G.units.some(u=>u.side==='E');
  if(!e||!p){G.over=true;showResult(!e);return;}
  // 总部占领：占领敌方总部直接获胜，己方总部被占直接战败
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
function select(u){G.sel=u;G.mode='selected';G.reach=bfsReach(u);SFX.select();render();showInfo(u);}
function deselect(){G.sel=null;G.reach=null;G.mode='idle';render();}
// 查看模式：点击敌军（或已行动单位）查看其移动/攻击范围，不能操作
function viewUnit(u){G.sel=u;G.mode='view';G.reach=bfsReach(u);SFX.select();render();showInfo(u);}
function waitUnit(){
  if(G.sel){G.sel.acted=true;log(T('waitLog')(G.sel.type),'dim');tryCapture(G.sel);tryRepair(G.sel);tryHeal(G.sel);}
  G.sel=null;G.reach=null;G.mode='idle';render();showInfo(null);
}
async function playerMove(u,x,y){
  G.busy=true;
  const fx=u.x,fy=u.y; // 记录出发格（用于离开城镇时清零占领进度）
  const path=pathTo(G.reach,x,y);
  G.reach=null;G.mode='idle';render();
  SFX.move(u.type);
  await animateMove(u,path);
  G.busy=false;
  resetCaptureOnLeave(u,fx,fy); // 离开城镇：占领进度清零
  tryCapture(u);tryRepair(u);tryHeal(u);
  const ts=targetsFrom(u,u.x,u.y);
  // 间接打击单位（火炮/火箭炮）移动后不能开火，只能原地待机开火
  const canFire=!NO_MOVE_FIRE.includes(u.type)||ARTILLERY_MOVE_FIRE;
  if(ts.length&&canFire){G.mode='attack';G.sel=u;render();showInfo(u);}
  else{u.acted=true;G.sel=null;render();showInfo(u);}
}
async function playerAttack(a,d){
  G.busy=true;G.reach=null;G.mode='idle';render();
  await doAttack(a,d);
  if(a.hp>0)a.acted=true;
  G.sel=null;G.busy=false;
  render();showInfo(a.hp>0?a:null);
}
board.addEventListener('click',async e=>{
  if(!G||G.busy||G.over||G.phase!=='P')return;
  const cellEl=e.target.closest('.cell');if(!cellEl)return;
  const x=+cellEl.dataset.x,y=+cellEl.dataset.y;
  const u=unitAt(x,y);
  if(G.mode==='selected'||G.mode==='attack'||G.mode==='view'){
    const sel=G.sel;
    if(u&&u.id===sel.id){deselect();showInfo(u);return;} // 再点一次=取消选择（可继续查看）
    if(G.mode==='selected'&&u&&u.side==='E'&&targetsFrom(sel,sel.x,sel.y).includes(u)){await playerAttack(sel,u);return;}
    if(G.mode==='selected'&&G.reach.stoppable.has(x+','+y)&&(!u||u.id===sel.id)){await playerMove(sel,x,y);return;}
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
function aiPlan(u){
  const reach=bfsReach(u);
  const players=G.units.filter(v=>v.side==='P');
  if(!players.length)return null;
  let best=null;
  for(const k of reach.stoppable){
    const[x,y]=k.split(',').map(Number);
    for(const t of players){
      const d=manhattan(x,y,t.x,t.y);
      if(d<u.minR||d>u.maxR)continue;
      const dmg=calcDamage(u,t,x,y,1);
      let score=dmg+(dmg>=t.hp?60:0)+terrAt(x,y).def*15;
      let danger=0;
      for(const p of players){
        const pd=manhattan(x,y,p.x,p.y);
        const canReach=p.type==='artillery'?(pd>=p.minR&&pd<=p.move+p.maxR):(pd<=p.move+p.maxR);
        if(canReach)danger+=calcDamage(p,u,p.x,p.y,1)*0.35;
      }
      score-=danger;
      if(!best||score>best.score)best={x,y,target:t,score,reach};
    }
  }
  if(best)return best;
  // 无攻击机会：向最近玩家推进（火炮保持距离 ~3，火箭炮保持距离 ~4）
  const ideal=u.type==='rocket'?4:u.type==='artillery'?3:0;
  let mv=null;
  for(const k of reach.stoppable){
    const[x,y]=k.split(',').map(Number);
    let nd=Infinity;
    for(const p of players)nd=Math.min(nd,manhattan(x,y,p.x,p.y));
    const sc=-Math.abs(nd-ideal)*10+terrAt(x,y).def*5;
    if(!mv||sc>mv.sc)mv={x,y,sc,reach};
  }
  return{x:mv.x,y:mv.y,target:null,reach:mv.reach,score:0};
}
async function aiAct(u){
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
    }
    const t=plan.target;
    // 间接打击单位（火炮/火箭炮）移动后不能开火，只能原地开火
    const canFire=!(NO_MOVE_FIRE.includes(u.type)&&!ARTILLERY_MOVE_FIRE&&(plan.x!==u.x||plan.y!==u.y));
    if(t&&t.hp>0&&G.units.includes(t)&&inRange(u,u.x,u.y,t.x,t.y)&&canFire){
      await doAttack(u,t);
    }
  }
  tryCapture(u);tryRepair(u);tryHeal(u);
  u.acted=true;G.sel=null;
  render();
}
async function startEnemyPhase(){
  G.phase='E';G.busy=true;deselect();
  BGM.setSide('E'); // 敌方回合切换为敌方主题
  render();updateTop();
  log(T('phaseLog')(G.turn,T('phaseE')),'phase');
  SFX.turn();
  collectIncome('E');updateFunds(); // 敌方建筑收入
  await sleep(450);
  for(const u of G.units.filter(v=>v.side==='E')){
    if(u.hp<=0||G.over)continue;
    u.acted=false;
    await aiAct(u);
    if(G.over)return;
    await sleep(220);
  }
  aiBuild(); // 敌方回合结束：在己方空工厂造兵（下回合行动）
  // 新回合：本方建筑回血（只有己方占领的建筑才回血）
  G.turn++;G.phase='P';G.busy=false;
  BGM.setSide('P'); // 我方回合切换回我方主题
  collectIncome('P');updateFunds(); // 我方建筑收入
  for(const u of G.units.filter(v=>v.side==='P')){
    u.acted=false;
    const cap=capAt(u.x,u.y);
    if(CAPTURABLE.includes(G.map[u.y][u.x])&&cap&&cap.owner==='P'&&u.hp<u.maxHp){
      u.hp=Math.min(u.maxHp,u.hp+2);
      render();floatText(u.x,u.y,'+2','heal');
    }
  }
  // 敌军 acted 标记清零（不带入我方回合，避免敌军显示"已行动"样式）
  for(const u of G.units.filter(v=>v.side==='E'))u.acted=false;
  log(T('phaseLog')(G.turn,T('phaseP')),'phase');
  SFX.turn();
  render();updateTop();
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
  updateTop();updateFunds();
  const moveSet=G.reach?G.reach.stoppable:null;
  // 选中时：攻击范围（从移动范围内任意落点可达的攻击格）；view 模式同样显示
  let zoneSet=null,atkSet=null;
  if(G.sel&&(G.mode==='selected'||G.mode==='attack'||G.mode==='view')){
    atkSet=new Set(targetsFrom(G.sel,G.sel.x,G.sel.y).map(t=>t.id));
    if(G.mode!=='attack'){
      zoneSet=new Set();
      const u=G.sel;
      const spots=G.mode==='selected'?[...G.reach.stoppable].map(k=>k.split(',').map(Number)):[[u.x,u.y]];
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
  const waitBtn=$('#waitBtn');
  if(waitBtn)waitBtn.style.display=(G.sel&&G.mode==='selected'&&G.phase==='P'&&!G.busy&&!G.over)?'block':'none';
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
    if(pathSet&&pathSet.has(x+','+y)&&!isSel)cls+=' path';
    html+=`<div class="${cls}" data-x="${x}" data-y="${y}">`;
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
      html+=`<span class="unit ${u.side==='P'?'p':'e'}${u.acted?' acted':''}">${icon}`
          +`<i class="hpbar"><b class="${hc.trim()}" style="width:${Math.round(ratio*100)}%"></b></i>`
          +(u.level>1?`<em class="lv">${roman(u.level)}</em>`:'')
          +`</span>`;
    }
    if(pathDirs&&pathDirs.has(x+','+y))html+=`<span class="arrow a-${pathDirs.get(x+','+y)}"></span>`;
    html+='</div>';
  }
  board.innerHTML=html;
}
function showInfo(u){
  const el=$('#unitInfo');
  if(!u){
    el.innerHTML=T('unitHint')+'<br><span style="color:var(--dim);font-size:12px">'+T('unitHint2')+'</span>';
    return;
  }
  const b=UNIT_TYPES[u.type],t=terrAt(u.x,u.y);
  const ratio=u.hp/u.maxHp,hc=ratio>0.6?'':ratio>0.3?'mid':'low';
  const uicon=b.icon?`<i class="uicon ${b.icon}"></i>`:b.emoji;
  el.innerHTML=`
    <div class="uhead"><span class="uemoji">${uicon}</span>
      <span><span class="uname">${b.name}</span><span class="uside ${u.side==='P'?'p':'e'}">${sideName(u.side)} Lv.${u.level}</span></span>
    </div>
    <div style="font-size:12px;color:var(--dim)">HP ${u.hp}/${u.maxHp}　经验 ${u.xp}/${30+(u.level-1)*10}</div>
    <div class="statbar"><b class="${hc}" style="width:${Math.round(ratio*100)}%"></b></div>
    <div class="stats">
      <span>${T('thAtk')} <b>${u.atk}</b></span><span>${T('thDef')} <b>${u.def}</b></span>
      <span>${T('thMove')} <b>${u.move}</b></span><span>${T('thRange')} <b>${u.minR===u.maxR?u.maxR:u.minR+'-'+u.maxR}</b></span>
    </div>
    <div style="font-size:12px;color:var(--dim);margin-top:6px">${b.desc}<br>${T('onTerrain')}：${t.emoji||'🟩'} ${t.name}（+${Math.round(t.def*100)}%）${u.acted?`<br><b style="color:var(--dim)">${u.side==='P'?T('actedP'):T('actedE')}</b>`:''}</div>`;
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
function makeUnit(side,type,x,y){
  const b=UNIT_TYPES[type];
  return{id:++uid,side,type,x,y,hp:b.hp,maxHp:b.hp,atk:b.atk,def:b.def,
         move:b.move,minR:b.minR,maxR:b.maxR,level:1,xp:0,acted:false};
}
function newGame(size){
  const map=genMap(size);
  G={size,map,units:[],turn:1,phase:'P',sel:null,reach:null,mode:'idle',busy:false,over:false,caps:new Map(),funds:{P:START_FUNDS,E:START_FUNDS}};
  uid=0;
  const spawns=[[0,size-1],[1,size-1],[0,size-2],[1,size-2],[2,size-2],[0,size-3],[2,size-1],[3,size-1]];
  const types=['infantry','heavy','recon','infantry','artillery','engineer','tank','rocket'];
  spawns.forEach((p,i)=>{
    G.units.push(makeUnit('P',types[i],p[0],p[1]));
    G.units.push(makeUnit('E',types[i],size-1-p[0],size-1-p[1]));
  });
  // 军医：双方各 1 名，放在出生点附近
  G.units.push(makeUnit('P','medic',1,size-3));
  G.units.push(makeUnit('E','medic',size-2,2));
  // 初始建筑全部中立
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(CAPTURABLE.includes(map[y][x]))G.caps.set(capKey(x,y),{owner:null,prog:0});
  board.style.setProperty('--n',size);
  board.style.setProperty('--cell',(size<=8?54:size<=10?46:38)+'px');
  $('#menu').classList.add('hidden');
  $('#overlay').classList.add('hidden');
  $('#log').innerHTML='';
  log(T('startLog'),'phase');
  SFX.start();
  BGM.start('P'); // 开局播放我方主题 BGM
  render();showInfo(null);
}
function showResult(win,how){
  G.busy=true;G.resultWin=win;
  BGM.stop(); // 结束时停止 BGM
  win?SFX.win():SFX.lose();
  $('#resultTitle').textContent=win?T('winTitle'):T('loseTitle');
  $('#resultText').textContent=win?T('winText')(G.turn,how):T('loseText')(G.turn,how);
  $('#overlay').classList.remove('hidden');
}
function toMenu(){
  BGM.stop(); // 返回菜单停止 BGM
  $('#overlay').classList.add('hidden');
  $('#menu').classList.remove('hidden');
}

// ================= 事件绑定 =================
document.querySelectorAll('#menu button[data-size]').forEach(b=>{
  b.addEventListener('click',()=>newGame(+b.dataset.size));
});
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
  b.addEventListener('click',()=>setLang(b.dataset.lang));
});
$('#againBtn').addEventListener('click',()=>newGame(G.size));
$('#toMenuBtn').addEventListener('click',toMenu);
$('#sndBtn').addEventListener('click',()=>{
  muted=!muted;
  $('#sndBtn').textContent=muted?'🔇':'🔊';
  BGM.refresh(); // 同步 BGM 静音状态
});
$('#helpBtn').addEventListener('click',()=>{
  $('#helpDialog').classList.remove('hidden');
});
$('#helpClose').addEventListener('click',()=>{
  $('#helpDialog').classList.add('hidden');
});
$('#prodClose').addEventListener('click',()=>{
  $('#prodDialog').classList.add('hidden');
  prodFactory=null;
});
$('#menuHelpBtn').addEventListener('click',()=>{
  $('#helpDialog').classList.remove('hidden');
});
// 启动时应用静态文案（默认中文）
applyStaticTexts();
