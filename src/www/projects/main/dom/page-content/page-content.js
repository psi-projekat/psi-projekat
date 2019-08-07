'use strict';

const LS = require('../../strings');
const Element = require('../element');

class PageContent extends Element.Div{
  constructor(parent){
    super(parent);
  }

  css(){ return 'page-content'; }
}

module.exports = PageContent;