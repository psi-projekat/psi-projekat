'use strict';

const LS = require('../../strings');
const Element = require('../element');

class Selectable extends Element.Div{
  constructor(parent){
    super(parent);

    this.selected = 0;
  }

  select(){
    this.elem.classList.add('selected');
    this.selected = 1;
  }

  unselect(){
    this.elem.classList.remove('selected');
    this.selected = 0;
  }

  toggle(){
    if(this.selected) this.unselect();
    else this.select();
  }

  css(){ return 'selectable'; }
}

module.exports = Selectable;