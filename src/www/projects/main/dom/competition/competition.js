'use strict';

const LS = require('../../strings');
const Element = require('../element');
const Form = require('../form');
const CompetitionTitle = require('./title');
const CompetitionDate = require('./date');
const CompetitionDescription = require('./desc');

class Competition extends Element.Region{
  constructor(parent, id, title, date, desc, maxUsers, currentUsers, applied){
    super(parent);

    this.id = id;
    this.title = new CompetitionTitle(this, title, maxUsers, currentUsers);
    this.date = new CompetitionDate(this, date);
    this.desc = new CompetitionDescription(this, desc);

    this.applied = applied;

    if(O.lst.signedIn && (applied || currentUsers !== maxUsers)){
      this.right = new Element.Right(this);
      this.btn = new Form.ButtonConfirm(this.right);
      this.updateBtn();

      this.btn.on('click', this.onClick.bind(this));
    }
  }

  onClick(){
    this.emit('stateChange', this.applied ^ 1, ok => {
      if(!ok) return;

      this.applied ^= 1;
      this.updateBtn();
    });
  }

  updateBtn(){
    this.btn.val = this.applied ?
      LS.labels.competition.giveUp :
      LS.labels.competition.apply;
  }

  getTitle(){ return this.title.title; }
  css(){ return 'post'; }
}

Competition.CompetitionTitle = CompetitionTitle;
Competition.CompetitionDate = CompetitionDate;
Competition.CompetitionDescription = CompetitionDescription;

module.exports = Competition;