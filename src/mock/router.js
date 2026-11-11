// راوتر بسيط يحاكي سيرفر REST (للاختبار فقط)
export class MockError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }
export const fail = (status, code) => { throw new MockError(status, code); };

export const table = [];
const add = (method, path, handler, open = false) => {
  const keys = [];
  const re = new RegExp(`^${path.replace(/:[^/]+/g, (m) => { keys.push(m.slice(1)); return '([^/]+)'; })}$`);
  table.push({ method, re, keys, handler, open });
};
export const r = {
  get: (p, h, o) => add('GET', p, h, o), post: (p, h, o) => add('POST', p, h, o), put: (p, h, o) => add('PUT', p, h, o),
  patch: (p, h, o) => add('PATCH', p, h, o), del: (p, h, o) => add('DELETE', p, h, o),
};
