const { JSDOM } = require('jsdom');
let track, dom;

beforeEach(() => {
  dom = new JSDOM(`<!doctype html><html><body>
  <form id="chat-form"><input id="chat-input"></form>
  <div id="chat-messages"></div>
  </body></html>`, { url: 'https://nutritracker.exautomata.ai/' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.fetch = jest.fn().mockResolvedValue({ status:200, json: () => Promise.resolve({ reply: 'hi' })});
  global.fetchWithAuth = global.fetch;
  delete require.cache[require.resolve('../track.js')];
  track = require('../track.js');
});

test('sendToAIChat posts message and adds bot reply', async () => {
  const chatMessages = document.getElementById('chat-messages');
  await track.sendToAIChat('hello');
  expect(fetch).toHaveBeenCalled();
  expect(chatMessages.children.length).toBeGreaterThan(0);
});

test('presentLog adds log element', () => {
  const chatMessages = document.getElementById('chat-messages');
  track.presentLog({ title: 'T', details: 'D' });
  const last = chatMessages.lastElementChild;
  expect(last.querySelector('.log-entry')).not.toBeNull();
});

test('formatMessage handles markdown and newlines', () => {
  const formatted = track.formatMessage('Hello\n**World**');
  expect(formatted).toBe('Hello<br><strong>World</strong>');
});
