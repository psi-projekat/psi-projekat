'use strict';

const LS = require('../../strings');
const Element = require('../element');

class PostContent extends Element.Span{
  constructor(parent, str){
    super(parent, str);
  }

  css(){ return 'post-content'; }
}

module.exports = PostContent;