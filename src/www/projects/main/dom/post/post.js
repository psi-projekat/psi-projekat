'use strict';

const LS = require('../../strings');
const Element = require('../element');
const PostUser = require('./user');
const PostDate = require('./date');
const PostContent = require('./content');

class Post extends Element.Region{
  constructor(parent, user, date, content){
    super(parent);

    this.user = new PostUser(this, user);
    this.date = new PostDate(this, date);
    this.content = new PostContent(this, content);
  }

  css(){ return 'post'; }
}

Post.PostUser = PostUser;
Post.PostDate = PostDate;
Post.PostContent = PostContent;

module.exports = Post;