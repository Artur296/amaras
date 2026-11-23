/**
 * AMARAS LIVE CHAT, MULTILINGUAL BOT & TAWK.TO INTEGRATION
 * Zero emojis - High-end editorial UI (#1C1A1A, #201F1F, #586EFF, #C7FF32)
 * Features:
 * 1. Trilingual Knowledge-base Bot (RU, ENG, HY) for instant answers
 * 2. Automatic handover to live human operators via Tawk.to and internal staff portal
 * 3. Tawk.to Property ID: 6b045c72b2432a3cd966113c / Widget: 1k84gi84q
 * 4. Cross-tab real-time sync between website visitor and staff portal (/staff)
 */

(function (window) {
  'use strict';

  const STORAGE_KEYS = {
    STAFF_USERS: 'amaras_staff_users',
    CURRENT_STAFF: 'amaras_staff_current_user',
    CHATS: 'amaras_live_chats',
    CLIENT_CHAT_ID: 'amaras_client_chat_id'
  };

  const ADMIN_HASH = 'c4a764736627f9d3db338b054ccf216724e11ee05455eb3dc467b55413c3182a';

  // =========================================================================
  // 1. TAWK.TO OFFICIAL INTEGRATION
  // =========================================================================
  var Tawk_API = window.Tawk_API || {}, Tawk_LoadStart = new Date();
  window.Tawk_API = Tawk_API;

  Tawk_API.onLoad = function () {
    try {
      // Hide default Tawk.to launcher bubble so our luxury Amaras button controls it
      if (typeof Tawk_API.hideWidget === 'function') {
        Tawk_API.hideWidget();
      }
    } catch (e) {}
  };

  if (!document.querySelector('script[src*="tawk.to"]')) {
    (function () {
      var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
      s1.async = true;
      s1.src = 'https://embed.tawk.to/6b045c72b2432a3cd966113c/1k84gi84q';
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');
      if (s0 && s0.parentNode) {
        s0.parentNode.insertBefore(s1, s0);
      } else {
        document.head.appendChild(s1);
      }
    })();
  }

  window.openTawkChat = function () {
    if (window.Tawk_API) {
      try {
        if (typeof window.Tawk_API.showWidget === 'function') {
          window.Tawk_API.showWidget();
        }
        if (typeof window.Tawk_API.maximize === 'function') {
          window.Tawk_API.maximize();
          return;
        }
        if (typeof window.Tawk_API.toggle === 'function') {
          window.Tawk_API.toggle();
          return;
        }
      } catch (err) {}
    }
    window.open('https://tawk.to/chat/6b045c72b2432a3cd966113c/1k84gi84q', '_blank');
  };

  // =========================================================================
  // 2. LANGUAGE DETECTION & HELPERS
  // =========================================================================
  function getActiveLanguage() {
    if (window.currentLang === 'ENG' || window.currentLang === 'HY' || window.currentLang === 'RU') {
      return window.currentLang;
    }
    const saved = localStorage.getItem('amaras_selected_lang');
    if (saved === 'ENG' || saved === 'HY' || saved === 'RU') return saved;
    const docLang = (document.documentElement.lang || '').toLowerCase();
    if (docLang.startsWith('en')) return 'ENG';
    if (docLang.startsWith('hy') || docLang.startsWith('am')) return 'HY';
    return 'RU';
  }

  function detectMessageLanguage(text) {
    const str = (text || '').trim();
    if (/[\u0531-\u058F]/.test(str)) return 'HY';
    if (/[\u0400-\u04FF]/.test(str)) return 'RU';
    if (/[a-zA-Z]/.test(str)) return 'ENG';
    return getActiveLanguage();
  }

  // SHA-256 Helper
  async function sha256Hex(text) {
    if (window.crypto && crypto.subtle) {
      try {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {}
    }
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  // =========================================================================
  // 3. STORAGE & STAFF LOGIC
  // =========================================================================
  function initStaffStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STAFF_USERS);
      if (raw) {
        let users = JSON.parse(raw);
        if (Array.isArray(users)) {
          const filtered = users.filter(u => u.role !== 'admin' && (u.login || '').toLowerCase() !== 'admin');
          if (filtered.length !== users.length) {
            localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(filtered));
          }
        }
      }
    } catch (e) {}
  }

  function getStaffUsers() {
    initStaffStorage();
    try {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF_USERS)) || [];
      return users.filter(u => u.role !== 'admin' && (u.login || '').toLowerCase() !== 'admin');
    } catch (e) {
      return [];
    }
  }

  function saveStaffUsers(users) {
    localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('amaras:staff_updated', { detail: { users } }));
  }

  function getCurrentStaff() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEYS.CURRENT_STAFF)) || null;
    } catch (e) {
      return null;
    }
  }

  function setCurrentStaff(user) {
    if (user) {
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_STAFF, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_STAFF);
    }
    window.dispatchEvent(new CustomEvent('amaras:current_staff_changed', { detail: { user } }));
  }

  function getAllChats() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveAllChats(chats) {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    window.dispatchEvent(new CustomEvent('amaras:chats_updated', { detail: { chats } }));
  }

  // Get or create client chat session for website visitor
  function getOrCreateClientChat() {
    let chatId = sessionStorage.getItem(STORAGE_KEYS.CLIENT_CHAT_ID);
    const chats = getAllChats();
    const lang = getActiveLanguage();

    let current = chats.find(c => c.id === chatId);
    if (!current) {
      chatId = 'chat_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      sessionStorage.setItem(STORAGE_KEYS.CLIENT_CHAT_ID, chatId);

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let welcomeText = 'Здравствуйте! Рады приветствовать вас в Amaras Tour. Чем я могу помочь вам в выборе тура, трансфера или организации отдыха в Армении?';
      let welcomeChips = ['Популярные туры', 'Цены на трансферы', 'Как забронировать', 'Позвать оператора'];
      let botSenderName = 'Бот Amaras';

      if (lang === 'ENG') {
        welcomeText = 'Hello! Welcome to Amaras Tour. How can I help you choose a tour, book a private transfer, or plan your stay in Armenia?';
        welcomeChips = ['Popular tours', 'Transfer prices', 'How to book', 'Live operator'];
        botSenderName = 'Amaras Bot';
      } else if (lang === 'HY') {
        welcomeText = 'Բարև Ձեզ: Ուրախ ենք ողջունել ձեզ Amaras Tour-ում: Ինչո՞վ կարող ենք օգնել տուրի ընտրության կամ տրանսֆերի ամրագրման հարցում:';
        welcomeChips = ['Հանրաճանաչ տուրեր', 'Տրանսֆերի գներ', 'Ինչպես ամրագրել', 'Կապ օպերատորի հետ'];
        botSenderName = 'Amaras Բոտ';
      }

      current = {
        id: chatId,
        clientName: (lang === 'ENG' ? 'Guest #' : lang === 'HY' ? 'Հյուր #' : 'Гость #') + chatId.slice(-4).toUpperCase(),
        page: document.title ? document.title.split('|')[0].trim() : 'Amaras Tour',
        status: 'bot',
        assignedOperator: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        unreadForOperator: 0,
        unreadForVisitor: 0,
        messages: [
          {
            id: 'msg_init',
            sender: 'bot',
            senderName: botSenderName,
            text: welcomeText,
            timestamp: Date.now(),
            timeStr: timeStr,
            chips: welcomeChips
          }
        ]
      };
      chats.unshift(current);
      saveAllChats(chats);
    }
    return current;
  }

  // =========================================================================
  // 4. TRILINGUAL KNOWLEDGE BASE (RU, ENG, HY)
  // =========================================================================
  const TRILINGUAL_KNOWLEDGE = [
    // Transfers / Airport
    {
      keywords: {
        RU: ['трансфер', 'аэропорт', 'звартноц', 'такси', 'машин', 'встреч', 'доехать', 'автопарк'],
        ENG: ['transfer', 'airport', 'zvartnots', 'taxi', 'ride', 'car', 'pickup', 'dropoff', 'drive', 'fleet'],
        HY: ['տրանսֆեր', 'օդանավակայան', 'զվարթնոց', 'տաքսի', 'մեքենա', 'դիմավորել', 'ավտոպարկ']
      },
      response: {
        RU: 'Мы предоставляем комфортные трансферы из аэропорта Звартноц в Ереван (от 10 000 AMD) и по всей Армении (Севан, Дилижан, Цахкадзор, Джермук, Татев, Тбилиси). В автопарке комфортные седаны, минивэны Mercedes V-Class (до 7 мест), микроавтобусы Sprinter (до 20 мест) и представительский Maybach. Водитель встретит вас с табличкой в зале прилета.',
        ENG: 'We provide comfortable private transfers from Zvartnots Airport to Yerevan (from 10,000 AMD / ~$26) and throughout Armenia (Sevan, Dilijan, Tsaghkadzor, Jermuk, Tatev, Tbilisi). Our fleet includes comfort sedans, Mercedes V-Class VIP minivans (up to 7 seats), Sprinter minibuses (up to 20 seats), and luxury Maybach. Your driver meets you with a nameplate in the arrivals hall.',
        HY: 'Մենք տրամադրում ենք հարմարավետ տրանսֆերներ Զվարթնոց օդանավակայանից դեպի Երևան (սկսած 10 000 դրամից) և ողջ Հայաստանով (Սևան, Դիլիջան, Ծաղկաձոր, Ջերմուկ, Տաթև, Թբիլիսի): Մեր ավտոպարկում առկա են սեդաններ, Mercedes V-Class (մինչև 7 տեղ), Sprinter (մինչև 20 տեղ) և VIP Maybach: Վարորդը կդիմավորի ձեզ անվանական ցուցանակով:'
      },
      chips: {
        RU: ['Тарифы на трансферы', 'Заказать трансфер', 'Позвать оператора'],
        ENG: ['Transfer rates', 'Book transfer', 'Live operator'],
        HY: ['Տրանսֆերի սակագներ', 'Պատվիրել տրանսֆեր', 'Կապ օպերատորի հետ']
      }
    },

    // Jeep Tours
    {
      keywords: {
        RU: ['джип', 'аждаак', 'арагац', 'ущелье ангелов', 'вулкан', 'горы', '4x4', 'внедорож'],
        ENG: ['jeep', 'offroad', 'azhdahak', 'aragats', 'angels canyon', 'volcano', 'mountains', '4x4'],
        HY: ['ջիպ', 'աժդահակ', 'արագած', 'հրեշտակների կիրճ', 'հրաբուխ', 'սարեր', '4x4']
      },
      response: {
        RU: 'Наши авторские джип-туры проходят на подготовленных внедорожниках Toyota Land Cruiser и Sequoia с опытными гидами-водителями. Топовые направления: Восхождение на вулкан Аждаак к кратерному озеру (3597 м), Экспедиция на гору Арагац и Марсианские каньоны Ущелья Ангелов. В стоимость входят трансфер, экипировка и сопровождение.',
        ENG: 'Our signature 4x4 jeep tours feature expedition-ready Toyota Land Cruiser and Sequoia vehicles with seasoned mountain drivers. Top routes: Mount Azhdahak volcano crater lake (3597 m), Mount Aragats high-altitude expedition, and the Martian labyrinths of Angels Canyon. Transfers, guiding, and safety gear are all included.',
        HY: 'Մեր հեղինակային ջիպ-տուրերն անցկացվում են հատուկ պատրաստված Toyota Land Cruiser և Sequoia ամենագնացներով՝ փորձառու գիդ-վարորդների ուղեկցությամբ: Գլխավոր ուղղություններ՝ Վերելք Աժդահակ հրաբուխ (3597 մ), Արագած լեռան արշավ և Հրեշտակների կիրճի մարսյան լաբիրինթոսներ:'
      },
      chips: {
        RU: ['Подробнее о джип-турах', 'Позвать оператора'],
        ENG: ['More about jeep tours', 'Live operator'],
        HY: ['Ավելին ջիպ-տուրերի մասին', 'Կապ օպերատորի հետ']
      }
    },

    // Gastro Tours
    {
      keywords: {
        RU: ['гастро', 'вино', 'арени', 'сыр', 'лаваш', 'севанский ишхан', 'еда', 'дегустац', 'кухня'],
        ENG: ['gastro', 'wine', 'areni', 'cheese', 'lavash', 'trout', 'food', 'tasting', 'culinary', 'kitchen'],
        HY: ['գաստրո', 'գինի', 'արենի', 'պանիր', 'լավաշ', 'իշխան', 'ուտելիք', 'համտես', 'խոհանոց']
      },
      response: {
        RU: 'В гастрономических турах Amaras вас ждут мастер-классы по выпечке традиционного лаваша в тонире, дегустации премиальных вин в старейших винодельнях Арени и свежий севанский ишхан с раковыми шейками на берегу озера. В стоимость включены все дегустации и сытный обед.',
        ENG: 'Amaras gastro tours feature authentic masterclasses in baking Armenian tonir lavash, premium wine tastings in historical Areni cave wineries, and fresh Lake Sevan trout with crayfish kebabs. All tastings and full traditional lunches are fully included.',
        HY: 'Amaras-ի գաստրոնոմիկ տուրերում ձեզ սպասվում են ավանդական թոնրի լավաշի թխման վարպետաց դասեր, բարձրակարգ գինիների համտես Արենիի հնագույն գինեգործարաններում և թարմ Սևանի իշխան լճի ափին:'
      },
      chips: {
        RU: ['Гастрономические туры', 'Позвать оператора'],
        ENG: ['Gastro tours', 'Live operator'],
        HY: ['Գաստրո տուրեր', 'Կապ օպերատորի հետ']
      }
    },

    // Cultural & Group Tours
    {
      keywords: {
        RU: ['гарни', 'гегард', 'хор вирап', 'татев', 'дилижан', 'севан', 'экскурси', 'группов', 'мини'],
        ENG: ['garni', 'geghard', 'khor virap', 'tatev', 'dilijan', 'sevan', 'excursion', 'group tour', 'sightseeing'],
        HY: ['գառնի', 'գեղարդ', 'խոր վիրապ', 'տաթև', 'դիլիջան', 'սևան', 'էքսկուրսիա', 'խմբային']
      },
      response: {
        RU: 'Ежедневные регулярные экскурсии по главным святыням и красотам Армении: Храм Гарни и скальный монастырь Гегард, Симфония камней, Хор Вирап с панорамой на Арарат, Озеро Севан и Монастырь Татев с канатной дорогой Крылья Татева. Выезд из центра Еревана в комфортных мини-группах.',
        ENG: 'Daily tours to Armenia’s most breathtaking landmarks: Garni pagan temple & Geghard cave monastery, Symphony of Stones, Khor Virap overlooking majestic Mount Ararat, Lake Sevan & Dilijan, and Tatev Monastery with the Wings of Tatev ropeway. Daily departures from central Yerevan in modern mini-groups.',
        HY: 'Ամենօրյա էքսկուրսիաներ Հայաստանի գլխավոր տեսարժան վայրերով՝ Գառնիի տաճար և Գեղարդավանք, Քարերի սիմֆոնիա, Խոր Վիրապ՝ Արարատի հիասքանչ տեսարանով, Սևանա լիճ, Դիլիջան և Տաթևի վանք՝ ՏաԹևեր ճոպանուղով: Մեկնումները կենտրոնական Երևանից:'
      },
      chips: {
        RU: ['Посмотреть каталог туров', 'Позвать оператора'],
        ENG: ['Browse all tours', 'Live operator'],
        HY: ['Տեսնել բոլոր տուրերը', 'Կապ օպերատորի հետ']
      }
    },

    // Prices & Rates
    {
      keywords: {
        RU: ['цен', 'стоимост', 'прайс', 'тариф', 'скидк', 'сколько стоит'],
        ENG: ['price', 'cost', 'rate', 'fee', 'discount', 'how much', 'fares'],
        HY: ['գին', 'արժեք', 'սակագին', 'զեղչ', 'ինչքան արժե']
      },
      response: {
        RU: 'Стоимость групповых мини-туров начинается от 22 000 AMD за человека. Авторские джип-туры — от 65 000 AMD. Трансферы из аэропорта Звартноц — от 10 000 AMD. При бронировании от 2-х туров действуют специальные сезонные скидки.',
        ENG: 'Group mini-tours start from 22,000 AMD (~$55) per person. Signature jeep expeditions from 65,000 AMD. Airport transfers from 10,000 AMD (~$26). Seasonal discounts apply when booking two or more tours.',
        HY: 'Խմբային մինի-տուրերի արժեքը սկսվում է 22 000 դրամից մեկ անձի համար: Ջիպ-արշավները՝ 65 000 դրամից: Օդանավակայանի տրանսֆերները՝ 10 000 դրամից: Երկու կամ ավելի տուրեր ամրագրելիս գործում են հատուկ զեղչեր:'
      },
      chips: {
        RU: ['Каталог туров', 'Позвать оператора'],
        ENG: ['Tour catalog', 'Live operator'],
        HY: ['Տուրերի կատալոգ', 'Կապ օպերատորի հետ']
      }
    },

    // Booking & Cancellation
    {
      keywords: {
        RU: ['брон', 'заказ', 'оплат', 'картой', 'наличн', 'предоплат', 'отмен'],
        ENG: ['book', 'reserve', 'order', 'pay', 'payment', 'card', 'cash', 'cancel', 'refund'],
        HY: ['ամրագրել', 'պատվիրել', 'վճարել', 'քարտով', 'կանխիկ', 'չեղարկել']
      },
      response: {
        RU: 'Забронировать тур или трансфер можно прямо на сайте, добавив маршрут в корзину, или через наших менеджеров. Оплата возможна картами онлайн, банковским переводом или наличными водителю. Бесплатная отмена бронирования действует за 24 часа до поездки.',
        ENG: 'You can book any tour or transfer directly on the website by adding it to your cart, or through our managers. We accept online card payments, bank wire transfers, and cash to the driver. Free cancellation is guaranteed up to 24 hours prior to departure.',
        HY: 'Տուրը կամ տրանսֆերը կարող եք ամրագրել անմիջապես կայքում՝ ավելացնելով զամբյուղի մեջ, կամ մեր մենեջերների միջոցով: Վճարումը հնարավոր է քարտով օնլայն, բանկային փոխանցմամբ կամ կանխիկ վարորդին: Գործում է անվճար չեղարկում ուղևորությունից 24 ժամ առաջ:'
      },
      chips: {
        RU: ['Как забронировать', 'Позвать оператора'],
        ENG: ['How to book', 'Live operator'],
        HY: ['Ինչպես ամրագրել', 'Կապ օպերատորի հետ']
      }
    },

    // Contacts
    {
      keywords: {
        RU: ['контакт', 'телефон', 'номер', 'whatsapp', 'вацап', 'ватсап', 'адрес', 'офис', 'где вы'],
        ENG: ['contact', 'phone', 'number', 'whatsapp', 'call', 'address', 'office', 'location', 'where'],
        HY: ['կոնտակտ', 'հեռախոս', 'համար', 'whatsapp', 'հասցե', 'գրասենյակ', 'որտեղ']
      },
      response: {
        RU: 'Служба заботы Amaras Tour на связи ежедневно с 08:00 до 23:00 (GMT+4). Горячая линия: +374 99 250 525. WhatsApp: +374 99 250 525. Telegram: @amarastour. Офис расположен в центре Еревана.',
        ENG: 'Amaras Tour customer care is available daily from 08:00 to 23:00 (GMT+4). Hotline: +374 99 250 525. WhatsApp: +374 99 250 525. Telegram: @amarastour. Our main office is located in central Yerevan.',
        HY: 'Amaras Tour-ի աջակցման կենտրոնն աշխատում է ամեն օր 08:00-ից մինչև 23:00 (GMT+4): Թեժ գիծ՝ +374 99 250 525: WhatsApp՝ +374 99 250 525: Telegram՝ @amarastour: Գրասենյակը գտնվում է Երևանի կենտրոնում:'
      },
      chips: {
        RU: ['Написать в WhatsApp', 'Позвать оператора'],
        ENG: ['WhatsApp chat', 'Live operator'],
        HY: ['Գրել WhatsApp-ում', 'Կապ օպերատորի հետ']
      }
    },

    // Clothing & Weather
    {
      keywords: {
        RU: ['что взять', 'одежд', 'погод', 'обувь', 'взять с собой'],
        ENG: ['what to wear', 'clothes', 'clothing', 'shoes', 'weather', 'bring', 'pack', 'temperature'],
        HY: ['ինչ վերցնել', 'հագուստ', 'եղանակ', 'կոշիկ', 'հագնել', 'ջերմաստիճան']
      },
      response: {
        RU: 'Для поездок в горы и к озеру Севан рекомендуем удобную трекинговую или спортивную обувь, ветрозащитную куртку (в горах прохладнее на 7-10 градусов), солнцезащитные очки и крем. При посещении монастырей рекомендуется закрытая одежда.',
        ENG: 'For mountain excursions and Lake Sevan trips, we recommend comfortable walking shoes, a light windbreaker jacket (mountain areas are 7-10°C cooler), sunglasses, and sunscreen. Modest clothing is recommended when entering historical churches and monasteries.',
        HY: 'Լեռնային ուղղությունների և Սևանի համար խորհուրդ ենք տալիս հարմարավետ մարզական կոշիկներ, քամուց պաշտպանող բաճկոն (սարերում 7-10 աստիճանով ավելի զով է), արևային ակնոց և քսուք: Վանքեր այցելելիս ցանկալի է կրել համեստ հագուստ:'
      },
      chips: {
        RU: ['Каталог туров', 'Позвать оператора'],
        ENG: ['Tour catalog', 'Live operator'],
        HY: ['Տուրերի կատալոգ', 'Կապ օպերատորի հետ']
      }
    }
  ];

  // Evaluate message for bot reply or operator handover
  function evaluateBotResponse(userInput) {
    const text = (userInput || '').trim().toLowerCase();
    const lang = detectMessageLanguage(userInput);

    // Operator handover triggers
    const operatorKeywords = [
      'оператор', 'человек', 'менеджер', 'позови', 'позовите', 'живой', 'специалист', 'сотрудник', 'консультант', 'связать',
      'operator', 'human', 'agent', 'manager', 'person', 'support', 'live agent', 'help me', 'talk to human',
      'օպերատոր', 'մարդ', 'մենեջեր', 'օգնություն', 'խորհրդատու'
    ];

    const wantsOperator = operatorKeywords.some(kw => text.includes(kw));
    if (wantsOperator) {
      return {
        action: 'handover',
        lang: lang,
        reason: lang === 'ENG' ? 'Visitor requested live agent' : lang === 'HY' ? 'Օգտատերը պահանջել է օպերատորի' : 'Запрос живого оператора'
      };
    }

    // Match knowledge base
    for (const item of TRILINGUAL_KNOWLEDGE) {
      const allKws = [...(item.keywords.RU || []), ...(item.keywords.ENG || []), ...(item.keywords.HY || [])];
      const matched = allKws.some(kw => text.includes(kw));
      if (matched) {
        return {
          action: 'reply',
          lang: lang,
          text: item.response[lang] || item.response.RU,
          chips: item.chips[lang] || item.chips.RU
        };
      }
    }

    // Unrecognized query -> handover to live operator
    return {
      action: 'handover',
      lang: lang,
      reason: lang === 'ENG' ? 'Custom travel inquiry' : lang === 'HY' ? 'Անհատական հարցում' : 'Вопрос требует консультации оператора'
    };
  }

  // =========================================================================
  // 5. PUBLIC API
  // =========================================================================
  window.AmarasLiveChat = {
    STORAGE_KEYS,
    sha256Hex,
    initStaffStorage,
    getStaffUsers,
    saveStaffUsers,
    getCurrentStaff,
    setCurrentStaff,
    getAllChats,
    saveAllChats,
    getOrCreateClientChat,
    evaluateBotResponse,
    getActiveLanguage,
    detectMessageLanguage,

    // Register a new operator (pending admin approval)
    async registerOperator({ name, login, phone, email, password }) {
      initStaffStorage();
      const users = getStaffUsers();
      const cleanLogin = (login || '').trim().toLowerCase();
      if (!cleanLogin) throw new Error('Логин обязателен');
      if (users.some(u => (u.login || '').toLowerCase() === cleanLogin)) {
        throw new Error('Пользователь с таким логином уже существует');
      }

      const passHash = await sha256Hex(password || '');
      const newOp = {
        id: 'op_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: (name || '').trim(),
        login: cleanLogin,
        phone: (phone || '').trim(),
        email: email ? email.trim() : '',
        role: 'operator',
        status: 'pending',
        workStatus: 'offline',
        handledChatsCount: 0,
        passwordHash: passHash,
        createdAt: Date.now()
      };

      users.push(newOp);
      saveStaffUsers(users);
      return newOp;
    },

    // Staff login
    async loginStaff(login, password) {
      initStaffStorage();
      const cleanLogin = (login || '').trim().toLowerCase();
      const passHash = await sha256Hex(password || '');

      if (cleanLogin === 'admin' || cleanLogin === 'admin@amaras.am') {
        if (passHash === ADMIN_HASH) {
          const adminSession = {
            id: 'staff_admin',
            name: 'Главный Администратор',
            login: 'admin',
            role: 'admin',
            status: 'approved',
            workStatus: 'online'
          };
          setCurrentStaff(adminSession);
          return { success: true, user: adminSession };
        } else {
          throw new Error('Неверный логин или пароль');
        }
      }

      const users = getStaffUsers();
      const op = users.find(u => (u.login || '').toLowerCase() === cleanLogin || ((u.email || '').toLowerCase() === cleanLogin));
      if (!op || op.passwordHash !== passHash) {
        throw new Error('Неверный логин или пароль');
      }

      if (op.status === 'pending') {
        throw new Error('Ваша учетная запись находится на проверке у администратора. Дождитесь одобрения заявки.');
      }

      if (op.status === 'rejected') {
        throw new Error('Ваша заявка на регистрацию была отклонена администратором.');
      }

      op.workStatus = 'online';
      saveStaffUsers(users);
      setCurrentStaff({
        id: op.id,
        name: op.name,
        login: op.login,
        phone: op.phone,
        email: op.email,
        role: 'operator',
        workStatus: 'online'
      });
      return { success: true, user: op };
    },

    logoutStaff() {
      const cur = getCurrentStaff();
      if (cur) {
        const users = getStaffUsers();
        const u = users.find(x => x.id === cur.id);
        if (u) {
          u.workStatus = 'offline';
          saveStaffUsers(users);
        }
      }
      setCurrentStaff(null);
    },

    approveOperator(operatorId) {
      const users = getStaffUsers();
      const op = users.find(u => u.id === operatorId);
      if (!op) return false;
      op.status = 'approved';
      op.approvedAt = Date.now();
      saveStaffUsers(users);
      return true;
    },

    rejectOperator(operatorId) {
      const users = getStaffUsers();
      const op = users.find(u => u.id === operatorId);
      if (!op) return false;
      op.status = 'rejected';
      op.rejectedAt = Date.now();
      saveStaffUsers(users);
      return true;
    },

    deleteOperator(operatorId) {
      let users = getStaffUsers();
      users = users.filter(u => u.id !== operatorId);
      saveStaffUsers(users);
      return true;
    },

    setOperatorWorkStatus(operatorId, status) {
      const users = getStaffUsers();
      const op = users.find(u => u.id === operatorId);
      if (!op) return false;
      op.workStatus = status;
      saveStaffUsers(users);
      const cur = getCurrentStaff();
      if (cur && cur.id === operatorId) {
        cur.workStatus = status;
        setCurrentStaff(cur);
      }
      return true;
    },

    // Send a message from website visitor
    sendVisitorMessage(text) {
      const chat = getOrCreateClientChat();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const lang = detectMessageLanguage(text);

      const newMsg = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        sender: 'visitor',
        senderName: chat.clientName || (lang === 'ENG' ? 'You' : lang === 'HY' ? 'Դուք' : 'Вы'),
        text: text,
        timestamp: Date.now(),
        timeStr: timeStr
      };

      const chats = getAllChats();
      const idx = chats.findIndex(c => c.id === chat.id);
      if (idx !== -1) {
        chats[idx].messages.push(newMsg);
        chats[idx].updatedAt = Date.now();
        chats[idx].unreadForOperator = (chats[idx].unreadForOperator || 0) + 1;

        if (chats[idx].status === 'bot') {
          const evalResult = evaluateBotResponse(text);

          if (evalResult.action === 'reply') {
            setTimeout(() => {
              const botMsg = {
                id: 'msg_bot_' + Date.now(),
                sender: 'bot',
                senderName: evalResult.lang === 'ENG' ? 'Amaras Bot' : evalResult.lang === 'HY' ? 'Amaras Բոտ' : 'Бот Amaras',
                text: evalResult.text,
                timestamp: Date.now(),
                timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                chips: evalResult.chips
              };
              const freshChats = getAllChats();
              const fIdx = freshChats.findIndex(c => c.id === chat.id);
              if (fIdx !== -1) {
                freshChats[fIdx].messages.push(botMsg);
                freshChats[fIdx].updatedAt = Date.now();
                saveAllChats(freshChats);
              }
            }, 550);
          } else if (evalResult.action === 'handover') {
            setTimeout(() => {
              this.requestOperatorHandover(chat.id, evalResult.reason, evalResult.lang);
            }, 450);
          }
        }

        saveAllChats(chats);
      }
      return newMsg;
    },

    // Handover to live operator via Tawk.to
    requestOperatorHandover(chatId, reason, lang) {
      const chats = getAllChats();
      const idx = chats.findIndex(c => c.id === chatId);
      if (idx === -1) return;

      const currentLang = lang || getActiveLanguage();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      chats[idx].status = 'waiting_operator';
      chats[idx].updatedAt = Date.now();

      let handoverText = 'Переключаю вас на дежурного оператора Amaras Tour в Tawk.to. Пожалуйста, оставайтесь на связи...';
      let chips = ['Открыть чат с оператором', 'Написать в WhatsApp'];

      if (currentLang === 'ENG') {
        handoverText = 'Connecting you to an Amaras Tour live agent on Tawk.to. Please stay on the line...';
        chips = ['Open Live Agent Chat', 'Message on WhatsApp'];
      } else if (currentLang === 'HY') {
        handoverText = 'Միացնում եմ Amaras Tour-ի հերթապահ օպերատորին Tawk.to-ում: Խնդրում ենք մնալ կապի մեջ...';
        chips = ['Բացել օպերատորի չատը', 'Գրել WhatsApp-ում'];
      }

      const sysMsg = {
        id: 'msg_handover_' + Date.now(),
        sender: 'system',
        senderName: 'Tawk.to Live Support',
        text: handoverText,
        timestamp: Date.now(),
        timeStr: timeStr,
        chips: chips
      };

      chats[idx].messages.push(sysMsg);
      saveAllChats(chats);

      // Open Tawk.to window automatically
      setTimeout(() => {
        if (typeof window.openTawkChat === 'function') {
          window.openTawkChat();
        }
      }, 350);
    },

    // Operator claims chat
    acceptChat(chatId, operatorUser) {
      const chats = getAllChats();
      const idx = chats.findIndex(c => c.id === chatId);
      if (idx === -1) return false;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      chats[idx].status = 'in_operator_chat';
      chats[idx].assignedOperator = {
        id: operatorUser.id,
        name: operatorUser.name,
        login: operatorUser.login
      };
      chats[idx].updatedAt = Date.now();

      const joinMsg = {
        id: 'msg_join_' + Date.now(),
        sender: 'system',
        senderName: 'Система',
        text: `Оператор ${operatorUser.name} подключился к диалогу. Здравствуйте! Чем я могу вам помочь?`,
        timestamp: Date.now(),
        timeStr: timeStr
      };

      chats[idx].messages.push(joinMsg);

      const staff = getStaffUsers();
      const op = staff.find(u => u.id === operatorUser.id);
      if (op) {
        op.handledChatsCount = (op.handledChatsCount || 0) + 1;
        saveStaffUsers(staff);
      }

      saveAllChats(chats);
      return true;
    },

    sendOperatorMessage(chatId, text, staffUser) {
      const chats = getAllChats();
      const idx = chats.findIndex(c => c.id === chatId);
      if (idx === -1) return false;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMsg = {
        id: 'msg_op_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        sender: 'operator',
        senderName: staffUser.name || 'Оператор',
        text: (text || '').trim(),
        timestamp: Date.now(),
        timeStr: timeStr
      };

      chats[idx].messages.push(newMsg);
      chats[idx].updatedAt = Date.now();
      chats[idx].unreadForVisitor = (chats[idx].unreadForVisitor || 0) + 1;
      saveAllChats(chats);
      return newMsg;
    },

    closeChat(chatId, closedByStaff) {
      const chats = getAllChats();
      const idx = chats.findIndex(c => c.id === chatId);
      if (idx === -1) return false;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      chats[idx].status = 'closed';
      chats[idx].updatedAt = Date.now();

      const closeMsg = {
        id: 'msg_close_' + Date.now(),
        sender: 'system',
        senderName: 'Система',
        text: `Диалог завершен сотрудником ${closedByStaff ? closedByStaff.name : ''}. Спасибо за обращение в Amaras Tour!`,
        timestamp: Date.now(),
        timeStr: timeStr
      };

      chats[idx].messages.push(closeMsg);
      saveAllChats(chats);
      return true;
    }
  };

  // =========================================================================
  // 6. DOM UI BINDING & REAL-TIME SYNC
  // =========================================================================
  function escapeHtml(str) {
    if (!str) return '';
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
  }

  function escapeJsStr(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  function renderClientMessages() {
    const scroll = document.getElementById('amarasChatScroll');
    if (!scroll) return;

    const chat = getOrCreateClientChat();
    if (!chat || !chat.messages) return;
    const lang = getActiveLanguage();

    const dateDividerText = lang === 'ENG' ? 'Today' : lang === 'HY' ? 'Այսօր' : 'Сегодня';
    let html = `<div class="amaras-chat-date-divider">${dateDividerText}</div>`;

    chat.messages.forEach(m => {
      let bubbleClass = 'is-agent';
      let senderLabel = m.senderName || (lang === 'ENG' ? 'Amaras Support' : lang === 'HY' ? 'Amaras Աջակցություն' : 'Служба заботы');

      if (m.sender === 'visitor') {
        bubbleClass = 'is-user';
        senderLabel = '';
      } else if (m.sender === 'operator') {
        bubbleClass = 'is-operator';
        senderLabel = (lang === 'ENG' ? 'Agent ' : lang === 'HY' ? 'Օպերատոր ' : 'Оператор ') + (m.senderName || 'Amaras');
      } else if (m.sender === 'system') {
        bubbleClass = 'is-system';
        senderLabel = '';
      }

      let chipsHtml = '';
      if (m.chips && m.chips.length > 0) {
        chipsHtml = `<div class="amaras-chat-chips">` +
          m.chips.map(ch => `<button type="button" class="amaras-chat-chip" onclick="window.handleVisitorQuickChip('${escapeJsStr(ch)}')">${escapeHtml(ch)}</button>`).join('') +
          `</div>`;
      }

      if (m.sender === 'system') {
        html += `
          <div class="amaras-chat-bubble is-system">
            <div>${escapeHtml(m.text)}</div>
            ${chipsHtml}
          </div>
        `;
      } else {
        html += `
          <div class="amaras-chat-bubble ${bubbleClass}">
            ${senderLabel ? `<div class="amaras-bubble-sender">${escapeHtml(senderLabel)}</div>` : ''}
            <div>${m.text}</div>
            ${chipsHtml}
            <div class="amaras-bubble-time">${m.timeStr || ''}</div>
          </div>
        `;
      }
    });

    scroll.innerHTML = html;
    scroll.scrollTop = scroll.scrollHeight;
  }

  function autoBindChatWidget() {
    const scroll = document.getElementById('amarasChatScroll');
    if (!scroll) return;

    window.sendQuickChatMessage = function (question) {
      if (typeof window.openSupportChatView === 'function') window.openSupportChatView('messages');
      window.AmarasLiveChat.sendVisitorMessage(question);
      renderClientMessages();
    };

    window.handleChatSubmit = function (e) {
      if (e && e.preventDefault) e.preventDefault();
      const input = document.getElementById('amarasChatInput');
      if (!input) return;
      const val = input.value.trim();
      if (!val) return;
      input.value = '';
      window.AmarasLiveChat.sendVisitorMessage(val);
      renderClientMessages();
    };

    window.handleVisitorQuickChip = function (text) {
      const chat = getOrCreateClientChat();
      const lower = (text || '').toLowerCase();

      if (lower.includes('оператор') || lower.includes('operator') || lower.includes('օպերատոր') || lower.includes('agent')) {
        window.AmarasLiveChat.requestOperatorHandover(chat.id, 'Запрос живого оператора');
      } else if (lower.includes('tawk')) {
        if (typeof window.openTawkChat === 'function') window.openTawkChat();
      } else if (lower.includes('whatsapp') || lower.includes('вацап')) {
        window.open('https://wa.me/37499250525', '_blank');
      } else if (lower.startsWith('позвонить') || lower.startsWith('call') || lower.startsWith('զանգ')) {
        window.location.href = 'tel:+37499250525';
      } else {
        window.AmarasLiveChat.sendVisitorMessage(text);
      }
      renderClientMessages();
    };

    window.renderClientChatMessages = renderClientMessages;

    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.CHATS) {
        renderClientMessages();
      }
    });

    window.addEventListener('amaras:chats_updated', () => {
      renderClientMessages();
    });

    renderClientMessages();
    setInterval(renderClientMessages, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoBindChatWidget);
  } else {
    autoBindChatWidget();
  }

  initStaffStorage();

})(window);
