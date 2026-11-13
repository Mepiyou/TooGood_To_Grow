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

const CHROME_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1';
const FIREFOX_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/120.0 Mobile/15E148 Safari/605.1.15';
const EDGE_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 EdgiOS/120.0.2210.126 Mobile/15E148 Safari/605.1.15';
const INSTAGRAM_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/20A362 Instagram 300.0.0.29.110 (iPhone10,4; iOS 16_0; fr_FR; fr; scale=2.00; 750x1334; 500000000)';
const FACEBOOK_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/430.0.0.0.0;FBBV/1]';
const LINE_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/13.0.0';
const SAFARI_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

test('Safari iPhone : encart proposé', () => {
  assert.equal(encartAProposer({ userAgent: SAFARI_IPHONE, platform: 'iPhone', maxTouchPoints: 5 }), true);
});

test("navigateurs iOS tiers et navigateurs d'apps : pas d'encart", () => {
  for (const userAgent of [CHROME_IOS, FIREFOX_IOS, EDGE_IOS, INSTAGRAM_IOS, FACEBOOK_IOS, LINE_IOS]) {
    assert.equal(encartAProposer({ userAgent, platform: 'iPhone', maxTouchPoints: 5 }), false, userAgent);
  }
});
