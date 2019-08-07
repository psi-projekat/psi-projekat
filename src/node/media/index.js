'use strict';

const DEBUG = 0;
const ENABLE_TRUNC = 0;

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../omikron');
if(!O.isElectron) return;

const config = require('../config');
const nodeCanvas = require('../canvas');
const logSync = require('../log-sync');
const logStatus = require('../log-status');
const format = require('../format');
const setPriority = require('../set-priority');

const {
  Canvas,
  registerFont,
} = nodeCanvas;

const FFMPEG_DIR = path.join(config.exe.ffmpeg, '..');

const BGRA = '-f rawvideo -pix_fmt bgra';
const RGBA = '-f rawvideo -pix_fmt rgba';
const PIXEL_FORMAT = O.isElectron ? RGBA : BGRA;

const VIDEO_PRESET = '-preset slow -profile:v high -crf 18 -coder 1 -pix_fmt yuv420p -movflags +faststart -bf 2 -c:a aac -b:a 384k -profile:a aac_low';
const FAST_PRESET = `-c:v h264_nvenc ${VIDEO_PRESET}`;
const HD_PRESET = `-c:v libx264 ${VIDEO_PRESET}`;

const TRUNC = ENABLE_TRUNC ? '-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2"' : '';
const SYM_PROC_IRRELEVANT = Symbol();

const ctx = createContext(1, 1);

var procs = [];
var tempDir = null;
var shouldExit = 0;
var priority = 0;

class Video{
  constructor(input, w, h, framesNum){
    this.input = input;

    this.w = w;
    this.h = h;

    this.framesNum = framesNum;
    this.f = 0;

    this.g = createContext(w, h);
    this.imgd = this.g.createImageData(w, h);
    this.data = this.imgd.data;

    this.data.fill(128);

    this.iMax = w * h << 2;
    this.index = 0;

    this.chunks = [];

    var proc = spawnFfmpeg(`-i "${input}" ${RGBA} -`);
    this.proc = proc;

    proc[SYM_PROC_IRRELEVANT] = 1;

    proc.stdout.on('data', this.onProcData.bind(this));
    proc.on('exit', this.onProcExit.bind(this));
  }

  onProcData(data){
    this.chunks.push(data);
    this.consume();
  }

  onProcExit(status){
    end(this.proc);
  }

  consume(){
    var {chunks, data, iMax, index} = this;

    while(chunks.length !== 0){
      var chunk = chunks[0];
      chunk.copy(data, index);

      index += chunk.length;

      if(index > iMax){
        chunks[0] = chunk.slice(iMax - index);
        index = iMax;
        break;
      }else if(index === iMax){
        chunks.shift();
        break;
      }

      chunks.shift();
    }

    this.index = index;
    if(this.isReady()) this.pause();
  }

  update(){
    this.g.putImageData(this.imgd, 0, 0);
    this.index = 0;
  }

  async frame(){
    if(!this.isReady()) this.resume();

    await O.while(() => {
      return this.proc !== null && !this.isReady();
    });

    if(this.proc === null)
      return this.g;

    this.update();

    if(!this.isReady()) this.resume();
    this.consume();

    this.f++;

    return this.g;
  }

  pause(){ this.proc.stdout.pause(); }
  resume(){ this.proc.stdout.resume(); }
  isReady(){ return !shouldExit && this.index === this.iMax; }
  hasMore(){ return !shouldExit && this.f !== this.framesNum; }
}

init();

module.exports = {
  Canvas,
  registerFont,

  Video,

  createCanvas,
  createContext,

  logStatus,
  resetStatus,

  loadImage,
  saveImage,
  loadAudio,
  loadVideo,

  renderImage,
  editImage,

  renderVideo,
  editVideo,

  renderAudio,

  presentation,
  custom,

  buff2canvas,
  spawnFfmpeg,

  blur,
  fill,
  scale,

  col2rgb,
  rgb2col,
  normalize,
  color,

  setPriority: setPriorityForNewProcs,
};

