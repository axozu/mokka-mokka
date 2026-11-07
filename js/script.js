/* =========================================================
   Мокка-Мокка — интерактивность сайта
   ========================================================= */


/* ---------- Мобильное меню («бургер») ---------- */

// Находим на странице кнопку и меню
const burger = document.querySelector('.burger');
const nav = document.querySelector('#nav');

// Одна функция открывает и закрывает меню.
// isOpen = true → открыть, false → закрыть.
function setMenuOpen(isOpen) {
  nav.classList.toggle('nav--open', isOpen);
  burger.setAttribute('aria-expanded', String(isOpen));
  burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
}

// Меню сейчас открыто?
function isMenuOpen() {
  return burger.getAttribute('aria-expanded') === 'true';
}

// Подключаем меню, только если кнопка и меню есть на странице.
// Иначе ошибка здесь остановила бы весь скрипт — и сломались бы вкладки, статус и карта.
if (burger && nav) {
  // 1. Нажали на кнопку ☰ → переключаем меню
  burger.addEventListener('click', function () {
    setMenuOpen(!isMenuOpen());
  });

  // 2. Выбрали пункт меню → закрываем меню (страница прокрутится к разделу)
  nav.addEventListener('click', function (event) {
    if (event.target.closest('a')) {
      setMenuOpen(false);
    }
  });

  // 3. Нажали Escape → закрываем меню и возвращаем фокус на кнопку
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isMenuOpen()) {
      setMenuOpen(false);
      burger.focus();
    }
  });

  // 4. Нажали мимо меню (на любое место страницы) → закрываем
  document.addEventListener('click', function (event) {
    if (isMenuOpen() && !event.target.closest('.header')) {
      setMenuOpen(false);
    }
  });

  // 5. Экран стал широким (повернули планшет) → закрываем мобильное меню,
  //    чтобы при возврате на узкий экран оно не осталось «висеть» открытым
  const desktopQuery = window.matchMedia('(min-width: 768px)');
  desktopQuery.addEventListener('change', function (event) {
    if (event.matches) {
      setMenuOpen(false);
    }
  });
}


/* ---------- Вкладки меню кофейни ---------- */

// Все категории меню, у которых есть подпись для вкладки (data-tab)
const categories = document.querySelectorAll('.menu__category[data-tab]');
const menuTitle = document.querySelector('#menu-title');
const tabs = [];       // сюда сложим созданные кнопки
let tabList = null;    // контейнер вкладок
let currentTab = -1;   // номер открытой вкладки (-1 — ещё ни одна не открыта)

// Показывает вкладку номер index и прячет остальные.
// moveFocus = true — перевести фокус на вкладку (нужно при управлении стрелками).
function selectTab(index, moveFocus) {
  if (moveFocus) {
    tabs[index].focus();
  }

  // Нажали на уже открытую вкладку — ничего не делаем (без лишней анимации)
  if (index === currentTab) {
    return;
  }

  // Куда «едем»: вправо (next) или влево (prev).
  // При первом открытии направления нет — анимация не нужна.
  let direction = '';
  if (currentTab !== -1) {
    direction = index > currentTab ? 'next' : 'prev';
  }

  tabs.forEach(function (tab, i) {
    const isActive = i === index;
    tab.setAttribute('aria-selected', String(isActive));
    // Клавишей Tab попадаем только в активную вкладку, между вкладками — стрелками
    tab.tabIndex = isActive ? 0 : -1;
    categories[i].hidden = !isActive;
  });

  // CSS запускает анимацию появления по атрибуту data-direction
  if (direction) {
    categories[index].dataset.direction = direction;
  }

  // Сдвигаем скользящую подложку под активную вкладку (это делает CSS)
  tabList.style.setProperty('--active-index', index);
  currentTab = index;
}

