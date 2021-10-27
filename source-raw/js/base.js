"use strict";
(() => {
  if (!NodeList.prototype[Symbol.iterator]) {
    NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
  }
  if (!HTMLCollection.prototype[Symbol.iterator]) {
    HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
  }
  if (!NamedNodeMap.prototype[Symbol.iterator]) {
    NamedNodeMap.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
  }

  const Appbar = {
    init(first) {
      this.navbar = document.querySelector(".navbar");
      this.scroll();
    
      if (first) {
        window.addEventListener("scroll", () => this.scroll());
        document.querySelector("#toggle-menu").addEventListener("click", () => Sidebar.toggle());
        document.querySelector("#back-to-top").addEventListener("click", () => {
          try {
            window.scrollTo({
              top: 0,
              behavior: "smooth"
            });
          } catch (e) {
            window.scrollTo(0, 0);
          }
        });
      }
    },
    scroll() {
      // for chrome 48 support
      const scrollTop = document.documentElement.scrollTop || window.scrollY;
      this.navbar.classList.toggle("navbar-active", scrollTop > 0)
    }
  }
  
  const Resize = {
    init(first) {
      if (!first) {
        return;
      }
      this.isDesktop = document.documentElement.clientWidth > 768;
      this.callbacks = [];
      window.addEventListener("resize", () => {
        const desktop = document.documentElement.clientWidth > 768;
        if (this.isDesktop === desktop) {
          return;
        }
        this.isDesktop = desktop;
        document.body.classList.add("no-transition");
        for (const i of this.callbacks) {
          i(desktop);
        }
        setTimeout(() => {
          document.body.classList.remove("no-transition");
        }, 20);
      });
    }
  }
  
  class Backdrop {
    constructor(zIndex = 199) {
      this.element = null;
      this.hideTimer = -1;
      this.zIndex = zIndex;
      this.onshow = () => {};
      this.onshown = () => {};
      this.onhide = () => {};
      this.onhidden = () => {};
      this.onclick = () => {};
    }
  
    ensureElement() {
      if (this.element === null) {
        this.element = document.createElement("div");
        this.element.className = "backdrop";
        this.element.style.zIndex = this.zIndex;
        this.element.addEventListener("click", this.onclick);
        document.body.appendChild(this.element);
        Backdrop.count++;
        document.body.classList.add("no-overflow");
      }
    }
  
    setOpacity(opacity) {
      if (this.element !== null) {
        this.element.style.opacity = opacity;
      }
    }
  
    show(immediate = false) {
      clearTimeout(this.hideTimer);
      this.hideTimer = -1;
      this.ensureElement();
      this.onshow();
      if (immediate) {
        this.element.style.opacity = 1;
        this.onshown();
      } else {
        setTimeout(() => {
          this.element.style.opacity = 1;
        }, 20);
        setTimeout(() => this.onshown(), 250);
      }
    }
  
    hide(immediate = false) {
      if (this.element === null) {
        return;
      }
      this.onhide();
      this.element.style.opacity = 0;
      if (immediate) {
        this.element.remove();
        this.element = null;
        if (--Backdrop.count === 0) {
          document.body.classList.remove("no-overflow");
        }
        this.onhidden();
      } else if (this.hideTimer === -1) {
        this.hideTimer = setTimeout(() => {
          this.element.remove();
          this.element = null;
          this.hideTimer = -1;
          if (--Backdrop.count === 0) {
            document.body.classList.remove("no-overflow");
          }
          this.onhidden();
        }, 250);
      }
    }
  
    beginSwipe() {
      this.ensureElement();
      this.element.style.transition = "none";
    }
  
    endSwipe(show = true) {
      this.element.style.removeProperty("transition");
      if (show) {
        this.show();
      } else {
        this.hide();
      }
    }
  }
  
  Backdrop.count = 0;
  
  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }
  
  const Sidebar = {
    close() {
      this.backdrop.hide();
    },
    toggle() {
      const value = document.body.classList.toggle("sidebar-toggled");
      if (Resize.isDesktop) {
        localStorage.setItem("sidebar-toggled", value);
      } else {
        this.backdrop.show();
        this.sidebar.style.left = "-240px";
        setTimeout(() => {
          this.sidebar.style.removeProperty("left");
        }, 20);
      }
    },
    init(first) {
      if (!first) {
        return;
      }
      this.sidebar = document.querySelector(".sidebar");
      this.backdrop = new Backdrop();
      this.disabled = false;
  
      this.backdrop.onshow = () => {
        document.body.classList.add("sidebar-toggled");
      };
  
      this.backdrop.onhide = () => {
        document.body.classList.remove("sidebar-toggled");
        this.sidebar.style.display = "block";
      };
  
      this.backdrop.onhidden = () => {
        this.sidebar.style.removeProperty("display");
      };
  
      this.backdrop.onclick = () => this.backdrop.hide();
  
      Resize.callbacks.push(desktop => {
        if (desktop) {
          document.body.classList.toggle("sidebar-toggled", localStorage.getItem("sidebar-toggled") == "true");
          this.backdrop.hide(true);
        } else {
          document.body.classList.remove("sidebar-toggled");
        }
      });
  
      if (localStorage.getItem("sidebar-toggled") === "true" && Resize.isDesktop) {
        document.body.classList.add("no-transition");
        document.body.classList.add("sidebar-toggled");
        setTimeout(() => {
          document.body.classList.remove("no-transition");
        }, 20);
      }
  
      const DRAG_AREA = 24;
      const DRAG_THRESOLD = 24;
  
      let beginX = 0;
      let deltaX = 0;
      let dragging = false;
      let isInit = false;
  
      window.addEventListener("touchstart", e => {
        beginX = e.touches[0].clientX;
        deltaX = 0;
        isInit = false;
        if (!Resize.isDesktop && !this.disabled && (document.body.classList.contains("sidebar-toggled") || beginX < DRAG_AREA)) {
          dragging = true;
        }
      });
  
      window.addEventListener("touchmove", e => {
        if (!dragging) {
          return;
        }
        deltaX = e.touches[0].clientX - beginX;
        const toggled = document.body.classList.contains("sidebar-toggled");
        const triggered = toggled ? deltaX < -DRAG_THRESOLD : deltaX > DRAG_THRESOLD;
        if (triggered) {
          if (!isInit) {
            isInit = true;
            this.sidebar.style.transition = "none";
            this.sidebar.style.display = "block";
            this.backdrop.beginSwipe();
          }
          if (toggled) {
            const pos = clamp(deltaX + DRAG_THRESOLD, -this.sidebar.clientWidth, 0);
            this.sidebar.style.left = `${pos}px`;
            this.backdrop.setOpacity(1 + pos / this.sidebar.clientWidth);
          } else {
            const pos = clamp(deltaX - DRAG_THRESOLD, 0, this.sidebar.clientWidth);
            this.sidebar.style.left = `${pos - this.sidebar.clientWidth}px`;
            this.backdrop.setOpacity(pos / this.sidebar.clientWidth);
          }
        }
      });
  
      window.addEventListener("touchend", () => {
        if (!dragging) {
          return;
        }
        dragging = false;
        this.sidebar.style.removeProperty("left");
        this.sidebar.style.removeProperty("transition");
        const oldShown = document.body.classList.contains("sidebar-toggled");
        const newShown = oldShown ? deltaX > -DRAG_THRESOLD : deltaX > DRAG_THRESOLD;
        if (oldShown !== newShown) {
          this.backdrop.endSwipe(newShown);
        }
        if (newShown) {
          this.sidebar.style.removeProperty("display");
        }
      });

      for (const link of this.sidebar.querySelectorAll(".menu-link")) {
        link.addEventListener("click", () => {
          this.backdrop.hide();
        });
      }
    }
  }
  
  const WavesEffect = {
    init(first) {
      if (first) {
        Waves.init();
      }
      Waves.attach(".btn-icon");
      Waves.attach(".menu-link");
      Waves.attach(".post-link");
      Waves.attach(".chip");
      Waves.attach(".filter a");
      Waves.attach("a.paginator-item");
    }
  }
  
  const Menu = {
    init(first) {
      if (!first) {
        return;
      }
      for (const config of ["dark", "serif", "justify"]) {
        const item = document.querySelector(`#settings-${config}`);
        const button = item.querySelector("button");
        if (localStorage.getItem(config) === "true") {
          document.body.classList.add(config);
          button.classList.add("active");
        }
  
        item.addEventListener("click", () => {
          const active = button.classList.toggle("active");
          localStorage.setItem(config, active);
          document.body.classList.toggle(config, active);
          window.dispatchEvent(new CustomEvent("settingsChanged", {
            detail: { key: config, value: active }
          }));
        });
      }
  
      for (const [name, defaultValue, setFunc] of [
        ["width", 1024, value => {
          document.body.style.setProperty("--content-width", value === "0" ? "none" : `${value}px`);
        }],
        ["size", 1, value => {
          document.body.style.setProperty("--font-size", `${value}em`);
        }]
      ]) {
        if (localStorage.getItem(name) === null) {
          localStorage.setItem(name, defaultValue);
        }
        const buttons = document.querySelector(`#settings-${name}`).children;
        const value = localStorage.getItem(name);
        setFunc(value);
        let activeButton = buttons[0];
        for (const button of buttons) {
          if (value === button.dataset.value) {
            button.classList.add("active");
            activeButton = button;
          }
          button.addEventListener("click", () => {
            setFunc(button.dataset.value);
            localStorage.setItem(name, button.dataset.value);
            activeButton.classList.remove("active");
            button.classList.add("active");
            activeButton = button;
          });
        }
      }
  
      const settings = document.querySelector("#settings-dialog");
  
      const backdrop = new Backdrop(299);
  
      backdrop.onshow = () => {
        settings.classList.add("open");
        Sidebar.disabled = true;
      };
  
      backdrop.onhide = () => {
        settings.style.bottom = `-${settings.clientHeight}px`;
        Sidebar.disabled = false;
      };
  
      backdrop.onhidden = () => {
        settings.classList.remove("open");
        settings.style.removeProperty("bottom");
      };
  
      backdrop.onclick = () => backdrop.hide();
  
      document.querySelector("#settings").addEventListener("click", () => {
        Sidebar.close();
        backdrop.show();
        settings.style.transition = "none";
        settings.style.bottom = `-${settings.clientHeight}px`;
        setTimeout(() => {
          settings.style.removeProperty("bottom");
          settings.style.removeProperty("transition");
        }, 20);
      });
  
      let beginY = 0;
      let deltaY = 0;
      let dragging = false;
      let isInit = false;
      const DRAG_THRESOLD = 24;
  
      window.addEventListener("touchstart", e => {
        beginY = e.touches[0].clientY;
        deltaY = 0;
        isInit = false;
        if (settings.classList.contains("open")) {
          dragging = true;
        }
      });
  
      window.addEventListener("touchmove", e => {
        if (!dragging) {
          return;
        }
        deltaY = e.touches[0].clientY - beginY;
        const triggered = deltaY > DRAG_THRESOLD;
        if (triggered) {
          if (!isInit) {
            isInit = true;
            settings.style.transition = "none";
            backdrop.beginSwipe();
          }
          const pos = clamp(deltaY - DRAG_THRESOLD, 0, settings.clientHeight);
          settings.style.bottom = `-${pos}px`;
          backdrop.setOpacity(1 - pos / settings.clientHeight);
        }
      });
  
      window.addEventListener("touchend", () => {
        if (!dragging) {
          return;
        }
        dragging = false;
        settings.style.removeProperty("bottom");
        settings.style.removeProperty("transition");
        if (deltaY > DRAG_THRESOLD) {
          backdrop.endSwipe(false);
        }
      });
    }
  }
  
  /**
   * @param {HTMLAnchorElement} elem 
   */
  function isSelf(elem) {
    if (elem.target === "_self" || elem.target === "") {
      return true;
    } else if (elem.target === "_top" || elem.target === "_parent") {
      return window.parent === window;
    }
    return false;
  }
  
  let loadedScripts;
  let activeScripts;
  let loadedStyles;
  let activePjax = null;
  
  async function pjax(url) {
    if (activePjax === null) {
      for (const i of window.pageModules) {
        i.deinit && i.deinit();
      }
    } else {
      activePjax.progress.remove();
      activePjax.cancelled = true;
      clearInterval(activePjax.progressTimer);
    }
    const progress = document.createElement("div");
    progress.className = "page-progress";
    progress.style.width = "0";
    document.querySelector(".navbar").appendChild(progress);
    let width = 0;
    const progressTimer = setInterval(() => {
      width = Math.min(width + Math.random() * 10, 90);
      progress.style.width = `${width}%`;
    }, 100);
    const currentPjax = { progress: progress, progressTimer: progressTimer, cancelled: false }
    activePjax = currentPjax;
    const src = await (await fetch(url)).text();
    if (currentPjax.cancelled) {
      return;
    }
    activePjax = null;
    const doc = new DOMParser().parseFromString(src, "text/html");
    const promises = [];
    for (const style of doc.querySelectorAll("[rel=stylesheet]")) {
      const href = style.getAttribute("href");
      if (!loadedStyles.has(href)) {
        loadedStyles.add(href);
        const adopted = document.adoptNode(style);
        promises.push(new Promise(resolve => adopted.addEventListener("load", resolve)));
        document.head.appendChild(adopted);
      }
    }
    activeScripts.clear();
    for (const script of doc.querySelectorAll("body > script")) {
      const src = script.getAttribute("src");
      activeScripts.add(src);
      if (!loadedScripts.has(src)) {
        loadedScripts.add(src);
        const newScript = document.createElement("script");
        promises.push(new Promise(resolve => newScript.addEventListener("load", resolve)));
        newScript.src = src;
        document.body.appendChild(newScript);
      }
    }
    await Promise.all(promises);
    if (currentPjax.cancelled) {
      return;
    }
    progress.style.width = "100%";
    progress.style.opacity = "1";
    clearInterval(progressTimer);
    setTimeout(() => {
      progress.style.opacity = "0";
    }, 250);
    setTimeout(() => {
      progress.remove();
    }, 500);
    const adopted = document.adoptNode(doc.querySelector("#content"));
    document.querySelector("#content").replaceWith(adopted);
    document.querySelector(".navbar").className = doc.querySelector(".navbar").className;
    document.querySelector(".navbar-title").textContent = doc.querySelector(".navbar-title").textContent;
    document.title = doc.title;
    for (const script of adopted.querySelectorAll("script")) {
      const cloned = document.createElement("script");
      for (const attr of script.attributes) {
        cloned.setAttribute(attr.name, attr.value);
      }
      cloned.textContent = script.textContent;
      script.replaceWith(cloned);
    }
    window.scrollTo(0, 0);
    init();
  }
  
  window.pageModules = [
    Appbar,
    Resize,
    Sidebar,
    WavesEffect,
    Menu
  ];
  
  function init() {
    for (const i of window.pageModules) {
      if (!i.script || activeScripts.has(i.script)) {
        i.init(!i.executed);
        i.executed = true;
      }
    }
  }
  
  window.addEventListener("popstate", () => {
    pjax(location.href);
  });
  
  window.addEventListener("click", e => {
    if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) {
      return;
    }
    const elem = e.target;
    if (elem.tagName !== "A" || location.protocol !== elem.protocol || location.host !== elem.host || !isSelf(elem) || elem.dataset.pjax === "skip") {
      return;
    }
    if (location.pathname === elem.pathname && elem.hash !== "") {
      return;
    }
    e.preventDefault();
    history.pushState(null, "", elem.href);
    pjax(elem.href).catch(ex => {
      console.error("PJAX: PJAX failed, fallback to set location.href");
      console.error(ex);
      location.href = elem.href;
    });
  });
  
  document.addEventListener("DOMContentLoaded", () => {
    loadedScripts = new Set(Array.from(document.querySelectorAll("script")).map(elem => elem.getAttribute("src")));
    activeScripts = new Set(loadedScripts);
    loadedStyles = new Set(Array.from(document.querySelectorAll("[rel=stylesheet]")).map(elem => elem.getAttribute("href")));
    init();
  });
})();
