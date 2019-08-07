'use strict';

const LS = require('../../strings');
const Element = require('../element');
const Page = require('./page');

class Help extends Page{
  constructor(parent){
    super(parent);

    new Element.Span(this, LS.texts.help);
  }

  static title(){ return LS.titles.help; }

  css(){ return 'page-help'; }
}

module.exports = Help;