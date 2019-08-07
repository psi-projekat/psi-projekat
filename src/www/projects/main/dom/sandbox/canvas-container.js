'use strict';

const LS = require('../../strings');
const Element = require('../element');

class CanvasContainer extends Element.Div{
  css(){ return 'canvas-container'; }
}

module.exports = CanvasContainer;