'use strict';

const format = require('/node/format');
const LS = require('../../strings');
const Element = require('../element');

class Integer extends Element.InputText{
  constructor(parent, min, max, val){
    super(parent);

    this.min = min;
    this.max = max;
    this.val = val;

    this.ael('blur', evt => {
      const {val} = this;
      let err = null;

      if(this.elem.value !== format.num(this.val)) err = 'invalidNum';
      else if(val < this.min) err = 'tooSmallNum';
      else if(val > this.max) err = 'tooBigNum';
      else return;

      O.glob.dom.alert(LS.errors[err], () => {
        this.focus();
      });
    });
  }

  get val(){
    return this.elem.value.replace(/[^\d\-]+/g, '') | 0;
  }

  set val(val){
    return this.elem.value = format.num(val | 0);
  }

  css(){ return 'integer'; }
}

module.exports = Integer;