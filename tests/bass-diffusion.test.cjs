const test=require('node:test');const assert=require('node:assert/strict');
const m=require('../src/bass-diffusion-model.cjs');
const close=(a,b,tol=1e-9)=>assert(Math.abs(a-b)<=tol,`${a} != ${b}`);
// [p, q, F0]: typical durable, pure innovation, pure imitation, fast viral, q < p, a seeded market.
const cases=[[.03,.38,0],[.05,0,0],[0,.5,.01],[.01,.9,0],[.2,.1,0],[.03,.38,.3]];

test('the exact solution starts at F0 and satisfies the differential equation',()=>{
  for(const [p,q,F0] of cases){
    close(m.solution(F0,0,p,q),F0,1e-14);
    for(const t of [.5,1,3,8,15,30]){
      const F=m.solution(F0,t,p,q),h=1e-5;
      const dF=(m.solution(F0,t+h,p,q)-m.solution(F0,t-h,p,q))/(2*h);
      close(dF,m.rate(F,p,q),1e-7);
      assert(F>=F0&&F<1);
    }
  }
});

test('the rate splits into innovators and imitators',()=>{
  for(const [p,q] of cases)for(const F of [0,.2,.5,.9,1])close(m.innovators(F,p)+m.imitators(F,q),m.rate(F,p,q),1e-15);
});

test('special cases reduce to the textbook formulas',()=>{
  // q = 0: F' = p(1 - F) is linear, F = 1 - e^{-pt}.
  for(const t of [1,5,20])close(m.solution(0,t,.05,0),1-Math.exp(-.05*t),1e-14);
  // p = 0: F' = qF(1 - F) is the logistic equation of Section 2.1.
  for(const t of [1,5,20]){const e=Math.exp(.5*t);close(m.solution(.01,t,0,.5),.01*e/(1-.01+.01*e),1e-13);}
  // F0 = 0: the standard Bass curve.
  const [p,q]=[.03,.38];
  for(const t of [1,5,20]){const e=Math.exp(-(p+q)*t);close(m.solution(0,t,p,q),(1-e)/(1+q/p*e),1e-14);}
  // Pure word of mouth with no first adopter stays at zero; no persuasion at all stays put.
  assert.equal(m.solution(0,50,0,.5),0);assert.equal(m.solution(.4,50,0,0),.4);
});

test('the solution is finite for long times and tends to the stable equilibrium F = 1',()=>{
  for(const [p,q,F0] of cases){
    const F=m.solution(F0,1e4,p,q);assert(Number.isFinite(F));close(F,1,1e-12);
    if(q>0)close(m.rate(-p/q,p,q),0,1e-15);
    close(m.rate(1,p,q),0);
    assert.deepEqual(m.equilibria(p,q).at(-1),1);
  }
});

test('timeTo inverts the solution',()=>{
  for(const [p,q,F0] of cases)for(const F of [.1,.5,.9]){
    if(F<=F0)continue;
    close(m.solution(F0,m.timeTo(F0,F,p,q),p,q),F,1e-12);
  }
  assert.equal(m.timeTo(0,.5,0,.5),Infinity);
  assert.equal(m.timeTo(0,1,.03,.38),Infinity);
});

test('sales peak at F* = (q - p)/(2q), at time ln(q/p)/(p + q) from an empty market',()=>{
  const [p,q]=[.03,.38],pk=m.peak(0,p,q);
  close(pk.F,(q-p)/(2*q));close(pk.t,Math.log(q/p)/(p+q),1e-12);close(pk.rate,(p+q)**2/(4*q),1e-14);
  // The rate along the solution is maximal at that time.
  for(const dt of [-.5,-.05,.05,.5])assert(m.rate(m.solution(0,pk.t+dt,p,q),p,q)<pk.rate);
  // q <= p: sales are largest at launch.
  const flat=m.peak(0,.2,.1);assert.equal(flat.t,0);assert.equal(flat.F,0);
  // Starting past the vertex: also largest at the start.
  assert.equal(m.peak(.5,.03,.38).t,0);
});

test('the innovator share matches the integral of p(1 - F) over the whole diffusion',()=>{
  for(const [p,q,F0] of cases){
    const T=40/(p+q),n=200000,h=T/n;let sum=0;
    for(let i=0;i<n;i++){const a=m.solution(F0,i*h,p,q),b=m.solution(F0,(i+1)*h,p,q);sum+=h*(m.innovators(a,p)+m.innovators(b,p))/2;}
    close(m.innovatorShare(F0,p,q),sum/(1-F0),1e-6);
    const s=m.innovatorShare(F0,p,q);assert(s>=0&&s<=1);
  }
});
