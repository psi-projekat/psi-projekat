'use strict';

const LS = require('../../strings');
const backend = require('../../backend');
const Element = require('../element');
const Form = require('../form');
const elemCtors = require('../user-profile');
const Page = require('./page');

class UserProfile extends Page{
  constructor(parent, data){
    super(parent);

    this.data = data;
    this.btns = [];

    const me = O.lst.signedIn && data.nick === O.lst.nick;
    const editable = O.lst.signedIn && O.lst.isMod && !data.isMod;

    this.avatar = new elemCtors.Avatar(this, data.nick, me);

    {
      const labels = [
        ['nick', 'nick', 0],
        ['email', 'email', 0],
        ['registrationDate', 'registrationDate', 0],
        ['points', 'points', 0],
        ['fullName', 'fullName', 1],
        ['description', 'desc', 1],
        ['isMod', 'isMod', 0],
      ];

      for(const [key, labelName] of labels){
        let val = data[key];
        if(val === null) continue;

        if(key === 'isMod') val = LS.bool[val];

        const label = LS.labels.userProfile[labelName];
        new elemCtors.Label(this, label, val);
      }

      if(O.lst.signedIn){
        const strs = LS.labels.forms.buttons;

        if(me){
          const form = new Form(this);

          {
            const field = form.createField(Element.InputDropdown, 'type');
            for(const [type, labelName, editable] of labels){
              if(!editable) continue;
              field.addOpt(type, LS.labels.userProfile[labelName]);
            }
          }

          form.createField(Element.InputText, 'val', LS.labels.forms.fields.newVal);
          form.addConfirm();

          form.on('confirm', fields => {
            const {type, val} = fields;
            O.glob.dom.handle(backend.editUserData(O.lst.token, type, val));
          });
        }

        if(!me && editable){
          this.addBtn(strs.turnIntoMod, this.turnIntoMod.bind(this));
        }

        if(me || editable){
          if(me) this.addBtn(strs.deleteOwnProfile, this.deleteOwnProfile.bind(this));
          else this.addBtn(strs.deleteOtherProfile, this.deleteOtherProfile.bind(this));
        }
      }
    }
  }

  static title(){ return LS.titles.userProfile; }

  addBtn(label, listener){
    const {btns} = this;
    if(btns.length !== 0) this.br();

    const btn = new elemCtors.UserPageButton(this, label).on('click', listener);
    btns.push(btn);

    return btn;
  }

  turnIntoMod(){
    O.glob.dom.handle(backend.turnIntoMod(O.lst.token, this.data.nick));
  }

  deleteOwnProfile(){
    O.glob.dom.handle(backend.deleteOwnProfile(O.lst.token).then(() => {
      O.lst.token = null;
      location.href = '/';
    }));
  }

  deleteOtherProfile(){
    O.glob.dom.handle(backend.deleteOtherProfile(O.lst.token, this.data.nick), '');
  }

  css(){ return 'user-profile'; }
}

module.exports = UserProfile;