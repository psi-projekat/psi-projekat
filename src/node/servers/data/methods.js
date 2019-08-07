'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const hash = require('../../hash');
const php = require('../../php');
const echo = require('../../echo');
const avatar = require('../../avatar');
const Token = require('../../token');
const langsList = require('../../prog-langs/langs-list');
const Captcha = require('./captcha');
const check = require('./check');
const editableData = require('./editable-user-data');

const ALLOW_DELETING_PROFILE = 1;

const SCRIPT_IDENTIFIER = 'ai-playground.user-script';
const SCRIPT_VERSION = 1;

const methods = {
  async echo(str){
    if(!check.str(str)) throw 'data';

    const buf = Buffer.from(str, 'base64');
    const token = echo.set(buf);

    return token;
  },

  async getPosts(keywords){
    if(!check.text(keywords)) throw 'data';
    return await php.exec('getPosts', {keywords});
  },

  async getCompetitions(token, keywords){
    if(!check.tokenn(token)) throw 'data';
    if(!check.text(keywords)) throw 'data';
    return await php.exec('getCompetitions', {token, keywords});
  },

  async getFunctionalities(token, keywords){
    if(!check.tokenn(token)) throw 'data';
    if(!check.text(keywords)) throw 'data';
    return await php.exec('getFunctionalities', {token, keywords});
  },

  async getUsers(keywords){
    if(!check.sstr(keywords)) throw 'data';
    return await php.exec('getUsers', {keywords});
  },

  async getCaptcha(){
    // Generate a new captcha image and send the token to the user
    const captcha = await Captcha.generate();
    return captcha.token;
  },

  async register(nick, email, pass, captchaToken, captchaStr){
    if(!check.nick(nick)) throw 'invalidNick';
    if(!check.email(email)) throw 'invalidEmail';
    if(!check.pass(pass)) throw 'invalidPass';

    /*
      Check the captcha validity.
      The reason this is separated in a new code block is because
      variables `msg`, `captcha` and `ok` are not used outside
      this block, so encapsulating them in a new code block speeds
      up the JavaScript engine.
    */
    {
      const msg = 'invalidCaptcha';
      if(check.nstr(captchaToken)) throw msg;

      const captcha = Captcha.get(captchaToken);
      if(captcha === null) throw msg;

      const ok = check.str(captchaStr) && captcha.check(captchaStr);
      captcha.invalidate();
      if(!ok) throw msg;
    }

    /*
      Finally, execute the `register` PHP query and send the
      relevant arguments (nick, email, passHash).
    */
    await php.exec('register', {
      nick,
      email,
      passHash: hash(pass, 'sha512').toString('base64'),
    });
  },

  async login(nick, pass){
    if(check.nstr(nick) || check.nstr(pass)) throw 'data';

    const token = Token.generate();
    const data = await php.exec('login', {
      nick,
      passHash: hash(pass, 'sha512').toString('base64'),
      token,
    });

    data.token = token;
    return data;
  },

  async logout(token){
    if(!check.token(token)) throw 'data';
    await php.exec('logout', {token});
  },

  async getUserData(nick){
    if(!check.nick(nick)) throw 'data';
    return await php.exec('getUserData', {nick});
  },

  async applyForCompetition(token, idComp, scriptData){
    if(!check.token(token)) throw 'data';
    if(!check.id(idComp)) throw 'data';
    if(!check.str(scriptData)) throw 'data';

    const msg = 'invalidScript';
    const buf = Buffer.from(scriptData, 'base64');
    let s = null;

    try{ s = new O.Serializer(buf, 1); }catch{}
    if(s === null) throw msg;

    const ser = s;
    if(ser.readStr() !== SCRIPT_IDENTIFIER) throw msg;
    if(ser.readUint() !== SCRIPT_VERSION) throw msg;

    const lang = ser.readStr();
    if(!O.has(langsList, lang)) throw msg;

    const script = ser.readStr();
    await php.exec('applyForCompetition', {token, idComp, lang, script});
  },

  async giveUpFromCompetition(token, idComp){
    if(!check.token(token)) throw 'data';
    if(!check.id(idComp)) throw 'data';
    await php.exec('giveUpFromCompetition', {token, idComp});
  },

  async upgradeFunctionality(token, idFunc){
    if(!check.token(token)) throw 'data';
    if(!check.id(idFunc)) throw 'data';
    await php.exec('upgradeFunctionality', {token, idFunc});
  },

  async addPost(token, content){
    if(!check.token(token)) throw 'data';
    if(!check.text(content)) throw 'data';
    await php.exec('addPost', {token, content});
  },

  async addCompetition(token, title, desc, startDate, maxUsers){
    if(!check.token(token)) throw 'data';
    if(!check.sstr(title)) throw 'data';
    if(!check.date(startDate)) throw 'data';
    if(!check.int(maxUsers, 1, 1e5)) throw 'invalidNum';
    await php.exec('addCompetition', {token, title, desc, startDate, maxUsers});
  },

  async editUserData(token, type, val){
    if(!check.token(token)) throw 'data';
    if(!check.str(type)) throw 'data';
    if(!check.str(val)) throw 'data';

    if(!O.has(editableData, type)){
      if(type === 'avatar'){
        const nick = await php.exec('getNickFromToken', {token});
        const buf = Buffer.from(val, 'base64');
        return await avatar.update(nick, buf);
      }

      throw 'data';
    }

    val = val.trim();
    if(val.length > editableData[type]) throw 'data';
    else if(val.length === 0) val = null;

    await php.exec('editUserData', {token, type, val});
  },

  async turnIntoMod(token, nick){
    if(!check.token(token)) throw 'data';
    if(!check.sstr(nick)) throw 'data';
    await php.exec('turnIntoMod', {token, nick});
  },

  async deleteOwnProfile(token){
    if(!ALLOW_DELETING_PROFILE) throw 'forbidden';
    if(!check.token(token)) throw 'data';
    await php.exec('deleteOwnProfile', {token});
  },

  async deleteOtherProfile(token, nick){
    if(!ALLOW_DELETING_PROFILE) throw 'forbidden';
    if(!check.token(token)) throw 'data';
    if(!check.sstr(nick)) throw 'data';
    await php.exec('deleteOtherProfile', {token, nick});
  },
};

module.exports = methods;