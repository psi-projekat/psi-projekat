'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');
const SG = require('../../../serializable-graph');
const SF = require('../../stack-frame');
const cgs = require('../../common-graph-nodes');
const ParserBase = require('../../parser-base');

class Parser extends ParserBase{
  constructor(g, syntax, str, exec){
    super(g, syntax, str, exec);
    if(g.dsr) return;
  }
}

module.exports = Parser;

const Compiler = require('./compiler');
const Interpreter = require('./interpreter');

Parser.Compiler = Compiler;
Parser.Interpreter = Interpreter;