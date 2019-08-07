'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const config = require('../../config');
const media = require('../../media');
const randStr = require('../../rand-str');
const Token = require('../../token');

const FILE_EXT = 'png';
const ID_MAX = 1n << 64n;

const DEFAULT_WIDTH = 370;
const DEFAULT_HEIGHT = 120;
const DEFAULT_STR_LEN = 5;
const EXPIRE_TIMEOUT = 1e3 * 60 * 10;

const captchasDir = config.dirs.captchas;

const params = initParams({
  textSize: [20, 40],
  charTranslation: 25,
  charRotation: O.pi / 6,
  col: [0, 128],
});

const captchas = O.obj();

let id = 0n;

class Captcha{
  constructor(token, str, file, timeout=EXPIRE_TIMEOUT){
    this.token = token;
    this.str = str.toLowerCase();
    this.file = file;
    this.timeout = timeout;

    this.timeout = setTimeout(this.expire.bind(this), timeout)

    captchas[token] = this;
  }

  static generate(w=DEFAULT_WIDTH, h=DEFAULT_HEIGHT, len=DEFAULT_STR_LEN, timeout=EXPIRE_TIMEOUT){
    return new Promise(res => {
      const fileName = `${++id}.${FILE_EXT}`;
      const file = path.join(captchasDir, fileName);
      const str = randStr('azAZ09', len);
      const token = Token.generate();

      if(id === ID_MAX) id = 0n;

      media.renderImage(file, w, h, (w, h, g) => {
        const [wh, hh] = [w, h].map(a => a / 2);

        g.fillStyle = O.Color.rand(1);
        g.fillRect(0, 0, w, h);

        for(let i = 0; i !== len; i++){
          const char = str[i];

          const dx = params.charTranslation;
          const dy = params.charTranslation;

          g.translate((i + .5) * (w / len) + dx, hh + dy);
          g.rotate(params.charRotation);
          g.font = `${params.textSize}px arial`;

          g.fillStyle = new O.Color(params.col, params.col, params.col);
          g.fillText(char, 0, 0);

          g.resetTransform();
        }
      }, code => {
        const captcha = new Captcha(token, str, file, timeout);
        res(captcha);
      });
    });
  }

  static get(token){
    if(!(token in captchas)) return null;
    return captchas[token];
  }

  check(str){
    return str.toLowerCase() === this.str;
  }

  expire(){
    this.invalidate(0);
  }

  invalidate(removeTimeout=1){
    if(removeTimeout) clearTimeout(this.timeout);
    delete captchas[this.token];
    fs.unlinkSync(this.file);
  }
}

module.exports = Captcha;

function initParams(params){
  const obj = O.obj();

  for(const key of O.keys(params)){
    const val = params[key];
    let min, max;

    if(Array.isArray(val)) [min, max] = val;
    else min = -(max = val);

    Object.defineProperty(obj, key, {
      get(){
        return O.randf(min, max);
      },
    });
  }

  return obj;
}