'use strict';

const LS = require('../../strings');
const Element = require('../element');
const Form = require('../form');

class UserPageButton extends Form.ButtonConfirm{
  css(){ return 'user-page-btn'; }
}

module.exports = UserPageButton;