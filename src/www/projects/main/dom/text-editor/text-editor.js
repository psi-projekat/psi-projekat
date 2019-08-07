'use strict';

const LS = require('../../strings');
const Element = require('../element');

const TAB_SIZE = 2;
const TAB = ' '.repeat(TAB_SIZE);

const PAGE_LINES = 70;
const MAX_HISTORY_SIZE = 100;

class TextEditor extends Element.InputTextarea{
  constructor(parent){
    super(parent);

    this.ta = this.elem;

    this.pos = null;
    this.clipboard = null;

    this.history = [new State(1, '', 0, 0)];
    this.historyIndex = 0;

    this.aels();
  }

  aels(){
    O.ael(this.ta, 'keydown', this.onKeyDown.bind(this));
  }

  onKeyDown(evt){
    evt.preventDefault();

    const {ta, history} = this;

    var {key} = evt;
    var alt = evt.altKey;
    var ctrl = evt.ctrlKey;
    var shift = evt.shiftKey;
    var fKey = /^F\d+$/.test(key) ? key.slice(1) | 0 : 0;

    var val = ta.value;
    var len = val.length;
    var pos = getPos();

    var startPrev = getStart();
    var endPrev = getEnd();
    var size = endPrev - startPrev;

    var update = shift;
    var removePos = 1;
    var saveHistory = 1;
    var actionType = key.length === 1 && !(alt || ctrl || fKey) ? 0 : 1;

    if(fKey){
      switch(fKey){
        case 5:
          window.location.reload();
          break;
      }

      return;
    }

    if(actionType === 0){
      var s = key;

      if(s === '(') s += ')';
      else if(s === '[') s += ']';
      else if(s === '{') s += '}';
      else if(/[)\]}'"`]/.test(s) && getCharRel(0) === s) s = '';
      else if(/['"`]/.test(s)) s += s;

      if(size !== 0) remove(size);

      insert(s, 0);
      moveRel(1);

      update = 0;
    }else{
      switch(key){
        case 'a':
          if(!ctrl) break;
          setStart(0);
          setEnd(len);
          break;

        case 'M':
          if(!ctrl) break;

          var s = getCharRel(-1) + getCharRel(0);
          if(/\(\)|\[\]|{}|['"`]{2}/.test(s)) break;

          var d = 0;
          if(/[\)\]}][^\(\)\[\]{}]/.test(s)) d = -1;
          else if(/[^\(\)\[\]{}][\(\[{]/.test(s)) d = 1;
          moveRel(d);

          var depth = 0;
          var start = find((c, dpos) => {
            if(dpos === 0) return -1;
            if(/[\(\[{]/.test(c)) depth--;
            else if(/[\)\]}]/.test(c)) depth++;
            if(depth === -1) return 0;
            return -1;
          });
          if(depth !== -1){ moveRel(-d); break; }

          depth = 0;
          var end = find(c => {
            if(/[\(\[{]/.test(c)) depth++;
            else if(/[\)\]}]/.test(c)) depth--;
            if(depth === -1) return 0;
            return 1;
          });
          if(depth !== -1){ moveRel(-d); break; }

          setStart(start + 1);
          setEnd(end);

          update = 0;
          break;

        case 'c':
          if(!ctrl) break;
          var start, end;
          if(size === 0){
            start = getLineStart(1);
            end = getLineEnd();
          }else{
            start = startPrev;
            end = endPrev;
          }
          this.clipboard = val.slice(start, end);
          break;

        case 'x':
          if(!ctrl) break;
          var start, end;
          if(size === 0){
            start = getLineStart(1);
            end = getLineEnd() + 1;
          }else{
            start = startPrev;
            end = endPrev;
          }
          this.clipboard = val.slice(start, end);
          ta.value = val.slice(0, start) + val.slice(end);
          moveAbs(start);
          update = 0;
          break;

        case 'v':
          if(!ctrl) break;
          var s = this.clipboard;
          if(s === null) break;
          if(size !== 0) remove(size);
          insert(s, 1, 0);
          update = 0;
          break;

        case 'D':
          if(!ctrl) break;
          var start = getLineStart(1);
          var end = getLineEnd();
          var s = val.slice(start, end);
          moveAbs(end);
          insert(`\n${s}`, 0, 0);
          moveAbs(pos + s.length + 1);
          update = 0;
          break;

        case 'z':
          if(!ctrl) break;
          if(this.historyIndex === 0) break;
          var {val, start, end} = history[--this.historyIndex];
          ta.value = val;
          setStart(start);
          setEnd(end);
          update = 0;
          saveHistory = 0;
          break;

        case 'y':
          if(!ctrl) break;
          if(this.historyIndex === history.length - 1) break;
          var {val, start, end} = history[++this.historyIndex];
          ta.value = val;
          setStart(start);
          setEnd(end);
          update = 0;
          saveHistory = 0;
          break;

        case 'ArrowLeft':
          if(ctrl) moveAbs(getIdentStart());
          else moveRel(-1, shift);
          break;

        case 'ArrowRight':
          if(ctrl) moveAbs(getIdentEnd());
          else moveRel(1, shift);
          break;

        case 'ArrowUp':
          var start = getLineStart(1);
          var end = getLineEnd();
          if(start === 0) break;

          if(ctrl && shift){
            update = 0;
            moveAbs(start - 1);

            var start1 = getLineStart(1);
            var end1 = getLineEnd();
            var s = val.slice(start, end);
            var s1 = val.slice(start1, end1);

            ta.value = `${val.slice(0, start1)}${s}\n${s1}${val.slice(end)}`;

            var dpos = -(s1.length + 1);
            setStart(startPrev + dpos);
            setEnd(endPrev + dpos);
            break;
          }

          if(this.pos === null) this.pos = pos - start;
          moveAbs(start - 1);
          moveAbs(getLineStart(1));
          moveAbs(find((c, dpos) => {
            if(c === '\n' || dpos === this.pos) return 0;
            return 1;
          }));
          removePos = 0;
          break;

        case 'ArrowDown':
          var start = getLineStart(1);
          var end = getLineEnd();
          if(end === len) break;

          if(ctrl && shift){
            update = 0;
            moveAbs(end + 1);

            var start1 = getLineStart(1);
            var end1 = getLineEnd();
            var s = val.slice(start, end);
            var s1 = val.slice(start1, end1);

            ta.value = `${val.slice(0, start)}${s1}\n${s}${val.slice(end1)}`;

            var dpos = s1.length + 1;
            setStart(startPrev + dpos);
            setEnd(endPrev + dpos);
            break;
          }

          if(this.pos === null) this.pos = pos - start;
          moveAbs(end + 1);
          moveAbs(find((c, dpos) => {
            if(c === '\n' || dpos === this.pos) return 0;
            return 1;
          }));
          removePos = 0;
          break;

        case 'Home':
          moveAbs(getLineStart());
          break;

        case 'End':
          moveAbs(getLineEnd());
          break;

        case 'PageUp':
          var n = PAGE_LINES;
          moveAbs(find(c => {
            if(c === '\n') n--;
            if(n === 0) return 0;
            return -1;
          }));
          moveAbs(getLineStart(1));
          break;

        case 'PageDown':
          var n = PAGE_LINES;
          moveAbs(find(c => {
            if(c === '\n') n--;
            if(n === 0) return 0;
            return 1;
          }));
          moveAbs(getLineEnd());
          break;

        case 'Tab':
          insert(TAB);
          break;

        case 'Backspace':
          update = 0;
          if(size !== 0){ remove(size); break; }
          remove(-1);
          break;

        case 'Delete':
          update = 0;
          if(size !== 0){ remove(size); break; }
          remove(1);
          break;

        case 'Enter':
          if(pos !== 0 && pos !== len){
            var s = getCharRel(-1) + getCharRel(0);
            if(/\(\)|\[\]|{}|['"`]{2}/.test(s)){
              insert(`\n${TAB}\n`, 0);
              moveRel(1);
              moveAbs(getLineEnd());
              break;
            }
          }
          insert('\n');
          break;
      }
    }

    if(update){
      setStart(Math.min(getStart(), startPrev));
      setEnd(Math.max(getEnd(), endPrev));
    }

    if(removePos){
      this.pos = null;
    }

    if(saveHistory){
      var {type, val, start, end} = history[this.historyIndex];
      var obj = {type: actionType, val: ta.value, start: getStart(), end: getEnd()};

      if(val !== obj.val){
        if(this.historyIndex !== history.length - 1){
          history.splice(this.historyIndex + 1);
          this.historyIndex = history.length - 1;
        }

        if(history.length === MAX_HISTORY_SIZE || type === 0 && actionType === 0){
          history[this.historyIndex] = obj;
        }else{
          history.push(obj);
          this.historyIndex++;
        }
      }
    }else{
      this.pos = null;
    }

    function insert(str, move=1, addTabs=1){
      var pos = getPos();
      var tab = getTab();
      var s = ta.value;

      if(addTabs)
        str = str.replace(/\n/g, `\n${tab}`);

      s = s.slice(0, pos) + str + s.slice(pos);
      ta.value = s;

      moveAbs(move ? pos + str.length : pos);
    }

    function remove(size){
      var pos = getPos();
      var s = ta.value;

      if(size < 0) s = s.slice(0, pos + size) + s.slice(pos);
      else s = s.slice(0, pos) + s.slice(pos + size);
      ta.value = s;

      if(size < 0) moveAbs(pos + size);
      else moveAbs(pos);
    }

    function moveRel(dpos, force=0){
      var pos;

      if(dpos < 0){
        pos = getStart();
        if(!force && getEnd() !== pos) pos++;
      }else{
        pos = getEnd();
        if(!force && getStart() !== pos) pos--;
      }

      moveAbs(pos + dpos);
    }

    function moveAbs(pos){
      pos = O.bound(pos, 0, ta.value.length);

      O.repeat(2, () => {
        setStart(pos);
        setEnd(pos);
      });
    }

    function setStart(pos){
      ta.selectionStart = pos;
    }

    function setEnd(pos){
      ta.selectionEnd = pos;
    }

    function getTab(){
      var start = getLineStart(1);
      var end = getLineEnd();
      var s = ta.value.slice(start, end);

      var len = s.match(/^ */)[0].length / TAB_SIZE | 0;
      return TAB.repeat(len);
    }

    function getIdentStart(){
      var first = 1;
      var found = 0;

      var pos = find(c => {
        if(first){ first = 0; return -1; }
        if(c === null) return -1;
        if(/[0-9a-zA-Z_\$]/.test(c)) found = 1;
        else if(found) return 0;
        return -1;
      });

      if(!/[0-9a-zA-Z_\$]/.test(val[pos])) pos++;
      return pos;
    }

    function getIdentEnd(){
      var found = 0;

      return find(c => {
        if(c === null) return 1;
        if(/[0-9a-zA-Z_\$]/.test(c)) found = 1;
        else if(found) return 0;
        return 1;
      });
    }

    function getLineStart(force=0){
      var val = ta.value;
      var pos = getPos();
      var start;

      if(pos === 0 || val[pos - 1] === '\n'){
        start = pos;
      }else{
        start = find((c, dpos) => {
          if(dpos === 0) return -1;
          if(c === null) return -1;
          if(c === '\n') return 0;
          return -1;
        });
        if(start !== 0 || (pos !== 0 && val[0] === '\n')) start++;
      }

      if(force) return start;

      if(pos === start){
        var end = getLineEnd();
        var s = val.slice(start, end);
        return start + s.match(/^ */)[0].length;
      }

      var s = val.slice(start, pos);
      if(/^ *$/.test(s)) return start;

      return start + s.match(/^ */)[0].length;
    }

    function getLineEnd(){
      return find(c => {
        if(c === null) return 1;
        if(c === '\n') return 0;
        return 1;
      });
    }

    function find(func, minDpos=0){
      var val = ta.value;
      var len = val.length;

      var pos = getPos();
      var dpos = 0;

      while(1){
        var dp = func(val[pos + dpos] || null, dpos, pos + dpos);
        if(dp === 0 && Math.abs(dpos) >= minDpos) break;

        dpos += dp;
        if(pos + dpos < 0){ dpos = -pos; break; }
        if(pos + dpos > len){ dpos = len - pos; break; }
      }

      return pos + dpos;
    }

    function getPos(dir=-1){
      if(dir === -1) return getStart();
      return getEnd();
    }

    function getStart(){
      return ta.selectionStart;
    }

    function getEnd(){
      return ta.selectionEnd;
    }

    function getCharRel(dpos){
      return getCharAbs(getPos() + dpos);
    }

    function getCharAbs(pos){
      var val = ta.value;
      var len = val.length;

      if(pos < 0 || pos >= len) return null;
      return val[pos];
    }
  }

  enable(){ this.elem.disabled = 0; }
  disable(){ this.elem.disabled = 1; }

  focus(){
    const {ta} = this;

    ta.focus();
    ta.selectionStart = 0;
    ta.selectionEnd = 0;
  }

  css(){ return 'rect region text-editor'; }
}

class State{
  constructor(type, val, start, end){
    this.type = type;
    this.val = val;
    this.start = start;
    this.end = end;
  }
}

module.exports = TextEditor;