function init(){
  aels();
}

function aels(){
  process.on('uncaughtException', onError);
  O.proc.on('sigint', onSigint);
}

function onError(err){
  if(!O.isElectron)
    console.error(err);
  closeProcs();
}

function onSigint(){
  closeProcs();
}

function loadImage(input){
  return new Promise((res, rej) => {
    let img = null;

    editImage(input, null, (w, h, g) => {
      img = g;
    }, exitCode => {
      if(exitCode === 0 && img !== null) res(img);
      else rej('invalidImg');
    });
  });
}

function saveImage(output, img){
  return new Promise((res, rej) => {
    const {canvas} = img;

    renderImage(output, canvas.width, canvas.height, (w, h, g) => {
      g.drawImage(canvas, 0, 0);
    }, exitCode => {
      if(exitCode === 0) res();
      else rej('invalidImg');
    });
  });
}

function loadAudio(input, convertToArr=0){
  input = format.path(input);

  return new Promise(res => {
    var buffs = [];

    var proc = spawnFfmpeg(`-i "${input}" -f f32le -ac 1 -`, () => {
      var buff = Buffer.concat(buffs);
      if(!convertToArr) return res(buff);

      var arr = [];

      for(var i = 0; i !== buff.length; i += 4)
        arr.push(buff.readFloatLE(i))

      res(arr);
    });

    proc.stdout.on('data', buff => buffs.push(buff));
  });
}

function loadVideo(input){
  input = format.path(input);

  return new Promise(res => {
    getMediaParams(input, (w, h, framesNum) => {
      var vid = new Video(input, w, h, framesNum);
      res(vid);
    });
  });
}

function renderImage(output, w, h, frameFunc=O.nop, exitCb=O.nop){
  output = format.path(output);

  var canvas = createCanvas(w, h);
  var g = canvas.getContext('2d');

  var proc = spawnFfmpeg(`${PIXEL_FORMAT} -s ${w}x${h} -i - -y ${TRUNC} "${output}"`, exitCb);

  frameFunc(w, h, g);

  end(proc, canvas.toBuffer('raw'));
}

function editImage(input, output, frameFunc=O.nop, exitCb=O.nop){
  input = format.path(input);
  if(output !== null) output = format.path(output);

  getMediaParams(input, (w, h) => {
    var canvas = createCanvas(w, h);
    var g = canvas.getContext('2d');
    var buffLen = w * h << 2;
    var buff = Buffer.alloc(0);

    var proc1 = spawnFfmpeg(`-i "${input}" ${RGBA} -vframes 1 -`, output === null ? exitCb : O.nop);
    var proc2 = output !== null ? spawnFfmpeg(`${PIXEL_FORMAT} -s ${w}x${h} -i - -y ${TRUNC} "${output}"`, exitCb) : null;

    proc1.stdout.on('data', data => {
      buff = Buffer.concat([buff, data]);

      if(buff.length == buffLen){
        putBuffer(g, buff);
        frameFunc(w, h, g, proc2 !== null ? proc2.stdout : null);

        if(proc2 !== null) end(proc2, canvas.toBuffer('raw'));
      }
    });
  });
}

function renderVideo(output, w, h, fps, fast, frameFunc=O.nop, exitCb=O.nop, vflip=0){
  output = format.path(output);

  var canvas = createCanvas(w, h);
  var g = canvas.getContext('2d');
  var f = 0;

  var proc = spawnFfmpeg(`${PIXEL_FORMAT} -s ${w}x${h} -framerate ${fps} -i - -y -framerate ${fps}${
    vflip ? ' -vf vflip' : ''
  } ${
    fast ? FAST_PRESET : HD_PRESET
  } ${TRUNC} "${output}"`, exitCb);

  frame();

  function frame(){
    var value = frameFunc(w, h, g, ++f);
    var buf;

    if(value instanceof Buffer){
      buf = value;
    }else if(value === null){
      f--;
      setTimeout(frame);
      return;
    }else if(value === -1){
      end(proc);
      return;
    }else{
      buf = canvas.toBuffer('raw');
    }

    if(value) write(proc, buf, frame);
    else end(proc, buf);
  }
}

