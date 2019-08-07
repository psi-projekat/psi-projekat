'use strict';

const LS = require('../../strings');
const backend = require('../../backend');
const Element = require('../element');
const Captcha = require('../captcha');
const ButtonConfirm = require('./btn-confirm');

class Form extends Element.Region{
  constructor(parent){
    super(parent);

    this.fields = O.obj();

    this.captcha = null;
    this.btnConfirm = null;
  }

  createField(ctor, ...args){
    this.br();
    const field = new ctor(this, ...args);
    return this.addField(field);
  }

  addField(field){
    return this.fields[field.name] = field;
  }

  async addCaptcha(){
    this.br();
    const token = await backend.getCaptcha();
    return this.captcha = new Captcha(this, token);
  }

  async newCaptcha(){
    const token = await backend.getCaptcha();
    this.captcha.token = token;
  }

  addConfirm(label){
    this.br();

    const btn = new ButtonConfirm(this, label);;
    btn.on('click', this.onConfirm.bind(this));

    return this.btnConfirm = btn;
  }

  onConfirm(){
    const {fields} = this;
    const obj = O.obj();

    for(const fieldName in fields){
      const field = fields[fieldName];
      obj[field.name] = field.val;
    }

    if(this.captcha)
      obj.captchaToken = this.captcha.token;

    this.emit('confirm', obj);
  }

  br(){
    if(O.keys(this.fields).length === 0) return;
    super.br();
  }

  css(){ return 'form'; }
}

Form.ButtonConfirm = ButtonConfirm;

module.exports = Form;