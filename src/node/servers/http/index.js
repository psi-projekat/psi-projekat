'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const O = require('../../omikron');
const config = require('../../config');
const echo = require('../../echo');
const Server = require('../server');
const Captcha = require('../data/captcha');

const SIMULATE_SLOW_CONNECTION = 0;
const DELAY_RESPONSE = 100;

const INDEX_FILE = 'index.htm';

const cwd = __dirname;
const wwwDir = path.join(cwd, '../../../www');
const nodeDir = path.join(cwd, '../..');

class HTTPServer extends Server{
  constructor(port){
    super(port);

    const onReq = this.onReq.bind(this);
    this.server = http.createServer(onReq);
  }

  static name(){ return 'http'; }

  start(){
    this.server.listen(this.port);
  }

  close(){
    this.server.close();
  }

  onReq(req, res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'x-requested-with');

    const send = file => {
      const sendFile = () => fs.createReadStream(file).pipe(res);

      if(!SIMULATE_SLOW_CONNECTION) return sendFile(file);
      setTimeout(sendFile, DELAY_RESPONSE);
    };

    const err = (status, info=null) => {
      if(errHandled) return;

      const hs = req.headers;
      const hName = 'x-requested-with';

      if(O.has(hs, hName) && hs[hName] === 'XMLHttpRequest'){
        res.statusCode = status;
        res.end(info !== null ? info : '');
      }else{
        let redirect = `/?path=error&status=${status}`;
        if(info !== null) redirect += `&info=${info}`;

        res.statusCode = 301;
        res.setHeader('Location', redirect);
        res.end();
      }

      errHandled = 1;

      throw new Error(info);
    };

    const e404 = () => err(404);

    const {url} = req;
    const pth = url.replace(/^\/|[\?\#].*/gs, '') || '/';

    let errHandled = 0;

    try{
      if(/^(?:omikron|framework)\.js$/.test(pth))
        return send(O.dirs.omikron);

      if(pth === 'echo'){
        const match = url.match(/[\?\&]token=([^\&]*)/);
        if(match === null) e404();

        const token = match[1];
        const buf = echo.get(token);
        if(buf === null) e404();

        return res.end(buf);
      }

      if(pth === 'captcha'){
        const match = url.match(/[\?\&]token=([^\&]*)/);
        if(match === null) e404();

        const token = match[1];
        const captcha = Captcha.get(token);
        if(captcha === null) e404();

        return send(captcha.file);
      }

      if(pth === 'avatar'){
        const match = url.match(/[\?\&]nick=([^\&]*)/);
        if(match === null) e404();

        const nick = match[1];
        if(!/^[a-z0-9\-]+$/.test(nick)) e404();

        const dir = config.dirs.avatars;
        let file = path.join(dir, `${nick}.png`);
        if(!fs.existsSync(file)) file = path.join(dir, `${config.defaultAvatar}.png`);

        return send(file);
      }

      if(
        !/^[a-z0-9\-\.\/]+$/i.test(pth) ||
        /^\.|\.$|\.{2}/.test(pth)
      ) err(400, 'invalidURL');

      const check = (en=entry) => {
        if(!fs.existsSync(en))
          e404();
      };

      const isNode = pth.startsWith('node/');
      const dir = isNode ? nodeDir : wwwDir;
      const pthNew = isNode ? pth.split('/').slice(1).join('/') : pth;

      let entry = path.join(dir, pthNew);
      check(entry);

      const stat = fs.statSync(entry);

      if(stat.isFile()){
        send(entry);
      }else if(stat.isDirectory()){
        entry = path.join(entry, INDEX_FILE);
        check(entry);
        send(entry);
      }else{
        err(500, 'unknownEntry');
      }
    }catch(e){
      if(!errHandled){
        log('[WARNING] Internal server error');
        log(e);
        log();
      }

      err(500, String(e));
    }
  }
}

module.exports = HTTPServer;