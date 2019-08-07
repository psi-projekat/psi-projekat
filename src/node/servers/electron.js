'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const config = require('../config');
const Server = require('./server');
const HTTPServer = require('./http');
const DataServer = require('./data');
const ports = require('./ports');

const servers = {
  http: new HTTPServer(ports.http),
  data: new DataServer(ports.data),
};

setTimeout(main);

function main(){
  iter(server => {
    server.start();
  });
}

function iter(func){
  for(const name in servers)
    func(servers[name]);
}

function exit(){
  iter(server => server.close());
}