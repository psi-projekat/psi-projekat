'use strict';

const LS = require('../../strings');
const Element = require('../element');

class OptionLabel extends Element.Span{
  constructor(parent, label){
    label = `${LS.labels.sandbox.options[label]}:`;
    super(parent, label);
  }

  css(){ return 'sandbox-option-label'; }
}

module.exports = OptionLabel;