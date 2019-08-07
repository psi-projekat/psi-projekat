'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Range = require('./range');

class RangeSet{
  constructor(range=null){
    this.ranges = [];

    if(range !== null) this.add(range);
  }

  get size(){ return this.ranges.length; }

  add(range){ this.ranges.push(range); }
  has(num){ return this.ranges.some(r => r.has(num)); }
  overlaps(range){ return this.ranges.some(r => r.overlaps(range)); }
  isEmpty(){ return this.ranges.length === 0; }
}

module.exports = RangeSet;