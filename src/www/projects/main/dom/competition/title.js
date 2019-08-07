'use strict';

const LS = require('../../strings');
const Element = require('../element');

class CompetitionTitle extends Element.Span{
  constructor(parent, title, maxUsers, currentUsers){
    super(parent);

    this.title = title;
    this.maxUsers = maxUsers;
    this.currentUsers = currentUsers;

    this.update();
  }

  update(){
    const {title, maxUsers, currentUsers} = this;
    this.val = `${title} (${currentUsers}/${maxUsers})`;
  }

  css(){ return 'competition-title'; }
}

module.exports = CompetitionTitle;