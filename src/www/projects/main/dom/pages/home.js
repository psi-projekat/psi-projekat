'use strict';

const LS = require('../../strings');
const backend = require('../../backend');
const Element = require('../element');
const Form = require('../form');
const Post = require('../post');
const Page = require('./page');

class Home extends Page{
  constructor(parent, posts=[]){
    super(parent);

    if(O.lst.signedIn && O.lst.isMod){
      const form = this.form = new Form(this);
      const strs = LS.labels.forms;

      form.createField(Element.InputText, 'content', strs.fields.postContent);
      form.addConfirm(strs.buttons.addPost);

      form.on('confirm', fields => {
        backend.addPost(O.lst.token, fields.content).then(() => {
          O.glob.dom.nav('');
        }, err => {
          O.glob.dom.err(err);
        });
      });
    }

    this.posts = [];
    this.addPosts(posts);
  }

  static title(){ return LS.titles.home; }

  createPost(...args){
    const post = new Post(this, ...args);
    this.addPost(post);
  }

  addPost(post){
    this.posts.push(post);
  }

  addPosts(posts){
    for(const post of posts)
      this.addPost(post);
  }

  css(){ return 'home'; }
}

Home.Post = Post;

module.exports = Home;