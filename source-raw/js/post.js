"use strict";
(() => {
  const scriptSrc = document.currentScript.getAttribute("src");

  const Toc = {
    script: scriptSrc,
    init(first) {
      const i18n = document.querySelector("#i18n-data-post").dataset;
      this.toc = document.querySelector(".toc");
      this.toc.classList.add("tab-hidden");
      document.querySelector(".sidebar").appendChild(this.toc);
      this.header = document.querySelector(".sidebar-header");
      this.header.classList.add("with-tab");
      this.tab = document.createElement("div");
      this.tab.className = "tab";
      this.header.appendChild(this.tab);
      const bar = document.createElement("div");
      bar.className = "tab-bar";
      this.tab.appendChild(bar);
      this.menu = document.querySelector("#menu");
      const menuTab = document.createElement("div");
      menuTab.className = "tab-item waves-effect";
      menuTab.textContent = i18n.tabMenu;
      menuTab.addEventListener("click", () => {
        this.menu.classList.remove("tab-hidden");
        this.toc.classList.add("tab-hidden");
        bar.style.left = `${menuTab.offsetLeft}px`;
        bar.style.width = `${menuTab.clientWidth}px`;
      });
      this.tab.appendChild(menuTab);
      const tocTab = document.createElement("div");
      tocTab.textContent = i18n.tabToc;
      tocTab.className = "tab-item waves-effect";
      tocTab.addEventListener("click", () => {
        this.toc.classList.remove("tab-hidden");
        this.menu.classList.add("tab-hidden");
        bar.style.left = `${tocTab.offsetLeft}px`;
        bar.style.width = `${tocTab.clientWidth}px`;
      });
      this.tab.appendChild(tocTab);
      bar.style.left = `${menuTab.offsetLeft}px`;
      bar.style.width = `${menuTab.clientWidth}px`;

      Waves.attach(".toc-link");
      for (const i of this.toc.querySelectorAll(".toc-link")) {
        const elem = document.getElementById(decodeURI(i.hash).slice(1));
        i.addEventListener("click", e => {
          e.preventDefault();
          const top = elem.getBoundingClientRect().top - 80;
          try {
            window.scrollBy({
              top: top,
              behavior: "smooth"
            });
          } catch (e) {
            window.scrollBy(0, top);
          }
        });
      }
    },
    deinit() {
      this.toc.remove();
      this.header.classList.remove("with-tab");
      this.tab.remove();
      this.menu.classList.remove("tab-hidden");
    }
  }

  const Code = {
    script: scriptSrc,
    init(first) {
      for (const highlight of document.querySelectorAll(".highlight")) {
        const code = highlight.querySelector(".code pre");
        const copy = document.createElement("button");
        copy.addEventListener("click", () => {
          const textarea = document.createElement("textarea");
          textarea.textContent = code.innerText;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("Copy");
          textarea.remove();
        });
        copy.className = "copy btn-icon waves-effect";
        const icon = document.createElement("span");
        icon.className = "iconify";
        icon.dataset.icon = "mdi:content-copy";
        copy.appendChild(icon);
        highlight.appendChild(copy);
      }
    }
  };

  const Progress = {
    script: scriptSrc,
    init(first) {
      if (first) {
        this.update = this.update.bind(this);
      }
      const navbar = document.querySelector(".navbar");
      this.number = document.createElement("span");
      navbar.insertBefore(this.number, document.querySelector("#back-to-top"));
      this.progress = document.createElement("div");
      this.progress.className = "page-progress";
      navbar.appendChild(this.progress);
      this.content = document.querySelector(".post-content");
      window.addEventListener("scroll", this.update);
      window.addEventListener("resize", this.update);
      this.update();
    },
    deinit() {
      window.removeEventListener("scroll", this.update);
      window.removeEventListener("resize", this.update);
      this.progress.remove();
      this.number.remove();
    },
    update() {
      // for chrome 48 support
      const scrollTop = document.documentElement.scrollTop || window.scrollY;
      const pageBottom = this.content.clientHeight + this.content.offsetTop;
      const viewBottom = pageBottom - document.documentElement.clientHeight;
      const percentage = viewBottom <= 0 ? "100%" : Math.round(Math.min(scrollTop / viewBottom, 1) * 100) + "%";
      this.progress.style.width = percentage;
      this.number.textContent = percentage;
    }
  };

  const Giscus = {
    script: scriptSrc,
    init(first) {
      const giscus = document.querySelector("#giscus-script");
      if (!giscus) {
        return;
      }
      // Ensure Intl.PluralRules exists or browser will hang
      // If Intl.RelativeTimeFormat exists, Intl.PluralRules exists too.
      // If not, browser won't hang, but comments still unavailable.
      if (!Intl.RelativeTimeFormat) {
        giscus.replaceWith(document.querySelector("#i18n-data-post").dataset.commentUnsupported);
        return;
      }
      if (document.body.classList.contains("dark")) {
        giscus.dataset.theme = "dark";
      }
      window.addEventListener("settingsChanged", this.switch);
      giscus.src = "https://giscus.app/client.js";
    },
    deinit() {
      window.removeEventListener("settingsChanged", this.switch);
    },
    switch(e) {
      if (e.detail.key === "dark") {
        document.querySelector(".giscus-frame").contentWindow.postMessage({
          giscus: { setConfig: { theme: e.detail.value ? "dark" : "light" } }
        }, "https://giscus.app");
      }
    }
  }

  window.pageModules.push(
    Toc,
    Code,
    Progress,
    Giscus
  );
})();
