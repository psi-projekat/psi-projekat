'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../../omikron');

const G = (...a) => (a.a = 0, a);
const F = (...a) => (a.a = 1, a);

module.exports = {
  G, F,

  normalize,
  prepare,
  expand,

  reduce,
  reduceStep,
  cmp,
  cmpRaw,

  copy,
  map,
  vec,

  str,
  show,
};

const invoke = require('./invoke');
module.exports.invoke = invoke;

function normalize(expr){
  if(!vec(expr)) return expr;
  const {a} = expr;

  if(!expr.a){
    if(expr.length === 1)
      return normalize(expr[0]);
  }else{
    while(vec(expr[0]) && !expr[0].a)
      expr = expr[0].concat(expr.slice(1));
  }

  const m = expr.map(normalize);
  m.a = a;
  return m;
}

function prepare(expr){
  expr = copy(expr);
  if(expr.a) expr = G(expr);
  return expr;
}

function expand(expr){
  const group = expr.shift();

  if(!vec(group))
    throw new TypeError('Group must be a vector');

  for(let i = group.length - 1; i !== -1; i--)
    expr.unshift(group[i]);

  return expr;
}

function reduce(expr, greedy=1, clever=1){
  expr = prepare(expr);

  const history = clever ? [copy(expr)] : null;

  while(reduceStep(expr, greedy)){
    if(clever){
      for(const h of history){
        if(expr.length < h.length) continue;
        if(expr.every((e, i) => cmpRaw(e, h[i]))) return null;
      }

      history.push(copy(expr));
    }
  }

  return expr;
}

function reduceStep(expr, greedy=1){
  while(vec(expr[0]) && !expr[0].a) expand(expr);

  if(greedy){
    while(expr.length === 1){
      expr = expr[0];
      while(vec(expr[0]) && !expr[0].a) expand(expr);
      if(!vec(expr[0])) return 0;
    }
  }else{
    if(expr.length === 1) return 0;
  }

  const func = expr.shift();
  const arg = expr.shift();

  const subst = (nest, e) => {
    if(!vec(e)){
      if(e === nest) return arg;
      return e;
    }

    nest += e.a;

    return map(e, e => subst(nest, e));
  };

  if(!vec(func))
    throw new TypeError('Function must be a vector');

  for(let i = func.length - 1; i !== -1; i--)
    expr.unshift(subst(0, func[i]));

  return 1;
}

function cmp(expr1, expr2, clever=0){
  if(!clever){
    const e1 = reduce(expr1, 1, 0);
    const e2 = reduce(expr2, 1, 0);

    if(e1 !== null && e2 !== null) return cmpRaw(e1, e2);
    if(e1 !== null || e2 !== null) return 0;

    return cmp(expr1, expr2, 1);
  }

  expr1 = prepare(expr1);
  expr2 = prepare(expr2);

  const history1 = [copy(expr1)];
  const history2 = [copy(expr2)];

  let done1 = 0;
  let done2 = 0;

  while(1){
    let donePrev1 = done1;
    let donePrev2 = done2;

    if(!donePrev1) done1 = !reduceStep(expr1);
    if(!donePrev2) done2 = !reduceStep(expr2);

    if(!donePrev1) history1.push(copy(expr1));
    if(!donePrev2) history2.push(copy(expr2));

    if(history1.some(h => cmpRaw(h, expr2))) return 1;
    if(history2.some(h => cmpRaw(h, expr1))) return 1;

    if(donePrev1 && donePrev2) break;
  }

  return cmpRaw(expr1, expr2);
}

function cmpRaw(e1, e2){
  if(!(vec(e1) && vec(e2))) return e1 === e2;
  return e1.length === e2.length && e1.every((e, i) => {
    return cmpRaw(e, e2[i]);
  });
}

function copy(expr, map=new Map()){
  if(!vec(expr)) return expr;
  if(map.has(expr)) return map.get(expr);

  const c = expr.slice();

  c.a = expr.a;
  map.set(expr, c);

  for(let i = 0; i !== c.length; i++)
    c[i] = copy(c[i], map);

  return c;
}

function map(expr, func){
  const m = expr.map(func);
  m.a = expr.a;
  return m;
}

function vec(e){
  return Array.isArray(e);
}

function str(expr, top=0){
  if(!vec(expr)) return String(expr);

  const p = expr.a || expr.length !== 1 ? expr.a ? ['(', ')'] : ['[', ']'] : ['', ''];
  return `${p[0]}${expr.map(e => str(e, expr.a)).join(' ')}${p[1]}`;
}

function show(expr){
  log(str(expr));
  return expr;
}