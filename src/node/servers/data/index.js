'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const O = require('../../omikron');
const Server = require('../server');
const methods = require('./methods');

class DataServer extends Server{
  constructor(port){
    super(port);

    const onReq = this.onReq.bind(this);
    this.server = http.createServer(onReq);
  }

  static name(){ return 'data'; }

  start(){
    this.server.listen(this.port);
  }

  close(){
    this.server.close();
  }

  onReq(req, res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'x-requested-with');

    if(req.method !== 'POST'){
      req.resume();
      res.end(JSON.stringify({
        data: null,
        error: 'Request\'s method must be POST',
      }));
      return;
    }

    const bufs = [];

    req.on('data', buf => bufs.push(buf));

    req.on('end', () => {
      const buf = Buffer.concat(bufs);
      const json = buf.toString('utf8');

      processJson(json).then(data => {
        res.end(JSON.stringify({data, error: null}));
      }).catch(err => {
        if(err instanceof Error){
          log(err);
          err = 'data';
        }

        res.end(JSON.stringify({data: null, error: err}));
      });
    });
  }
}

module.exports = DataServer;

async function processJson(json){
  const err = msg => { throw msg; };

  let obj;

  try{ obj = JSON.parse(json); }
  catch{ err('Invalid JSON'); }

  if(!isObj(obj)) err('JSON value must be an object');

  if(!O.has(obj, 'method')) err('Missing method name');
  const methodName = obj.method;

  if(!isStr(methodName)) err('Method name must be a string');
  if(!O.has(methods, methodName)) err('Unknown method');
  const method = methods[methodName];

  if(!O.has(obj, 'args')) err('Missing method arguments');
  const args = obj.args;

  if(!isArr(args)) err('Arguments property must be an array');
  if(args.length !== method.length) err('Wrong number of arguments');

  return method(...args);
}

function isStr(val){
  return typeof val === 'string';
}

function isArr(val){
  return Array.isArray(val);
}

function isObj(val){
  return typeof val === 'object' && val !== null;
}