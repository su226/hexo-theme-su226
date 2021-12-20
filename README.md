# hexo-theme-su226

Yet another [Material Design](https://material.io) theme for [Hexo](https://hexo.io). Demo: [su226.tk](https://su226.tk)

Currently only Simplified Chinese and English are available. (Sorry for my poor English)

## Features

* Support old browsers including Internet Explorer 11 and Chrome 48. (Partial support, Chrome 49 for main website support)
* Local search
* [Highlight.js](https://hexo.io/docs/syntax-highlight#Highlight-js) with line number and copy button
* Customizable sidebar and footer
* Topmost posts
* Supports [hexo-blog-encrypt](https://github.com/D0n9X1n/hexo-blog-encrypt)
* [Giscus](https://giscus.app) comments (Chrome 71 at least)

## Installation

First clone this repository

```shell
git clone https://github.com/su226/hexo-theme-su226 themes/su226
```

Then modify `_config.yml`

```yaml
# Set index generator to generate updated list (Will be fetched in index.html's script)
index_generator:
  path: '/updated'
  per_page: 10
  order_by: -updated
# Search database powered by hexo-generator-searchdb
search:
  path: search.xml
  field: post
  content: true
  format: striptags
theme: su226
```

Add `source/index.ejs` and `source/search/index.ejs` for actual index page and search page.

```ejs
---
layout: index_base
---
<!-- You can put custom header here -->
```

```ejs
---
layout: search
---
```

## Configuration

All configuration are read from `_config.yml`

```yaml
theme_config:
  # Sidebar avatar URL
  avatar: https://avatars.githubusercontent.com/u/17371317?s=112
  # Footer content (HTML)
  footer: '由 <a href="https://hexo.io">Hexo</a> 强力驱动，托管于 <a href="https://pages.github.com/">Github Pages</a>'
  # Custom menu items
  menu_items:
  # Lookup an icon on iconify.design
  - icon: mdi:account
    href: /about
    name: 关于我
    # Disable PJAX for custom internal link, PJAX for external link will be automatically disabled.
    pjax: false
  - icon: mdi:youtube
    href: https://space.bilibili.com/14334962
    name: Bilibili
  - icon: mdi:github-circle
    href: https://github.com/su226
    name: GitHub
  # Post preview length limit
  preview_limit: 64
  # Topmost tag, if there's no post or topmost tag is unset, no topmost post will be displayed.
  top_tag: 置顶
  # Giscus comment settings, https://giscus.app/
  giscus:
    repo: su226/su226.github.io
    repo_id: "***omitted***"
    category: Announcements
    category_id: "***omitted***"
    lang: zh-CN
```