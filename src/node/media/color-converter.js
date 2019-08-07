'use strict';

var O = require('../omikron');
var media = require('../media');

var g = new media.Canvas(1, 1).getContext('2d');

module.exports = {
  col2rgb,
  rgb2col,
  normalize,
  color,
};

function col2rgb(col){
  g.fillStyle = '#000000';
  g.fillStyle = col;

  col = g.fillStyle.match(/[0-9a-z]{2}/g);
  col = col.map(byte => parseInt(byte, 16));

  return col;
}

function rgb2col(rgb){
  g.fillStyle = '#000000';
  g.fillStyle = `rgb(${[...rgb]})`;

  var col = g.fillStyle;

  return col;
}

function normalize(col){
  return rgb2col(col2rgb(col));
}

function color(col){
  return O.Color.from(col2rgb(col));
}