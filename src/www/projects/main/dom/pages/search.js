'use strict';

const LS = require('../../strings');
const backend = require('../../backend');
const Element = require('../element');
const Post = require('../post');
const Competition = require('../competition');
const Functionality = require('../functionality');
const Form = require('../form');
const searchCtors = require('../search');
const Page = require('./page');

class Search extends Page{
  constructor(parent){
    super(parent);

    const form = new Form(this);
    const field = form.createField(Element.InputDropdown, 'type');
    const results = new searchCtors.SearchResults(this);

    const searchTypes = [
      ['funcs', 'functionalities'],
      ['comps', 'competitions'],
      ['posts', 'posts'],
      ['users', 'users'],
    ];

    searchTypes.forEach(([type, label], i) => {
      field.addOpt(type, LS.labels.forms.fields[label]);
    });

    form.createField(Element.InputText, 'keywords', LS.labels.forms.fields.keywords);
    form.addConfirm(LS.labels.forms.buttons.search);

    form.on('confirm', fields => {
      const {dom} = O.glob;
      const {type, keywords} = fields;

      results.purge();

      (async () => {
        switch(type){
          case 'posts':
            for(const post of await backend.getPosts(keywords)){
              const {user, date, content} = post;
              new Post(results, user, date, content);
            }
            break;

          case 'comps':
            for(const comp of await backend.getCompetitions(O.lst.token, keywords)){
              const {id, title, date, desc, maxUsers, currentUsers, applied} = comp;
              new Competition(results, id, title, date, desc, maxUsers, currentUsers, applied);
            }
            break;

          case 'funcs':
            for(const func of await backend.getFunctionalities(O.lst.token, keywords)){
              const {id, name, desc, points, upgraded} = func;
              new Functionality(results, id, name, desc, points, upgraded);
            }
            break;

          case 'users':
            for(const user of await backend.getUsers(keywords)){
              const {nick} = user;
              new searchCtors.UserItem(results, nick);
            }
            break;
        }
      })().catch(dom.err.bind(dom));
    });

    this.form = form;
    this.results = results;
  }

  static title(){ return LS.titles.search; }

  css(){ return 'page-search'; }
}

module.exports = Search;