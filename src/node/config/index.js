'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const IS_TRAVIS = process.env.TRAVIS === 'true';

const cwd = __dirname;
const configDir = path.join(cwd, '../../../config');
const dataDir = path.join(cwd, '../../../data');

const config = require(path.join(configDir, 'config'));
config.isTravis = IS_TRAVIS;

// Initialize executables
{
  const {exe} = config;

  for(const key of O.keys(exe)){
    const exePath = exe[key];
    exe[key] = path.normalize(
      IS_TRAVIS ?
      path.parse(exePath).name :
      resolveFile(exePath)
    );
  }
}

// Initialize directories
{
  const {dirs} = config;

  for(const key of O.keys(dirs)){
    const dir = dirs[key];
    dirs[key] = path.join(dataDir, dir);
  }

  dirs.config = configDir;
  dirs.data = dataDir;
}

// Initialize files
{
  const {files} = config;

  for(const key of O.keys(files)){
    const file = path.normalize(resolveFile(files[key]));
    Object.defineProperty(files, key, {
      get(){
        return O.rfs(path.join(configDir, file));
      },
    });
  }
}

module.exports = config;

function resolveFile(file){
  return file.replace(/%([^%]+)%/g, (a, b) => process.env[b]);
}