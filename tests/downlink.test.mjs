// Tests for the downlink queue (owner: K3). Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enqueue, movePacket, sendPass, planQueue, duePasses, runDuePasses, splitDelay, marsClock, connectDownlink } from '../src/ui/downlink.js';
import { createBus } from '../src/ui/dev/stub_bus.js';
import { downlinkRows } from '../src/ui/dev/stub_samples.js';

const pkt = (id, mbit, type = 'photo') => ({ type, id, mbit, points: 10 });
const passes = [{ id: 'mro', name: 'MRO', atSolFraction: 0.3, mbit: 100 }, { id: 'maven', name: 'MAVEN', atSolFraction: 0.75, mbit: 50 }];
const ids = (q) => q.map((p) => p.id);

test('a packet is queued once, even if it is sent twice', () => {
  const q = [];
  enqueue(q, pkt('a', 10));
  enqueue(q, pkt('a', 10));
  assert.deepEqual(ids(q), ['a']);
});

test('the player can reorder the queue', () => {
  const q = [pkt('a', 1), pkt('b', 1), pkt('c', 1)].reduce((qq, p) => enqueue(qq, p), []);
  movePacket(q, 'c', 0);
  assert.deepEqual(ids(q), ['c', 'a', 'b']);
});

test('a pass sends in order up to its capacity; the rest waits', () => {
  const q = [pkt('a', 60), pkt('b', 30), pkt('c', 30)].reduce((qq, p) => enqueue(qq, p), []);
  const { sent, usedMbit } = sendPass(q, 100);
  assert.deepEqual(ids(sent), ['a', 'b']);
  assert.equal(usedMbit, 100);
  assert.deepEqual(ids(q), ['c']);
  assert.equal(q[0].sentMbit, 10, 'c went out in part');
});

test('a big packet continues on the next pass', () => {
  const q = enqueue([], pkt('big', 150));
  assert.deepEqual(sendPass(q, 100).sent, []);
  assert.equal(q[0].sentMbit, 100);
  assert.deepEqual(ids(sendPass(q, 50).sent), ['big']);
  assert.equal(q.length, 0);
});

test('the plan shows which pass each packet goes on, without sending anything', () => {
  const q = [pkt('a', 90), pkt('b', 40), pkt('c', 500)].reduce((qq, p) => enqueue(qq, p), []);
  assert.deepEqual(planQueue(q, passes), { a: 'mro', b: 'maven', c: null });
  assert.equal(q.length, 3);
  assert.equal(q[0].sentMbit, 0);
});

test('passes that start between two times are found across sols', () => {
  assert.deepEqual(duePasses(passes, 1.2, 1.5).map((p) => p.id), ['mro']);
  assert.deepEqual(duePasses(passes, 1.8, 2.4).map((p) => `${p.sol}:${p.id}`), ['2:mro']);
  assert.deepEqual(duePasses(passes, 1.3, 1.3), []);
});

test('only finished packets are announced with downlink:sent, and used data is counted', () => {
  const bus = createBus();
  const state = { dataBudget: { perSol: 150, used: 0, queue: [] } };
  connectDownlink(bus, () => state);
  bus.emit('downlink:queue', pkt('photo1', 80));
  bus.emit('downlink:queue', pkt('report1', 40, 'report'));
  const sent = [];
  bus.on('downlink:sent', (p) => sent.push(p));
  runDuePasses(state, passes, 1.0, 1.5, bus); // MRO only: 100 Mbit
  assert.deepEqual(sent.map((p) => [p.id, p.sol, p.passId]), [['photo1', 1, 'mro']]);
  assert.equal(state.dataBudget.used, 100);
  assert.equal(state.dataBudget.queue[0].sentMbit, 20);
  runDuePasses(state, passes, 1.5, 1.9, bus); // MAVEN: 50 Mbit
  assert.deepEqual(sent.map((p) => p.id), ['photo1', 'report1']);
  assert.ok(!('sentMbit' in sent[0]), 'the sent event carries the D-003 packet, not internal progress');
});

test('light delay and Mars clock are formatted for the panel', () => {
  assert.deepEqual(splitDelay(862.4), { min: 14, sec: 22 });
  assert.equal(marsClock(0.5), '12:00');
  assert.equal(marsClock(0.3), '07:12');
});

test('every downlink sample number has a src', () => {
  for (const [k, row] of Object.entries(downlinkRows)) assert.ok(row.src, `${k} has no src`);
});
