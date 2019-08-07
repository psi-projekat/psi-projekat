'use strict';

const LS = require('../../strings');
const backend = require('../../backend');
const Element = require('../element');
const Form = require('../form');
const FunctionalityName = require('./name');
const FunctionalityDescription = require('./desc');

class Functionality extends Element.Region{
  constructor(parent, id, name, desc, points, upgraded){
    super(parent);

    this.id = id;
    this.name = new FunctionalityName(this, `[${points}] ${name}`);
    this.desc = new FunctionalityDescription(this, desc);

    this.upgraded = upgraded;

    if(O.lst.signedIn){
      this.right = new Element.Right(this);

      if(!upgraded){
        this.btn = new Form.ButtonConfirm(this.right, LS.labels.functionality.upgrade);
        this.btn.on('click', this.onClick.bind(this));
      }
    }
  }

  onClick(){
    const {dom} = O.glob;

    backend.upgradeFunctionality(O.lst.token, this.id).then(() => {
      this.btn.remove();
      dom.alert(LS.labels.functionality.msgs.upgraded);
    }).catch(dom.err.bind(dom));
  }

  getName(){ return this.name.name; }
  css(){ return 'post'; }
}

Functionality.FunctionalityName = FunctionalityName;
Functionality.FunctionalityDescription = FunctionalityDescription;

module.exports = Functionality;