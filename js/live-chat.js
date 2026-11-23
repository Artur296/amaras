/**
 * AMARAS LIVE CHAT & STAFF SYSTEM
 * Zero emojis - High-end editorial UI (#1C1A1A, #201F1F, #586EFF, #C7FF32)
 * Features:
 * 1. Intelligent Knowledge-base Bot with Amaras Tour domain answers
 * 2. Automatic handover to live human operators when requested or unrecognized
 * 3. Cross-tab real-time sync between website visitor and staff portal (/staff)
 * 4. Admin supervisor monitoring and operator registration approval flow
 */

(function (window) {
  'use strict';

  const STORAGE_KEYS = {
    STAFF_USERS: 'amaras_staff_users',
    CURRENT_STAFF: 'amaras_staff_current_user',
    CHATS: 'amaras_live_chats',
    CLIENT_CHAT_ID: 'amaras_client_chat_id'
  };

  const ADMIN_HASH = 'c4a764736627f9d3db338b054ccf216724e11ee05455eb3dc467b55413c3182a'; // amaras-big-secret2026$

  // SHA-256 Helper with fallback
  async function sha256Hex(text) {
    if (window.crypto && crypto.subtle) {
      try {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        // Fallback below
      }
    }
    // Simple deterministic hash for fallback if crypto.subtle is unavailable
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  // Initial staff seeding
  function initStaffStorage() {
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF_USERS)) || [];
    } catch (e) {
      users = [];
    }

    const adminExists = users.some(u => u.login.toLowerCase() === 'admin' || u.role === 'admin');
    if (!adminExists) {
      users.unshift({
        id: 'staff_admin',
        name: 'Главный Администратор',
        login: 'admin',
        email: 'admin@amaras.am',
        phone: '+374 99 250 525',
        role: 'admin',
        status: 'approved',
        workStatus: 'online',
        handledChatsCount: 0,
        passwordHash: ADMIN_HASH,
        createdAt: Date.now()
      });
      localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(users));
    }
  }

  // Get all staff users
  function getStaffUsers() {
    initStaffStorage();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF_USERS)) || [];
    } catch (e) {
      return [];
    }
  }

  // Save staff users
  function saveStaffUsers(users) {
    localStorage.setItem(STORAGE_KEYS.STAFF_USERS, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('amaras:staff_updated', { detail: { users } }));
  }

  // Current logged in staff
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

  // Check if any operator is currently online
  function hasOnlineOperators() {
    const users = getStaffUsers();
    return users.some(u => u.role === 'operator' && u.status === 'approved' && (u.workStatus === 'online' || u.workStatus === 'busy'));
  }

  // Get active online operators count
  function getOnlineOperatorsCount() {
    const users = getStaffUsers();
    return users.filter(u => u.role === 'operator' && u.status === 'approved' && (u.workStatus === 'online' || u.workStatus === 'busy')).length;
  }

  // Chat Data Storage
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

    let current = chats.find(c => c.id === chatId);
    if (!current) {
      chatId = 'chat_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      sessionStorage.setItem(STORAGE_KEYS.CLIENT_CHAT_ID, chatId);

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      current = {
        id: chatId,
        clientName: 'Гость #' + chatId.slice(-4).toUpperCase(),
        page: document.title ? document.title.split('|')[0].trim() : 'Главная',
        status: 'bot', // 'bot' | 'waiting_operator' | 'in_operator_chat' | 'closed'
        assignedOperator: null, // { id, name, login }
        createdAt: Date.now(),
        updatedAt: Date.now(),
        unreadForOperator: 0,
        unreadForVisitor: 0,
        messages: [
          {
            id: 'msg_init',
            sender: 'bot',
            senderName: 'Бот Amaras',
            text: 'Здравствуйте! Рады приветствовать вас в Amaras Tour. Чем я могу помочь вам в выборе тура, трансфера или организации отдыха в Армении?',
            timestamp: Date.now(),
            timeStr: timeStr,
            chips: [
              'Популярные туры',
              'Цены на трансферы',
              'Как забронировать',
              'Позвать оператора'
            ]
          }
        ]
      };
      chats.unshift(current);
      saveAllChats(chats);
    }
    return current;
  }

  // Knowledge Base Bot Answers
  const BOT_KNOWLEDGE = [
    {
      keywords: ['трансфер', 'аэропорт', 'звартноц', 'такси', 'машин', 'встреч', 'доехать'],
      response: 'Мы предоставляем комфортные трансферы из аэропорта Звартноц в Ереван (от 10 000 AMD) и по всей Армении (Севан, Дилижан, Цахкадзор, Джермук, Татев, Тбилиси). В автопарке комфортные седаны, минивэны Mercedes V-Class (до 7 мест), микроавтобусы Sprinter (до 20 мест) и представительский Maybach. Водитель встретит вас с табличкой в зале прилета.',
      chips: ['Тарифы на трансферы', 'Заказать трансфер', 'Позвать оператора']
    },
    {
      keywords: ['джип', 'аждаак', 'арагац', 'ущелье ангелов', 'вулкан', 'горы', '4x4'],
      response: 'Наши авторские джип-туры проходят на подготовленных внедорожниках Toyota Land Cruiser и Sequoia с опытными гидами-водителями. Популярные направления: Восхождение на вулкан Аждаак к кратерному озеру, Экспедиция на гору Арагац и Марсианские каньоны Ущелья Ангелов. В стоимость входят трансфер, экипировка и сопровождение.',
      chips: ['Подробнее о джип-турах', 'Позвать оператора']
    },
    {
      keywords: ['гастро', 'вино', 'арени', 'сыр', 'лаваш', 'севанский ишхан', 'еда', 'дегустац'],
      response: 'В гастрономических турах Amaras вас ждут мастер-классы по выпечке традиционного лаваша в тонире, дегустации вин в старейших винодельнях Арени и свежий севанский ишхан с раковыми шейками на берегу озера. В стоимость включены все дегустации и сытный обед.',
      chips: ['Гастрономические туры', 'Позвать оператора']
    },
    {
      keywords: ['гарни', 'гегард', 'хор вирап', 'татев', 'дилижан', 'севан', 'экскурси', 'группов', 'мини'],
      response: 'Ежедневные регулярные экскурсии по главным святыням и красотам Армении: Гарни и скальный монастырь Гегард, Симфония камней, Хор Вирап с панорамой на Арарат, Озеро Севан и Монастырь Татев с канатной дорогой Крылья Татева. Выезд из центра Еревана в комфортных мини-группах.',
      chips: ['Посмотреть каталог туров', 'Позвать оператора']
    },
    {
      keywords: ['цен', 'стоимост', 'прайс', 'тариф', 'скидк', 'сколько стоит'],
      response: 'Стоимость групповых мини-туров начинается от 22 000 AMD за человека. Авторские джип-туры — от 65 000 AMD. Трансферы из аэропорта — от 10 000 AMD. При бронировании от 2-х туров действуют специальные сезонные скидки.',
      chips: ['Каталог туров', 'Позвать оператора']
    },
    {
      keywords: ['брон', 'заказ', 'оплат', 'картой', 'наличн', 'предоплат', 'отмен'],
      response: 'Забронировать тур или трансфер можно прямо на сайте, добавив маршрут в корзину, или через наших менеджеров. Оплата возможна картами онлайн, банковским переводом или наличными водителю. Бесплатная отмена бронирования действует за 24 часа до начала поездки.',
      chips: ['Как забронировать', 'Позвать оператора']
    },
    {
      keywords: ['контакт', 'телефон', 'номер', 'whatsapp', 'вацап', 'ватсап', 'адрес', 'офис', 'где вы'],
      response: 'Служба заботы Amaras Tour на связи ежедневно с 08:00 до 23:00. Телефон горячей линии: +374 99 250 525. Наш WhatsApp: +374 99 250 525. Telegram: @amarastour. Офис расположен в центре Еревана.',
      chips: ['Написать в WhatsApp', 'Позвать оператора']
    },
    {
      keywords: ['что взять', 'одежд', 'погод', 'обувь', 'взять с собой'],
      response: 'Для поездок в горы и к озеру Севан рекомендуем удобную трекинговую или спортивную обувь, ветрозащитную куртку (в горах прохладнее на 7-10 градусов), солнцезащитные очки и крем. При посещении монастырей рекомендуется закрытая одежда.',
      chips: ['Выбрать тур', 'Позвать оператора']
    }
  ];

  // Evaluate message for bot reply or operator handover
  function evaluateBotResponse(userInput) {
    const text = userInput.trim().toLowerCase();

    // Check explicit operator requests
    const operatorKeywords = ['оператор', 'человек', 'менеджер', 'позови', 'позовите', 'живой', 'специалист', 'сотрудник', 'help', 'human', 'консультант', 'связать'];
    const wantsOperator = operatorKeywords.some(kw => text.includes(kw));

    if (wantsOperator) {
      return {
        action: 'handover',
        reason: 'Запрос живого оператора'
      };
    }

    // Match knowledge base
    for (const item of BOT_KNOWLEDGE) {
      const matched = item.keywords.some(kw => text.includes(kw));
      if (matched) {
        return {
          action: 'reply',
          text: item.response,
          chips: item.chips
        };
      }
    }

    // Not recognized -> handover to operator
    return {
      action: 'handover',
      reason: 'Вопрос требует персональной консультации оператора'
    };
  }

  // Public API object attached to window
  window.AmarasLiveChat = {
    STORAGE_KEYS,
    sha256Hex,
    initStaffStorage,
    getStaffUsers,
    saveStaffUsers,
    getCurrentStaff,
    setCurrentStaff,
    hasOnlineOperators,
    getOnlineOperatorsCount,
    getAllChats,
    saveAllChats,
    getOrCreateClientChat,
    evaluateBotResponse,

    // Register a new operator (pending admin approval)
    async registerOperator({ name, login, phone, email, password }) {
      initStaffStorage();
      const users = getStaffUsers();

      const cleanLogin = login.trim().toLowerCase();
      if (!cleanLogin) throw new Error('Логин обязателен');
      if (users.some(u => u.login.toLowerCase() === cleanLogin)) {
        throw new Error('Пользователь с таким логином уже существует');
      }

      const passHash = await sha256Hex(password);
      const newOp = {
        id: 'op_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: name.trim(),
        login: cleanLogin,
        phone: phone.trim(),
        email: email ? email.trim() : '',
        role: 'operator',
        status: 'pending', // Pending approval by Admin
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
      const users = getStaffUsers();
      const cleanLogin = login.trim().toLowerCase();
      const passHash = await sha256Hex(password);

      // Check admin
      if (cleanLogin === 'admin' || cleanLogin === 'admin@amaras.am') {
        if (passHash === ADMIN_HASH || password === 'amaras-big-secret2026$') {
          let admin = users.find(u => u.login.toLowerCase() === 'admin');
          if (!admin) {
            admin = {
              id: 'staff_admin',
              name: 'Главный Администратор',
              login: 'admin',
              role: 'admin',
              status: 'approved',
              workStatus: 'online',
              createdAt: Date.now()
            };
          }
          admin.workStatus = 'online';
          saveStaffUsers(users);
          setCurrentStaff(admin);
          return { success: true, user: admin };
        } else {
          throw new Error('Неверный пароль администратора');
        }
      }

      // Check operator
      const op = users.find(u => u.login.toLowerCase() === cleanLogin || (u.email && u.email.toLowerCase() === cleanLogin));
      if (!op) {
        throw new Error('Пользователь с таким логином не найден');
      }

      if (op.passwordHash !== passHash) {
        throw new Error('Неверный пароль');
      }

      if (op.status === 'pending') {
        throw new Error('Ваша учетная запись находится на проверке у администратора. Дождитесь одобрения заявки.');
      }

      if (op.status === 'rejected') {
        throw new Error('Ваша заявка на регистрацию была отклонена администратором.');
      }

      op.workStatus = 'online';
      saveStaffUsers(users);
      setCurrentStaff(op);
      return { success: true, user: op };
    },

    // Staff logout
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

    // Admin approves operator
    approveOperator(operatorId) {
      const users = getStaffUsers();
      const op = users.find(u => u.id === operatorId);
      if (!op) return false;
      op.status = 'approved';
      op.approvedAt = Date.now();
      saveStaffUsers(users);
      return true;
    },

    // Admin rejects operator
    rejectOperator(operatorId) {
      const users = getStaffUsers();
      const op = users.find(u => u.id === operatorId);
      if (!op) return false;
      op.status = 'rejected';
      op.rejectedAt = Date.now();
      saveStaffUsers(users);
      return true;
    },

    // Admin deletes operator
    deleteOperator(operatorId) {
      let users = getStaffUsers();
      users = users.filter(u => u.id !== operatorId);
      saveStaffUsers(users);
      return true;
    },

    // Operator updates work status (online / busy / offline)
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

      const newMsg = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        sender: 'visitor',
        senderName: chat.clientName || 'Посетитель',
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

        // If currently talking to bot, evaluate bot answer or handover
        if (chats[idx].status === 'bot') {
          const evalResult = evaluateBotResponse(text);

          if (evalResult.action === 'reply') {
            setTimeout(() => {
              const botMsg = {
                id: 'msg_bot_' + Date.now(),
                sender: 'bot',
                senderName: 'Бот Amaras',
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
            }, 600);
          } else if (evalResult.action === 'handover') {
            // Handover to operator
            setTimeout(() => {
              this.requestOperatorHandover(chat.id, evalResult.reason);
            }, 500);
          }
        }

        saveAllChats(chats);
      }
      return newMsg;
    },

    // Request handover to live operator
    requestOperatorHandover(chatId, reason) {
      const chats = getAllChats();
      const idx = chats.findIndex(c => c.id === chatId);
      if (idx === -1) return;

      const onlineCount = getOnlineOperatorsCount();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      chats[idx].status = 'waiting_operator';
      chats[idx].updatedAt = Date.now();

      let handoverText = '';
      if (onlineCount > 0) {
        handoverText = 'Подключаю свободного оператора Amaras Tour. Пожалуйста, оставайтесь на связи, менеджер ответит в течение 1-2 минут...';
      } else {
        handoverText = 'Все наши операторы сейчас на выезде или не на смене. Напишите нам напрямую в WhatsApp: +374 99 250 525 или оставьте контактный номер, дежурный специалист свяжется с вами в течение 10 минут.';
      }

      const sysMsg = {
        id: 'msg_handover_' + Date.now(),
        sender: 'system',
        senderName: 'Система',
        text: handoverText,
        timestamp: Date.now(),
        timeStr: timeStr,
        chips: onlineCount === 0 ? ['Написать в WhatsApp', 'Позвонить +374 99 250 525'] : []
      };

      chats[idx].messages.push(sysMsg);
      saveAllChats(chats);
    },

    // Operator claims/accepts a waiting chat
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

      // Increment operator handled count
      const staff = getStaffUsers();
      const op = staff.find(u => u.id === operatorUser.id);
      if (op) {
        op.handledChatsCount = (op.handledChatsCount || 0) + 1;
        saveStaffUsers(staff);
      }

      saveAllChats(chats);
      return true;
    },

    // Operator or Admin sends a reply message
    sendOperatorMessage(chatId, text, staffUser) {
      const chats = getAllChats();
      const idx = chats.findIndex(c => c.id === chatId);
      if (idx === -1) return false;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMsg = {
        id: 'msg_op_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        sender: 'operator',
        senderName: staffUser.name || 'Оператор',
        text: text.trim(),
        timestamp: Date.now(),
        timeStr: timeStr
      };

      chats[idx].messages.push(newMsg);
      chats[idx].updatedAt = Date.now();
      chats[idx].unreadForVisitor = (chats[idx].unreadForVisitor || 0) + 1;
      saveAllChats(chats);
      return newMsg;
    },

    // Close / resolve chat
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
    },

    renderClientMessages
  };

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

    let html = '<div class="amaras-chat-date-divider" data-i18n="chat_date_today">Сегодня</div>';

    chat.messages.forEach(m => {
      let bubbleClass = 'is-agent';
      let senderLabel = m.senderName || 'Служба заботы';
      if (m.sender === 'visitor') {
        bubbleClass = 'is-user';
        senderLabel = '';
      } else if (m.sender === 'operator') {
        bubbleClass = 'is-operator';
        senderLabel = 'Оператор ' + (m.senderName || 'Amaras');
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
            <div class="amaras-bubble-time">${m.timeStr || ''} ${m.sender === 'visitor' ? '✓✓' : ''}</div>
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

    window.sendQuickChatMessage = function(question) {
      if (typeof window.openSupportChatView === 'function') window.openSupportChatView('messages');
      window.AmarasLiveChat.sendVisitorMessage(question);
      renderClientMessages();
    };

    window.handleChatSubmit = function(e) {
      if (e && e.preventDefault) e.preventDefault();
      const input = document.getElementById('amarasChatInput');
      if (!input) return;
      const val = input.value.trim();
      if (!val) return;
      input.value = '';
      window.AmarasLiveChat.sendVisitorMessage(val);
      renderClientMessages();
    };

    window.handleVisitorQuickChip = function(text) {
      const chat = getOrCreateClientChat();
      if (text === 'Позвать оператора') {
        window.AmarasLiveChat.requestOperatorHandover(chat.id, 'Запрос живого оператора');
      } else if (text === 'Написать в WhatsApp') {
        window.open('https://wa.me/37499250525', '_blank');
        return;
      } else if (text && text.indexOf('Позвонить') === 0) {
        window.location.href = 'tel:+37499250525';
        return;
      } else {
        window.AmarasLiveChat.sendVisitorMessage(text);
      }
      renderClientMessages();
    };

    window.renderClientChatMessages = renderClientMessages;

    // Listen for storage changes
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

  // Seed storage immediately
  initStaffStorage();

})(window);
