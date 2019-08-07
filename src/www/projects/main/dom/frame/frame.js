'use strict';

const LS = require('../../strings');
const Element = require('../element');
const TabStrip = require('./tab-strip');
const Tab = require('./tab');
const TabContent = require('./tab-content');

class Frame extends Element.Div{
  constructor(parent, tabs=[]){
    super(parent);

    this.tabs = [];
    this.contents = [];

    this.tabStrip = new TabStrip(this);

    for(const [name, label] of tabs)
      this.createTab(name, label);

    this.tabStrip.on('click', (tab, evt) => {
      this.selectTab(tab.name, evt);
    });
  }

  createTab(name, label){
    this.tabs.push(new Tab(this.tabStrip, name, label));
    this.contents.push(new TabContent(this));
    if(this.tabs.length === 1) this.selectTab(name);
  }

  getSelectedTab(){
    if(this.tabs.length === 0) return null;
    return this.tabs.find(tab => tab.selected);
  }

  getSelectedIndex(){
    return this.tabs.findIndex(tab => tab.selected);
  }

  getTab(name){
    return this.tabs.find(tab => tab.name === name);
  }

  getContent(name){
    return this.contents[this.getTabIndex(name)];
  }

  getTabIndex(name){
    return this.tabs.findIndex(tab => tab.name === name);
  }

  selectTab(name, evt=null){
    this.selectTabByIndex(this.getTabIndex(name, evt));
  }

  selectTabByIndex(index, evt=null){
    const {tabs, contents} = this;
    const indexPrev = this.getSelectedIndex();

    if(indexPrev !== -1){
      this.emit('unselect', tabs[indexPrev], evt);
      tabs[indexPrev].unselect();
      contents[indexPrev].unselect();
    }

    this.emit('select', tabs[index], evt);
    tabs[index].select();
    contents[index].select();
  }

  css(){ return 'frame'; }
}

module.exports = Object.assign(Frame, {
  TabStrip,
  Tab,
  TabContent,
});