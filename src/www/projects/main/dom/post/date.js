'use strict';

const LS = require('../../strings');
const Element = require('../element');

class PostDate extends Element.Span{
  constructor(parent, date){
    const str = O.date(date);
    super(parent, str);
  }

  css(){ return 'post-date'; }
}

module.exports = PostDate;