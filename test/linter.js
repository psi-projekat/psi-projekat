'use strict';

const fsRec = require('../fs-rec');

const TAB_SIZE = 2;
const MAX_LINE_LEN = 200;

const TAB = ' '.repeat(TAB_SIZE);

const codeExts = [
  'bat',
  'js',
  'glsl',
  'php',
  'sql',
];

const textExts = codeExts.concat([
  'txt',
  'md',
  'json',
  'htm',
  'css',
  'xml',
  'yml',
]);

const allExts = textExts.concat([
  'png',
  'pdf',
  'zip',
  'docx',
  'erwin',
  'obj',
  'hex',
  'mdj',
]);

const latLower = O.ca(26, i => O.sfcc(i + O.cc('a'))).join('');
const latUpper = latLower.toUpperCase();
const lat = latLower + latUpper;

const cyrLower = `
  \u0430\u0431\u0432\u0433\u0434\u0452\u0435\u0436\u0437\u0438
  \u0458\u043A\u043B\u0459\u043C\u043D\u045A\u043E\u043F\u0440
  \u0441\u0442\u045B\u0443\u0444\u0445\u0446\u0447\u045F\u0448
`.replace(/\s+/g, '');
const cyrUpper = cyrLower.toUpperCase();
const cyr = cyrLower + cyrUpper;

const lower = latLower + cyrLower;
const upper = latUpper + cyrUpper;

const allowedChars = `\r\n${O.ca(95, i => O.sfcc(i + 32)).join('')}${cyr}`;

(() => {
  const dir = path.join(cwd, '../../..');

  fsRec.processFilesSync(dir, d => {
    if(d.processed) return;
    if(d.depth === 0) return;

    const f = d.fullPath;
    const p = d.relativeSubPath.replace(/\\/g, '/');
    const sf = O.sf(p);

    if(/^(?:\.git|data)(?:\/|$)/.test(p)) return;
    if(p === '.gitignore') return;

    if(p !== '.travis.yml'){
      const name = d.isDir ?
        d.name :
        d.name.slice(0, d.name.length - d.ext.length - 1);

      if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name))
        err(`${d.isDir ? 'Directory' : 'File'} ${sf}\n${TAB}has invalid name`);
    }

    const stat = fs.statSync(f);

    if(stat.isFile()){
      const e = (msg, line=null) => {
        msg = `${TAB}has ${msg}`;
        if(line !== null) msg = `${TAB}on line ${line + 1}\n${msg}`;
        err(`File ${sf}\n${msg}`);
      };

      if(!allExts.includes(d.ext))
        e(`forbidden extension ${O.sf(d.ext)}`);

      if(d.ext !== 'txt' && textExts.includes(d.ext)){
        const str = O.rfs(f, 1);

        if(str.length === 0)
          e('no content');

        if(str.startsWith(' '))
          e('space at the beginning');

        if(/[\r\n]/.test(str.replace(/\r\n/g, '')))
          e('non-CRLF line break');

        const lines = O.sanl(str).map(line => {
          if(line.trimLeft().startsWith('*')){
            if(/^(?: {2})* \*/.test(line))
              line = line.replace(' *', '**');

            line = line.replace(/\*.*/, a => {
              return a.replace(/ +/g, ' ');
            });
          }

          return line;
        });

        if(lines[0].length === 0)
          e('new line at the beginning');

        if(O.last(lines).length === 0)
          e('new line at the end');

        const isCode = codeExts.includes(d.ext);

        lines.forEach((line, i) => {
          if(line.endsWith(' '))
            e('space at the end of line', i);

          if(/\t/.test(line))
            e('tabs instead of spaces', i);

          if(/ {2}/.test(line.trim()))
            e('two consecutive spaces', i);

          if(isCode && line.length > MAX_LINE_LEN)
            e(`more than ${MAX_LINE_LEN} characters in a single line`, i);

          {
            let chars = line.split('');
            let index;

            if((index = chars.findIndex(c => !allowedChars.includes(c))) !== -1)
              e(`illegal unicode character \\u${O.hex(O.cc(chars[index]), 2)}`, i);

            if(isCode){
              if((index = chars.findIndex(c => cyr.includes(c))) !== -1)
                e(`cyrillic character in code at position ${index + 1}`, i);
            }
          }

          if(i !== 0){
            const prev = lines[i - 1];

            if(line.length === 0 && prev.length === 0)
              e('two consecutive empty lines', i);

            const len = line.match(/^ */)[0].length;
            const lenPrev = prev.length !== 0 ?
              prev.match(/^ */)[0].length :
              lines[i - 2].match(/^ */)[0].length;
            const diff = len - lenPrev;

            if(Math.abs(diff) % TAB_SIZE !== 0)
              e(`indentation level that is not a multiple of ${TAB_SIZE}`, i);

            if(diff > 0 && diff !== TAB_SIZE)
              e(`wrong indentation (must be exactly ${TAB_SIZE} spaces)`, i);
          }
        });
      }

      return;
    }

    if(stat.isDirectory()){
      const e = msg => {
        msg = `${TAB}${msg}`;
        err(`Directory ${sf}\n${msg}`);
      };

      const files = fs.readdirSync(f);

      if(files.length === 0)
        e('is empty');

      return;
    }

    err('Unsupported file system entry type');
  });
})();

done();