// DEV STUB (owner: K3) — a proposal for K1's engineering.js `evaluateDesign(design, data)`.
// D-003 says formulas live only in src/core/engineering.js, so this file is used only until K1
// adds the real function. `design` is K1's gameState.design; `data` is nasa_data.json.
// The return shape is what src/scenes/design.js reads.
//
// Night energy model (simplified, to be reviewed by K1):
//   nightNeed_kWh = (nightLifeSupport_W + heatingNight_W(site) * heatingFactor(insulation)
//                    + sum(instrument power_W) * instrumentNightDuty - RTG output)
//                   * (solLength / 2) / 1000

const find = (list, id) => (list || []).find((x) => x.id === id);
const num = (row, k) => (row && typeof row[k] === 'number' ? row[k] : 0);
// Scalar by dotted path; 0 when K1's file does not have the entry yet, so the screen still opens.
const sv = (data, path) => path.split('.').reduce((n, k) => n?.[k], data)?.value ?? 0;

export function evaluateDesign(design, data) {
  const rocket = find(data.rockets, design.rocketId);
  const traj = find(data.trajectories, design.trajectoryId);
  const site = find(data.landingSites, design.landingSiteId);
  const power = (data.powerOptions || []).find((o) => Boolean(o.rtg) === Boolean(design.power.rtg)
    && o.solarArea_m2 === design.power.solarArea_m2);
  const battery = (data.batteries || []).find((o) => o.capacity_kWh === design.power.battery_kWh);
  const ins = find(data.insulation, design.insulation);
  const comms = find(data.commsOptions, design.comms);
  const kits = (data.spareKits || []).find((o) => o.count === design.spareKits);
  const instruments = (design.instruments || []).map((id) => find(data.instruments, id)).filter(Boolean);

  const parts = [traj, power, battery, ins, comms, kits, ...instruments];
  const rtgMass = design.power.rtg ? sv(data, 'power.rtgMass') : 0;
  const rtgW = design.power.rtg ? sv(data, 'power.rtgOutput') : 0;

  const cost = num(rocket, 'cost_musd') + parts.reduce((s, p) => s + num(p, 'cost_musd'), 0);
  const mass = sv(data, 'mission.baseMass_kg') + rtgMass + parts.reduce((s, p) => s + num(p, 'mass_kg'), 0);

  const instrumentW = instruments.reduce((s, p) => s + num(p, 'power_W'), 0);
  const heatingW = num(site, 'heatingNight_W') * (ins ? ins.heatingFactor : 1);
  const nightW = Math.max(0, sv(data, 'mission.nightLifeSupport_W') + heatingW + instrumentW * sv(data, 'mission.instrumentNightDuty') - rtgW);
  const nightHours = sv(data, 'mars.solLength') / 2;

  return {
    cost,
    budget: sv(data, 'mission.budget_musd'),
    mass,
    capacity: num(rocket, 'capacityToMars_kg'),
    nightNeedKWh: (nightW * nightHours) / 1000,
    batteryKWh: design.power.battery_kWh || 0,
    instrumentDayW: instrumentW,
    transitDays: num(traj, 'transit_days'),
    downlinkMbitPerSol: num(comms, 'dataPerSol_Mbit'),
  };
}
