'use strict';

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const O = require('../omikron');
const Ebuf = require('../ebuf');
const logSync = require('../log-sync');

module.exports = {
  createInterface,
  rl: createInterface,
};

function createInterface(input, output){
  return new ReadlineInterface(input, output);
}

class ReadlineInterface extends EventEmitter{
  constructor(input=process.stdin, output=process.stdout){
    super();

    if(input !== process.stdin)
      throw new TypeError('Input stream must be process.stdin');
    if(output !== process.stdout)
      throw new TypeError('Output stream must be process.stdout');

    this.lines = [];
    this.ebuf = new Ebuf();
    this.cr = 0;

    this.end = 0;
    this.sigints = 0;

    this.active = 1;
    this.paused = 0;
    this.listenWhenPaused = 0;

    this.qCb = null;

    this.aels();
  }

  aels(){
    O.proc.on('sigint', this.onSigintB = this.onSigint.bind(this));
    O.proc.stdin.on('data', this.onDataB = this.onData.bind(this));
    O.proc.stdin.on('end', this.onEndB = this.onEnd.bind(this));
    O.proc.stdin.ref();
  }

  ask(prompt='', cb){
    if(this.qCb !== null)
      throw new TypeError('Question callback is already set');

    logSync(prompt);
    this.qCb = cb;
  }

  aska(prompt){
    return new Promise(res => {
      this.ask(prompt, res);
    });
  }

  question(prompt, cb){
    return this.ask(prompt, cb);
  }

  questiona(prompt, cb){
    return this.aska(prompt, cb);
  }

  onData(data){
    if(this.paused && !this.listenWhenPaused)
      return;

    const {lines, ebuf} = this;
    var {cr} = this;

    for(var byte of data){
      if(byte === 0x0D){ // CR
        if(cr) this.push();
        else cr = 1;
        continue;
      }

      if(byte === 0x0A){ // LF
        cr = 0;
        this.push();
        continue;
      }

      ebuf.push(byte);
    }

    this.cr = cr;
    this.update();
  }

  onEnd(){
    this.end = 1;

    if(this.cr){
      this.push();
      this.cr = 0;
    }

    this.update();
  }

  onSigint(){
    this.sigints++;
    this.update();
  }

  onLine(line){
    const {qCb} = this;

    this.emit('line', line);

    if(qCb !== null){
      this.qCb = null;
      qCb(line);
    }
  }

  update(){
    this.paused = !this.active;
    if(this.paused) return;

    for(var line of this.lines)
      this.onLine(line);
    this.lines.length = 0;

    if(this.end){
      this.emit('end');
      this.end = 0;
    }

    O.repeat(this.sigints, () => this.emit('sigint'));
    this.sigints = 0;
  }

  pause(){
    this.active = 0;
    this.update();
  }

  resume(){
    this.active = 1;
    this.update();
  }

  close(){
    O.proc.removeListener('sigint', this.onSigintB);
    O.proc.stdin.removeListener('data', this.onDataB);
    O.proc.stdin.removeListener('end', this.onEndB);
    O.proc.stdin.unref();
  }

  push(){
    const {lines, ebuf} = this;

    var buf = ebuf.getBuf();
    lines.push(buf.toString());
    ebuf.reset();
  }
}