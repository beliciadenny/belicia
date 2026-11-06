// Belicia Denny portfolio: shared interactions
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile nav ---------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { links.classList.remove("open"); });
    });
  }

  /* ---------- Project rows: scroll reveal ---------- */
  function initReveal() {
    var rows = document.querySelectorAll(".project-row");
    if (!rows.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      rows.forEach(function (r) { r.classList.add("in-view"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    rows.forEach(function (r) { io.observe(r); });
  }

  /* ---------- Missing screenshot fallback for row thumbnails ---------- */
  function initImageFallbacks() {
    document.querySelectorAll(".row-media img").forEach(function (img) {
      var box = img.parentElement;
      function fail() { box.classList.add("is-missing"); }
      img.addEventListener("error", fail);
      if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) fail();
    });
  }

  /* ---------- Case-study popup ---------- */
  function initCaseStudies() {
    var rows = document.querySelectorAll(".project-row");
    if (!rows.length) return;

    var root = document.createElement("div");
    root.className = "modal";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML =
      '<div class="modal-backdrop" data-close></div>' +
      '<div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">' +
        '<div class="modal-bar">' +
          '<span class="modal-eyebrow"></span>' +
          '<button type="button" class="modal-close" aria-label="Close case study" data-close>&times;</button>' +
        '</div>' +
        '<div class="modal-scroll">' +
          '<div class="modal-media">' +
            '<div class="modal-frame"><img alt=""></div>' +
            '<p class="modal-caption"></p>' +
            '<div class="modal-thumbs"></div>' +
          '</div>' +
          '<div class="modal-body"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(root);

    var dialog = root.querySelector(".modal-dialog");
    var scroller = root.querySelector(".modal-scroll");
    var eyebrow = root.querySelector(".modal-eyebrow");
    var media = root.querySelector(".modal-media");
    var frame = root.querySelector(".modal-frame");
    var shot = frame.querySelector("img");
    var caption = root.querySelector(".modal-caption");
    var thumbs = root.querySelector(".modal-thumbs");
    var body = root.querySelector(".modal-body");

    var state = { title: "", images: [], captions: [], index: 0 };
    var lastFocus = null;
    var isOpen = false;

    shot.addEventListener("load", function () { frame.classList.remove("is-missing"); });
    shot.addEventListener("error", function () { frame.classList.add("is-missing"); });

    function show(i) {
      state.index = i;
      var cap = state.captions[i] || "";
      frame.classList.remove("is-missing");
      shot.src = state.images[i];
      shot.alt = state.title + (cap ? ": " + cap : "");
      caption.textContent = cap;
      caption.hidden = !cap;
      thumbs.querySelectorAll(".thumb").forEach(function (t, k) {
        var on = k === i;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    function buildThumbs() {
      thumbs.innerHTML = "";
      if (state.images.length < 2) { thumbs.hidden = true; return; }
      thumbs.hidden = false;
      state.images.forEach(function (src, k) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "thumb";
        var cap = state.captions[k] || "";
        b.setAttribute("aria-label", "Show screenshot " + (k + 1) + (cap ? ": " + cap : ""));
        var t = document.createElement("img");
        t.src = src;
        t.alt = "";
        t.addEventListener("error", function () { b.classList.add("is-missing"); });
        b.appendChild(t);
        b.addEventListener("click", function () { show(k); });
        thumbs.appendChild(b);
      });
    }

    function open(row) {
      var content = row.querySelector(".case-content");
      if (!content) return;

      state.title = row.getAttribute("data-title") || "";
      state.images = (row.getAttribute("data-images") || "").split("|").filter(Boolean);
      state.captions = (row.getAttribute("data-captions") || "").split("|");

      var clone = content.cloneNode(true);
      clone.hidden = false;
      var eb = clone.querySelector(".case-eyebrow");
      eyebrow.textContent = eb ? eb.textContent : "";
      if (eb) eb.parentNode.removeChild(eb);
      var h = clone.querySelector("h3");
      if (h) h.id = "modal-title";
      body.innerHTML = "";
      body.appendChild(clone);

      if (state.images.length) {
        media.hidden = false;
        buildThumbs();
        show(0);
      } else {
        media.hidden = true;
      }

      lastFocus = row.querySelector(".row-open") || document.activeElement;
      var sbw = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.classList.add("modal-open");
      if (sbw > 0) document.body.style.paddingRight = sbw + "px";

      scroller.scrollTop = 0;
      root.classList.add("is-open");
      root.setAttribute("aria-hidden", "false");
      isOpen = true;
      dialog.focus();
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      root.classList.remove("is-open");
      root.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("modal-open");
      document.body.style.paddingRight = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) close();
    });

    document.addEventListener("keydown", function (e) {
      if (!isOpen) return;
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key === "ArrowRight" && state.images.length > 1) {
        show((state.index + 1) % state.images.length);
        return;
      }
      if (e.key === "ArrowLeft" && state.images.length > 1) {
        show((state.index - 1 + state.images.length) % state.images.length);
        return;
      }
      if (e.key === "Tab") {
        var f = dialog.querySelectorAll('a[href], button:not([disabled])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });

    rows.forEach(function (row) {
      row.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        open(row);
      });
    });
  }

  /* ---------- Hero network canvas ---------- */
  function initCanvas() {
    var canvas = document.querySelector(".hero-canvas");
    if (!canvas || reduceMotion) return;

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rgb = "22,230,195";
    var width = 0, height = 0, nodes = [], visible = true, timer = null;

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.max(18, Math.min(46, Math.round((width * height) / 26000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          r: Math.random() * 1.6 + 1
        });
      }
    }

    function step() {
      requestAnimationFrame(step);
      if (!visible) return;
      ctx.clearRect(0, 0, width, height);
      var linkDist = Math.min(150, width / 6);
      var i, j;

      for (i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }
      for (i = 0; i < nodes.length; i++) {
        for (j = i + 1; j < nodes.length; j++) {
          var dx = nodes[i].x - nodes[j].x;
          var dy = nodes[i].y - nodes[j].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < linkDist) {
            ctx.strokeStyle = "rgba(" + rgb + "," + (0.16 * (1 - d / linkDist)) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(" + rgb + ",0.85)";
      for (i = 0; i < nodes.length; i++) {
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, nodes[i].r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }).observe(canvas.parentElement);
    }

    resize();
    window.addEventListener("resize", function () {
      clearTimeout(timer);
      timer = setTimeout(resize, 150);
    });
    requestAnimationFrame(step);
  }

  initNav();
  initReveal();
  initImageFallbacks();
  initCaseStudies();
  initCanvas();
})();
