'use strict';

const LS = require('../../strings');
const Element = require('../element');

class FunctionalityDescription extends Element.Span{
  constructor(parent, desc){
    super(parent, desc);
  }

  css(){ return 'functionality-desc'; }
}

module.exports = FunctionalityDescription;