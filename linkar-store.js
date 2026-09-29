/* LINKAR registrations store — used by the landing pages (sign-ups) and customer-service.html (follow-up).
 *
 * With an API (window.LINKAR_API, see config.js) everything is stored in SQL Server:
 *   POST {API}/registrations        sign-up (public) or a record added by staff
 *   GET  {API}/registrations        all records with notes and history (staff)
 *   PUT  {API}/registrations/{id}   save follow-up data; new notes/history are appended (staff)
 * Without an API (GitHub Pages demo) records live in this browser's localStorage.
 */
(function () {
  const API = String(window.LINKAR_API || '').replace(/\/$/, '');
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
  const pageSource = () => (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') || 'website';

  function blank(data) {
    const now = new Date().toISOString();
    return Object.assign({
      id: uid(), createdAt: now, updatedAt: now, source: pageSource(), lang: 'ar',
      type: 'customer', name: '', company: '', phone: '', email: '', page: location.pathname, userAgent: navigator.userAgent,
      status: 'new', priority: 'normal', services: [], preferredDate: '', preferredTime: '',
      city: '', carMake: '', carModel: '', agent: '', followUp: '', notes: [],
      history: [{ at: now, text: 'registered' }],
    }, data);
  }

  async function api(path, opts) {
    const r = await fetch(API + path, Object.assign({ credentials: 'include', headers: { 'Content-Type': 'application/json' } }, opts));
    if (r.status === 401) { const e = new Error('signed-out'); e.status = 401; throw e; }
    if (!r.ok) { let m = r.status + ''; try { m = (await r.json()).error || m; } catch (e) {} throw new Error(m); }
    return r.status === 204 ? null : r.json();
  }

  window.LinkarStore = {
    SERVICES,
    remote: !!API,
    async list() { return API ? api('/registrations') : read(); },
    async add(data) {
      const rec = blank(data);
      if (API) return api('/registrations', { method: 'POST', body: JSON.stringify(rec) });
      const all = read(); all.unshift(rec); write(all); return rec;
    },
    /** Saves a record; returns the stored version (server ids for new notes/history). */
    async save(rec) {
      rec.updatedAt = new Date().toISOString();
      if (API) return api('/registrations/' + encodeURIComponent(rec.id), { method: 'PUT', body: JSON.stringify(rec) });
      const all = read(); const i = all.findIndex(r => r.id === rec.id);
      if (i >= 0) all[i] = rec; else all.unshift(rec);
      write(all); return rec;
    },
    async replaceAll(list) { if (!API) write(list.map(r => blank(r))); },
    blank,
  };
})();
