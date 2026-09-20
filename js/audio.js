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
  move(){tone(440,0.05,'triangle',0.08);tone(560,0.05,'triangle',0.08,0.06)},
  hit(){tone(180,0.12,'sawtooth',0.14);tone(120,0.15,'sawtooth',0.1,0.05)},
  miss(){tone(300,0.08,'sine',0.07)},
  crit(){tone(200,0.1,'sawtooth',0.15);tone(420,0.1,'square',0.11,0.06);tone(640,0.12,'square',0.11,0.12)},
  // 摧毁：低频爆炸 + 噪声感下滑音
  destroy(){tone(90,0.35,'sawtooth',0.18);tone(55,0.45,'triangle',0.16,0.04);tone(140,0.2,'square',0.1,0.02)},
  level(){[523,659,784,1047].forEach((f,i)=>tone(f,0.12,'square',0.09,i*0.09))},
  // 回合切换：短促双音
  turn(){tone(520,0.08,'triangle',0.09);tone(390,0.1,'triangle',0.09,0.09)},
  // 开局号角
  start(){[392,523,659,784].forEach((f,i)=>tone(f,0.16,'square',0.1,i*0.11));tone(1047,0.3,'square',0.11,0.44)},
  win(){[523,659,784,1047,784,1047].forEach((f,i)=>tone(f,0.15,'square',0.11,i*0.12))},
  lose(){[400,340,280,220,160].forEach((f,i)=>tone(f,0.22,'sawtooth',0.09,i*0.16))},
};
