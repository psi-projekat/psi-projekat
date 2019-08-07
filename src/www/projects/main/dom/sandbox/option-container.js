'use strict';

const LS = require('../../strings');
const Element = require('../element');
const OptionLabel = require('./option-label');

class OptionContainer extends Element.Div{
  constructor(parent, label, optCtor, ...args){
    super(parent);

    this.label = new OptionLabel(this, label);
    this.opt = new optCtor(this, ...args);
  }

  css(){ return 'sandbox-option-container'; }
}

module.exports = OptionContainer;