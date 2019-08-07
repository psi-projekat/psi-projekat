'use strict';

const EnhancedStorage = require('./enhanced-storage');

const keys = [];

class SessionStorage extends EnhancedStorage{
  constructor(){
    super(O.sst, O.project, keys);
  }

  init(){
    const state = O.obj();
    this.state = state;
  }

  ser(ser=new O.Serializer()){
    const {state} = this;

    return ser;
  }

  deser(ser){
    const state = O.obj();
    this.state = state;

    return this;
  }
}

module.exports = SessionStorage;