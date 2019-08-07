'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');
const PL = require('../prog-langs/programming-language');
const ProgLangEngine = require('../prog-langs/engine');
const RenderEngine = require('../simulator/render-engine');
const execute = require('../simulator/execute');

const HD = 0;

const w = 1920;
const h = 1080;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);

const duration = 300;
const framesNum = fps * duration;

const outputFile = 'C:/wamp/www/projects/video/1.mp4';

const MAX_SIZE = 1e7;
const CRITICAL_SIZE = MAX_SIZE - 1e3;
const INSTRUCTIONS_PER_TICK = 1e4;

module.exports = {
  render,
};

async function render(compData){
  log('Loading...');
  O.body.style.margin = '0px';

  const reng = new RenderEngine(O.body, w, h, compData);
  await reng.init();
  reng.play();

  const {canvas3D: canvas, gl} = reng;
  const buf = Buffer.alloc(w * h << 2);

  reng.hudVisible = 0;

  // TODO: fix this
  await O.waita(3e3);

  const engs = await createEngs(reng, compData);

  await new Promise(res => {
    media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
      if(f > framesNum) return -1;
      media.logStatus(f, framesNum);

      O.time += 1e3 / fps;
      O.animFrame();
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      return buf;
    }, res, 1);
  });
}

async function createEngs(reng, compData){
  const maxSize = MAX_SIZE;
  const criticalSize = CRITICAL_SIZE;
  const instructionsPerTick = INSTRUCTIONS_PER_TICK;

  const engs = O.obj();
  const tickFuncs = [];

  for(const user of compData.users){
    const lang = await PL.get(user.lang);
    const eng = new ProgLangEngine(lang, user.script, maxSize, criticalSize);
    engs[user.nick] = eng;

    let error = null;
    let io;

    const inp = [];
    const out = [];

    eng.stdin.on('read', (buf, len) => {
      if(len & 7){
        buf.fill(0);
        return 1;
      }

      len >>= 3;

      for(let i = 0; i !== len; i++){
        if(out.length !== 0) buf[i] = out.shift();
        else buf[i] = 0;
      }

      return 1;
    });

    eng.stdout.on('write', (buf, len) => {
      if(len & 7){
        return;
      }

      len >>= 3;

      for(let i = 0; i !== len; i++)
        inp.push(buf[i]);

      eng.pause();
    });

    eng.stderr.on('write', (buf, len) => {
      error = buf.toString();
      eng.pause();
    });

    tickFuncs.push(bot => {
      if(error !== null) return;

      let ticks = instructionsPerTick;

      while(ticks > 0){
        const prev = ticks;
        ticks = execute(bot, inp, out, ticks);
        if(ticks === prev) break;
      }

      while(ticks > 0 && !eng.done){
        ticks = eng.run(ticks);
        if(error !== null) break;

        while(ticks > 0){
          const prev = ticks;
          ticks = execute(bot, inp, out, ticks);
          if(ticks === prev) break;
        }
      }
    });
  }

  reng.on('tick', bot => {
    tickFuncs[bot.id](bot);
  });

  return engs;
}