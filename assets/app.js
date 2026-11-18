(function(){
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* нативный drag&drop картинок выключаем — мешает перетаскиванию барабана и ленты */
  document.addEventListener("dragstart", function(e){
    if(e.target && e.target.tagName === "IMG") e.preventDefault();
  });

  /* ---------- данные коллекций ---------- */
  /* полотна — рендеры 3D-моделей фабрики (FBX с Яндекс.Диска), номер = модель в сцене */
  var DOORS = [
    {name:"ARIA",  model:"02", size:"800 × 2200 мм", thickness:"38 мм", img:"assets/doors/aria-01.png"},
    {name:"ZERO",  model:"04", size:"800 × 2000 мм", thickness:"38 мм", img:"assets/doors/zero-01.png"},
    {name:"MAGIC", model:"07", size:"800 × 2000 мм", thickness:"38 мм", img:"assets/doors/magic-01.png"},
    {name:"ARIA",  model:"09", size:"800 × 2200 мм", thickness:"38 мм", img:"assets/doors/aria-02.png"},
    {name:"ZERO",  model:"02", size:"800 × 2000 мм", thickness:"38 мм", img:"assets/doors/zero-02.png"},
    {name:"MAGIC", model:"12", size:"800 × 2000 мм", thickness:"38 мм", img:"assets/doors/magic-02.png"}
  ];

  /* ---------- заставка ---------- */
  var splash = document.getElementById("splash");
  function hideSplash(){
    if(splash.classList.contains("is-hidden")) return;
    splash.classList.add("is-hidden");
    document.body.classList.remove("is-loading");
    var v = document.getElementById("heroVideo");
    if(v && v.paused){ v.play().catch(function(){}); }
  }
  window.addEventListener("load", function(){ setTimeout(hideSplash, reduce ? 200 : 2600); });
  setTimeout(hideSplash, 5000); // страховка

  /* ---------- шапка ---------- */
  var header = document.getElementById("header");
  var onScroll = function(){ header.classList.toggle("is-scrolled", window.scrollY > 40); };
  onScroll(); window.addEventListener("scroll", onScroll, {passive:true});

  var burger = document.getElementById("burger"), drawer = document.getElementById("drawer");
  burger.addEventListener("click", function(){
    var open = drawer.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  });
  drawer.addEventListener("click", function(e){
    if(e.target.tagName === "A"){
      drawer.classList.remove("is-open");
      burger.setAttribute("aria-expanded","false");
      document.body.style.overflow = "";
    }
  });

  /* ---------- шеренга дверей в герое ---------- */
  var lineup = document.getElementById("lineup");
  DOORS.forEach(function(d,i){
    var el = document.createElement("div");
    el.className = "door";
    el.innerHTML = '<img src="'+d.img+'" alt="Полотно коллекции '+d.name+', модель '+d.model+'"><span class="door__name">'+d.name+'</span>';
    el.style.transitionDelay = (0.5 + i*0.09) + "s";
    /* задержка нужна только для появления — потом убираем, чтобы hover срабатывал сразу */
    el.addEventListener("transitionend", function clear(e){
      if(e.target !== el || !el.classList.contains("is-in")) return;
      el.style.transitionDelay = "";
      el.removeEventListener("transitionend", clear);
    });
    lineup.appendChild(el);
  });
  setTimeout(function(){
    [].forEach.call(lineup.children, function(el){ el.classList.add("is-in"); });
  }, reduce ? 0 : 2800);

  /* лёгкий параллакс шеренги за курсором */
  if(!reduce && window.matchMedia("(pointer:fine)").matches){
    var hero = document.getElementById("hero"), tx = 0, cx = 0, raf = null;
    hero.addEventListener("mousemove", function(e){
      tx = ((e.clientX / window.innerWidth) - 0.5) * 26;
      if(!raf) raf = requestAnimationFrame(tick);
    });
    function tick(){
      cx += (tx - cx) * 0.06;
      lineup.style.transform = "translateX(" + cx.toFixed(2) + "px)";
      raf = Math.abs(tx - cx) > 0.1 ? requestAnimationFrame(tick) : null;
    }
  }

  /* ---------- появление блоков ---------- */
  function revealer(options){
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add("is-in"); obs.unobserve(en.target); }
      });
    }, options);
    return obs;
  }

  /* тексты и мелкие блоки: показываются, едва войдя в кадр */
  var io = revealer({threshold:0.22, rootMargin:"0px 0px -8% 0px"});
  document.querySelectorAll(".reveal").forEach(function(el){ io.observe(el); });

  /* ---------- створки коллекций ---------- */
  /* Открываются сразу, как только блок появляется в кадре, и обе одновременно:
     первая же попавшая в кадр панель раскрывает весь ряд, иначе доли пикселя
     в геометрии дают разное время старта. */
  var panels = document.querySelectorAll("[data-panel]");
  if(panels.length){
    document.documentElement.classList.add("has-reveal");
    var ioPanels = new IntersectionObserver(function(entries){
      var visible = entries.some(function(en){ return en.isIntersecting; });
      if(!visible) return;
      panels.forEach(function(el){ el.classList.add("is-in"); });
      ioPanels.disconnect();
    }, {threshold:0});
    panels.forEach(function(el){ ioPanels.observe(el); });
  }

  /* ---------- витрина-барабан на Swiper (свой эффект: настоящий цилиндр) ---------- */
  var panel = document.getElementById("panel"), nameEl = document.getElementById("reelName");
  var specsEl = document.getElementById("reelSpecs"), countEl = document.getElementById("reelCount");
  var progEl = document.getElementById("reelProgress"), wrap = document.getElementById("drumWrap");

  var N = DOORS.length;          /* 6 полотен */
  var REPEATS = 3;               /* дублируем набор: loop требует минимум slidesPerView * 2 слайдов */

  for(var k = 0; k < N * REPEATS; k++){
    var d = DOORS[k % N];
    var el = document.createElement("div");
    el.className = "swiper-slide drum__item";
    el.innerHTML = '<span class="drum__face">' +
                     '<img src="' + d.img + '" alt="Полотно коллекции ' + d.name + ', модель ' + d.model + '">' +
                     '<span class="drum__shadow"></span>' +
                   '</span>';
    wrap.appendChild(el);
  }

  function pad(n){ return String(n).padStart(2,"0"); }

  var STEP = 28;                 /* градусов цилиндра на одно полотно */
  var GAP = 1.3;                 /* шаг по дуге в ширинах самого полотна: с запасом, чтобы не слипались */
  var DOOR_RATIO = 2.5;          /* высота к ширине у рендеров (2.5 и 2.75) */

  function smooth(x){ x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }  /* без изломов на концах */

  /* Собственный эффект вместо coverflow: тот сдвигает полотна вбок по прямой,
     а здесь они стоят на образующей цилиндра — уходят вглубь по дуге, как в референсе.
     Swiper отдаёт прогресс каждого слайда (0 — в центре, ±1 — соседнее), всё остальное — геометрия. */
  function arrange(sw){
    var w = sw.slides.length ? sw.slides[0].offsetWidth : 0;
    if(!w) return;
    /* ширина слайда больше нарисованной двери: object-fit вписывает полотно по высоте.
       Радиус считаем от самой двери, иначе на узких экранах полотна слипаются */
    var door = Math.min(w, sw.slides[0].offsetHeight / DOOR_RATIO);
    var R = door * GAP / Math.sin(STEP * Math.PI / 180);
    var center = (sw.width - w) / 2;               /* левая координата отцентрованного полотна */
    /* граница видимости считается от числа полотен в кадре: 5 на десктопе, 3 на телефоне */
    var edge = (+sw.params.slidesPerView || 5) / 2 + 0.4;
    sw.slides.forEach(function(slide){
      var face = slide.firstElementChild;
      if(!face) return;
      var p = Math.max(-5, Math.min(5, slide.progress));   /* правее центра прогресс отрицательный */
      var a = -p * STEP, rad = a * Math.PI / 180;
      var x = center - slide.swiperSlideOffset + R * Math.sin(rad);
      var z = R * Math.cos(rad) - R;               /* центральное полотно на z = 0, боковые уходят назад */
      slide.style.transform =
        "translate3d(" + x.toFixed(1) + "px,0," + z.toFixed(1) + "px) rotateY(" + a.toFixed(2) + "deg)";

      var ap = Math.abs(p);
      var t = smooth(Math.min(ap, 2) / 2);
      var fade = smooth((edge - ap) / 0.9);        /* дальше кадра — не видно */
      face.style.opacity = ((1 - t * 0.45) * fade).toFixed(3);
      face.style.filter = "blur(" + (t * 1.5).toFixed(2) + "px) brightness(" + (1 - t * 0.26).toFixed(2) + ")";
      slide.style.zIndex = String(100 - Math.round(ap * 10));
    });
  }

  function setPanel(i){
    var real = i % N;
    panel.classList.add("is-swap");
    setTimeout(function(){
      var d = DOORS[real];
      nameEl.textContent = d.name;
      specsEl.innerHTML =
        '<li><span>Модель</span>' + d.model + '</li>' +
        '<li><span>Размер</span>' + d.size + '</li>' +
        '<li><span>Толщина</span>' + d.thickness + '</li>';
      panel.classList.remove("is-swap");
    }, reduce ? 0 : 240);
    countEl.textContent = pad(real + 1) + " / " + pad(N);
    progEl.style.width = ((real + 1) / N * 100).toFixed(1) + "%";
  }

  new Swiper("#drum", {
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: 5,            /* ровно пять полотен в кадре */
    breakpoints: {0: {slidesPerView: 3}, 700: {slidesPerView: 5}},  /* на телефоне три, зато крупные */
    loop: true,                  /* бесконечно по кругу, без рывка из конца в начало */
    speed: reduce ? 0 : 650,
    watchSlidesProgress: true,   /* нужен прогресс каждого слайда для геометрии */
    virtualTranslate: true,      /* ленту не двигаем — положение полотен считаем сами */
    slideToClickedSlide: true,
    threshold: 4,
    keyboard: {enabled: true},
    navigation: {prevEl: "#prev", nextEl: "#next"},
    on: {
      init: function(){ arrange(this); setPanel(this.realIndex); },
      setTranslate: function(sw){ arrange(sw); },    /* и во время перетаскивания, покадрово */
      resize: function(sw){ arrange(sw); },
      breakpoint: function(sw){ arrange(sw); },
      /* под пальцем барабан идёт за движением мгновенно (duration = 0),
         а на доводке и стрелках крутится плавно */
      setTransition: function(sw, d){      /* в params.on первым аргументом Swiper всегда передаёт сам инстанс */
        sw.slides.forEach(function(slide){
          slide.style.transitionDuration = d + "ms";
          var face = slide.firstElementChild;
          if(face) face.style.transitionDuration = (d ? Math.round(d * 1.2) : 0) + "ms";
        });
        /* лента при virtualTranslate не едет, значит и transitionend от неё не придёт.
           Без этого Swiper остаётся в состоянии animating, loopPreventsSliding блокирует
           следующий шаг — и стрелки срабатывают ровно один раз. Закрываем переход сами. */
        clearTimeout(sw.drumSettle);
        if(d) sw.drumSettle = setTimeout(function(){
          if(!sw.destroyed && sw.animating) sw.transitionEnd();
        }, d + 60);
      },
      slideChange: function(){ setPanel(this.realIndex); }
    }
  });

})();
