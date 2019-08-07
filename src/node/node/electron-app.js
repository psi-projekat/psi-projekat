'use strict';

const fs = require('fs');
const path = require('path');
const electron = require('electron');

const DEBUG = process.argv.includes('visual');

const size = 500;

const cwd = process.cwd();
const mainFile = path.join(cwd, process.argv[2]);

const args = process.argv.slice(3);

electron.app.once('ready', main);

function main(){
  const ipc = electron.ipcMain;

  ipc.on('log', (evt, args) => console.log.apply(null, args));
  ipc.on('info', (evt, args) => console.info.apply(null, args));
  ipc.on('error', (evt, args) => console.error.apply(null, args));
  ipc.on('logRaw', (evt, data) => logRaw(data));
  ipc.on('getArgs', (evt, data) => evt.sender.send('args', args));

  const win = new electron.BrowserWindow({
    width: size,
    height: size,
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  if(DEBUG){
    win.webContents.openDevTools();

    win.on('ready-to-show', () => {
      win.maximize();
      win.show();
    });
  }

  win.loadURL(`data:text/html;base64,${Buffer.from(`<script>${
    `window.addEventListener('load',()=>require(${JSON.stringify(mainFile)}))`
  }</script>`).toString('base64')}`);
}

function logRaw(data){
  process.stdout.write(data);
}

function log(...args){
  console.log(...args);
}