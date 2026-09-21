'use strict';
// ================= 音效（WebAudio，极简） =================
let AC=null, muted=false;
function tone(f,d,type='square',v=0.12,delay=0){
  if(muted)return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    const o=AC.createOscillator(),g=AC.createGain();
    o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(v,AC.currentTime+delay);
    g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+delay+d);
    o.connect(g).connect(AC.destination);
    o.start(AC.currentTime+delay);o.stop(AC.currentTime+delay+d+0.05);
  }catch(e){}
}
const SFX={
  select(){tone(660,0.06,'square',0.07)},
  // 移动音效：按兵种区分（步兵脚步/重装沉重/侦察引擎/火炮履带/工程师敲击/军医轻快）
  move(type){
    switch(type){
      case 'heavy':    tone(160,0.07,'sawtooth',0.1);tone(120,0.08,'sawtooth',0.09,0.07);break;
      case 'recon':    tone(300,0.04,'square',0.07);tone(420,0.04,'square',0.07,0.05);tone(560,0.05,'square',0.07,0.1);break;
      case 'artillery':tone(110,0.09,'triangle',0.11);tone(90,0.1,'triangle',0.1,0.09);break;
      case 'engineer': tone(520,0.04,'square',0.07);tone(390,0.05,'square',0.06,0.05);break;
      case 'medic':    tone(660,0.05,'sine',0.07);tone(880,0.05,'sine',0.06,0.06);break;
      default:         tone(440,0.05,'triangle',0.08);tone(560,0.05,'triangle',0.08,0.06); // 步兵
    }
  },
  // 攻击音效：按兵种区分（步兵枪声/重装重击/侦察速射/火炮轰鸣/工程师扳手/军医注射）
  attack(type){
    switch(type){
      case 'heavy':    tone(140,0.14,'sawtooth',0.15);tone(90,0.18,'sawtooth',0.12,0.05);break;
      case 'recon':    tone(700,0.04,'square',0.09);tone(600,0.04,'square',0.08,0.05);tone(500,0.05,'square',0.08,0.1);break;
      case 'artillery':tone(70,0.3,'sawtooth',0.18);tone(50,0.4,'triangle',0.15,0.05);tone(200,0.15,'square',0.1,0.02);break;
      case 'engineer': tone(880,0.05,'square',0.08);tone(660,0.06,'square',0.07,0.06);break;
      case 'medic':    tone(520,0.06,'sine',0.08);tone(780,0.08,'sine',0.07,0.07);break;
      default:         tone(180,0.12,'sawtooth',0.14);tone(120,0.15,'sawtooth',0.1,0.05); // 步兵
    }
  },
  hit(){tone(180,0.12,'sawtooth',0.14);tone(120,0.15,'sawtooth',0.1,0.05)},
  miss(){tone(300,0.08,'sine',0.07)},
  crit(){tone(200,0.1,'sawtooth',0.15);tone(420,0.1,'square',0.11,0.06);tone(640,0.12,'square',0.11,0.12)},
  // 摧毁：低频爆炸 + 噪声感下滑音
  destroy(){tone(90,0.35,'sawtooth',0.18);tone(55,0.45,'triangle',0.16,0.04);tone(140,0.2,'square',0.1,0.02)},
  level(){[523,659,784,1047].forEach((f,i)=>tone(f,0.12,'square',0.09,i*0.09))},
  // 满级恢复：柔和上升双音（与升级音区分）
  maxheal(){tone(523,0.1,'sine',0.09);tone(784,0.14,'sine',0.08,0.1)},
  // 占领成功：小号凯旋音（与升级音区分，结尾长音用三角波）
  capture(){[392,494,587,784].forEach((f,i)=>tone(f,0.11,'square',0.1,i*0.09));tone(988,0.28,'triangle',0.11,0.36)},
  // 修理：扳手敲击双音
  repair(){tone(880,0.05,'square',0.09);tone(660,0.07,'square',0.08,0.06);tone(880,0.05,'square',0.08,0.13)},
  // 治疗：柔和上升琶音
  heal(){[523,659,784].forEach((f,i)=>tone(f,0.09,'sine',0.08,i*0.07))},
  // 回合切换：短促双音
  turn(){tone(520,0.08,'triangle',0.09);tone(390,0.1,'triangle',0.09,0.09)},
  // 开局号角
  start(){[392,523,659,784].forEach((f,i)=>tone(f,0.16,'square',0.1,i*0.11));tone(1047,0.3,'square',0.11,0.44)},
  win(){[523,659,784,1047,784,1047].forEach((f,i)=>tone(f,0.15,'square',0.11,i*0.12))},
  lose(){[400,340,280,220,160].forEach((f,i)=>tone(f,0.22,'sawtooth',0.09,i*0.16))},
};

