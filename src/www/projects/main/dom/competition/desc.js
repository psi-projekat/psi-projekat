'use strict';

const LS = require('../../strings');
const Element = require('../element');

class CompetitionDescription extends Element.Span{
  constructor(parent, desc){
    super(parent, desc);
  }

  css(){ return 'competition-desc'; }
}

module.exports = CompetitionDescription;