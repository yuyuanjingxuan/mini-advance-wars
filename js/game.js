'use strict';
// ================= 状态 =================
let G=null, uid=0;
const $=s=>document.querySelector(s);
const board=$('#board');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// ================= 工具 =================
function unitAt(x,y){return G.units.find(u=>u.x===x&&u.y===y)||null;}
function terrAt(x,y){return TERRAINS[G.map[y][x]];}
function manhattan(x1,y1,x2,y2){return Math.abs(x1-x2)+Math.abs(y1-y2);}
function sideName(s){return s==='P'?'我方':'敌军';}
function inRange(u,x,y,tx,ty){const d=manhattan(x,y,tx,ty);return d>=u.minR&&d<=u.maxR;}
function targetsFrom(u,x,y){return G.units.filter(t=>t.side!==u.side&&inRange(u,x,y,t.x,t.y));}
function calcDamage(att,dfd,fromX,fromY,luck=1){
  const dterr=TERRAINS[G.map[dfd.y][dfd.x]];
  const mult=DMG_MULT[att.type][dfd.type];
  const raw=att.atk*mult*(att.hp/att.maxHp)*(1-dterr.def)*luck;
  return Math.max(1,Math.round(raw-dfd.def));
}

// ================= 地图生成（180° 对称 + 连通性校验） =================
function genMap(size){
  for(let attempt=0;attempt<80;attempt++){
    const m=Array.from({length:size},()=>Array(size).fill('plain'));
    const half=Math.ceil(size/2);
    for(let y=0;y<size;y++)for(let x=0;x<half;x++){
      const r=Math.random();
      m[y][x]=r<0.14?'forest':r<0.22?'mountain':r<0.30?'water':'plain';
    }
    for(let y=0;y<size;y++)for(let x=half;x<size;x++)m[y][x]=m[size-1-y][size-1-x];
    // 出生点强制平原
    const spawns=[[0,size-1],[1,size-1],[0,size-2],[1,size-2],[2,size-2]];
    for(const[x,y]of spawns){m[y][x]='plain';m[size-1-y][size-1-x]='plain';}
    // 城镇：每方后方 1 个 + 中路 1 对
    const cities=[[2,size-3],[size-3,2]];
    if(size%2===1)cities.push([(size-1)/2,(size-1)/2]);
    for(const[x,y]of cities){if(m[y][x]==='water')m[y][x]='plain';m[y][x]='city';}
    if(connected(m,size))return m;
  }
  // 兜底：全平原 + 角落森林
  const m=Array.from({length:size},()=>Array(size).fill('plain'));
  m[1][1]='forest';m[size-2][size-2]='forest';
  m[2][size-3]='city';m[size-3][2]='city';
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

// ================= 寻路（Dijkstra，含地形消耗） =================
function bfsReach(u){
  const size=G.size,start=u.x+','+u.y;
  const dist=new Map([[start,0]]),parent=new Map(),pq=[[0,u.x,u.y]];
  while(pq.length){
    pq.sort((a,b)=>a[0]-b[0]);
    const[c,x,y]=pq.shift();
    if(c>dist.get(x+','+y))continue;
    for(const[dx,dy]of DIRS){
      const nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=size||ny>=size)continue;
      const t=TERRAINS[G.map[ny][nx]];
      if(t.cost===Infinity)continue;
      const occ=unitAt(nx,ny);
      if(occ&&occ.side!==u.side)continue; // 敌军挡路
      const nc=c+t.cost;
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
  log(`${sideName(att.side)} ${UNIT_TYPES[att.type].name} 攻击 ${sideName(dfd.side)} ${UNIT_TYPES[dfd.type].name}！`,'info');
  await resolveHit(att,dfd,1);
  if(!G.over&&dfd.hp>0&&canCounter(dfd,att)){
    await sleep(260);
    log(`${UNIT_TYPES[dfd.type].name} 反击！`,'dim');
    await resolveHit(dfd,att,COUNTER_MULT);
  }
  checkEnd();
  G.busy=false;
}
function canCounter(d,att){
  if(d.type==='artillery')return false; // 火炮不反击
  return inRange(d,d.x,d.y,att.x,att.y);
}
async function resolveHit(a,d,counterMult){
  if(Math.random()>HIT_CHANCE){
    floatText(d.x,d.y,'MISS','miss');SFX.miss();
    log('……被闪避了！','dim');
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
    log(`💥 ${sideName(a.side)} ${UNIT_TYPES[a.type].name} 击毁了 ${sideName(d.side)} ${UNIT_TYPES[d.type].name}！`,'kill');
    SFX.destroy();
    gainXp(a,25);
    G.units=G.units.filter(u=>u.id!==d.id);
    render();
  }else{
    log(`${UNIT_TYPES[d.type].name} 剩余 ${d.hp}/${d.maxHp} HP`,'dim');
  }
}
function gainXp(u,n){
  u.xp+=n;
  let need=30+(u.level-1)*10;
  while(u.xp>=need){
    u.xp-=need;u.level++;
    u.atk+=1;u.def+=1;u.maxHp+=2;u.hp=Math.min(u.maxHp,u.hp+3);
    render();
    floatText(u.x,u.y,'⬆️ Lv'+u.level,'levelup');SFX.level();
    log(`⬆️ ${sideName(u.side)} ${UNIT_TYPES[u.type].name} 升到 Lv.${u.level}！（攻+1 防+1 HP+2）`,'level');
    need=30+(u.level-1)*10;
  }
}
function checkEnd(){
  const p=G.units.some(u=>u.side==='P');
  const e=G.units.some(u=>u.side==='E');
  if(!e||!p){G.over=true;showResult(!e);}
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
function waitUnit(){
  if(G.sel){G.sel.acted=true;log(`${UNIT_TYPES[G.sel.type].name} 待机。`,'dim');}
  G.sel=null;G.reach=null;G.mode='idle';render();showInfo(null);
}
async function playerMove(u,x,y){
  G.busy=true;
  const path=pathTo(G.reach,x,y);
  G.reach=null;G.mode='idle';render();
  SFX.move();
  await animateMove(u,path);
  G.busy=false;
  const ts=targetsFrom(u,u.x,u.y);
  if(ts.length){G.mode='attack';G.sel=u;render();showInfo(u);}
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
  if(G.mode==='selected'||G.mode==='attack'){
    const sel=G.sel;
    if(u&&u.id===sel.id){deselect();showInfo(u);return;} // 再点一次=取消选择（可继续查看）
    if(u&&u.side==='E'&&targetsFrom(sel,sel.x,sel.y).includes(u)){await playerAttack(sel,u);return;}
    if(G.mode==='selected'&&G.reach.stoppable.has(x+','+y)&&(!u||u.id===sel.id)){await playerMove(sel,x,y);return;}
    if(u&&u.side==='P'&&!u.acted){select(u);return;}
    deselect();return;
  }
  if(u&&u.side==='P'&&!u.acted)select(u);
  else if(u)showInfo(u);
});
board.addEventListener('mousemove',e=>{
  if(!G)return;
  const c=e.target.closest('.cell');if(!c)return;
  const x=+c.dataset.x,y=+c.dataset.y,t=terrAt(x,y);
  $('#tileInfo').innerHTML=`<b>${t.emoji||'🟩'} ${t.name}</b><br>防御加成 +${Math.round(t.def*100)}% ｜ 移动消耗 ${t.cost===Infinity?'不可通行':t.cost}`;
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
  // 无攻击机会：向最近玩家推进（火炮保持距离 ~3）
  const ideal=u.type==='artillery'?3:0;
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
    if(plan.x!==u.x||plan.y!==u.y){
      const path=pathTo(plan.reach,plan.x,plan.y);
      SFX.move();
      await animateMove(u,path);
    }
    const t=plan.target;
    if(t&&t.hp>0&&G.units.includes(t)&&inRange(u,u.x,u.y,t.x,t.y)){
      await doAttack(u,t);
    }
  }
  u.acted=true;G.sel=null;
  render();
}
async function startEnemyPhase(){
  G.phase='E';G.busy=true;deselect();
  render();updateTop();
  log(`—— 第 ${G.turn} 回合：敌方行动 ——`,'phase');
  SFX.turn();
  await sleep(450);
  for(const u of G.units.filter(v=>v.side==='E')){
    if(u.hp<=0||G.over)continue;
    u.acted=false;
    await aiAct(u);
    if(G.over)return;
    await sleep(220);
  }
  // 新回合：我方城内回血
  G.turn++;G.phase='P';G.busy=false;
  for(const u of G.units.filter(v=>v.side==='P')){
    u.acted=false;
    if(G.map[u.y][u.x]==='city'&&u.hp<u.maxHp){
      u.hp=Math.min(u.maxHp,u.hp+2);
      render();floatText(u.x,u.y,'+2','heal');
    }
  }
  log(`—— 第 ${G.turn} 回合：我方行动 ——`,'phase');
  SFX.turn();
  render();updateTop();
}

// ================= 渲染 =================
function updateTop(){
  $('#turnNum').textContent=G.turn;
  const pl=$('#phaseLabel');
  pl.textContent=G.phase==='P'?'我方行动':'敌方行动';
  pl.className='phase '+(G.phase==='P'?'p':'e');
  $('#endTurn').disabled=G.phase!=='P'||G.busy||G.over;
}
function render(){
  if(!G)return;
  updateTop();
  const moveSet=G.reach?G.reach.stoppable:null;
  // 选中时：攻击范围（从移动范围内任意落点可达的攻击格）
  let zoneSet=null,atkSet=null;
  if(G.sel&&(G.mode==='selected'||G.mode==='attack')){
    atkSet=new Set(targetsFrom(G.sel,G.sel.x,G.sel.y).map(t=>t.id));
    if(G.mode==='selected'){
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
  if(waitBtn)waitBtn.style.display=(G.sel&&G.phase==='P'&&!G.busy&&!G.over)?'block':'none';
  let html='';
  for(let y=0;y<G.size;y++)for(let x=0;x<G.size;x++){
    const tk=G.map[y][x],t=TERRAINS[tk];
    let cls='cell t-'+tk;
    const u=unitAt(x,y);
    const isSel=u&&G.sel&&u.id===G.sel.id;
    if(isSel)cls+=' sel';
    if(moveSet&&moveSet.has(x+','+y)&&!isSel)cls+=' mv';
    if(zoneSet&&zoneSet.has(x+','+y))cls+=' atkzone';
    if(atkSet&&u&&atkSet.has(u.id))cls+=' atk';
    html+=`<div class="${cls}" data-x="${x}" data-y="${y}">`;
    if(t.emoji)html+=`<span class="terr">${t.emoji}</span>`;
    if(u){
      const ratio=u.hp/u.maxHp;
      const hc=ratio>0.6?'':ratio>0.3?' mid':' low';
      html+=`<span class="unit ${u.side==='P'?'p':'e'}${u.acted?' acted':''}">${UNIT_TYPES[u.type].emoji}`
          +`<i class="hpbar"><b class="${hc.trim()}" style="width:${Math.round(ratio*100)}%"></b></i>`
          +(u.level>1?`<em class="lv">${u.level}</em>`:'')
          +`</span>`;
    }
    html+='</div>';
  }
  board.innerHTML=html;
}
function showInfo(u){
  const el=$('#unitInfo');
  if(!u){
    el.innerHTML='点击己方单位开始行动<br><span style="color:var(--dim);font-size:12px">点击任意单位可查看详情</span>';
    return;
  }
  const b=UNIT_TYPES[u.type],t=terrAt(u.x,u.y);
  const ratio=u.hp/u.maxHp,hc=ratio>0.6?'':ratio>0.3?'mid':'low';
  el.innerHTML=`
    <div class="uhead"><span class="uemoji">${b.emoji}</span>
      <span><span class="uname">${b.name}</span><span class="uside ${u.side==='P'?'p':'e'}">${sideName(u.side)} Lv.${u.level}</span></span>
    </div>
    <div style="font-size:12px;color:var(--dim)">HP ${u.hp}/${u.maxHp}　经验 ${u.xp}/${30+(u.level-1)*10}</div>
    <div class="statbar"><b class="${hc}" style="width:${Math.round(ratio*100)}%"></b></div>
    <div class="stats">
      <span>攻击 <b>${u.atk}</b></span><span>防御 <b>${u.def}</b></span>
      <span>移动 <b>${u.move}</b></span><span>射程 <b>${u.minR===u.maxR?u.maxR:u.minR+'-'+u.maxR}</b></span>
    </div>
    <div style="font-size:12px;color:var(--dim);margin-top:6px">${b.desc}<br>所在地形：${t.emoji||'🟩'} ${t.name}（防御+${Math.round(t.def*100)}%）${u.acted?'<br><b style="color:var(--dim)">已行动</b>':''}</div>`;
}
function log(msg,cls='info'){
  const el=$('#log');
  const d=document.createElement('div');
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
  G={size,map,units:[],turn:1,phase:'P',sel:null,reach:null,mode:'idle',busy:false,over:false};
  uid=0;
  const spawns=[[0,size-1],[1,size-1],[0,size-2],[1,size-2],[2,size-2]];
  const types=['infantry','heavy','recon','infantry','artillery'];
  spawns.forEach((p,i)=>{
    G.units.push(makeUnit('P',types[i],p[0],p[1]));
    G.units.push(makeUnit('E',types[i],size-1-p[0],size-1-p[1]));
  });
  board.style.setProperty('--n',size);
  board.style.setProperty('--cell',(size<=8?54:size<=10?46:38)+'px');
  $('#menu').classList.add('hidden');
  $('#overlay').classList.add('hidden');
  $('#log').innerHTML='';
  log('⚔️ 战斗开始！消灭所有敌军即可获胜。','phase');
  SFX.start();
  render();showInfo(null);
}
function showResult(win){
  G.busy=true;
  win?SFX.win():SFX.lose();
  $('#resultTitle').textContent=win?'🎉 胜利！':'💀 战败……';
  $('#resultText').textContent=win?`历经 ${G.turn} 回合消灭了全部敌军！`:`我军全灭于第 ${G.turn} 回合，再接再厉！`;
  $('#overlay').classList.remove('hidden');
}
function toMenu(){
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
  if(G&&!G.over&&!confirm('返回主菜单？当前进度将丢失'))return;
  toMenu();
});
$('#againBtn').addEventListener('click',()=>newGame(G.size));
$('#toMenuBtn').addEventListener('click',toMenu);
$('#sndBtn').addEventListener('click',()=>{
  muted=!muted;
  $('#sndBtn').textContent=muted?'🔇':'🔊';
});
$('#helpBtn').addEventListener('click',()=>{
  $('#helpDialog').classList.remove('hidden');
});
$('#helpClose').addEventListener('click',()=>{
  $('#helpDialog').classList.add('hidden');
});
$('#menuHelpBtn').addEventListener('click',()=>{
  $('#helpDialog').classList.remove('hidden');
});
