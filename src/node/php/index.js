'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../omikron');
const config = require('../config');

const cwd = __dirname;
const phpDir = path.join(cwd, '../../php');

/*
  This semaphore ensures that only one query will be executed at a time.
  That is important, because some queries that are implemented in the PHP
  directory `queries` rely on that assumption.
*/
const sem = new O.Semaphore(1);

module.exports = {
  exec,
};

async function exec(query, args=null){
  await sem.wait();

  query = query.replace(/[A-Z]/g, a => `-${a.toLowerCase()}`);

  return new Promise((res, rej) => {
    const proc = cp.spawn(config.exe.php, [
      '-d', 'display_errors=stderr',
      'main.php',
    ], {
      cwd: phpDir,
    });

    const outBufs = [];
    const errBufs = [];

    proc.stdout.on('data', buf => outBufs.push(buf));
    proc.stderr.on('data', buf => errBufs.push(buf));

    proc.on('exit', code => {
      const outStr = Buffer.concat(outBufs).toString('utf8').trim();
      const errStr = Buffer.concat(errBufs).toString('utf8').trim();

      if(errStr.length !== 0){
        log(errStr);
        return rej('php');
      }

      if(code !== 0){
        if(outStr !== 0) return rej(outStr);
        return rej(`PHP NZEC ${code}`);
      }

      if(outStr.length === 0) return res(null);

      let ok = 0;
      let data;

      try{
        data = JSON.parse(outStr);
        ok = 1;
      }catch{}

      if(!ok) return rej(`Invalid JSON: ${O.sf(outStr)}`);
      if(data.error !== null) return rej(data.error);

      res(data.data);
    });

    proc.on('error', rej);

    proc.stdin.end(JSON.stringify({query, args}) + '\n');
  }).finally(() => sem.signal());
}