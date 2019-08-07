'use strict';

const LS = require('../../strings');
const backend = require('../../backend');
const Element = require('../element');
const AvatarImage = require('./avatar-image');

class Avatar extends Element.Div{
  constructor(parent, nick, editable){
    super(parent);

    const {dom} = O.glob;

    this.editable = editable;
    const img = this.img = new AvatarImage(this, nick);

    if(editable){
      O.ael(this.elem, 'click', evt => {
        dom.openFile(file => {
          if(file === null) return;
          dom.handle(backend.editUserData(O.lst.token, 'avatar', file), null, 1);
        });
      });
    }
  }

  css(){ return 'user-profile-avatar'; }
}

module.exports = Object.assign(Avatar, {
  AvatarImage,
});

function getUrl(nick){
  return `/avatar?nick=${nick}`;
}