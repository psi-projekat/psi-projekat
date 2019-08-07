'use strict';

const LS = require('../../strings');
const Element = require('../element');

class TabStrip extends Element.Div{
  css(){ return 'tab-strip'; }
}

module.exports = TabStrip;