const test=require('node:test');const assert=require('node:assert/strict');
const m=require('../src/solow-growth-model.cjs');
const close=(a,b,tol=1e-9)=>assert(Math.abs(a-b)<=tol,`${a} != ${b}`);
// [s, a, lam, k0]: baseline from below and above, high saving, high capital share, low depreciation.
const cases=[[.2,1/3,.06,2],[.2,1/3,.06,15],[.6,.3,.08,1],[.25,.6,.05,3],[.1,.4,.02,.5]];

test('the Bernoulli solution starts at k0 and satisfies the differential equation',()=>{
  for(const [s,a,lam,k0] of cases){
    close(m.solution(k0,0,s,a,lam),k0,1e-12*k0);
    for(const t of [1,5,20,60,100]){
      const k=m.solution(k0,t,s,a,lam),h=1e-4;
      const dk=(m.solution(k0,t+h,s,a,lam)-m.solution(k0,t-h,s,a,lam))/(2*h);
      close(dk,m.rate(k,s,a,lam),1e-7*Math.max(1,Math.abs(m.rate(k,s,a,lam))));
    }
  }
});

test('v = k^(1-a) solves the linear equation v\' = (1-a)(s - lam v)',()=>{
  for(const [s,a,lam,k0] of cases)for(const t of [2,10,40]){
    const v=k=>Math.pow(k,1-a),h=1e-4;
    const dv=(v(m.solution(k0,t+h,s,a,lam))-v(m.solution(k0,t-h,s,a,lam)))/(2*h);
    close(dv,(1-a)*(s-lam*v(m.solution(k0,t,s,a,lam))),1e-8);
  }
});

test('k* is an equilibrium where investment equals break-even investment, and solutions approach it',()=>{
  for(const [s,a,lam,k0] of cases){
    const ks=m.steady(s,a,lam);
    close(m.investment(ks,s,a),m.breakEven(ks,lam),1e-12*ks);
    close(m.rate(ks,s,a,lam),0,1e-12*ks);
    close(m.solution(ks,50,s,a,lam),ks,1e-10*ks);
    const far=m.solution(k0,40/m.convergenceRate(a,lam),s,a,lam);close(far,ks,1e-8*ks);
    // Phase line: k rises below k* and falls above it.
    assert(m.rate(ks/2,s,a,lam)>0&&m.rate(2*ks,s,a,lam)<0);
    // Solutions never cross k*: starting below stays below.
    if(k0<ks)for(const t of [1,10,100])assert(m.solution(k0,t,s,a,lam)<ks);
  }
});

test('the linearized rate at k* is -(1-a) lam and sets the half-life',()=>{
  for(const [s,a,lam] of cases){
    const ks=m.steady(s,a,lam),h=1e-6*ks;
    close((m.rate(ks+h,s,a,lam)-m.rate(ks-h,s,a,lam))/(2*h),-m.convergenceRate(a,lam),1e-6);
    // The gap in v halves every half-life.
    const v=k=>Math.pow(k,1-a),vs=v(ks),k0=ks/3,T=m.halfLife(a,lam);
    close((v(m.solution(k0,T,s,a,lam))-vs)/(v(k0)-vs),.5,1e-12);
  }
  close(m.halfLife(1/3,.06),Math.LN2/.04,1e-12); // about 17.3 years
});

test('steady-state consumption is maximized at the golden rule s = a',()=>{
  for(const a of [.25,1/3,.5,.6])for(const lam of [.03,.06,.1]){
    const best=m.steadyConsumption(m.goldenRule(a),a,lam);
    for(const ds of [-.1,-.01,.01,.1])assert(m.steadyConsumption(a+ds,a,lam)<best);
    close(m.steadyConsumption(.3,a,lam),m.consumption(m.steady(.3,a,lam),.3,a),1e-12);
  }
});

