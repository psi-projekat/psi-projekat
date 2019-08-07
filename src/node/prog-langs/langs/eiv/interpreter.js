'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');
const SG = require('../../../serializable-graph');
const SF = require('../../stack-frame');
const cgs = require('../../common-graph-nodes');
const InterpreterBase = require('../../interpreter-base');

class Interpreter extends InterpreterBase{
  constructor(g, script){
    super(g, script);
    if(g.dsr) return;
  }
}

const ctorsArr = [
];

const ctorsObj = O.obj();
for(const ctor of ctorsArr)
  ctorsObj[ctor.name] = ctor;

module.exports = Object.assign(Interpreter, {
  ctorsArr,
  ctorsObj,
});

const Parser = require('./parser');
const Compiler = require('./compiler');

Interpreter.Parser = Parser;
Interpreter.Compiler = Compiler;