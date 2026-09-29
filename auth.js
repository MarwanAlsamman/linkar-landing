/* LINKAR staff accounts for the customer-service portal.
 *
 * Static-site version: accounts live in this browser (localStorage), passwords are stored only as
 * salted PBKDF2-SHA256 hashes, and there are no built-in/default passwords — the first visit asks
 * for an admin account. This keeps casual visitors out of the portal UI, but it is NOT server-side
 * security: once the portal has a real backend (API_BASE in linkar-store.js), move login to it.
 */
(function () {
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
  const pub = u => ({ username: u.username, name: u.name, role: u.role, createdAt: u.createdAt, lastLogin: u.lastLogin || '' });

  function startSession(u, remember) {
    const s = JSON.stringify({ username: u.username, name: u.name, role: u.role, exp: Date.now() + HOURS * 36e5 });
    sessionStorage.setItem(SESSION, s);
    if (remember) localStorage.setItem(SESSION, s); else localStorage.removeItem(SESSION);
  }

  window.LinkarAuth = {
    hasUsers: () => read().length > 0,
    async createUser({ username, name, password, role = 'agent' }) {
      const users = read(), un = norm(username);
      if (!un || !name || !password) throw new Error('missing');
      if (password.length < 6) throw new Error('short');
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
    current() {
      try {
        const s = JSON.parse(sessionStorage.getItem(SESSION) || localStorage.getItem(SESSION));
        if (!s || s.exp < Date.now() || !read().some(u => u.username === s.username)) return null;
        return s;
      } catch (e) { return null; }
    },
    logout() { sessionStorage.removeItem(SESSION); localStorage.removeItem(SESSION); },
    users: () => read().map(pub),
    removeUser(username) {
      const users = read();
      if (users.filter(u => u.role === 'admin').length === 1 && users.find(u => u.username === username)?.role === 'admin') throw new Error('last-admin');
      write(users.filter(u => u.username !== username));
    },
    async resetPassword(username, password) {
      if (!password || password.length < 6) throw new Error('short');
      const users = read(), u = users.find(x => x.username === username);
      if (!u) throw new Error('invalid');
      u.salt = newSalt(); u.hash = await hash(password, u.salt); write(users);
    },
  };
})();
