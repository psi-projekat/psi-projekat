'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const config = require('../config');
const media = require('../media');

const SIZE = config.avatarSize;
const DEFAULT_AVATAR_OFFSET = .15;
const DEFAULT_AVATAR_SCALE = 2;

const dir = config.dirs.avatars;
const tempFile = path.join(dir, 'temp');

const updateSem = new O.Semaphore(1);

module.exports = {
  createDefault,
  update,
};

async function createDefault(){
  const scale = DEFAULT_AVATAR_SCALE;

  return new Promise(res => {
    const fileName = `[default].png`;
    const file = path.join(dir, fileName);
    const s = SIZE;
    const sh = s / 2;

    const c1 = new O.Color(203, 213, 222);
    const c2 = new O.Color(128, 144, 157);

    media.renderImage(file, s, s, (w, h, g) => {
      g.clearRect(0, 0, s, s);

      g.fillStyle = c1;
      g.beginPath();
      g.arc(sh, sh, sh, 0, O.pi2);
      g.fill();

      const offset = s * DEFAULT_AVATAR_OFFSET;
      g.translate(sh, sh + offset);
      g.scale(offset * scale, offset);

      g.fillStyle = c2;
      g.beginPath();
      g.moveTo(-.5, -1);
      g.ellipse(.5, 0, .5, 1, 0, -O.pih, 0);
      g.lineTo(1, .5);
      g.ellipse(1 - .5 / scale, .5, .5 / scale, .5, 0, 0, O.pih);
      g.lineTo(.5 / scale - 1, 1);
      g.ellipse(.5 / scale - 1, .5, .5 / scale, .5, 0, O.pih, O.pi);
      g.lineTo(-1, 0);
      g.ellipse(-.5, 0, .5, 1, 0, -O.pi, -O.pih);
      g.closePath();
      g.fill();

      g.resetTransform();

      g.lineWidth = 10;
      g.strokeStyle = c1;
      g.beginPath();
      g.arc(sh, sh - offset * .8, offset * 1.1, 0, O.pi2);
      g.fill();
      g.stroke();
    }, res);
  });
}

async function update(nick, buf){
  await updateSem.wait();

  return new Promise((res, rej) => {
    (async () => {
      const fileName = `${nick}.png`;
      const file = path.join(dir, fileName);
      const s = SIZE;

      O.wfs(tempFile, buf);
      const img = (await media.loadImage(tempFile)).canvas;
      const w1 = img.width;
      const h1 = img.height;

      media.renderImage(file, s, s, (w, h, g) => {
        g.clearRect(0, 0, w, h);

        const sx = w / w1;
        const sy = h / h1;
        const s = Math.min(sx, sy);
        const w2 = w1 * s;
        const h2 = h1 * s;
        const x = (w - w2) / 2;
        const y = (h - h2) / 2;

        g.drawImage(img, 0, 0, w1, h1, x, y, w2, h2);
      }, exitCode => {
        if(exitCode === 0) res();
        else rej('invalidImg');
      });
    })().then(res, rej);
  }).finally(() => {
    while(fs.existsSync(tempFile)){
      try{ fs.unlinkSync(tempFile); }
      catch{}
    }

    updateSem.signal();
  });
}