(function () {
  "use strict";

  var $ = function (selector, context) {
    return (context || document).querySelector(selector);
  };
  var $$ = function (selector, context) {
    return Array.prototype.slice.call(
      (context || document).querySelectorAll(selector)
    );
  };

  var faNumber = function (value) {
    return Number(value).toLocaleString("fa-IR");
  };

  /* Header shadow on scroll */
  var header = $(".site-header");
  if (header) {
    var onScrollHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScrollHeader();
    window.addEventListener("scroll", onScrollHeader, { passive: true });
  }

  /* Mobile menu */
  var body = document.body;
  var menu = $("#mobile-menu");
  var menuToggle = $(".nav-toggle");
  var menuCloseButtons = $$("[data-menu-close]");
  var lastFocused = null;

  function openMenu() {
    lastFocused = document.activeElement;
    body.classList.add("menu-open");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
    if (menu) {
      menu.setAttribute("aria-hidden", "false");
      var firstLink = menu.querySelector("a, button");
      if (firstLink) firstLink.focus();
    }
  }

  function closeMenu() {
    body.classList.remove("menu-open");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
    if (menu) menu.setAttribute("aria-hidden", "true");
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      if (body.classList.contains("menu-open")) closeMenu();
      else openMenu();
    });
  }

  menuCloseButtons.forEach(function (el) {
    el.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && body.classList.contains("menu-open")) {
      closeMenu();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 1120 && body.classList.contains("menu-open")) {
      closeMenu();
    }
  });

  /* Reveal on scroll */
  var revealItems = $$("[data-reveal]");
  if (revealItems.length) {
    if ("IntersectionObserver" in window) {
      var revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      revealItems.forEach(function (item) {
        revealObserver.observe(item);
      });
    } else {
      revealItems.forEach(function (item) {
        item.classList.add("is-visible");
      });
    }
  }

  /* Animated counters */
  var counters = $$("[data-count]");
  if (counters.length) {
    var reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    var runCounter = function (el) {
      var target = Number(el.getAttribute("data-count")) || 0;
      if (reduceMotion) {
        el.textContent = faNumber(target);
        return;
      }
      var duration = 1600;
      var start = null;
      var tick = function (timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = faNumber(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if ("IntersectionObserver" in window) {
      var counterObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              runCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach(function (el) {
        counterObserver.observe(el);
      });
    } else {
      counters.forEach(runCounter);
    }
  }

  /* Testimonial slider */
  $$("[data-slider]").forEach(function (root) {
    var track = $(".testi-track", root);
    if (!track) return;

    var slides = $$(".testi-card", track);
    var prevBtn = $("[data-slider-prev]", root);
    var nextBtn = $("[data-slider-next]", root);
    var dotsWrap = $("[data-slider-dots]", root);
    var index = 0;

    if (!slides.length) return;

    var perView = function () {
      return parseInt(
        window.getComputedStyle(track).getPropertyValue("--per-view"),
        10
      ) || 1;
    };

    var maxIndex = function () {
      return Math.max(0, slides.length - perView());
    };

    var stepSize = function () {
      var styles = window.getComputedStyle(track);
      var gap = parseFloat(styles.columnGap || styles.gap) || 24;
      return slides[0].getBoundingClientRect().width + gap;
    };

    var render = function () {
      index = Math.min(index, maxIndex());
      track.style.transform = "translateX(" + index * stepSize() + "px)";
      if (prevBtn) prevBtn.disabled = index <= 0;
      if (nextBtn) nextBtn.disabled = index >= maxIndex();
      if (dotsWrap) {
        $$(".slider-dot", dotsWrap).forEach(function (dot, i) {
          dot.classList.toggle("is-active", i === index);
        });
      }
    };

    var buildDots = function () {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      var count = maxIndex() + 1;
      for (var i = 0; i < count; i += 1) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "slider-dot";
        dot.setAttribute("aria-label", "اسلاید " + (i + 1));
        dot.addEventListener(
          "click",
          (function (dotIndex) {
            return function () {
              index = dotIndex;
              render();
            };
          })(i)
        );
        dotsWrap.appendChild(dot);
      }
    };

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        index = Math.max(0, index - 1);
        render();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        index = Math.min(maxIndex(), index + 1);
        render();
      });
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        index = Math.min(index, maxIndex());
        buildDots();
        render();
      }, 150);
    });

    buildDots();
    render();
  });

  /* FAQ accordion */
  $$(".faq-item").forEach(function (item) {
    var button = $(".faq-q", item);
    var panel = $(".faq-a", item);
    if (!button || !panel) return;

    button.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      var siblings = $$(".faq-item.is-open", item.parentElement);

      siblings.forEach(function (sibling) {
        if (sibling === item) return;
        sibling.classList.remove("is-open");
        var siblingQ = $(".faq-q", sibling);
        var siblingA = $(".faq-a", sibling);
        if (siblingQ) siblingQ.setAttribute("aria-expanded", "false");
        if (siblingA) siblingA.style.maxHeight = null;
      });

      item.classList.toggle("is-open", !isOpen);
      button.setAttribute("aria-expanded", String(!isOpen));
      panel.style.maxHeight = !isOpen ? panel.scrollHeight + "px" : null;
    });
  });

  $$(".faq-item.is-open").forEach(function (item) {
    var panel = $(".faq-a", item);
    if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
  });

  /* Project filters */
  $$("[data-filter-bar]").forEach(function (bar) {
    var gridSelector = bar.getAttribute("data-filter-bar");
    var grid = gridSelector ? $(gridSelector) : null;
    if (!grid) return;

    var cards = $$("[data-category]", grid);

    $$(".filter-btn", bar).forEach(function (button) {
      button.addEventListener("click", function () {
        $$(".filter-btn", bar).forEach(function (btn) {
          btn.classList.remove("is-active");
        });
        button.classList.add("is-active");

        var filter = button.getAttribute("data-filter");
        cards.forEach(function (card) {
          var show =
            filter === "*" || card.getAttribute("data-category") === filter;
          card.style.display = show ? "" : "none";
        });
      });
    });
  });

  /* Pricing billing toggle */
  $$("[data-billing-toggle]").forEach(function (toggle) {
    var scope = toggle.closest("[data-pricing]") || document;
    var buttons = $$("[data-billing]", toggle);
    var values = $$(".price-value", scope);
    var periods = $$(".price-period", scope);

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var mode = button.getAttribute("data-billing");
        buttons.forEach(function (btn) {
          btn.classList.toggle("is-active", btn === button);
          btn.setAttribute("aria-pressed", String(btn === button));
        });

        values.forEach(function (value) {
          var next = value.getAttribute(
            mode === "yearly" ? "data-yearly" : "data-monthly"
          );
          if (next) value.textContent = next;
        });

        periods.forEach(function (period) {
          period.textContent =
            mode === "yearly" ? "سالانه (با ۲۰٪ تخفیف)" : "ماهانه";
        });
      });
    });
  });

  /* Form validation */
  $$("form[data-validate]").forEach(function (form) {
    var success = $(".form-success", form);

    var validateField = function (field) {
      var input = $("input, textarea, select", field);
      if (!input) return true;

      var valid = true;
      var value = input.value.trim();

      if (input.required && !value) valid = false;
      if (
        valid &&
        input.type === "email" &&
        value &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        valid = false;
      }
      if (
        valid &&
        input.getAttribute("data-minlength") &&
        value.length < Number(input.getAttribute("data-minlength"))
      ) {
        valid = false;
      }

      field.classList.toggle("has-error", !valid);
      return valid;
    };

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var fields = $$(".field", form);
      var valid = fields.map(validateField).every(Boolean);

      if (!valid) {
        var firstError = $(".field.has-error input, .field.has-error textarea", form);
        if (firstError) firstError.focus();
        return;
      }

      form.reset();
      fields.forEach(function (field) {
        field.classList.remove("has-error");
      });

      if (success) {
        success.classList.add("is-visible");
        window.setTimeout(function () {
          success.classList.remove("is-visible");
        }, 6000);
      }
    });

    $$(".field input, .field textarea, .field select", form).forEach(function (input) {
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field && field.classList.contains("has-error")) {
          validateField(field);
        }
      });
    });
  });

  /* Newsletter */
  $$("[data-newsletter]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = $("input", form);
      var message =
        form.parentElement.querySelector(".newsletter-msg") ||
        form.nextElementSibling;

      if (!input) return;

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
        if (message) {
          message.textContent = "لطفاً یک ایمیل معتبر وارد کنید.";
          message.style.color = "#f3a3a3";
        }
        return;
      }

      input.value = "";
      if (message) {
        message.textContent = "عضویت شما با موفقیت ثبت شد.";
        message.style.color = "#7dd3a0";
      }
    });
  });

  /* Back to top */
  var toTop = $(".to-top");
  if (toTop) {
    var toggleToTop = function () {
      toTop.classList.toggle("is-visible", window.scrollY > 500);
    };
    toggleToTop();
    window.addEventListener("scroll", toggleToTop, { passive: true });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* Footer year */
  var currentYear = "";
  try {
    currentYear = new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
    }).format(new Date());
  } catch (error) {
    currentYear = "۱۴۰۵";
  }
  $$("[data-year]").forEach(function (el) {
    el.textContent = currentYear;
  });
})();