if (categories.length > 0 && menuTitle) {
  // 1. Создаём контейнер для вкладок.
  //    role="tablist" и role="tab" сообщают программам для незрячих, что это вкладки.
  tabList = document.createElement('div');
  tabList.className = 'menu__tabs';
  tabList.setAttribute('role', 'tablist');
  tabList.setAttribute('aria-label', 'Категории меню');
  tabList.style.setProperty('--tab-count', categories.length);

  // 2. Скользящая подложка под активной вкладкой — чисто декоративная,
  //    поэтому aria-hidden: программы для незрячих её пропускают
  const indicator = document.createElement('span');
  indicator.className = 'menu__tabs-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  tabList.appendChild(indicator);

  // 3. Для каждой категории — кнопка-вкладка
  categories.forEach(function (category, i) {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'menu__tab';
    tab.id = 'tab-' + category.id;
    tab.textContent = category.dataset.tab; // текст из атрибута data-tab
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', category.id);

    // Связываем категорию с её вкладкой
    category.setAttribute('role', 'tabpanel');
    category.setAttribute('aria-labelledby', tab.id);
    category.tabIndex = 0;

    // Нумеруем позиции категории: по номеру CSS рассчитает задержку «лесенки»
    category.querySelectorAll('.menu__item, .menu__note').forEach(function (item, n) {
      item.style.setProperty('--i', n);
    });

    tab.addEventListener('click', function () {
      selectTab(i, false);
    });

    tabList.appendChild(tab);
    tabs.push(tab);
  });

  // 4. Управление с клавиатуры: ← → переключают вкладки, Home/End — первая/последняя
  tabList.addEventListener('keydown', function (event) {
    const current = tabs.indexOf(document.activeElement);
    let next = -1;

    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;

    if (next !== -1) {
      event.preventDefault(); // чтобы стрелки/Home не прокручивали страницу
      selectTab(next, true);
    }
  });

  // 5. Вставляем вкладки сразу после заголовка «Меню» и открываем первую
  menuTitle.after(tabList);
  selectTab(0, false);
}


/* ---------- «Сейчас открыто / закрыто» ---------- */

const OPEN_MINUTES = 7 * 60;    // открываемся в 7:00 (в минутах от полуночи)
const CLOSE_MINUTES = 23 * 60;  // закрываемся в 23:00

// Возвращает { isOpen, text } для момента date.
// Время берём по часовому поясу Бузулука (Оренбургская область, UTC+5),
// а не по часам посетителя — иначе гость из Москвы увидел бы неверный статус.
function getOpenStatus(date) {
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Yekaterinburg', // тот же пояс UTC+5, что и в Оренбургской области
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23'
  }).formatToParts(date);

  const hour = Number(parts.find(function (p) { return p.type === 'hour'; }).value);
  const minute = Number(parts.find(function (p) { return p.type === 'minute'; }).value);
  const now = hour * 60 + minute;

  const isOpen = now >= OPEN_MINUTES && now < CLOSE_MINUTES;
  return {
    isOpen: isOpen,
    text: isOpen ? 'Сейчас открыто' : 'Сейчас закрыто · откроемся в 7:00'
  };
}

// Вписывает статус во все места, помеченные атрибутом data-open-status
function updateOpenStatus() {
  const status = getOpenStatus(new Date());
  document.querySelectorAll('[data-open-status]').forEach(function (el) {
    el.textContent = status.text;
    el.classList.toggle('open-status--open', status.isOpen);
    el.classList.toggle('open-status--closed', !status.isOpen);
  });
}

updateOpenStatus();
// Обновляем раз в минуту — если страница открыта долго, статус не устареет
setInterval(updateOpenStatus, 60 * 1000);


/* ---------- Карта: загрузка по мере приближения ---------- */

// Карта Яндекса весит ~2,6 МБ и ставит cookie. Вставляем её, только когда
// посетитель долистал почти до контактов — кто смотрел лишь меню, её не скачает.
const mapBox = document.querySelector('[data-map-src]');

function loadMap() {
  if (mapBox.querySelector('iframe')) {
    return; // карта уже загружена
  }
  const frame = document.createElement('iframe');
  frame.src = mapBox.dataset.mapSrc;
  frame.title = mapBox.dataset.mapTitle;
  frame.allowFullscreen = true;
  // replaceChildren заменяет надпись «Загружаем карту…» на саму карту
  mapBox.replaceChildren(frame);
}

if (mapBox) {
  if ('IntersectionObserver' in window) {
    // IntersectionObserver — встроенный «наблюдатель»: сообщает, когда элемент
    // появляется на экране. rootMargin 300px — срабатываем чуть заранее,
    // чтобы карта успела загрузиться к моменту, когда до неё долистают.
    const mapObserver = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        loadMap();
        mapObserver.disconnect(); // больше следить не нужно
      }
    }, { rootMargin: '300px 0px' });
    mapObserver.observe(mapBox);
  } else {
    loadMap(); // очень старый браузер — просто загружаем сразу
  }
}
