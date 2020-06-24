const Config = require('markdown-it-chain'); // 支持 markdown Loader 链式调用？ 
const anchorPlugin = require('markdown-it-anchor'); // 锚点
const slugify = require('transliteration').slugify;
const containers = require('./containers');
const overWriteFenceRule = require('./fence');

const config = new Config();

config
  .options.html(true).end() // 先生成html

  .plugin('anchor').use(anchorPlugin, [
    {
      level: 2,
      slugify: slugify,
      permalink: true,
      permalinkBefore: true
    }
  ]).end() // 添加锚点

  .plugin('containers').use(containers).end();  // 使用自研的插件 containers

const md = config.toMd();
overWriteFenceRule(md);

module.exports = md;
