'use strict';

const LS = require('../../strings');
const Element = require('../element');

class SearchResults extends Element.Div{
  css(){ return 'search-results'; }
}

module.exports = SearchResults;