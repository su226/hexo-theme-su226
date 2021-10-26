"use strict";
(() => {
  const Index = {
    script: document.currentScript.getAttribute("src"),
    init(first) {
      if (first) {
        this.scroll = this.scroll.bind(this);
      }
      this.page = 1;
      this.loading = false;
      this.end = false;
      this.list = document.querySelector("#updated-list");
      window.addEventListener("scroll", this.scroll);
      this.scroll();
    },
    deinit() {
      window.removeEventListener("scroll", this.scroll);
    },
    nextUrl() {
      const current = this.page++;
      return current === 1 ? "/updated/" : `/updated/page/${current}/`;
    },
    scroll() {
      // for chrome 48 support
      const scrollTop = document.documentElement.scrollTop || window.scrollY;
      if (this.loading || this.end || scrollTop < document.documentElement.scrollHeight - document.documentElement.clientHeight - 100) {
        return;
      }
      this.loading = true;
      fetch(this.nextUrl())
        .then(res => res.text())
        .then(src => {
          this.loading = false;
          const doc = new DOMParser().parseFromString(src, "text/html");
          const list = doc.querySelector("ul");
          for (const node of Array.from(list.children)) {
            const adopted = document.adoptNode(node);
            Waves.attach([adopted.querySelector(".post-link"), ...adopted.querySelectorAll(".chip")]);
            this.list.appendChild(adopted);
          }
          if ("end" in list.dataset) {
            this.end = true;
          }
        });
    }
  };
  
  window.pageModules.push(Index);  
})();
