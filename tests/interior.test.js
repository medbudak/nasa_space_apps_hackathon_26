/**
 * Mekik içi istasyonları: yeni bir istasyon eklendiğinde (ör. D-016 şişe rafı) adı TR + EN metinde olmalı.
 * İstasyon paneli adı gösterir; eksik metin ekranda ham anahtar olarak görünür.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load_core.js');

test('Mekik içi: her istasyonun TR ve EN adı var (station.<id>)', () => {
  for (const lang of ['tr', 'en']) {
    const S = loadCore({ lang });
    for (const st of S.Surface.INTERIOR.stations) {
      assert.notEqual(S.t('station.' + st.id), 'station.' + st.id, lang + ': station.' + st.id + ' metni eksik');
    }
  }
});
