/**
 * SOL 14: RED HORIZON — Mini oyun yönlendiricisi (K3)
 * Sözleşme #5: await runMinigame(type, config) -> { success, score (0..1), timeUsed (sn), skipped }
 *   fieldcam            : FIELD CAM fotoğraf (src/ui/field_cam.js)
 *   S.TaskGames[type]   : göreve özel oyunlar ve kablo paneli (src/minigames/task_games.js)
 * Hangi görevin hangi oyunu oynattığı veride (experiments_config, forensics_cases, events_catalog, workshop).
 * RULES §2.6: Her mini oyunda ESC ile kaçış vardır; oyun döngüsü asla kilitlenmez.
 */
(function (S) {
  'use strict';
  const SKIPPED = { success: true, score: 1, timeUsed: 0, skipped: true };

  S.isMinigameOpen = () => Boolean(S.FieldCam && S.FieldCam.open) || Boolean(S.TaskGames && S.TaskGames.isOpen());

  S.runMinigame = function runMinigame(type, config = {}) {
    // DOM yoksa (başsız testler) oyun atlanmış sayılır
    if (typeof document === 'undefined' || !document.getElementById('modal-layer')) return Promise.resolve(SKIPPED);
    if (type === 'fieldcam' && S.FieldCam) return S.FieldCam.run(config);
    if (S.TaskGames && S.TaskGames[type]) return S.TaskGames[type](config);
    console.error('[minigame] unknown type: ' + type);
    return Promise.resolve(SKIPPED);
  };
})((window.SOL14 = window.SOL14 || {}));
