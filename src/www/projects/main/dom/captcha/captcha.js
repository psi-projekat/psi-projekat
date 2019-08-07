'use strict';

const LS = require('../../strings');
const Element = require('../element');

class Captcha extends Element.Image{
  #token;

  constructor(parent, token){
    super(parent, getUrl(token));
    this.#token = token;
  }

  get token(){
    return this.#token;
  }

  set token(token){
    this.src = getUrl(token);
    this.#token = token;
  }

  css(){ return 'captcha'; }
}

module.exports = Captcha;

function getUrl(token){
  return `/captcha?token=${token}`;
}