'use strict';

const LS = require('../../strings');
const backend = require('../../backend');
const Element = require('../element');
const Page = require('./page');
const Form = require('../form');

class Login extends Page{
  constructor(parent){
    super(parent);

    const form = new Form(this);

    const fields = [
      ['InputText', 'nick', 'nick'],
      ['InputPass', 'pass', 'pass'],
    ];

    this.fields = fields.map(([ctorName, fieldName, labelName]) => {
      const ctor = Element[ctorName];
      const label = LS.labels.forms.fields[labelName];

      form.createField(ctor, fieldName, label);
    });

    form.addConfirm();

    form.on('confirm', fields => {
      const {nick, pass} = fields;
      const {dom} = O.glob;

      backend.login(nick, pass).then(({token, isMod}) => {
        log(token, isMod);

        O.lst.nick = nick;
        O.lst.isMod = isMod;

        // This should be set at the end
        O.lst.token = token;

        location.href = '/';
      }, err => {
        dom.err(err);
      });
    });

    this.form = form;
  }

  static title(){ return LS.titles.login; }

  css(){ return 'login'; }
}

module.exports = Login;