test('a saving shock is continuous, keeps the old path before, and converges to the new k*',()=>{
  const [s1,s2,a,lam,k0,T]=[.2,.3,1/3,.06,m.steady(.2,1/3,.06),20];
  for(const t of [0,10,20])close(m.shockPath(k0,t,s1,s2,T,a,lam),m.solution(k0,t,s1,a,lam),1e-12);
  close(m.shockPath(k0,T+1e-9,s1,s2,T,a,lam),m.shockPath(k0,T,s1,s2,T,a,lam),1e-7);
  close(m.shockPath(k0,1000,s1,s2,T,a,lam),m.steady(s2,a,lam),1e-9);
  // Output growth is positive right after the shock and dies out: a level effect, not a growth effect.
  const g=t=>m.outputGrowth(m.shockPath(k0,t,s1,s2,T,a,lam),s2,a,lam);
  assert(g(T+.01)>0.005&&g(T+50)<g(T+5)&&g(T+300)<1e-6);
  close(m.output(m.steady(s2,a,lam),a)/m.output(m.steady(s1,a,lam),a),Math.pow(1.5,.5),1e-12);
});

test('consumption drops when saving rises, recovers, and ends higher below the golden rule',()=>{
  const [s1,s2,a,lam,T]=[.2,.3,1/3,.06,20],k0=m.steady(s1,a,lam);
  const c=t=>m.consumptionPath(k0,t,s1,s2,T,a,lam);
  // Before the shock it is (1 - s) k^a along the old path, constant at the steady state.
  for(const t of [0,10,T])close(c(t),m.steadyConsumption(s1,a,lam),1e-12);
  // At the shock k is unchanged, so c jumps by exactly (1 - s2)/(1 - s1).
  close(c(T+1e-9)/c(T),(1-s2)/(1-s1),1e-7);
  // It then rises monotonically and settles at the new steady state, which is higher since s2 < a.
  for(const t of [T+1,T+10,T+40])assert(c(t+1)>c(t));
  close(c(1000),m.steadyConsumption(s2,a,lam),1e-9);
  assert(c(1000)>c(T));
  // Without a shock (s2 = s1) it is just consumption along the plain solution.
  for(const t of [5,50])close(m.consumptionPath(2,t,s1,s1,T,a,lam),m.consumption(m.solution(2,t,s1,a,lam),s1,a),1e-12);
});

test('cutting an over-saving rate raises consumption at once and keeps it higher',()=>{
  const [a,lam,T]=[1/3,.06,20];
  for(const k0 of [2,20]){
    const keep=t=>m.consumptionPath(k0,t,.6,.6,T,a,lam),cut=t=>m.consumptionPath(k0,t,.6,a,T,a,lam);
    for(const t of [T+1e-9,T+5,T+30,T+100])assert(cut(t)>keep(t));
  }
});

test('Euler steps match hand calculations and converge with order one',()=>{
  const [s,a,lam,k0]=[.2,1/3,.06,2];
  const pts=m.euler(k0,10,20,s,a,lam);
  const k1=2+10*(.2*Math.cbrt(2)-.12);close(pts[1][1],k1,1e-12);
  close(pts[2][1],k1+10*(.2*Math.cbrt(k1)-.06*k1),1e-12);
  const exact=m.solution(k0,50,s,a,lam);
  const err=h=>Math.abs(m.euler(k0,h,50,s,a,lam).at(-1)[1]-exact);
  const r=err(1)/err(.5);assert(r>1.8&&r<2.2,`ratio ${r}`);
  assert(err(.01)<1e-3);
});

test('large Euler steps oscillate around k* and can diverge',()=>{
  const [s,a,lam]=[.2,1/3,.06],ks=m.steady(s,a,lam);
  assert(m.eulerFactor(10,a,lam)>0);assert(m.eulerFactor(40,a,lam)<0&&m.eulerFactor(40,a,lam)>-1);assert(m.eulerFactor(55,a,lam)<-1);
  const osc=m.euler(ks*1.05,40,400,s,a,lam).map(q=>q[1]-ks);
  for(let i=1;i<osc.length;i++)assert(Math.sign(osc[i])!==Math.sign(osc[i-1]));
  assert(Math.abs(osc.at(-1))<Math.abs(osc[0]));
  const div=m.euler(ks*1.05,55,1100,s,a,lam);
  assert(div.length<21||Math.abs(div.at(-1)[1]-ks)>Math.abs(div[0][1]-ks));
  for(const [,k] of div)assert(k>0);
});
