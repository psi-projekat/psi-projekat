'use strict';

const LS = require('../../strings');
const Element = require('../element');

class PostUser extends Element.Link{
  constructor(parent, str){
    super(parent, str, `/?path=users/${str}`);
  }

  css(){ return 'post-user'; }
}

module.exports = PostUser;