/* LINKAR registrations store — shared by landing-v3.html (writes) and customer-service.html (reads/updates).
 *
 * DEMO STORAGE: records live in this browser's localStorage, so the portal only sees sign-ups made
 * in the same browser. For real use, point API_BASE at a backend with these endpoints:
 *   GET  {API_BASE}/registrations            -> [record]
 *   POST {API_BASE}/registrations            -> record      (body: new record)
 *   PUT  {API_BASE}/registrations/{id}       -> record      (body: full record)
 * and every call below switches to the server automatically.
 */
(function () {
  const API_BASE = '';                       // e.g. 'https://api.linkar.sa' — empty = browser-only demo
  const KEY = 'linkar-registrations-v1';

  const SERVICES = [
    { id: 'wash',    en: 'Car wash',      ar: 'الغسيل' },
    { id: 'ppf',     en: 'PPF protection', ar: 'حماية PPF' },
    { id: 'tint',    en: 'Window tint',   ar: 'التظليل' },
    { id: 'polish',  en: 'Polishing',     ar: 'التلميع' },
    { id: 'ceramic', en: 'Nano ceramic',  ar: 'نانو سيراميك' },
  ];

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const write = list => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} };
  const uid = () => 'R' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();

  function blank(data) {
    const now = new Date().toISOString();
    return Object.assign({
      id: uid(), createdAt: now, updatedAt: now, source: 'landing-v3', lang: 'ar',
      type: 'customer', name: '', company: '', phone: '', email: '',
      status: 'new', priority: 'normal', services: [], preferredDate: '', preferredTime: '',
      city: '', carModel: '', agent: '', followUp: '', notes: [],
      history: [{ at: now, text: 'registered' }],
    }, data);
  }

  async function api(path, opts) {
    const r = await fetch(API_BASE + path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts));
    if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
    return r.json();
  }

  window.LinkarStore = {
    SERVICES,
    remote: !!API_BASE,
    async list() { return API_BASE ? api('/registrations') : read(); },
    async add(data) {
      const rec = blank(data);
      if (API_BASE) return api('/registrations', { method: 'POST', body: JSON.stringify(rec) });
      const all = read(); all.unshift(rec); write(all); return rec;
    },
    async save(rec) {
      rec.updatedAt = new Date().toISOString();
      if (API_BASE) return api('/registrations/' + encodeURIComponent(rec.id), { method: 'PUT', body: JSON.stringify(rec) });
      const all = read(); const i = all.findIndex(r => r.id === rec.id);
      if (i >= 0) all[i] = rec; else all.unshift(rec);
      write(all); return rec;
    },
    async replaceAll(list) { if (!API_BASE) write(list.map(r => blank(r))); },
    blank,
  };
})();
