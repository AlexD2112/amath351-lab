(function (root) {
  'use strict';
  const problems = Object.freeze({
    lecture: Object.freeze({label: 'Lecture: y′ = x + 0.2y, y(0) = −3', equation: 'y′ = x + 0.2y', initial: -3, end: 5, steps: [1, .5, .2, .1, .05], domain: [-5, 11], slope: (x,y) => x + .2*y, exact: x => 22*Math.exp(x/5)-5*x-25, formula: 'y(x) = 22eˣ⁄⁵ − 5x − 25'}),
    homework: Object.freeze({label: 'HW 2: y′ = x − y, y(0) = 1', equation: 'y′ = x − y', initial: 1, end: .4, steps: [.2, .1, .05, .025], domain: [.4, 1.1], slope: (x,y) => x-y, exact: x => x-1+2*Math.exp(-x), formula: 'y(x) = x − 1 + 2e⁻ˣ'})
  });
  function solve(problem, h) {
    if (!(h > 0) || !Number.isFinite(h)) throw new RangeError('Step size must be positive and finite.');
    const count = Math.round(problem.end / h);
    if (count < 1 || count > 10000 || Math.abs(count*h-problem.end) > 1e-9) throw new RangeError('Step size must divide the interval.');
    let y = problem.initial;
    return Array.from({length: count+1}, (_, n) => {
      const x = n*h, slope = problem.slope(x,y);
      const point = {n, x, y, slope, error: Math.abs(y-problem.exact(x))};
      y += h*slope;
      return point;
    });
  }
  const api = Object.freeze({problems, solve});
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Amath351Euler = api;
})(globalThis);
