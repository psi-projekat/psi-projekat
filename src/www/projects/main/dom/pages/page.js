'use strict';

const Element = require('../element');

/*
  This is an abstract class.
  It represents base class for all pages.
*/

class Page extends Element.Div{
  constructor(parent){
    super(parent);

    this.titleElem = new Element.Title(this, this.title());
  }

  static title(){ O.virtual('title'); }
  title(){ return this.constructor.title(); }

  css(){ return 'page'; }
}

module.exports = Page;