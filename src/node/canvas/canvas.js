'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

module.exports = {
  Canvas: class{
    getContext(){
      const canvas = this;

      return new class{
        canvas = canvas;
        fillRect(){}
      };
    }
  },
};