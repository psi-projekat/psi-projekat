'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Program = require('./program');

class Machine{
  #lang;
  #script;
  #prog;

  constructor(lang, script, maxSize, criticalSize){
    this.#lang = lang;
    this.#script = script;
    this.#prog = new Program(lang, script, maxSize, criticalSize);
  }

  get lang(){ return this.#lang; }
  get script(){ return this.#script; }
  get prog(){ return this.#prog; }
  get stdin(){ return this.#prog.stdin; }
  get stdout(){ return this.#prog.stdout; }
  get stderr(){ return this.#prog.stderr; }
  get active(){ return this.#prog.active; }
  get done(){ return this.#prog.done; }
  get calledGC(){ return this.#prog.calledGC; }

  tick(){
    this.#prog.tick();
  }
}

module.exports = Machine;