'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class Server{
  constructor(port){
    this.port = port;
  }

  static name(){ O.virtual('name'); }
  name(){ return this.constructor.name(); }

  start(){ O.virtual('start'); }
  close(){ O.virtual('close'); }
}

module.exports = Server;