'use strict';

const LS = require('../../strings');
const Element = require('../element');

class UserItem extends Element.Link{
  constructor(parent, str){
    super(parent, str, `/?path=users/${str}`);
  }

  css(){ return 'user-item'; }
}

module.exports = UserItem;