'use strict';

const LS = require('../../strings');
const backend = require('../../backend');
const Element = require('../element');
const Form = require('../form');
const Competition = require('../competition');
const Page = require('./page');

class CompetitionPage extends Page{
  constructor(parent, competitions=[]){
    super(parent);

    const {dom} = O.glob;

    if(O.lst.signedIn && O.lst.isMod){
      const form = this.form = new Form(this);
      const strs = LS.labels.forms;

      form.createField(Element.InputText, 'title', strs.fields.compTitle);
      form.createField(Element.InputText, 'desc', strs.fields.compDesc);
      form.createField(Element.InputText, 'startDate', strs.fields.compStartDate);
      form.createField(Element.InputText, 'maxUsers', strs.fields.compMaxUsers);
      form.addConfirm(strs.buttons.addComp);

      form.on('confirm', fields => {
        const {title, desc} = fields;
        let startDate, maxUsers;

        {
          const startStr = fields.startDate;
          const match = startStr.match(/^(\d{2})\.(\d{2})\.(\d{4})\. (\d{2})\:(\d{2})$/);
          if(match === null) return dom.err('invalidDateFormat');

          const date = new Date();
          date.setDate(match[1]);
          date.setMonth(match[2] - 1);
          date.setFullYear(match[3]);
          date.setHours(match[4]);
          date.setMinutes(match[5]);
          date.setSeconds(0);

          log(...match.slice(1));

          startDate = date.getTime();
          log(startDate);
        }

        {
          const maxUsersStr = fields.maxUsers;
          const match = maxUsersStr.match(/^\d+$/);
          if(match === null) return dom.err('invalidNum');

          maxUsers = +match[0];
        }

        backend.addCompetition(O.lst.token, title, desc, startDate, maxUsers).then(() => {
          dom.nav('competition');
        }).catch(err => {
          dom.err(err);
        });
      });
    }

    this.competitions = [];
    this.addcompetitions(competitions);
  }

  static title(){ return LS.titles.competition; }

  createCompetition(...args){
    const competition = new Competition(this, ...args);
    this.addCompetition(competition);
  }

  addCompetition(comp){
    this.competitions.push(comp);

    const {dom} = O.glob;
    const {token} = O.lst;
    const {msgs} = LS.labels.competition;

    const alert = applied => {
      dom.alert(`${
        applied ?
        msgs.applied :
        msgs.gaveUp
      } ${O.sf(comp.getTitle())}`);
    }

    comp.on('stateChange', (applied, cb) => {
      const send = (...args) => {
        const methodName = applied ? 'applyForCompetition' : 'giveUpFromCompetition';

        backend[methodName](token, comp.id, ...args).then(() => {
          const {title} = comp;
          title.currentUsers += applied ? 1 : -1;
          title.update();

          alert(applied);
          cb(1);
        }).catch(err => {
          dom.err(err);
          cb(0);
        });
      };

      if(!applied) return send();

      dom.openFile(file => {
        if(file === null) return cb(0);
        send(file);
      });
    });
  }

  addcompetitions(competitions){
    for(const competition of competitions)
      this.addCompetition(competition);
  }

  css(){ return 'competition-page'; }
}

CompetitionPage.Competition = Competition;

module.exports = CompetitionPage;