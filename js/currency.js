/**
 * AMARAS TOUR - Dynamic Currency Converter & Rates Synchronizer
 * Supported: AMD (֏), RUB (₽), USD ($), EUR (€)
 * Rates updated via Central Bank of Armenia / Live Exchange API
 */

(function() {
  const STORAGE_KEY_CURR = 'amaras_currency';
  const STORAGE_KEY_RATES = 'amaras_rates_cache';
  const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

  // Fallback baseline rates (per 1 AMD)
  const DEFAULT_RATES = {
    AMD: 1,
    RUB: 0.23,     // ~1 RUB = 4.35 AMD
    USD: 0.00258,  // ~1 USD = 388 AMD
    EUR: 0.00241   // ~1 EUR = 415 AMD
  };

  const CURRENCY_SYMBOLS = {
    AMD: '֏',
    RUB: '₽',
    USD: '$',
    EUR: '€'
  };

  let currentCurrency = 'AMD';
  try {
    currentCurrency = localStorage.getItem(STORAGE_KEY_CURR) || 'AMD';
  } catch (e) {}

  let rates = Object.assign({}, DEFAULT_RATES);

  // Load cached rates from localStorage
  try {
    const cached = localStorage.getItem(STORAGE_KEY_RATES);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.rates && (Date.now() - parsed.timestamp < CACHE_TTL_MS)) {
        rates = Object.assign({}, DEFAULT_RATES, parsed.rates);
      }
    }
  } catch (e) {}

  // Fetch fresh rates in background
  function fetchLiveRates() {
    fetch('https://open.er-api.com/v6/latest/AMD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          rates.AMD = 1;
          if (data.rates.RUB) rates.RUB = data.rates.RUB;
          if (data.rates.USD) rates.USD = data.rates.USD;
          if (data.rates.EUR) rates.EUR = data.rates.EUR;
          try {
            localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify({
              timestamp: Date.now(),
              rates: rates
            }));
          } catch (e) {}
          updateAllPrices();
        }
      })
      .catch(err => {
        console.warn('Amaras: using baseline exchange rates', err);
      });
  }

  // Format price from base AMD to target currency
  window.formatCurrencyPrice = function(amountInAmd, curr) {
    curr = curr || currentCurrency;
    const rate = rates[curr] || 1;
    const symbol = CURRENCY_SYMBOLS[curr] || '֏';
    
    if (curr === 'AMD') {
      return Math.round(amountInAmd).toLocaleString('ru-RU') + ' ' + symbol;
    } else if (curr === 'RUB') {
      return Math.round(amountInAmd * rate).toLocaleString('ru-RU') + ' ' + symbol;
    } else if (curr === 'USD') {
      return Math.round(amountInAmd * rate).toLocaleString('en-US') + ' ' + symbol;
    } else if (curr === 'EUR') {
      return Math.round(amountInAmd * rate).toLocaleString('de-DE') + ' ' + symbol;
    }
    return Math.round(amountInAmd).toLocaleString('ru-RU') + ' ֏';
  };

  // Convert all prices on page
  function updateAllPrices() {
    // 1. Elements with data-base-price
    document.querySelectorAll('[data-base-price]').forEach(el => {
      const baseAmd = parseFloat(el.getAttribute('data-base-price'));
      if (!isNaN(baseAmd)) {
        el.textContent = window.formatCurrencyPrice(baseAmd, currentCurrency);
      }
    });

    // 2. Elements with .amaras-cat-card-price-val or .amaras-pop-price-val without data-base-price
    document.querySelectorAll('.amaras-cat-card-price-val, .amaras-pop-price-val').forEach(el => {
      let base = el.getAttribute('data-base-price');
      if (!base) {
        const rawText = el.textContent.replace(/[^0-9]/g, '');
        if (rawText) {
          el.setAttribute('data-base-price', rawText);
          base = rawText;
        }
      }
      if (base) {
        el.textContent = window.formatCurrencyPrice(parseFloat(base), currentCurrency);
      }
    });

    // 3. Trigger custom event for cart / constructor to recalculate
    window.dispatchEvent(new CustomEvent('amarasCurrencyChanged', {
      detail: { currency: currentCurrency, rates: rates, symbol: CURRENCY_SYMBOLS[currentCurrency] }
    }));
  }

  // Public setter
  window.setCurrency = function(code) {
    if (!CURRENCY_SYMBOLS[code]) return;
    currentCurrency = code;
    try {
      localStorage.setItem(STORAGE_KEY_CURR, code);
    } catch (e) {}

    // Update triggers
    document.querySelectorAll('#currentCurrSymbol, .amaras-curr-symbol-display').forEach(el => {
      el.textContent = CURRENCY_SYMBOLS[code];
    });
    document.querySelectorAll('#currentCurrCode, .amaras-curr-code-display').forEach(el => {
      el.textContent = code;
    });

    // Update menu active states
    document.querySelectorAll('.amaras-curr-item').forEach(btn => {
      if (btn.getAttribute('data-curr') === code) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });

    // Close menu
    const menu = document.getElementById('currencyMenu');
    if (menu) menu.classList.remove('is-open');
    const trigger = document.getElementById('currencyTrigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');

    updateAllPrices();
  };

  // Toggle dropdown menu
  window.toggleCurrencyMenu = function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const menu = document.getElementById('currencyMenu');
    const trigger = document.getElementById('currencyTrigger');
    if (!menu) return;
    
    // Close language menu if open
    const langMenu = document.getElementById('mobileLangMenu');
    if (langMenu) langMenu.classList.remove('is-open');

    const isOpen = menu.classList.contains('is-open');
    if (isOpen) {
      menu.classList.remove('is-open');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    } else {
      menu.classList.add('is-open');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
    }
  };

  // Close when clicking outside
  document.addEventListener('click', function(e) {
    const wrap = document.getElementById('currencyWrapper');
    if (wrap && !wrap.contains(e.target)) {
      const menu = document.getElementById('currencyMenu');
      if (menu) menu.classList.remove('is-open');
      const trigger = document.getElementById('currencyTrigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }
  });

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    window.setCurrency(currentCurrency);
    fetchLiveRates();
  });

  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    window.setCurrency(currentCurrency);
    fetchLiveRates();
  }

  window.AMARAS_CURRENCY = {
    getCurrency: () => currentCurrency,
    getRates: () => rates,
    getSymbol: (c) => CURRENCY_SYMBOLS[c || currentCurrency]
  };
})();
