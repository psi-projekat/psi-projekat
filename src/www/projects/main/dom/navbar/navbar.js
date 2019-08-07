'use strict';

const LS = require('../../strings');
const Element = require('../element');
const NavbarItem = require('./item');

class Navbar extends Element.Div{
  constructor(parent){
    super(parent);

    const items = {
      left: [
        ['home', ''],
        ['sandbox', 'sandbox'],
        ['competition', 'competition'],
        ['search', 'search'],
        ['help', 'help'],
        ['language', 'language'],
      ],
      right: O.lst.signedIn ? [
        ['logout', null],
        ['profile', `users/${O.lst.nick}`],
      ] : [
        ['register', 'register'],
        ['login', 'login'],
      ],
    };

    for(const type of O.keys(items)){
      const arr = items[type];
      const ctor = type === 'left' ? NavbarItem.NavbarItemLeft : NavbarItem.NavbarItemRight;

      for(let i = 0; i !== arr.length; i++){
        const [name, path] = arr[i];
        const label = LS.labels.navbar[type][name];
        const elem = new ctor(this, label, path);

        elem.on('click', evt => {
          this.onItemClick(name, elem, evt);
        });

        arr[i] = elem;
      }
    }

    this.items = items;
  }

  // Triggers when user clicks on any navbar item
  onItemClick(name, elem, evt){
    this.emit('click', name, elem, evt);
  }

  css(){ return 'navbar'; }
}

module.exports = Navbar;