function editVideo(input, output, w2, h2, fps, fast, frameFunc=O.nop, exitCb=O.nop){
  input = format.path(input);
  output = format.path(output);

  getMediaParams(input, (w1, h1, framesNum) => {
    var g1 = createCanvas(w1, h1).getContext('2d');
    var g2 = createCanvas(w2, h2).getContext('2d');
    var buffLen = w1 * h1 << 2;
    var buff = Buffer.alloc(0);
    var f = 0;

    var proc1 = spawnFfmpeg(`-i "${input}" ${RGBA} -r ${fps} -`);
    var proc2 = spawnFfmpeg(`${PIXEL_FORMAT} -s ${w2}x${h2} -framerate ${fps} -i - -y -pix_fmt yuv420p -framerate ${fps} ${
      fast ? FAST_PRESET : HD_PRESET
    } ${TRUNC} "${output}"`, exitCb);

    proc1.stdout.on('data', data => {
      var b = null;

      buff = Buffer.concat([buff, data]);

      if(buff.length > buffLen){
        b = buff.slice(buffLen);
        buff = buff.slice(0, buffLen);
      }

      if(buff.length == buffLen){
        proc1.stdout.pause();

        putBuffer(g1, buff);
        buff = Buffer.alloc(0);
        frameFunc(w1, h1, w2, h2, g1, g2, ++f, framesNum, proc2.stdout);

        write(proc2, g2.canvas.toBuffer('raw'), () => proc1.stdout.resume());
      }

      if(b !== null) buff = b;
    });

    proc1.on('exit', status => {
      end(proc2);
    });
  });
}

function renderAudio(output, w, func, exitCb=O.nop){
  output = format.path(output);

  var buffLen = w << 2;
  var f = 0;

  var proc = spawnFfmpeg(`-f f32le -ar ${w} -ac 1 -i - -y -b:a 128k "${output}"`, exitCb);

  frame();

  function frame(){
    var buff = Buffer.alloc(buffLen);
    var notFinished = func(w, buff, ++f);

    if(notFinished === null){
      f--;
      setTimeout(frame);
      return;
    }

    if(notFinished) write(proc, buff, frame);
    else end(proc, buff);
  }
}

function presentation(output, w, h, fps, fast, exitCb=O.nop){
  output = format.path(output);

  var canvas = createCanvas(w, h);
  var g = canvas.getContext('2d');
  var f = 0;

  var proc = spawnFfmpeg(`${PIXEL_FORMAT} -s ${w}x${h} -framerate ${fps} -i - -y -framerate ${fps} ${
    fast ? FAST_PRESET : HD_PRESET
  } ${TRUNC} "${output}"`, exitCb);

  frame.g = g;
  frame.f = 1;

  return frame;

  function frame(value){
    return new Promise(res => {
      var buff;

      if(value instanceof Buffer) buff = value;
      else if(value === true) buff = canvas.toBuffer('raw');

      if(value) write(proc, buff, r);
      else end(proc, buff, r);

      function r(){
        frame.f++;
        res();
      }
    });
  }
}

function custom(inputArgs, input, outputArgs, output, func=O.nop, exitCb=O.nop){
  output = format.path(output);

  var f = 0;
  var proc = spawnFfmpeg(`${inputArgs} -i "${input}" -y ${outputArgs} "${output}"`, exitCb);

  frame();

  function frame(){
    var buff = func(++f);

    if(buff) write(proc, buff, frame);
    else end(proc);
  }
}

