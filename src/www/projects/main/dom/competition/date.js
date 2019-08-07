'use strict';

const LS = require('../../strings');
const Element = require('../element');

class CompetitionDate extends Element.Span{
  constructor(parent, date){
    const str = `${LS.labels.competition.startTime}: ${O.date(date)}`;
    super(parent, str);
  }

  css(){ return 'competition-date'; }
}

module.exports = CompetitionDate;