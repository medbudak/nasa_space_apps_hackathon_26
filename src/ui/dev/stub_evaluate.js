// DEV STUB (owner: K3) — a proposal for K1's engineering.js `evaluateDesign(design, data)`.
// D-003 says formulas live only in src/core/engineering.js, so this file is for the dev page
// until K1 publishes the real function. The return shape is what design.js reads.
//
// Night energy model (simplified, to be reviewed by K1):
//   nightNeedKWh = (lifeSupportNightW + heatingNightW(site) * heatingFactor(insulation)
//                   + sum(instrument powerW) * instrumentNightDuty - continuousW(power source))
//                  * nightHours / 1000

const val = (o, k) => (o && o[k] ? o[k].value : 0);
const find = (list, id) => list.find((x) => x.id === id);

export function evaluateDesign(design, data) {
  const r = data.rules;
  const rocket = find(data.launchVehicles, design.rocketId);
  const traj = find(data.trajectories, design.trajectoryId);
  const site = find(data.landingSites, design.siteId);
  const power = find(data.powerSources, design.powerId);
  const battery = find(data.batteries, design.batteryId);
  const ins = find(data.insulation, design.insulationId);
  const comms = find(data.comms, design.commsId);
  const kits = find(data.spareKits, design.spareKitsId);
  const instruments = design.instrumentIds.map((id) => find(data.instruments, id)).filter(Boolean);

  const parts = [traj, power, battery, ins, comms, kits, ...instruments];
  const cost = val(rocket, 'costMUSD') + parts.reduce((s, p) => s + val(p, 'costMUSD'), 0);
  const mass = r.baseMassKg.value + parts.reduce((s, p) => s + val(p, 'massKg'), 0);

  const instrumentW = instruments.reduce((s, p) => s + val(p, 'powerW'), 0);
  const heatingW = val(site, 'heatingNightW') * (ins ? val(ins, 'heatingFactor') : 1);
  const nightW = Math.max(0, r.lifeSupportNightW.value + heatingW
    + instrumentW * r.instrumentNightDuty.value - val(power, 'continuousW'));

  return {
    cost,
    budget: r.budgetMUSD.value,
    mass,
    capacity: val(rocket, 'capacityKg'),
    nightNeedKWh: (nightW * r.nightHours.value) / 1000,
    batteryKWh: val(battery, 'capacityKWh'),
    instrumentDayW: instrumentW,
    transitDays: val(traj, 'transitDays'),
    downlinkMbitPerSol: val(comms, 'mbitPerSol'),
  };
}
