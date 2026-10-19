const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../src/phase-line-model.cjs');
const E = require('../src/euler-model.cjs');
const near = (a,b,tol=1e-8) => assert.ok(Math.abs(a-b)<tol, `${a} ≠ ${b}`);
test('phase signs, equilibria, and attraction on each invariant interval', () => {
  assert.deepEqual([-3,-1,1,3].map(x=>Math.sign(P.slope(x))), [1,-1,-1,1]);
  for(const x of [-2,0,2]) near(P.solution(x,100),x);
  for(const x0 of [-3,-1,-.2,.2,1,1.99,2.01,3]) {
    const t = Math.min(.04,P.blowupTime(x0)/2);
    const x = P.solution(x0,t);
    assert.equal(Math.sign(x-x0),Math.sign(P.slope(x0)));
    near(P.primitive(x)-P.primitive(x0),t);
    near((P.solution(x0,t+1e-6)-P.solution(x0,t-1e-6))/2e-6,P.slope(x),1e-4);
  }
  assert.ok(P.solution(-.3,12)<-.3 && P.solution(-.3,12)>=-2);
  assert.ok(P.solution(.3,12)>0 && P.solution(.3,12)<.3);
});
test('finite-time blowup terminates the solution; display boundary is earlier', () => {
  const T=P.blowupTime(2.5);
  assert.ok(T>0 && Number.isFinite(T));
  assert.equal(P.solution(2.5,T),null);
  assert.equal(P.solution(2.5,T+1),null);
  assert.ok(P.solution(2.5,T*.99)>P.solution(2.5,T*.9));
  const curve=P.trajectory(2.5,1);
  near(curve.at(-1).x,3.2);
  assert.ok(curve.at(-1).t<T);
  near(P.primitive(40),1/160+Math.log(38/42)/16,1e-16);
});
test('lecture Euler steps and exact value, convergence at the same endpoint', () => {
  const p=E.problems.lecture, values=E.solve(p,1);
  [-3,-3.6,-3.32,-1.984,.6192,4.74304].forEach((y,n)=>near(values[n].y,y));
  near(p.exact(0),-3); near(p.exact(5),9.80220022609899);
  near(E.solve(p,.1).at(-1).y,9.214936639619374);
  const errors=[1,.5,.1].map(h=>E.solve(p,h).at(-1).error);
  assert.ok(errors[0]>errors[1] && errors[1]>errors[2]);
  const fine=E.solve(p,.5);
  values.forEach((v,n)=>near(v.x,fine[2*n].x));
});
test('homework preset, exact ODE identities, invalid step handling', () => {
  const p=E.problems.homework;
  near(E.solve(p,.2).at(-1).y,.68);
  near(E.solve(p,.1).at(-1).y,.7122);
  for(const problem of Object.values(E.problems)) for(const x of [0,.2,.4]) {
    near((problem.exact(x+1e-5)-problem.exact(x-1e-5))/2e-5,problem.slope(x,problem.exact(x)));
  }
  assert.throws(()=>E.solve(p,0),RangeError);
  assert.throws(()=>E.solve(p,.3),RangeError);
});
