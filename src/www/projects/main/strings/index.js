'use strict';

// Local strings

const LANGUAGE = O.lst.lang;
const dir = `./locales/${LANGUAGE}`;

const LS = require(`${dir}/main`);
LS.texts = O.obj();

const texts = [
  'help',
  'script-template',
];

for(const text of texts){
  const prop = text.replace(/\-./g, a => a[1].toUpperCase());
  const data = require(`${dir}/${text}`);
  LS.texts[prop] = data;
}

const langs = require('./languages');
LS.langs = langs;
LS.lang = LANGUAGE;

O.glob.LS = LS;

module.exports = LS;