function buff2canvas(buff, cb=O.nop){
  var tempDir = getTempDir();
  var tempFile = path.join(tempDir, '1');

  fs.writeFileSync(tempFile, buff);

  var ffprobe = getMediaParams(tempFile, (w, h) => {
    if(w === null)
      return err(h);

    var proc = spawnFfmpeg(`-i "${tempFile}" -f rawvideo -pix_fmt rgba -vframes 1 -`);
    var g = createContext(w, h);
    var imgd = g.createImageData(w, h);
    var data = imgd.data;
    var i = 0;

    proc.stdout.on('data', chunk => {
      var len = chunk.length;

      for(var j = 0; j !== len; j++)
        data[i++ | 0] = chunk[j | 0] | 0;
    });

    proc.on('exit', status => {
      if(status !== 0)
        return err(status);

      g.putImageData(imgd, 0, 0);

      cb(g.canvas);
    });

    proc.stdin.on('error', O.nop);
    end(proc, buff);
  });

  ffprobe.stdin.on('error', O.nop);
  end(ffprobe, buff);

  function err(status){
    cb(null, new Error(`The process exited with code ${status}`));
  }
}

function blur(g, x, y, w, h, r = 5){
  blurRegion(g, x, y, w, h, r);
  blurRegion(g, x, y, w, h, r);
}

function blurRegion(g, xx, yy, w, h, r){
  var imgd = g.getImageData(xx, yy, w, h);
  var data = imgd.data;
  var buff = Buffer.alloc(w * h << 2);

  var x, y;
  var i, j;
  var index, num;
  var sum = [0, 0, 0];

  for(y = 0; y < h; y++){
    for(x = 0; x < w; x++){
      num = 0;
      sum[0] = sum[1] = sum[2] = 0;

      for(j = y - r; j <= y + r; j++){
        for(i = x - r; i <= x + r; i++){
          if(i >= 0 && i < w && j >= 0 && j < h){
            index = i + j * w << 2;

            sum[0] += data[index];
            sum[1] += data[index + 1];
            sum[2] += data[index + 2];

            num++;
          }
        }
      }

      index = x + y * w << 2;

      buff[index] = sum[0] / num + .5;
      buff[index + 1] = sum[1] / num + .5;
      buff[index + 2] = sum[2] / num + .5;
    }
  }

  for(i = 0; i < buff.length; i += 4){
    data[i] = buff[i];
    data[i + 1] = buff[i + 1];
    data[i + 2] = buff[i + 2];
  }

  g.putImageData(imgd, xx, yy);
}

function fill(g, x, y, imgd=null){
  var {width: w, height: h} = g.canvas;

  if(imgd === null) imgd = g.getImageData(0, 0, w, h);
  var data = imgd.data;

  var col = Buffer.from(col2rgb(g.fillStyle));

  var i = getI(x, y);
  var colPrev = Buffer.alloc(3);

  colPrev[0] = data[i];
  colPrev[1] = data[i + 1];
  colPrev[2] = data[i + 2];

  if(col.equals(colPrev)) return 0;

  var queue = [x, y];

  while(queue.length !== 0){
    x = queue.shift(), y = queue.shift();
    if(!isPrev(x, y)) continue;

    var i = getI(x, y);

    data[i] = col[0];
    data[i + 1] = col[1];
    data[i + 2] = col[2];

    add(x, y - 1);
    add(x + 1, y);
    add(x, y + 1);
    add(x - 1, y);
  }

  g.putImageData(imgd, 0, 0);

  return 1;

  function add(x, y){
    if(!(isIn(x, y) && isPrev(x, y))) return;
    queue.push(x, y);
  }

  function isPrev(x, y){
    var i = getI(x, y);

    return data[i] === colPrev[0] &&
      data[i + 1] === colPrev[1] &&
      data[i + 2] === colPrev[2];
  }

  function isIn(x, y){
    return x >= 0 && y >= 0 && x < w && y < h;
  }

  function getI(x, y){
    return x + y * w << 2;
  }
}

function scale(g, wt, ht){
  const {canvas} = g;
  const {width: w, height: h} = canvas;

  const g1 = createContext(wt, ht);
  g1.drawImage(canvas, 0, 0, w, h, 0, 0, wt, ht);

  return g1;
}

