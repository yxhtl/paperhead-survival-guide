const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const analytics = fs.readFileSync(path.join(root, 'analytics.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

function setup(url, language = 'en') {
  const callbacks = [];
  const buttons = ['health', 'movement', 'clips'].map(focus => ({
    dataset: { focus },
    setAttribute() {},
    addEventListener(event, callback) { callbacks.push(callback); }
  }));
  const scripts = [];
  const elements = new Map();
  const document = {
    documentElement: { lang: language },
    head: { appendChild(script) { scripts.push(script); } },
    createElement() { return {}; },
    querySelectorAll(selector) { return selector === '[data-focus]' ? buttons : []; },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { textContent: '', addEventListener() {} });
      return elements.get(id);
    }
  };
  const window = {};
  const context = vm.createContext({ location: new URL(url), URL, document, window });
  vm.runInContext(analytics, context);
  vm.runInContext(app, context);
  return { window, callbacks, scripts, elements };
}

for (const url of ['http://127.0.0.1:8766/', 'https://yxhtl.github.io/doubao-voice-check/']) {
  const test = setup(url);
  test.callbacks[0]();
  assert.equal(test.window.gtag, undefined, 'Preview and other sites must not send analytics');
  assert.equal(test.scripts.length, 0);
}

for (const language of ['en', 'zh-CN']) {
  const test = setup('https://yxhtl.github.io/paperhead-survival-guide/' +
    (language === 'en' ? '' : 'zh.html'), language);
  const commands = () => Array.from(test.window.dataLayer, args => Array.from(args));
  assert.equal(commands().filter(command => command[0] === 'event').length, 0,
    'Default advice is not evidence of a user interacting');
  const config = commands().find(command => command[0] === 'config')[2];
  assert.equal(config.cookie_path, '/paperhead-survival-guide/');
  assert.equal(config.cookie_prefix, 'paperhead');
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  assert.equal(config.debug_mode, undefined, 'Normal visitors must not enter DebugView');
  for (const callback of test.callbacks) callback();
  test.callbacks[0]();
  const events = commands().filter(command => command[0] === 'event');
  assert.deepEqual(events.map(event => event[1]), ['check_start', 'recommendation_view'],
    'Count an interaction once per page rather than each answer change');
  for (const event of events) {
    assert.deepEqual(Object.keys(event[2]), ['send_to'], 'Never transmit the selected answer');
    assert.equal(event[2].send_to, 'G-9JJPLVM56V');
  }
  assert.ok(test.elements.get('answer-title').textContent, 'Advice must still update');
  assert.equal(test.scripts.length, 1);
}
const debug = setup('https://yxhtl.github.io/paperhead-survival-guide/?analytics_debug=1');
const config = Array.from(debug.window.dataLayer[1])[2];
assert.equal(config.debug_mode, true);
assert.equal(config.page_location, 'https://yxhtl.github.io/paperhead-survival-guide/');
console.log('PASS: production-only analytics, bilingual advice, one-time events and no answer payload');
