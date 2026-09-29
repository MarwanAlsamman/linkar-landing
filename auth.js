/* LINKAR staff sign-in for the customer-service portal.
 *
 * With an API (window.LINKAR_API, see config.js): accounts live in SQL Server, sign-in is a secure
 * server cookie, passwords are hashed on the server, and a temporary password must be changed at
 * first sign-in.
 *
 * Without an API (GitHub Pages demo): accounts live in this browser (localStorage) as salted
 * PBKDF2-SHA256 hashes. This only keeps casual visitors out; it is not server-side security.
 *
 * Every method is async and behaves the same in both modes.
 */
(function () {
  const API = String(window.LINKAR_API || '').replace(/\/$/, '');
  const page = () => location.pathname.split('/').pop() || 'customer-service.html';
  const toLogin = extra => location.replace('login.html?next=' + encodeURIComponent(page()) + (extra || ''));

  /* ---------- server mode ---------- */
  async function call(path, opts = {}) {
    const r = await fetch(API + path, Object.assign({ credentials: 'include', headers: { 'Content-Type': 'application/json' } }, opts));
    let data = null;
    try { data = await r.json(); } catch (e) {}
    if (!r.ok) { const e = new Error((data && data.error) || (r.status === 401 ? 'invalid' : r.status === 429 ? 'too-many' : 'server')); e.status = r.status; throw e; }
    return data;
  }
  const server = {
    remote: true,
    hasUsers: () => true,
    async me() { try { return await call('/auth/me'); } catch (e) { return null; } },
    login: (username, password, remember) => call('/auth/login', { method: 'POST', body: JSON.stringify({ username, password, remember: !!remember }) }),
    changePassword: (currentPassword, newPassword) => call('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
    async logout() { try { await call('/auth/logout', { method: 'POST' }); } catch (e) {} },
    users: () => call('/users'),
    createUser: ({ username, name, password, role }) => call('/users', { method: 'POST', body: JSON.stringify({ username, name, password, role }) }),
    removeUser: username => call('/users/' + encodeURIComponent(username), { method: 'DELETE' }),
    resetPassword: (username, password) => call('/users/' + encodeURIComponent(username) + '/reset-password', { method: 'POST', body: JSON.stringify({ password }) }),
  };

  /* ---------- browser-only demo mode ---------- */
  const USERS = 'linkar-staff-v1', SESSION = 'linkar-staff-session', HOURS = 12;
  const enc = new TextEncoder();
  const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  const read = () => { try { return JSON.parse(localStorage.getItem(USERS)) || []; } catch (e) { return []; } };
  const write = u => localStorage.setItem(USERS, JSON.stringify(u));
  const norm = s => String(s || '').trim().toLowerCase();
  async function hash(password, salt) {
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 150000, hash: 'SHA-256' }, key, 256));
  }
  const newSalt = () => hex(crypto.getRandomValues(new Uint8Array(16)));
  const pub = u => ({ username: u.username, name: u.name, role: u.role, createdAt: u.createdAt, lastLogin: u.lastLogin || '', mustChangePassword: false });
  const checkPw = pw => { if (!pw || pw.length < 8) throw new Error('short'); if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) throw new Error('weak'); };
  function startSession(u, remember) {
    const s = JSON.stringify({ username: u.username, name: u.name, role: u.role, exp: Date.now() + HOURS * 36e5 });
    sessionStorage.setItem(SESSION, s);
    if (remember) localStorage.setItem(SESSION, s); else localStorage.removeItem(SESSION);
  }
  function current() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION) || localStorage.getItem(SESSION));
      if (!s || s.exp < Date.now() || !read().some(u => u.username === s.username)) return null;
      return { ...s, mustChangePassword: false };
    } catch (e) { return null; }
  }
  const local = {
    remote: false,
    hasUsers: () => read().length > 0,
    async me() { return current(); },
    async createUser({ username, name, password, role = 'agent' }) {
      const users = read(), un = norm(username);
      if (!un || !name || !password) throw new Error('missing');
      checkPw(password);
      if (users.some(u => u.username === un)) throw new Error('exists');
      const salt = newSalt();
      users.push({ username: un, name: name.trim(), role, salt, hash: await hash(password, salt), createdAt: new Date().toISOString() });
      write(users);
    },
    async setupAdmin(data, remember) {
      if (read().length) throw new Error('exists');
      await this.createUser({ ...data, role: 'admin' });
      return this.login(data.username, data.password, remember);
    },
    async login(username, password, remember) {
      const users = read(), u = users.find(x => x.username === norm(username));
      if (!u || (await hash(password, u.salt)) !== u.hash) throw new Error('invalid');
      u.lastLogin = new Date().toISOString(); write(users);
      startSession(u, remember);
      return pub(u);
    },
    async changePassword(currentPassword, newPassword) {
      const me = current(); if (!me) throw new Error('invalid');
      const users = read(), u = users.find(x => x.username === me.username);
      if ((await hash(currentPassword, u.salt)) !== u.hash) throw new Error('wrong-current');
      checkPw(newPassword);
      if (newPassword === currentPassword) throw new Error('same');
      u.salt = newSalt(); u.hash = await hash(newPassword, u.salt); write(users);
      return pub(u);
    },
    async logout() { sessionStorage.removeItem(SESSION); localStorage.removeItem(SESSION); },
    async users() { return read().map(pub); },
    async removeUser(username) {
      const users = read();
      if (users.filter(u => u.role === 'admin').length === 1 && users.find(u => u.username === username)?.role === 'admin') throw new Error('last-admin');
      write(users.filter(u => u.username !== username));
    },
    async resetPassword(username, password) {
      checkPw(password);
      const users = read(), u = users.find(x => x.username === username);
      if (!u) throw new Error('invalid');
      u.salt = newSalt(); u.hash = await hash(password, u.salt); write(users);
    },
  };

  const impl = API ? server : local;
  window.LinkarAuth = Object.assign(impl, {
    /** For protected pages: returns the signed-in employee, or sends them to the login page. */
    async require() {
      const me = await impl.me();
      if (!me) { toLogin(); return new Promise(() => {}); }
      if (me.mustChangePassword) { toLogin('&change=1'); return new Promise(() => {}); }
      return me;
    },
  });
})();
