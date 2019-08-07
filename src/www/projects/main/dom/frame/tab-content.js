'use strict';

const LS = require('../../strings');
const Element = require('../element');
const Selectable = require('./selectable');

class TabContent extends Selectable{
  css(){ return 'tab-content'; }
}

module.exports = TabContent;