function putBuffer(g, buff){
  var w = g.canvas.width;
  var h = g.canvas.height;
  var buffLen = w * h << 2;

  var imgd = g.getImageData(0, 0, w, h);
  var data = imgd.data;

  for(var i = 0; i < buffLen; i++) imgd.data[i] = buff[i];

  g.putImageData(imgd, 0, 0);
}

function spawnFfmpeg(args, exitCb=O.nop){
  return spawnProc('ffmpeg', args, exitCb);
}

function getMediaParams(mediaFile, cb){
  var proc = spawnProc('ffprobe', `-v quiet -print_format json -show_format -show_streams -i "${mediaFile}"`);
  var data = Buffer.alloc(0);

  proc.stdout.on('data', chunk => {
    data = Buffer.concat([data, chunk]);
  });

  proc.on('exit', status => {
    if(status !== 0)
      return cb(null, status);

    var str = data.toString('utf8');
    var err = null;

    try{
      var obj = JSON.parse(str);
      var s = obj.streams[0];
    }catch(e){
      err = e;
    }

    if(err !== null) return cb(null, err);
    cb(s.width, s.height, Number(s.nb_frames));
  });

  return proc;
}

function spawnProc(name, args, exitCb=O.nop){
  name = path.join(FFMPEG_DIR, name);

  var args = [
    '-hide_banner',
    ...args.match(/"[^"]*"|\S+/g).map(a => a[0] == '"' ? a.substring(1, a.length - 1) : a)
  ];

  if(DEBUG){
    var border = '='.repeat(70);
    var argsStr = args.slice(1).map(arg => arg.includes(' ') ? `"${arg}"` : arg).join(' ');
    var strName = name.match(/([a-z]+)$/)[1];
    var str = `\n${border}\n${strName} ${argsStr}\n${border}\n`;

    log(str);
  }

  var options = {
    windowsHide: false,
  };

  var proc = cp.spawn(name, args, options);
  if(priority) setPriority(proc.pid);

  procs.push(proc);

  proc.stderr.on('data', DEBUG ? onStderrData : O.nop);
  proc.on('exit', code => onProcExit(proc, code, exitCb));

  return proc;
}

function onProcExit(proc, code, exitCb=O.nop){
  var index = procs.indexOf(proc);
  procs.splice(index, 1);

  exitCb(code);
}

function onStderrData(data){
  logSync(data);
}

function createCanvas(w, h){
  var g = new Canvas(w, h).getContext('2d');

  g.fillStyle = 'black';
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'white';

  g.textBaseline = 'middle';
  g.textAlign = 'center';
  g.font = '32px "Arial"';

  return g.canvas;
}

function createContext(w, h){
  return createCanvas(w, h).getContext('2d');
}

function closeProcs(){
  shouldExit = 1;

  procs.forEach(proc => {
    if(proc[SYM_PROC_IRRELEVANT])
      try{ proc.kill(); }catch{}
    else
      try{ proc.stdin.end(); }catch{}
  });
}

function write(proc, buff, cb){
  if(shouldExit) return;
  proc.stdin.write(buff, cb);
}

function end(proc, buff, cb){
  if(shouldExit) return;
  proc.stdin.end(buff, cb);
}

function getTempDir(){
  if(tempDir === null){
    const req = require;
    tempDir = req('../temp-dir')(__filename);
  }

  return tempDir;
}

function resetStatus(){
  logStatus.reset();
}

function col2rgb(col){
  ctx.fillStyle = '#000000';
  ctx.fillStyle = col;

  col = ctx.fillStyle.match(/[0-9a-z]{2}/g);
  col = col.map(byte => parseInt(byte, 16));

  return col;
}

function rgb2col(rgb){
  ctx.fillStyle = '#000000';
  ctx.fillStyle = `rgb(${[...rgb]})`;

  var col = ctx.fillStyle;

  return col;
}

function normalize(col){
  return rgb2col(col2rgb(col));
}

function color(col){
  return O.Color.from(col2rgb(col));
}

function setPriorityForNewProcs(pr=1){
  priority = pr;
}