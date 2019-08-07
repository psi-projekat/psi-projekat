'use strict';

const LS = require('../../strings');
const Element = require('../element');

class FunctionalityName extends Element.Span{
  constructor(parent, name){
    super(parent, name);
    this.name = name;
  }

  css(){ return 'functionality-name'; }
}

module.exports = FunctionalityName;