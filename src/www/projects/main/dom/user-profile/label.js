'use strict';

const LS = require('../../strings');
const Element = require('../element');

class Label extends Element.Span{
  constructor(parent, label, val){
    const str = `${label}: ${val}`;
    super(parent, str);
  }

  css(){ return 'user-profile-label'; }
}

module.exports = Label;