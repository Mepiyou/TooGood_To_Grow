import test from 'node:test';
import assert from 'node:assert/strict';
import { estIOS, encartAProposer } from '../js/ui/encart-ios.js';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
const IPAD_BUREAU = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36';

test('iPhone, iPad et iPod sont reconnus par le user agent', () => {
  assert.equal(estIOS({ userAgent: IPHONE, platform: 'iPhone', maxTouchPoints: 5 }), true);
  assert.equal(estIOS({ userAgent: 'x iPad x', platform: 'iPad', maxTouchPoints: 5 }), true);
  assert.equal(estIOS({ userAgent: 'x iPod x', platform: 'iPod', maxTouchPoints: 5 }), true);
});

test('iPad en mode bureau : MacIntel tactile', () => {
  assert.equal(estIOS({ userAgent: IPAD_BUREAU, platform: 'MacIntel', maxTouchPoints: 5 }), true);
});

test('Mac non tactile, Android et entrées absentes ne sont pas iOS', () => {
  assert.equal(estIOS({ userAgent: IPAD_BUREAU, platform: 'MacIntel', maxTouchPoints: 0 }), false);
  assert.equal(estIOS({ userAgent: ANDROID, platform: 'Linux armv8l', maxTouchPoints: 5 }), false);
  assert.equal(estIOS({}), false);
});

test('encart proposé sur iOS sauf en mode autonome', () => {
  const base = { userAgent: IPHONE, platform: 'iPhone', maxTouchPoints: 5 };
  assert.equal(encartAProposer({ ...base, standalone: undefined }), true);
  assert.equal(encartAProposer({ ...base, standalone: false }), true);
  assert.equal(encartAProposer({ ...base, standalone: true }), false);
  assert.equal(encartAProposer({ userAgent: ANDROID, platform: 'Linux', maxTouchPoints: 5 }), false);
});
