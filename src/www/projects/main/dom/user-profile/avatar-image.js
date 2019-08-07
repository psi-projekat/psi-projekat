'use strict';

const LS = require('../../strings');
const Element = require('../element');

class AvatarImage extends Element.Image{
  constructor(parent, nick){
    super(parent, getUrl(nick));
    this.nick = nick;
  }

  css(){ return 'user-profile-avatar-img'; }
}

module.exports = AvatarImage;

function getUrl(nick){
  return `/avatar?nick=${nick}`;
}