'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');

const MAX_DATE = 864e13;

const int = (a, min=Number.MIN_SAFE_INTEGER, max=Number.MAX_SAFE_INTEGER) => {
  return Number.isInteger(a) && a >= min && a <= max;
};

const uint = a => int(a, 0);
const date = a => int(a, 0, MAX_DATE);

const str = a => typeof a === 'string';
const nstr = a => !str(a);
const sstr = a => str(a) && a.length <= 1024;

const check = {
  int,
  uint,
  date,
  str,
  nstr,
  sstr,

  id: a => int(a) && a >= 1,
  token: a => sstr(a),
  tokenn: a => a === null || check.token(a),

  /*
    Ensure that the nick name:
      1. is a string
      2. is not longer than 32 characters
      3. consists of lower case letters or digits separated by optional hyphens
    Valid examples:
      a
      5
      xy
      some-user
      a-b-c-d
  */
  nick: a => str(a) && a.length <= 32 && /^[a-z0-9]+(?:\-[a-z0-9]+)*$/.test(a),

  /*
    Ensure that the email:
      1. is a string
      2. is not longer than 1024 characters
      3. consists of lower case letters or digits separated by exactly one "@" symbol
    Valid examples:
      user@website
      a.b.c@dd.ee
      ...@x.y.z
      ----@--
  */
  email: a => sstr(a) && /^[a-z0-9\-\.]+\@[a-z0-9\-\.]+$/.test(a),

  /*
    Ensure that the password:
      1. is a string
      2. is not shorter than 8 characters
      3. is not longer than 64 characters
      4. consists of printable ASCII characters (including spaces)
      5. has at least one lower case letter
      6. has at least one upper case letter
      7. has at least one digit
    Valid examples:
      abcdefX7
      aaAA3333
      2 + 3 x B
  */
  pass: a => str(a) && a.length >= 8 && a.length <= 64 &&
    /^[ -~]+$/.test(a) && /[a-z]/.test(a) && /[A-Z]/.test(a) && /[0-9]/.test(a),

  // Maximal length is 65535, not 65536
  text: a => str(a) && a.length <= 65535,
};

module.exports = check;