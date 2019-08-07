'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../omikron');

const PID = process.pid;

module.exports = setPriority;

function setPriority(pid=PID, pr='realtime'){
  return new Promise(res => {
    var proc = cp.spawn('wmic', [
      'process',
      'where',
      `ProcessID=${pid}`,
      'CALL',
      'setpriority',
      pr,
    ]);

    proc.on('exit', () => res());
  });
}