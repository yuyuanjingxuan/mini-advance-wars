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
