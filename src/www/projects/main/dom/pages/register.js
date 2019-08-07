'use strict';

const LS = require('../../strings');
const backend = require('../../backend');
const Element = require('../element');
const Page = require('./page');
const Form = require('../form');

class Register extends Page{
  constructor(parent){
    super(parent);

    const form = new Form(this);
    this.form = form;

    const fields = [
      ['InputText', 'nick', 'nick'],
      ['InputText', 'email', 'email'],
      ['InputPass', 'pass', 'pass'],
      ['InputPass', 'pass2', 'pass2'],
      ['InputText', 'captchaStr', 'captcha'],
    ];

    this.fields = fields.map(([ctorName, fieldName, labelName]) => {
      const ctor = Element[ctorName];
      const label = LS.labels.forms.fields[labelName];

      form.createField(ctor, fieldName, label);
    });

    form.on('confirm', fields => {
      const {nick, email, pass, pass2, captchaToken, captchaStr} = fields;
      const {dom} = O.glob;

      if(pass2 !== pass) return dom.err('passDiff');

      backend.register(nick, email, pass, captchaToken, captchaStr).then(data => {
        dom.succ('register', () => {
          dom.nav('login');
        });
      }, err => {
        form.newCaptcha();
        form.fields.captchaStr.val = '';
        dom.err(err);
      });
    });

    form.addCaptcha().then(() => {
      form.addConfirm();
    });
  }

  static title(){ return LS.titles.register; }

  css(){ return 'register'; }
}

module.exports = Register;