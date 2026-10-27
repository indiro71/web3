import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source = (await readFile(new URL('../src/components/pairs/PairsDashboard.utils.ts', import.meta.url), 'utf8'))
  .replace(/^import type .*;\n/gm, '').replace(/^export /gm, '');
const context = {};
vm.runInNewContext(stripTypeScriptTypes(source) + '\nglobalThis.filter = filterPairs;', context);
const pair = (id, data = {}) => ({
  _id: id, name: id, symbol: `${id}USDT`, exchange: 'BYBIT', exchangeAccount: 1,
  marginMode: 'CROSS', isActive: true, currentPrice: 100, longMargin: 20, shortMargin: 20,
  longPercent: 0, shortPercent: 0, longLiquidatePercent: 1, shortLiquidatePercent: 1,
  autoAddLongMargin: false, autoAddShortMargin: false, ...data,
});
const selected = (rows, flags, search = '') => Array.from(context.filter(rows, { allData: false, onlyPrice: false, onlyNext: false, ...flags }, search), row => row._id);

test('CROSS auto-add flags do not bypass Price or Next', () => {
  const rows = [pair('quiet'), pair('price', { longPercent: 14 }), pair('next', { nextBuyShortPrice: 90 })];
  assert.deepEqual(selected(rows, { onlyPrice: true }), ['price']);
  assert.deepEqual(selected(rows, { onlyNext: true }), ['next']);
  assert.deepEqual(selected(rows, { onlyPrice: true, onlyNext: true }), ['price', 'next']);
  assert.deepEqual(selected(rows, {}), ['quiet', 'price', 'next']);
});
test('Risk uses the same CROSS allocation and PnL conditions as table highlighting', () => {
  const rows = [pair('quiet'), pair('mm', { longLiquidatePercent: 34 }), pair('loss', { longUnrealisedPnl: -1001 })];
  assert.deepEqual(selected(rows, { allData: true }), ['mm', 'loss']);
});
test('CROSS MM allocation is scoped to account and calculated before search', () => {
  const rows = [pair('one', { longLiquidatePercent: 49, shortLiquidatePercent: 1 }), pair('two'), pair('other', { exchangeAccount: 2, longLiquidatePercent: 60 })];
  assert.deepEqual(selected(rows, { allData: true }, 'one'), ['one']);
  assert.deepEqual(selected(rows, { allData: true }, 'other'), []);
});
test('CROSS filtering does not depend on legacy margin-mode or auto-add flags', () => {
  const rows = [pair('quiet', { marginMode: undefined, autoAddLongMargin: undefined }), pair('risk', { marginMode: undefined, longUnrealisedPnl: -1001 })];
  assert.deepEqual(selected(rows, { allData: true }), ['risk']);
  assert.deepEqual(selected(rows, { onlyPrice: true }), []);
  assert.deepEqual(selected(rows, { onlyNext: true }), []);
});
