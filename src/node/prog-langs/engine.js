'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const format = require('../format');
const Machine = require('./machine');

class Engine{
  #machine;

  paused = 1;

  constructor(lang, script, maxSize, criticalSize){
    this.#machine = new Machine(lang, script, maxSize, criticalSize);
  }

  get stdin(){ return this.#machine.stdin; }
  get stdout(){ return this.#machine.stdout; }
  get stderr(){ return this.#machine.stderr; }

  get active(){ return !this.paused && this.#machine.active; }
  get done(){ return this.#machine.done; }

  get calledGC(){ return this.#machine.calledGC; }

  tick(){
    this.#machine.tick();
  }

  run(ticks=null){
    const machine = this.#machine;
    const g = this.#machine.prog;

    this.paused = 0;

    try{
      while(this.active){
        if(g.stage === 2 && ticks !== null && ticks-- === 0){
          ticks++;
          break;
        }

        this.tick();
      }
    }catch(err){
      let msg;

      if(err instanceof Error){
        msg = `${err.name}: ${err.message}`;
      }else{
        msg = 'UnknownError';
      }

      this.stderr.write(msg);
    }

    this.paused = 1;
    return ticks;
  }

  pause(){
    this.paused = 1;
    return this;
  }
}

module.exports = Engine;