// ================= BGM（WebAudio 音序器，双主题循环） =================
// 我方：明快大调进行曲；敌方：紧张小调低音。回合阶段切换时淡入淡出。
// 浏览器自动播放策略：首次用户交互（点击开局）后才能出声，BGM.start 在 newGame 中触发即可。
const BGM=(function(){
  const BPM=132, BEAT=60/BPM; // 每拍时长（秒）
  let timer=null, side='P', step=0, gain=null, ac=null;
  // 音名转频率
  const NOTE=(n)=>440*Math.pow(2,(n-69)/12); // n = MIDI 音符号
  // 我方主题（C 大调，明快军乐感）：旋律 + 低音，各 16 步循环
  const P_LEAD=[72,0,76,0,79,0,76,0, 74,0,77,0,81,0,79,0, 72,0,76,0,79,0,84,0, 83,81,79,77,76,0,72,0];
  const P_BASS=[48,0,55,0,48,0,55,0, 50,0,57,0,50,0,57,0, 48,0,55,0,48,0,55,0, 43,0,50,0,48,0,43,0];
  // 敌方主题（A 小调，紧张压迫感）：低音半音下行 + 不协和音程
  const E_LEAD=[69,0,0,72,0,0,71,0, 69,0,0,65,0,0,64,0, 69,0,0,72,0,0,74,0, 75,0,74,0,71,0,68,0];
  const E_BASS=[45,45,0,45,0,44,0,45, 41,41,0,41,0,40,0,41, 45,45,0,45,0,44,0,45, 46,0,45,0,44,0,41,0];
  function ensure(){
    if(ac)return true;
    try{
      ac=AC||new (window.AudioContext||window.webkitAudioContext)();
      AC=ac;
      gain=ac.createGain();gain.gain.value=0;gain.connect(ac.destination);
      return true;
    }catch(e){return false;}
  }
  function playNote(midi,dur,type,vol,when){
    if(midi<=0)return;
    const o=ac.createOscillator(),g=ac.createGain();
    o.type=type;o.frequency.value=NOTE(midi);
    g.gain.setValueAtTime(0.0001,when);
    g.gain.linearRampToValueAtTime(vol,when+0.02);
    g.gain.exponentialRampToValueAtTime(0.001,when+dur);
    o.connect(g).connect(gain);
    o.start(when);o.stop(when+dur+0.05);
  }
  function tick(){
    if(muted||!ac)return;
    const t=ac.currentTime+0.05;
    const lead=side==='P'?P_LEAD:E_LEAD, bass=side==='P'?P_BASS:E_BASS;
    const i=step%lead.length;
    if(side==='P'){
      playNote(lead[i],BEAT*0.9,'square',0.045,t);
      playNote(bass[i],BEAT*0.95,'triangle',0.05,t);
    }else{
      playNote(lead[i],BEAT*0.85,'sawtooth',0.028,t);
      playNote(bass[i],BEAT*0.9,'triangle',0.05,t);
    }
    step++;
  }
  function fade(v,ms){
    if(!gain)return;
    try{gain.gain.cancelScheduledValues(ac.currentTime);gain.gain.setValueAtTime(gain.gain.value,ac.currentTime);gain.gain.linearRampToValueAtTime(v,ac.currentTime+ms/1000);}catch(e){}
  }
  return{
    start(s){ if(!ensure())return; side=s||'P'; step=0;
      if(ac.state==='suspended')ac.resume();
      if(timer)return; fade(muted?0:0.9,600); timer=setInterval(tick,BEAT*1000); },
    setSide(s){ if(!ac||side===s)return; side=s; step=0; },
    stop(){ if(timer){clearInterval(timer);timer=null;} fade(0,400); },
    refresh(){ fade(muted?0:0.9,200); }, // 静音开关切换时调用
  };
})();
