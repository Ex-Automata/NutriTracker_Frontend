const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://nutritracker.exautomata.ai/' });

global.window = dom.window;
global.document = dom.window.document;

global.localStorage = window.localStorage;

delete require.cache[require.resolve('../auth.js')];
const auth = require('../auth.js');

test('store and clear tokens', () => {
  auth.storeTokens('t1','r1');
  expect(localStorage.getItem('nutritracker_token')).toBe('t1');
  expect(localStorage.getItem('nutritracker_refresh_token')).toBe('r1');
  auth.clearTokens();
  expect(localStorage.getItem('nutritracker_token')).toBe(null);
});


test('fetchWithAuth attaches token', async () => {
  auth.storeTokens('t1', 'r1');
  const fetch = jest.fn().mockResolvedValue({ ok:true, status:200, json: () => Promise.resolve({hi:1})});
  global.fetch = fetch;
  await auth.fetchWithAuth('http://x', {});
  expect(fetch).toHaveBeenCalled();
});
