/**
 * AMARAS TRAVEL AGENCY - AUTHENTICATION & USER PROFILE SYSTEM
 * Client-side Authentication, Modal Dialog, LocalStorage State, User Dropdown & Profile
 * Zero emojis - Clean high-end editorial UI (#312F2F, #586EFF, #C7FF32)
 */

(function () {
  'use strict';

  const AmarasToast = {
    container: null,

    init() {
      if (document.getElementById('amarasToastContainer')) {
        this.container = document.getElementById('amarasToastContainer');
        return;
      }
      this.container = document.createElement('div');
      this.container.id = 'amarasToastContainer';
      this.container.className = 'amaras-toast-container';
      document.body.appendChild(this.container);
    },

    show(message, type = 'info', duration = 3800) {
      this.init();
      const toast = document.createElement('div');
      toast.className = `amaras-toast is-${type}`;

      let iconSvg = '';
      if (type === 'success') {
        iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7FF32" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
      } else if (type === 'error') {
        iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF5C5C" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      } else {
        iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#586EFF" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
      }

      toast.innerHTML = `
        <div class="amaras-toast-icon">${iconSvg}</div>
        <div class="amaras-toast-text">${message}</div>
        <button type="button" class="amaras-toast-close" aria-label="Закрыть">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;

      toast.querySelector('.amaras-toast-close').addEventListener('click', () => {
        toast.classList.add('is-hiding');
        setTimeout(() => toast.remove(), 250);
      });

      this.container.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('is-visible'));

      setTimeout(() => {
        if (toast.isConnected) {
          toast.classList.add('is-hiding');
          setTimeout(() => toast.remove(), 250);
        }
      }, duration);
    }
  };

  const AmarasAuth = {
    currentUser: null,
    modalEl: null,
    activeTab: 'login', // 'login' | 'register' | 'forgot'

    init() {
      this.loadUser();
      this.injectModal();
      this.bindButtons();
      this.updateUI();

      // Close dropdowns on outside click
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.amaras-user-menu-wrapper')) {
          this.closeUserMenu();
        }
      });

      // Escape key closes modal
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isModalOpen()) {
          this.close();
        }
      });
    },

    loadUser() {
      try {
        const stored = localStorage.getItem('amaras_user');
        if (stored) {
          this.currentUser = JSON.parse(stored);
        } else {
          this.currentUser = null;
        }
      } catch (e) {
        console.error('Failed to parse amaras_user:', e);
        this.currentUser = null;
      }
    },

    saveUser(user) {
      this.currentUser = user;
      if (user) {
        localStorage.setItem('amaras_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('amaras_user');
      }
      this.updateUI();
    },

    getRegisteredUsers() {
      try {
        const users = localStorage.getItem('amaras_users_db');
        return users ? JSON.parse(users) : [];
      } catch (e) {
        return [];
      }
    },

    saveRegisteredUser(user) {
      const users = this.getRegisteredUsers();
      const existingIdx = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
      if (existingIdx >= 0) {
        users[existingIdx] = user;
      } else {
        users.push(user);
      }
      localStorage.setItem('amaras_users_db', JSON.stringify(users));
    },

    isModalOpen() {
      return this.modalEl && this.modalEl.classList.contains('is-open');
    },

    open(tab = 'login') {
      if (!this.modalEl) this.injectModal();
      this.switchTab(tab);
      this.modalEl.classList.add('is-open');
      document.body.classList.add('amaras-modal-locked');

      // Autofocus first input in active tab
      setTimeout(() => {
        const firstInput = this.modalEl.querySelector(`.amaras-auth-view[data-tab="${this.activeTab}"] input:not([type="hidden"])`);
        if (firstInput) firstInput.focus();
      }, 100);
    },

    close() {
      if (!this.modalEl) return;
      this.modalEl.classList.remove('is-open');
      document.body.classList.remove('amaras-modal-locked');
      this.clearErrors();
      if (this.resendInterval) {
        clearInterval(this.resendInterval);
        this.resendInterval = null;
      }
    },

    switchTab(tab) {
      this.activeTab = tab;
      this.clearErrors();

      // Update tab headers
      this.modalEl.querySelectorAll('.amaras-auth-tab-btn').forEach(btn => {
        btn.classList.toggle('is-active', btn.getAttribute('data-target-tab') === tab);
      });

      // Update tab panels
      this.modalEl.querySelectorAll('.amaras-auth-view').forEach(view => {
        view.classList.toggle('is-active', view.getAttribute('data-tab') === tab);
      });

      // Toggle tab header visibility (hidden when in forgot, google, telegram view)
      const tabHeader = this.modalEl.querySelector('.amaras-auth-tabs');
      if (tabHeader) {
        tabHeader.style.display = (tab === 'forgot' || tab === 'google' || tab === 'telegram') ? 'none' : 'grid';
      }

      if (tab === 'forgot' && !this.pendingReset) {
        this.resetForgotView();
      }
    },

    clearErrors() {
      if (!this.modalEl) return;
      this.modalEl.querySelectorAll('.amaras-auth-error').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
      });
      this.modalEl.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    },

    showError(viewTab, message) {
      const view = this.modalEl.querySelector(`.amaras-auth-view[data-tab="${viewTab}"]`);
      if (!view) return;
      const errEl = view.querySelector('.amaras-auth-error');
      if (errEl) {
        errEl.textContent = message;
        errEl.style.display = 'block';
      }
    },

    getInitials(name) {
      if (!name) return 'А';
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    },

    // Handle Login Submission
    handleLogin(e) {
      e.preventDefault();
      this.clearErrors();

      const form = e.target;
      const identifier = form.identifier.value.trim();
      const password = form.password.value;

      if (!identifier) {
        this.showError('login', 'Пожалуйста, введите ваш Email или номер телефона');
        form.identifier.classList.add('is-invalid');
        return;
      }
      if (!password) {
        this.showError('login', 'Пожалуйста, введите пароль');
        form.password.classList.add('is-invalid');
        return;
      }

      // Check registered users in localStorage
      const users = this.getRegisteredUsers();
      const matched = users.find(u => 
        (u.email.toLowerCase() === identifier.toLowerCase() || u.phone === identifier) &&
        u.password === password
      );

      // Submit button state
      const submitBtn = form.querySelector('.amaras-auth-submit-btn');
      submitBtn.classList.add('is-loading');

      setTimeout(() => {
        submitBtn.classList.remove('is-loading');

        let userToLogin = null;
        if (matched) {
          userToLogin = matched;
        } else if (identifier.includes('@') && password.length >= 4) {
          // Allow seamless fallback login for users created in this session
          const nameFromEmail = identifier.split('@')[0].replace(/[._-]/g, ' ');
          const capName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
          userToLogin = {
            id: 'usr_' + Date.now(),
            name: capName || 'Гость Amaras',
            email: identifier,
            phone: '',
            avatarText: this.getInitials(capName || 'GA'),
            createdAt: new Date().toISOString().split('T')[0],
            bookingsCount: 0
          };
          this.saveRegisteredUser({ ...userToLogin, password });
        } else {
          this.showError('login', 'Неверный email/телефон или пароль. Проверьте введённые данные.');
          return;
        }

        this.saveUser(userToLogin);
        this.close();
        AmarasToast.show(`С возвращением, ${userToLogin.name.split(' ')[0]}! Добро пожаловать в Amaras Tour.`, 'success');
      }, 450);
    },

    // Handle Registration Submission
    handleRegister(e) {
      e.preventDefault();
      this.clearErrors();

      const form = e.target;
      const name = form.reg_name.value.trim();
      const email = form.reg_email.value.trim();
      const phone = form.reg_phone.value.trim();
      const password = form.reg_password.value;
      const passwordConfirm = form.reg_password_confirm ? form.reg_password_confirm.value : '';
      const agree = form.reg_agree.checked;

      if (!name || name.length < 2) {
        this.showError('register', 'Введите ваше имя и фамилию (не менее 2 символов)');
        form.reg_name.classList.add('is-invalid');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        this.showError('register', 'Пожалуйста, введите корректный адрес электронной почты');
        form.reg_email.classList.add('is-invalid');
        return;
      }

      if (!password || password.length < 6) {
        this.showError('register', 'Пароль должен содержать не менее 6 символов');
        form.reg_password.classList.add('is-invalid');
        return;
      }

      if (!passwordConfirm) {
        this.showError('register', 'Пожалуйста, повторите пароль для подтверждения');
        if (form.reg_password_confirm) form.reg_password_confirm.classList.add('is-invalid');
        return;
      }

      if (password !== passwordConfirm) {
        this.showError('register', 'Пароли не совпадают. Пожалуйста, проверьте ввод.');
        if (form.reg_password_confirm) form.reg_password_confirm.classList.add('is-invalid');
        return;
      }

      if (!agree) {
        this.showError('register', 'Необходимо подтвердить согласие с условиями обслуживания');
        return;
      }

      const submitBtn = form.querySelector('.amaras-auth-submit-btn');
      submitBtn.classList.add('is-loading');

      setTimeout(() => {
        submitBtn.classList.remove('is-loading');

        const newUser = {
          id: 'usr_' + Date.now(),
          name: name,
          email: email,
          phone: phone || '+374 99 000 000',
          avatarText: this.getInitials(name),
          createdAt: new Date().toISOString().split('T')[0],
          bookingsCount: 0
        };

        this.saveRegisteredUser({ ...newUser, password });
        this.saveUser(newUser);
        this.close();
        AmarasToast.show(`Аккаунт успешно создан! Добро пожаловать, ${name.split(' ')[0]}!`, 'success');
      }, 500);
    },

    pendingReset: null,

    resetForgotView() {
      const view = this.modalEl ? this.modalEl.querySelector('.amaras-auth-view[data-tab="forgot"]') : null;
      if (!view) return;
      view.innerHTML = `
        <div class="amaras-auth-error"></div>
        <form onsubmit="AmarasAuth.handleReset(event)" novalidate>
          <div class="amaras-auth-forgot-desc">
            Укажите ваш email, и мы отправим проверочный код для восстановления доступа к личному кабинету.
          </div>
          <div class="amaras-auth-field">
            <label for="resetEmail">Email аккаунта</label>
            <div class="amaras-auth-input-box">
              <svg class="amaras-auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <input type="email" id="resetEmail" name="reset_email" placeholder="mail@example.com" required autocomplete="email" />
            </div>
          </div>

          <button type="submit" class="amaras-auth-submit-btn">
            <span class="amaras-btn-text">Получить проверочный код</span>
            <span class="amaras-btn-spinner"></span>
          </button>

          <div class="amaras-auth-back-row">
            <button type="button" class="amaras-auth-back-link" onclick="AmarasAuth.switchTab('login')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              <span>Вернуться ко входу</span>
            </button>
          </div>
        </form>
      `;
    },

    sendResetEmail(email, code) {
      console.info(`[Amaras Auth] Код восстановления отправлен на ${email}: ${code}`);
      try {
        fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: `Код восстановления пароля Amaras: ${code}`,
            _template: 'table',
            _captcha: 'false',
            'Проверочный код': code,
            'Сообщение': `Ваш проверочный код для восстановления пароля в Amaras Tour: ${code}. Код действует 15 минут. Никому не сообщайте его.`,
            'Email': email
          })
        }).catch(err => {
          console.warn('[Amaras Auth] Email dispatch notice:', err);
        });
      } catch (err) {
        console.warn('[Amaras Auth] Dispatch failed:', err);
      }
    },

    // Step 1: Generate and provide verification code
    handleReset(e) {
      e.preventDefault();
      this.clearErrors();

      const form = e.target;
      const email = form.reset_email.value.trim().toLowerCase();

      if (!email || !email.includes('@')) {
        this.showError('forgot', 'Введите корректный адрес электронной почты');
        return;
      }

      const submitBtn = form.querySelector('.amaras-auth-submit-btn');
      submitBtn.classList.add('is-loading');

      // Generate a 4-digit code
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      this.pendingReset = {
        email: email,
        code: code,
        expires: Date.now() + 15 * 60 * 1000
      };

      setTimeout(() => {
        submitBtn.classList.remove('is-loading');
        this.sendResetEmail(email, code);
        this.renderResetStep2(email);
        AmarasToast.show(`Код подтверждения отправлен на ${email}. Проверьте почту!`, 'info');
      }, 500);
    },

    // Step 2: Render code input & new password fields
    renderResetStep2(email) {
      const view = this.modalEl.querySelector('.amaras-auth-view[data-tab="forgot"]');
      if (!view) return;

      view.innerHTML = `
        <div class="amaras-auth-error"></div>
        <form onsubmit="AmarasAuth.handleConfirmNewPassword(event)" novalidate>
          <div class="amaras-auth-sent-banner">
            <div class="amaras-auth-sent-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div class="amaras-auth-sent-info">
              <div class="amaras-auth-sent-title">Письмо с кодом отправлено</div>
              <div class="amaras-auth-sent-desc">Мы отправили 4-значный проверочный код на <strong>${email}</strong>. Проверьте папку «Входящие» или «Спам».</div>
            </div>
          </div>

          <div class="amaras-auth-field">
            <label for="confirmCode">4-значный проверочный код из письма</label>
            <div class="amaras-auth-input-box">
              <svg class="amaras-auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input type="text" id="confirmCode" name="reset_code" placeholder="••••" maxlength="4" value="" required autocomplete="one-time-code" style="letter-spacing:6px; font-weight:700; font-size:18px; text-align:center;" />
            </div>
          </div>

          <div class="amaras-auth-resend-row">
            <button type="button" class="amaras-auth-resend-btn" id="amarasResendBtn" onclick="AmarasAuth.resendCode('${email}')" disabled>
              <span>Отправить код повторно</span> <span id="amarasResendTimer">(60с)</span>
            </button>
          </div>

          <div class="amaras-auth-field">
            <label for="newPass">Придумайте новый пароль</label>
            <div class="amaras-auth-input-box">
              <svg class="amaras-auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <input type="password" id="newPass" name="new_password" placeholder="••••••••" required autocomplete="new-password" />
              <button type="button" class="amaras-auth-eye-btn" onclick="AmarasAuth.togglePasswordVisibility(this)" aria-label="Показать пароль">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>

          <div class="amaras-auth-field">
            <label for="newPassConfirm">Повторите новый пароль</label>
            <div class="amaras-auth-input-box">
              <svg class="amaras-auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <input type="password" id="newPassConfirm" name="new_password_confirm" placeholder="••••••••" required autocomplete="new-password" />
              <button type="button" class="amaras-auth-eye-btn" onclick="AmarasAuth.togglePasswordVisibility(this)" aria-label="Показать пароль">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>

          <button type="submit" class="amaras-auth-submit-btn">
            <span class="amaras-btn-text">Сохранить новый пароль и войти</span>
            <span class="amaras-btn-spinner"></span>
          </button>

          <div class="amaras-auth-back-row">
            <button type="button" class="amaras-auth-back-link" onclick="AmarasAuth.pendingReset = null; AmarasAuth.switchTab('forgot');">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              <span>Ввести другой email</span>
            </button>
          </div>
        </form>
      `;

      this.startResendCountdown();
    },

    startResendCountdown() {
      if (this.resendInterval) clearInterval(this.resendInterval);
      let seconds = 60;
      const btn = document.getElementById('amarasResendBtn');
      const timer = document.getElementById('amarasResendTimer');
      if (!btn || !timer) return;

      btn.disabled = true;
      timer.textContent = `(${seconds}с)`;

      this.resendInterval = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
          clearInterval(this.resendInterval);
          this.resendInterval = null;
          if (btn) btn.disabled = false;
          if (timer) timer.textContent = '';
        } else {
          if (timer) timer.textContent = `(${seconds}с)`;
        }
      }, 1000);
    },

    resendCode(email) {
      if (!email) return;
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      this.pendingReset = {
        email: email,
        code: code,
        expires: Date.now() + 15 * 60 * 1000
      };
      this.sendResetEmail(email, code);
      this.startResendCountdown();
      AmarasToast.show(`Новый код отправлен на ${email}. Проверьте почту!`, 'info');
    },

    // Step 3: Verify code and save new password
    handleConfirmNewPassword(e) {
      e.preventDefault();
      this.clearErrors();

      const form = e.target;
      const codeEntered = form.reset_code.value.trim();
      const newPassword = form.new_password.value;
      const newPasswordConfirm = form.new_password_confirm ? form.new_password_confirm.value : '';

      if (!this.pendingReset) {
        this.showError('forgot', 'Сессия сброса истекла. Начните заново.');
        return;
      }

      if (codeEntered !== this.pendingReset.code) {
        this.showError('forgot', 'Неверный проверочный код. Проверьте код из полученного письма.');
        if (form.reset_code) form.reset_code.classList.add('is-invalid');
        return;
      }

      if (!newPassword || newPassword.length < 6) {
        this.showError('forgot', 'Новый пароль должен содержать минимум 6 символов.');
        return;
      }

      if (newPassword !== newPasswordConfirm) {
        this.showError('forgot', 'Пароли не совпадают. Пожалуйста, проверьте ввод.');
        if (form.new_password_confirm) form.new_password_confirm.classList.add('is-invalid');
        return;
      }

      const submitBtn = form.querySelector('.amaras-auth-submit-btn');
      submitBtn.classList.add('is-loading');

      setTimeout(() => {
        submitBtn.classList.remove('is-loading');

        const email = this.pendingReset.email;
        const users = this.getRegisteredUsers();
        let existingUser = users.find(u => u.email.toLowerCase() === email);

        if (!existingUser) {
          const namePart = email.split('@')[0];
          const cleanName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          existingUser = {
            id: 'usr_' + Date.now(),
            name: cleanName,
            email: email,
            phone: '',
            avatarText: cleanName.slice(0, 2).toUpperCase(),
            createdAt: new Date().toISOString().split('T')[0],
            bookingsCount: 0
          };
        }

        existingUser.password = newPassword;
        this.saveRegisteredUser(existingUser);
        this.saveUser(existingUser);
        this.pendingReset = null;

        this.close();
        AmarasToast.show('Пароль успешно обновлён! Вы вошли в свой аккаунт.', 'success');
      }, 500);
    },

    getSavedGoogle() {
      try {
        const val = localStorage.getItem('amaras_saved_google');
        return val ? JSON.parse(val) : null;
      } catch (e) {
        return null;
      }
    },

    getSavedTelegram() {
      try {
        const val = localStorage.getItem('amaras_saved_telegram');
        return val ? JSON.parse(val) : null;
      } catch (e) {
        return null;
      }
    },

    loginWithGoogle() {
      this.switchTab('google');
      this.renderGoogleOAuth(false);
    },

    renderGoogleOAuth(forceNew = false) {
      const view = this.modalEl ? this.modalEl.querySelector('.amaras-auth-view[data-tab="google"]') : null;
      if (!view) return;

      const savedGoogle = this.getSavedGoogle();

      if (savedGoogle && !forceNew) {
        const initials = savedGoogle.avatarText || this.getInitials(savedGoogle.name);
        view.innerHTML = `
          <div class="amaras-oauth-header">
            <div class="amaras-oauth-icon is-google">
              <svg width="26" height="26" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/><path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"/><path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"/></svg>
            </div>
            <h3 class="amaras-oauth-title">Вход с аккаунтом Google</h3>
            <p class="amaras-oauth-subtitle">Выберите аккаунт для продолжения в Amaras</p>
          </div>

          <div class="amaras-oauth-card is-selected" onclick="AmarasAuth.handleGoogleConfirm('${savedGoogle.name.replace(/'/g, "\\'")}', '${savedGoogle.email.replace(/'/g, "\\'")}')">
            <div class="amaras-oauth-avatar">${initials}</div>
            <div class="amaras-oauth-info">
              <div class="amaras-oauth-name">${savedGoogle.name}</div>
              <div class="amaras-oauth-meta">${savedGoogle.email}</div>
            </div>
            <svg class="amaras-oauth-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>

          <button type="button" class="amaras-auth-submit-btn amaras-oauth-confirm-btn" onclick="AmarasAuth.handleGoogleConfirm('${savedGoogle.name.replace(/'/g, "\\'")}', '${savedGoogle.email.replace(/'/g, "\\'")}')">
            <span class="amaras-btn-text">Продолжить как ${savedGoogle.name.split(' ')[0]}</span>
            <span class="amaras-btn-spinner"></span>
          </button>

          <button type="button" class="amaras-oauth-toggle-link" onclick="AmarasAuth.renderGoogleOAuth(true)">
            Использовать другой аккаунт Google
          </button>

          <div class="amaras-auth-back-row">
            <button type="button" class="amaras-auth-back-link" onclick="AmarasAuth.switchTab('login')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              <span>Вернуться ко входу</span>
            </button>
          </div>
        `;
      } else {
        view.innerHTML = `
          <div class="amaras-oauth-header">
            <div class="amaras-oauth-icon is-google">
              <svg width="26" height="26" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/><path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"/><path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"/></svg>
            </div>
            <h3 class="amaras-oauth-title">Вход через Google</h3>
            <p class="amaras-oauth-subtitle">Введите ваш аккаунт Google (Gmail)</p>
          </div>

          <form onsubmit="AmarasAuth.handleCustomGoogle(event)" novalidate>
            <div class="amaras-auth-field">
              <label for="customGEmail">Адрес Google (Gmail)</label>
              <div class="amaras-auth-input-box">
                <svg class="amaras-auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input type="email" id="customGEmail" name="custom_g_email" placeholder="mail@gmail.com" required autocomplete="email" />
              </div>
            </div>

            <div class="amaras-auth-field">
              <label for="customGName">Ваше имя в профиле</label>
              <div class="amaras-auth-input-box">
                <svg class="amaras-auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input type="text" id="customGName" name="custom_g_name" placeholder="Имя и фамилия (необязательно)" autocomplete="name" />
              </div>
            </div>

            <button type="submit" class="amaras-auth-submit-btn amaras-oauth-confirm-btn" style="margin-top: 14px;">
              <span class="amaras-btn-text">Войти через Google</span>
              <span class="amaras-btn-spinner"></span>
            </button>
          </form>

          ${savedGoogle ? `
            <button type="button" class="amaras-oauth-toggle-link" style="margin-top: 12px;" onclick="AmarasAuth.renderGoogleOAuth(false)">
              Вернуться к сохранённому аккаунту (${savedGoogle.name.split(' ')[0]})
            </button>
          ` : ''}

          <div class="amaras-auth-back-row">
            <button type="button" class="amaras-auth-back-link" onclick="AmarasAuth.switchTab('login')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              <span>Вернуться ко входу</span>
            </button>
          </div>
        `;
      }
    },

    handleCustomGoogle(e) {
      e.preventDefault();
      const form = e.target;
      const email = form.custom_g_email.value.trim();
      let name = form.custom_g_name ? form.custom_g_name.value.trim() : '';

      if (!email || !email.includes('@')) {
        AmarasToast.show('Пожалуйста, введите корректный адрес Gmail или Email', 'error');
        if (form.custom_g_email) form.custom_g_email.focus();
        return;
      }

      if (!name) {
        const base = email.split('@')[0].replace(/[._-]/g, ' ');
        name = base.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        if (!name) name = 'Google Пользователь';
      }

      this.handleGoogleConfirm(name, email);
    },

    handleGoogleConfirm(name, email) {
      const submitBtn = this.modalEl ? this.modalEl.querySelector('.amaras-oauth-confirm-btn') : null;
      if (submitBtn) submitBtn.classList.add('is-loading');

      setTimeout(() => {
        if (submitBtn) submitBtn.classList.remove('is-loading');
        const finalName = name || 'Google Пользователь';
        const finalEmail = email || 'user@gmail.com';
        const initials = this.getInitials(finalName);

        const googleUser = {
          id: 'usr_g_' + Date.now(),
          name: finalName,
          email: finalEmail,
          phone: '',
          avatarText: initials,
          provider: 'Google',
          createdAt: new Date().toISOString().split('T')[0],
          bookingsCount: 0
        };

        try {
          localStorage.setItem('amaras_saved_google', JSON.stringify({
            name: finalName,
            email: finalEmail,
            avatarText: initials
          }));
        } catch (err) {}

        this.saveRegisteredUser(googleUser);
        this.saveUser(googleUser);
        this.close();
        AmarasToast.show(`Успешный вход через Google: ${googleUser.name}!`, 'success');
      }, 350);
    },

    loginWithTelegram() {
      this.switchTab('telegram');
      this.renderTelegramOAuth(false);
    },

    renderTelegramOAuth(forceNew = false) {
      const view = this.modalEl ? this.modalEl.querySelector('.amaras-auth-view[data-tab="telegram"]') : null;
      if (!view) return;

      const savedTg = this.getSavedTelegram();

      if (savedTg && !forceNew) {
        const initials = savedTg.avatarText || this.getInitials(savedTg.name);
        view.innerHTML = `
          <div class="amaras-oauth-header">
            <div class="amaras-oauth-icon is-tg">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.92 9.07c-.14.65-.53.81-1.07.51l-2.95-2.18-1.42 1.37c-.16.16-.29.29-.6.29l.21-3.01 5.48-4.95c.24-.21-.05-.33-.37-.12l-6.77 4.26-2.92-.91c-.63-.2-.64-.63.13-.94l11.41-4.4c.53-.19.99.13.82.91z"/></svg>
            </div>
            <h3 class="amaras-oauth-title">Вход через Telegram</h3>
            <p class="amaras-oauth-subtitle">Выберите профиль для продолжения</p>
          </div>

          <div class="amaras-oauth-card is-selected" onclick="AmarasAuth.handleTelegramConfirm('${savedTg.name.replace(/'/g, "\\'")}', '${(savedTg.username || '').replace(/'/g, "\\'")}', '${(savedTg.phone || '').replace(/'/g, "\\'")}')">
            <div class="amaras-oauth-avatar is-tg">${initials}</div>
            <div class="amaras-oauth-info">
              <div class="amaras-oauth-name">${savedTg.name}</div>
              <div class="amaras-oauth-meta">${savedTg.username || savedTg.phone || 'Telegram'}</div>
            </div>
            <svg class="amaras-oauth-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>

          <button type="button" class="amaras-auth-submit-btn amaras-oauth-confirm-btn" onclick="AmarasAuth.handleTelegramConfirm('${savedTg.name.replace(/'/g, "\\'")}', '${(savedTg.username || '').replace(/'/g, "\\'")}', '${(savedTg.phone || '').replace(/'/g, "\\'")}')">
            <span class="amaras-btn-text">Войти как ${savedTg.name.split(' ')[0]}</span>
            <span class="amaras-btn-spinner"></span>
          </button>

          <button type="button" class="amaras-oauth-toggle-link" onclick="AmarasAuth.renderTelegramOAuth(true)">
            Указать другой аккаунт Telegram
          </button>

          <div class="amaras-auth-back-row">
            <button type="button" class="amaras-auth-back-link" onclick="AmarasAuth.switchTab('login')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              <span>Вернуться ко входу</span>
            </button>
          </div>
        `;
      } else {
        view.innerHTML = `
          <div class="amaras-oauth-header">
            <div class="amaras-oauth-icon is-tg">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.92 9.07c-.14.65-.53.81-1.07.51l-2.95-2.18-1.42 1.37c-.16.16-.29.29-.6.29l.21-3.01 5.48-4.95c.24-.21-.05-.33-.37-.12l-6.77 4.26-2.92-.91c-.63-.2-.64-.63.13-.94l11.41-4.4c.53-.19.99.13.82.91z"/></svg>
            </div>
            <h3 class="amaras-oauth-title">Вход через Telegram</h3>
            <p class="amaras-oauth-subtitle">Авторизуйтесь через никнейм или телефон</p>
          </div>

          <form onsubmit="AmarasAuth.handleCustomTelegram(event)" novalidate>
            <div class="amaras-auth-field">
              <label for="customTgUser">Никнейм @username или номер телефона</label>
              <div class="amaras-auth-input-box">
                <svg class="amaras-auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                <input type="text" id="customTgUser" name="custom_tg_user" placeholder="@username или +374 ..." required autocomplete="username" />
              </div>
            </div>

            <div class="amaras-auth-field">
              <label for="customTgName">Ваше имя (как в профиле Telegram)</label>
              <div class="amaras-auth-input-box">
                <svg class="amaras-auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input type="text" id="customTgName" name="custom_tg_name" placeholder="Имя и фамилия (необязательно)" autocomplete="name" />
              </div>
            </div>

            <button type="submit" class="amaras-auth-submit-btn amaras-oauth-confirm-btn" style="margin-top: 14px;">
              <span class="amaras-btn-text">Войти через Telegram</span>
              <span class="amaras-btn-spinner"></span>
            </button>
          </form>

          ${savedTg ? `
            <button type="button" class="amaras-oauth-toggle-link" style="margin-top: 12px;" onclick="AmarasAuth.renderTelegramOAuth(false)">
              Вернуться к сохранённому аккаунту (${savedTg.name.split(' ')[0]})
            </button>
          ` : ''}

          <div class="amaras-auth-back-row">
            <button type="button" class="amaras-auth-back-link" onclick="AmarasAuth.switchTab('login')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              <span>Вернуться ко входу</span>
            </button>
          </div>
        `;
      }
    },

    handleCustomTelegram(e) {
      e.preventDefault();
      const form = e.target;
      const userVal = form.custom_tg_user.value.trim();
      let name = form.custom_tg_name ? form.custom_tg_name.value.trim() : '';

      if (!userVal) {
        AmarasToast.show('Пожалуйста, укажите ваш Telegram @username или номер телефона', 'error');
        if (form.custom_tg_user) form.custom_tg_user.focus();
        return;
      }

      let username = '';
      let phone = '';

      if (userVal.startsWith('+') || /^\d+$/.test(userVal.replace(/[\s()-]/g, ''))) {
        phone = userVal;
      } else {
        username = userVal.startsWith('@') ? userVal : ('@' + userVal);
      }

      if (!name) {
        if (username) {
          const raw = username.replace(/^@/, '');
          name = raw.charAt(0).toUpperCase() + raw.slice(1);
        } else {
          name = 'Telegram Пользователь';
        }
      }

      this.handleTelegramConfirm(name, username, phone);
    },

    handleTelegramConfirm(name, username, phone) {
      const submitBtn = this.modalEl ? this.modalEl.querySelector('.amaras-oauth-confirm-btn') : null;
      if (submitBtn) submitBtn.classList.add('is-loading');

      setTimeout(() => {
        if (submitBtn) submitBtn.classList.remove('is-loading');
        const finalName = name || 'Telegram Пользователь';
        const initials = this.getInitials(finalName);

        const tgUser = {
          id: 'usr_tg_' + Date.now(),
          name: finalName,
          email: username && username.startsWith('@') ? username : (username || 'user@t.me'),
          phone: phone || '',
          avatarText: initials,
          provider: 'Telegram',
          createdAt: new Date().toISOString().split('T')[0],
          bookingsCount: 0
        };

        try {
          localStorage.setItem('amaras_saved_telegram', JSON.stringify({
            name: finalName,
            username: username,
            phone: phone,
            avatarText: initials
          }));
        } catch (err) {}

        this.saveRegisteredUser(tgUser);
        this.saveUser(tgUser);
        this.close();
        AmarasToast.show(`Успешный вход через Telegram: ${tgUser.name}!`, 'success');
      }, 350);
    },

    toggleCustomOAuthForm(formId) {
      const form = document.getElementById(formId);
      if (form) form.classList.toggle('is-open');
    },

    logout() {
      this.closeUserMenu();
      const prevName = this.currentUser ? this.currentUser.name.split(' ')[0] : '';
      this.saveUser(null);
      AmarasToast.show(prevName ? `До свидания, ${prevName}! Вы вышли из аккаунта.` : 'Вы вышли из аккаунта.', 'info');
    },

    toggleUserMenu(e) {
      if (e) e.stopPropagation();
      const dropdown = document.getElementById('amarasUserDropdown');
      const trigger = document.getElementById('amarasUserTrigger');
      if (!dropdown) return;
      const isOpen = dropdown.classList.contains('is-open');
      if (isOpen) {
        dropdown.classList.remove('is-open');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      } else {
        dropdown.classList.add('is-open');
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
      }
    },

    closeUserMenu() {
      const dropdown = document.getElementById('amarasUserDropdown');
      const trigger = document.getElementById('amarasUserTrigger');
      if (dropdown) dropdown.classList.remove('is-open');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    },

    openProfileModal() {
      this.closeUserMenu();
      if (!this.currentUser) {
        this.open('login');
        return;
      }
      const user = this.currentUser;
      AmarasToast.show(`Профиль: ${user.name} (${user.email})`, 'info', 4500);
    },

    togglePasswordVisibility(btn) {
      const wrapper = btn.closest('.amaras-auth-field');
      if (!wrapper) return;
      const input = wrapper.querySelector('input');
      if (!input) return;
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      btn.innerHTML = isPass
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    },

    // Update Header and Drawer buttons across the page
    updateUI() {
      const user = this.currentUser;
      const actions = document.querySelector('.amaras-nav-actions');

      // 1. Desktop Navbar Auth Buttons vs User Menu
      const loginBtns = document.querySelectorAll('.amaras-login-btn');
      const registerBtns = document.querySelectorAll('.amaras-register-btn');

      let userMenuWrapper = document.getElementById('amarasUserMenuWrapper');

      if (user) {
        // Hide standard login & register buttons
        loginBtns.forEach(b => b.style.display = 'none');
        registerBtns.forEach(b => b.style.display = 'none');

        // Create or update User Menu in navbar
        if (!userMenuWrapper && actions) {
          userMenuWrapper = document.createElement('div');
          userMenuWrapper.id = 'amarasUserMenuWrapper';
          userMenuWrapper.className = 'amaras-user-menu-wrapper';

          // Insert right where the login button was
          const loginBtn = actions.querySelector('.amaras-login-btn');
          if (loginBtn) {
            actions.insertBefore(userMenuWrapper, loginBtn);
          } else {
            const toggle = actions.querySelector('.amaras-mobile-toggle');
            if (toggle) {
              actions.insertBefore(userMenuWrapper, toggle);
            } else {
              actions.appendChild(userMenuWrapper);
            }
          }
        }

        if (userMenuWrapper) {
          userMenuWrapper.style.display = 'inline-flex';
          const firstName = user.name ? user.name.split(' ')[0] : 'Профиль';
          const initials = user.avatarText || this.getInitials(user.name);

          userMenuWrapper.innerHTML = `
            <button class="amaras-user-profile-trigger" id="amarasUserTrigger" type="button" onclick="AmarasAuth.toggleUserMenu(event)" aria-label="Профиль пользователя" aria-haspopup="true" aria-expanded="false">
              <span class="amaras-user-avatar">${initials}</span>
              <span class="amaras-user-name">${firstName}</span>
              <svg class="amaras-user-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="amaras-user-dropdown" id="amarasUserDropdown" role="menu">
              <div class="amaras-user-dropdown-header">
                <div class="amaras-user-avatar is-large">${initials}</div>
                <div class="amaras-user-info">
                  <div class="amaras-user-fullname">${user.name || 'Путешественник'}</div>
                  <div class="amaras-user-email">${user.email || ''}</div>
                </div>
              </div>
              <div class="amaras-user-dropdown-divider"></div>
              <a href="cart.html" class="amaras-user-dropdown-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <span>Мои туры и корзина</span>
              </a>
              <button type="button" class="amaras-user-dropdown-item" onclick="AmarasAuth.openProfileModal()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>Личные данные</span>
              </button>
              <div class="amaras-user-dropdown-divider"></div>
              <button type="button" class="amaras-user-dropdown-item is-logout" onclick="AmarasAuth.logout()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Выйти из аккаунта</span>
              </button>
            </div>
          `;
        }
      } else {
        // Show login & register buttons
        loginBtns.forEach(b => b.style.display = '');
        registerBtns.forEach(b => b.style.display = '');
        if (userMenuWrapper) {
          userMenuWrapper.style.display = 'none';
        }
      }

      // 2. Mobile Drawer Auth Area
      this.updateDrawerUI(user);
    },

    updateDrawerUI(user) {
      const drawerAuth = document.querySelector('.amaras-mobile-drawer-auth') ||
                         document.querySelector('.amaras-mobile-drawer-footer > div:last-child');
      if (!drawerAuth) return;

      if (user) {
        const initials = user.avatarText || this.getInitials(user.name);
        drawerAuth.innerHTML = `
          <div class="amaras-drawer-user-card">
            <div class="amaras-user-avatar">${initials}</div>
            <div class="amaras-drawer-user-info">
              <div class="amaras-drawer-user-name">${user.name}</div>
              <div class="amaras-drawer-user-email">${user.email}</div>
            </div>
            <button type="button" class="amaras-drawer-logout-btn" onclick="AmarasAuth.logout()" title="Выйти" aria-label="Выйти из аккаунта">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        `;
      } else {
        drawerAuth.innerHTML = `
          <button type="button" class="amaras-login-btn" onclick="AmarasAuth.open('login')">Вход</button>
          <button type="button" class="amaras-register-btn" onclick="AmarasAuth.open('register')">Регистрация</button>
        `;
      }
    },

    // Bind all static and dynamic auth buttons across the document
    bindButtons() {
      document.querySelectorAll('.amaras-login-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          // If inside mobile drawer, close drawer first
          if (typeof window.toggleMobileNav === 'function' && document.querySelector('.amaras-mobile-drawer.is-open')) {
            window.toggleMobileNav();
          }
          this.open('login');
        });
      });

      document.querySelectorAll('.amaras-register-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (typeof window.toggleMobileNav === 'function' && document.querySelector('.amaras-mobile-drawer.is-open')) {
            window.toggleMobileNav();
          }
          this.open('register');
        });
      });
    },

    // Inject Auth Modal DOM dynamically if not present
    injectModal() {
      if (document.getElementById('amarasAuthModal')) {
        this.modalEl = document.getElementById('amarasAuthModal');
        return;
      }

      const modal = document.createElement('div');
      modal.id = 'amarasAuthModal';
      modal.className = 'amaras-auth-modal-overlay';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');

      modal.innerHTML = `
        <div class="amaras-auth-backdrop" onclick="AmarasAuth.close()"></div>
        <div class="amaras-auth-dialog">
          <!-- Close Button -->
          <button type="button" class="amaras-auth-close-btn" onclick="AmarasAuth.close()" aria-label="Закрыть окно">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <!-- Modal Header -->
          <div class="amaras-auth-header">
            <div class="amaras-auth-brand">
              <img src="assets/amaras-logo-navbar.svg" alt="Amaras" class="amaras-auth-logo" />
            </div>
            <h2 class="amaras-auth-title" data-i18n="auth_modal_title">Личный кабинет</h2>
            <p class="amaras-auth-subtitle" data-i18n="auth_modal_sub">Бронируйте авторские туры по Армении и управляйте поездками</p>
          </div>

          <!-- Tabs Switcher -->
          <div class="amaras-auth-tabs">
            <button type="button" class="amaras-auth-tab-btn is-active" data-target-tab="login" onclick="AmarasAuth.switchTab('login')">
              <span data-i18n="auth_tab_login">Вход</span>
            </button>
            <button type="button" class="amaras-auth-tab-btn" data-target-tab="register" onclick="AmarasAuth.switchTab('register')">
              <span data-i18n="auth_tab_register">Регистрация</span>
            </button>
          </div>

          <!-- TAB 1: LOGIN -->
          <div class="amaras-auth-view is-active" data-tab="login">
            <div class="amaras-auth-error"></div>
            <form onsubmit="AmarasAuth.handleLogin(event)" novalidate>
              <div class="amaras-auth-field">
                <label for="authLoginId">Email или телефон</label>
                <div class="amaras-auth-input-box">
                  <svg class="amaras-auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <input type="text" id="authLoginId" name="identifier" placeholder="mail@example.com или +374 ..." required autocomplete="username" />
                </div>
              </div>

              <div class="amaras-auth-field">
                <div class="amaras-auth-field-header">
                  <label for="authLoginPass">Пароль</label>
                  <button type="button" class="amaras-auth-forgot-link" onclick="AmarasAuth.switchTab('forgot')">Забыли пароль?</button>
                </div>
                <div class="amaras-auth-input-box">
                  <svg class="amaras-auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input type="password" id="authLoginPass" name="password" placeholder="••••••••" required autocomplete="current-password" />
                  <button type="button" class="amaras-auth-eye-btn" onclick="AmarasAuth.togglePasswordVisibility(this)" aria-label="Показать пароль">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>

              <button type="submit" class="amaras-auth-submit-btn">
                <span class="amaras-btn-text">Войти в аккаунт</span>
                <span class="amaras-btn-spinner"></span>
              </button>
            </form>

            <div class="amaras-auth-divider">
              <span>или через сервисы</span>
            </div>

            <div class="amaras-auth-socials">
              <button type="button" class="amaras-auth-social-btn is-google" onclick="AmarasAuth.loginWithGoogle()">
                <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/><path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"/><path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"/></svg>
                <span>Google</span>
              </button>
              <button type="button" class="amaras-auth-social-btn is-tg" onclick="AmarasAuth.loginWithTelegram()">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#24A1DE"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.92 9.07c-.14.65-.53.81-1.07.51l-2.95-2.18-1.42 1.37c-.16.16-.29.29-.6.29l.21-3.01 5.48-4.95c.24-.21-.05-.33-.37-.12l-6.77 4.26-2.92-.91c-.63-.2-.64-.63.13-.94l11.41-4.4c.53-.19.99.13.82.91z"/></svg>
                <span>Telegram</span>
              </button>
            </div>
          </div>

          <!-- TAB 2: REGISTER -->
          <div class="amaras-auth-view" data-tab="register">
            <div class="amaras-auth-error"></div>
            <form onsubmit="AmarasAuth.handleRegister(event)" novalidate>
              <div class="amaras-auth-field">
                <label for="regName">Имя и фамилия</label>
                <div class="amaras-auth-input-box">
                  <svg class="amaras-auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <input type="text" id="regName" name="reg_name" placeholder="Ваше имя и фамилия" required autocomplete="name" />
                </div>
              </div>

              <div class="amaras-auth-field">
                <label for="regEmail">Электронная почта</label>
                <div class="amaras-auth-input-box">
                  <svg class="amaras-auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <input type="email" id="regEmail" name="reg_email" placeholder="mail@example.com" required autocomplete="email" />
                </div>
              </div>

              <div class="amaras-auth-field">
                <label for="regPhone">Телефон для связи</label>
                <div class="amaras-auth-input-box">
                  <svg class="amaras-auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <input type="tel" id="regPhone" name="reg_phone" placeholder="+374 99 000 000" autocomplete="tel" />
                </div>
              </div>

              <div class="amaras-auth-field">
                <label for="regPass">Придумайте пароль (минимум 6 символов)</label>
                <div class="amaras-auth-input-box">
                  <svg class="amaras-auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input type="password" id="regPass" name="reg_password" placeholder="••••••••" required autocomplete="new-password" />
                  <button type="button" class="amaras-auth-eye-btn" onclick="AmarasAuth.togglePasswordVisibility(this)" aria-label="Показать пароль">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>

              <div class="amaras-auth-field">
                <label for="regPassConfirm">Повторите пароль</label>
                <div class="amaras-auth-input-box">
                  <svg class="amaras-auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input type="password" id="regPassConfirm" name="reg_password_confirm" placeholder="••••••••" required autocomplete="new-password" />
                  <button type="button" class="amaras-auth-eye-btn" onclick="AmarasAuth.togglePasswordVisibility(this)" aria-label="Показать пароль">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>

              <div class="amaras-auth-checkbox-row">
                <label class="amaras-auth-check-label">
                  <input type="checkbox" name="reg_agree" checked required />
                  <span class="amaras-auth-checkmark"></span>
                  <span class="amaras-auth-check-text">
                    Я соглашаюсь с <a href="https://www.getyourguide.com/c/supplier-terms-and-conditions" target="_blank" rel="noopener">Условиями бронирования</a> и <a href="https://www.getyourguide.com/de-de/c/supplier-privacy-policy?visitor-id=EPO948QIBH7QNR5NS2DE5TS05GLM81R3" target="_blank" rel="noopener">Политикой конфиденциальности</a>
                  </span>
                </label>
              </div>

              <button type="submit" class="amaras-auth-submit-btn">
                <span class="amaras-btn-text">Создать аккаунт</span>
                <span class="amaras-btn-spinner"></span>
              </button>
            </form>

            <div class="amaras-auth-divider">
              <span>или быстрая регистрация через</span>
            </div>

            <div class="amaras-auth-socials">
              <button type="button" class="amaras-auth-social-btn is-google" onclick="AmarasAuth.loginWithGoogle()">
                <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/><path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"/><path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"/></svg>
                <span>Google</span>
              </button>
              <button type="button" class="amaras-auth-social-btn is-tg" onclick="AmarasAuth.loginWithTelegram()">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#24A1DE"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.92 9.07c-.14.65-.53.81-1.07.51l-2.95-2.18-1.42 1.37c-.16.16-.29.29-.6.29l.21-3.01 5.48-4.95c.24-.21-.05-.33-.37-.12l-6.77 4.26-2.92-.91c-.63-.2-.64-.63.13-.94l11.41-4.4c.53-.19.99.13.82.91z"/></svg>
                <span>Telegram</span>
              </button>
            </div>
          </div>

          <!-- TAB 3: FORGOT PASSWORD -->
          <div class="amaras-auth-view" data-tab="forgot">
            <div class="amaras-auth-error"></div>
            <form onsubmit="AmarasAuth.handleReset(event)" novalidate>
              <div class="amaras-auth-forgot-desc">
                Укажите ваш email, и мы отправим проверочный код для восстановления доступа к личному кабинету.
              </div>
              <div class="amaras-auth-field">
                <label for="resetEmail">Email аккаунта</label>
                <div class="amaras-auth-input-box">
                  <svg class="amaras-auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <input type="email" id="resetEmail" name="reset_email" placeholder="mail@example.com" required autocomplete="email" />
                </div>
              </div>

              <button type="submit" class="amaras-auth-submit-btn">
                <span class="amaras-btn-text">Получить проверочный код</span>
                <span class="amaras-btn-spinner"></span>
              </button>

              <div class="amaras-auth-back-row">
                <button type="button" class="amaras-auth-back-link" onclick="AmarasAuth.switchTab('login')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  <span>Вернуться ко входу</span>
                </button>
              </div>
            </form>
          </div>

          <!-- TAB 4: GOOGLE OAUTH -->
          <div class="amaras-auth-view" data-tab="google"></div>

          <!-- TAB 5: TELEGRAM OAUTH -->
          <div class="amaras-auth-view" data-tab="telegram"></div>

        </div>
      `;

      document.body.appendChild(modal);
      this.modalEl = modal;
    }
  };

  // Expose globally
  window.AmarasAuth = AmarasAuth;
  window.AmarasToast = AmarasToast;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AmarasAuth.init());
  } else {
    AmarasAuth.init();
  }
})();
