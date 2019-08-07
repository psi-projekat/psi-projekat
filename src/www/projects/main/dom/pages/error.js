'use strict';

const LS = require('../../strings');
const Element = require('../element');
const Page = require('./page');

const es = LS.errors;

class Error extends Page{
  constructor(parent, status, msg=null){
    status |= 0;
    Error[O.static] = status;

    super(parent);

    this.status = status;

    if(!(status in es.server.status))
      return O.error('Unsupported status code');

    if(msg === null) msg = es.server.status[status];
    else msg = es.server.info[msg];

    this.desc = new Element.Span(this, msg);
  }

  static title(){
    const status = O.has(this, 'status') ? this.status : Error[O.static];
    return `${LS.errors.error} ${status}`;
  }

  css(){ return 'page-error'; }
}

module.exports = Error;