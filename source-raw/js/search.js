"use strict";
(() => {
  class ACANode {
    constructor(depth) {
      this.fail = null;
      this.next = {};
      this.end = false;
      this.depth = depth || 0;
    }
  
    insert(word) {
      let cur = this;
      for (const ch of word) {
        if (!(ch in cur.next)) {
          cur.next[ch] = new ACANode(cur.depth + 1);
        }
        cur = cur.next[ch];
      }
      cur.end = true
    }
    
    build() {
      const queue = [];
      this.fail = this;
      for (const child of Object.values(this.next)) {
        child.fail = this;
        queue.push([this, child]);
      }
      while (queue.length != 0) {
        const [parent, cur] = queue.shift();
        for (const [ch, child] of Object.entries(cur.next)) {
          let fail = parent.fail;
          while (fail != this && !(ch in fail.next)) {
            fail = fail.fail;
          }
          if (ch in fail.next) {
            fail = fail.next[ch];
          }
          child.fail = fail;
          queue.push([cur, child]);
        }
      }
    }
  
    match(string, begin) {
      let cur = this;
      for (let i = begin || 0; i < string.length; i++) {
        const ch = string[i];
        while (cur != this && !(ch in cur.next)) {
          cur = cur.fail;
        }
        if (ch in cur.next) {
          cur = cur.next[ch];
        }
        if (cur.end) {
          return [i - cur.depth + 1, i + 1];
        }
      }
      return [-1, -1];
    }
  
    matchAll(string) {
      const result = [];
      for (let cur = 0;;) {
        const [begin, end] = this.match(string, cur);
        if (begin === -1) {
          break;
        }
        result.push([begin, end]);
        cur = end;
      }
      return result;
    }
  }
  
  function* search(indices, value) {
    const wordSet = new Set(value.split(/\s+/g).filter(x => x.length !== 0).map(x => x.toLowerCase()));
    if (wordSet.size === 0) {
      return false;
    }
    const wordAca = new ACANode();
    for (const word of wordSet) {
      wordAca.insert(word);
    }
    wordAca.build();
    for (const index of indices) {
      const lowerTitle = index.title.toLowerCase();
      const found = new Set();
      const titleFound = wordAca.matchAll(lowerTitle);
      const urlFound = wordAca.matchAll(index.url);
      const contentFound = wordAca.matchAll(index.lowerContent);
      const tags = index.tags.map(x => {
        if (wordSet.has(x)) {
          found.add(x);
          return [x, true];
        }
        return [x, false];
      });
      const categories = index.categories.map(x => {
        if (wordSet.has(x)) {
          found.add(x);
          return [x, true];
        }
        return [x, false];
      });
      for (const [begin, end] of titleFound) {
        found.add(lowerTitle.slice(begin, end));
      }
      for (const [begin, end] of urlFound) {
        found.add(index.url.slice(begin, end));
      }
      for (const [begin, end] of contentFound) {
        found.add(index.lowerContent.slice(begin, end));
      }
      let foundAll = true;
      for (const word of wordSet) {
        if (!found.has(word)) {
          foundAll = false;
          break;
        }
      }
      if (!foundAll) {
        continue;
      }
  
      const contentParts = [];
      const partWords = new Set();
      for (const [begin, end] of contentFound) {
        const word = index.lowerContent.slice(begin, end);
        if (partWords.has(word)) {
          continue;
        }
        partWords.add(word);
        const previewBegin = begin - 10;
        const previewEnd = end + 10;
        let added = false;
        for (const part of contentParts) {
          if (previewEnd >= part.begin && previewBegin <= part.end) {
            part.begin = Math.min(part.begin, previewBegin);
            part.end = Math.max(part.end, previewEnd);
            part.marks.push([begin, end]);
            added = true;
            break;
          }
        }
        if (!added) {
          contentParts.push({
            begin: previewBegin,
            end: previewEnd,
            marks: [[begin, end]]
          });
        }
      }
  
      const result = document.createElement("article");
      result.className = "post-card";
      const resultLink = document.createElement("a");
      result.appendChild(resultLink);
      resultLink.className = "post-link waves-effect";
      resultLink.href = index.url;
  
      const resultTitle = document.createElement("h3");
      resultTitle.className = "post-card-title";
      result.appendChild(resultTitle);
      let prev = 0;
      for (const [begin, end] of titleFound) {
        resultTitle.innerHTML += `${index.title.slice(prev, begin)}<mark>${index.title.slice(begin, end)}</mark>`;
        prev = end;
      }
      resultTitle.innerHTML += index.title.slice(prev);
  
      const resultContent = document.createElement("p");
      resultContent.className = "post-card-content";
      result.appendChild(resultContent);
      if (contentParts.length === 0) {
        resultContent.textContent = index.content.slice(0, 64);
      }
      contentParts.sort((a, b) => a.begin - b.begin);
      for (const part of contentParts) {
        part.marks.sort((a, b) => a[0] - b[0]);
        let prev = part.begin;
        for (const [begin, end] of part.marks) {
          resultContent.innerHTML += `${index.content.slice(prev, begin)}<mark>${index.content.slice(begin, end)}</mark>`;
          prev = end;
        }
        resultContent.innerHTML += `${index.content.slice(prev, part.end)}...`;
      }
      
      const resultInfo = document.createElement("div");
      resultInfo.className = "post-info";
      result.appendChild(resultInfo);
      
      if (categories.length !== 0) {
        const resultCategoriesIcon = document.createElement("span");
        resultCategoriesIcon.className = "iconify";
        resultCategoriesIcon.dataset.icon = "mdi:folder";
        resultInfo.appendChild(resultCategoriesIcon);
        const resultCategories = document.createElement("ul");
        resultCategories.className = "post-categories";
        resultInfo.appendChild(resultCategories);
        for (const [category, found] of categories) {
          const resultCategory = document.createElement("li");
          resultCategories.appendChild(resultCategory);
          if (found) {
            resultCategory.innerHTML = `<a href="/categories/${category}"><mark>${category}</mark></a>`;
          } else {
            resultCategory.innerHTML = `<a href="/categories/${category}">${category}</a>`;
          }
        }
      }
  
      if (tags.length !== 0) {
        const resultTagsIcon = document.createElement("span");
        resultTagsIcon.className = "iconify";
        resultTagsIcon.dataset.icon = "mdi:tag";
        resultInfo.appendChild(resultTagsIcon);
        const resultTags = document.createElement("ul");
        resultTags.className = "post-tags";
        resultInfo.appendChild(resultTags);
        for (const [tag, found] of tags) {
          const resultTag = document.createElement("li");
          resultTags.appendChild(resultTag);
          if (found) {
            resultTag.innerHTML = `<a class="chip waves-effect" href="/tags/${tag}"><mark>${tag}</mark></a>`;
          } else {
            resultTag.innerHTML = `<a class="chip waves-effect" href="/tags/${tag}">${tag}</a>`;
          }
        }
      }
  
      const resultUrlIcon = document.createElement("span");
      resultUrlIcon.className = "iconify";
      resultUrlIcon.dataset.icon = "mdi:link";
      resultInfo.appendChild(resultUrlIcon);
      const resultUrl = document.createElement("p");
      resultUrl.className = "search-permalink";
      resultInfo.appendChild(resultUrl);
      prev = 0;
      for (const [begin, end] of urlFound) {
        resultUrl.innerHTML += `${index.url.slice(prev, begin)}<mark>${index.url.slice(begin, end)}</mark>`;
        prev = end;
      }
      resultUrl.innerHTML += index.url.slice(prev);
  
      yield result;
    }
    return true;
  }
  
  const Search = {
    script: document.currentScript.getAttribute("src"),
    SEARCH_PAGE_SIZE: 10,
    update() {
      for (const child of Array.from(this.results.children)) {
        child.remove();
      }
      this.resultGen = search(this.indices, this.input.value);
      let result = this.resultGen.next();
      if (result.done) {
        this.resultsBox.dataset.search = result.value ? "empty" : "";
        return;
      }
      for (let i = 1; i < this.SEARCH_PAGE_SIZE && !result.done; i++) {
        this.results.appendChild(result.value);
        result = this.resultGen.next();
      }
      if (result.done) {
        this.resultsBox.dataset.search = "";
      } else {
        this.resultsBox.dataset.search = "incomplete";
        this.results.appendChild(result.value);
      }
    },
    init(first) {
      this.input = document.querySelector("#search-input");
      this.resultsBox = document.querySelector("#search-results-box");
      this.results = document.querySelector("#search-results");
      this.indices = [];
      fetch("/search.xml")
      .then(res => res.text())
      .then(raw => {
        const xml = new DOMParser().parseFromString(raw, "text/xml");
        for (const entryNode of xml.querySelectorAll("entry")) {
          const content = entryNode.querySelector("content").textContent;
          this.indices.push({
            title: entryNode.querySelector("title").textContent,
            url: entryNode.querySelector("url").textContent,
            content: content,
            lowerContent: content.toLowerCase(),
            categories: Array.from(entryNode.querySelectorAll("category")).map(node => node.textContent),
            tags: Array.from(entryNode.querySelectorAll("tag")).map(node => node.textContent)
          });
        }
        document.querySelector("#search-pending").remove();
        this.update();
      });
      let prevValue = "";
      this.input.addEventListener("keyup", () => {
        if (this.input.value !== prevValue) {
          prevValue = this.input.value;
          this.update();
        }
      });
      this.input.addEventListener("change", () => {
        this.update();
      });
      document.querySelector("#search-clear").addEventListener("click", () => {
        this.input.value = "";
        this.update();
      });
      document.querySelector("#search-more").addEventListener("click", () => {
        let result = this.resultGen.next();
        for (let i = 1; i < this.SEARCH_PAGE_SIZE && !result.done; i++) {
          this.results.appendChild(result.value);
          result = this.resultGen.next();
        }
        this.resultsBox.dataset.search = result.done ? "" : "incomplete";
      });
    }
  };
  
  window.pageModules.push(Search);
})();
