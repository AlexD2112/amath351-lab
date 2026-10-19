(function (root) {
  'use strict';
  const slope = x => x * x * (x * x - 4);
  const equilibria = Object.freeze([-2, 0, 2]);
  // H'(x) = 1/f(x). Invert H(x(t)) = H(x0) + t on one invariant interval.
  function primitive(x) {
    if (x === -2 || x === 0) return Infinity;
    if (x === 2) return -Infinity;
    if (Math.abs(x) > 32) {
      let sum = 0, power = 1 / (x * x * x), coefficient = 1;
      for (let n = 0; n < 10; n++) {
        sum -= coefficient * power / (2 * n + 3);
        power /= x * x; coefficient *= 4;
      }
      return sum;
    }
    return 1 / (4 * x) + Math.log(Math.abs((x - 2) / (x + 2))) / 16;
  }
  const blowupTime = x0 => x0 > 2 ? -primitive(x0) : Infinity;
  function solution(x0, t) {
    if (!Number.isFinite(x0) || !Number.isFinite(t) || t < 0) throw new RangeError('Use finite x0 and t ≥ 0.');
    if (t === 0 || equilibria.includes(x0)) return x0;
    if (t >= blowupTime(x0)) return null; // No finite solution at/after blowup.
    const target = primitive(x0) + t;
    let lo, hi, increasing;
    if (x0 < -2) { lo = x0; hi = -2; increasing = true; }
    else if (x0 < 0) { lo = -2; hi = x0; increasing = false; }
    else if (x0 < 2) { lo = 0; hi = x0; increasing = false; }
    else {
      lo = x0; hi = 2 * x0; increasing = true;
      while (primitive(hi) < target) hi *= 2;
    }
    for (let n = 0; n < 70; n++) {
      const mid = (lo + hi) / 2;
      if (mid === lo || mid === hi) break;
      if ((primitive(mid) < target) === increasing) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }
  function trajectory(x0, end, ceiling = 3.2, samples = 320) {
    const exit = x0 > 2 && x0 < ceiling ? primitive(ceiling) - primitive(x0) : Infinity;
    const last = Math.min(end, exit);
    return Array.from({length: samples + 1}, (_, i) => {
      const t = last * i / samples;
      return {t, x: solution(x0, t)};
    });
  }
  function behavior(x0) {
    if (equilibria.includes(x0)) return `Equilibrium: x(t) = ${x0} for all t.`;
    if (x0 < 0) return `${x0 < -2 ? 'Increasing' : 'Decreasing'} toward −2 as t → ∞. The solution never crosses −2.`;
    if (x0 < 2) return 'Decreasing toward 0 as t → ∞. From above, 0 attracts; the solution never reaches or crosses 0 in finite time.';
    return 'Increasing without bound in finite time. Leaving the plot is not the same as reaching infinity.';
  }
  const api = Object.freeze({slope, equilibria, primitive, blowupTime, solution, trajectory, behavior});
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Amath351Phase = api;
})(globalThis);
