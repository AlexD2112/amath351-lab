const test=require('node:test');const assert=require('node:assert/strict');
const m=require('../src/michaelis-menten-model.cjs');
const close=(a,b,tol=1e-9)=>assert(Math.abs(a-b)<=tol,`${a} != ${b}`);
const cases=[[5,1,1],[0.1,4,0.1],[10,0.1,5],[10,4,0.1],[0.1,0.1,5],[2.3,2.5,0.7]];

test('the implicit solution passes through the initial value and satisfies the equation',()=>{
  for(const [s0,v,k] of cases){
    close(m.solution(s0,0,v,k),s0,1e-12*s0);
    for(const t of [.1,.5,1,2,5,10]){
      const s=m.solution(s0,t,v,k),h=1e-5*Math.max(1,t);
      const ds=(m.solution(s0,t+h,v,k)-m.solution(s0,t-h,v,k))/(2*h);
      close(k*Math.log(s/s0)+s-s0,-v*t,1e-9*Math.max(1,v*t));
      close(ds,-m.rate(s,v,k),1e-6*Math.max(1e-3,m.rate(s,v,k)));
      assert(s>0&&s<s0);
    }
  }
});

test('Newton solves u + ln u = L across extreme arguments',()=>{
  for(const L of [-700,-40,-5,-1,0,1,2,10,100,1e6]){
    const u=m.solveU(L);assert(u>0);close(u+Math.log(u),L,1e-10*Math.max(1,Math.abs(L)));
  }
});

test('the rate saturates at Vmax with half speed at K_M',()=>{
  for(const [,v,k] of cases){close(m.rate(k,v,k),v/2);assert(m.rate(1e9,v,k)<v);close(m.rate(1e9,v,k),v,1e-8*v);}
});

test('the full model keeps the enzyme constraint and conserves S + C + P',()=>{
  for(const [s0,v,k] of cases)for(const e0 of [m.minEnzyme(v,k),1,40]){
    if(e0<m.minEnzyme(v,k))continue;
    const {kc,kr}=m.fullRates(v,k,e0);
    close(kc*e0,v,1e-12);close(kr+kc,k,1e-12);assert(kr>=0);
    const sim=m.simulateFull(e0,kr,kc,s0,10,200);
    let p=0;
    for(let i=0;i<=200;i++){
      const s=sim.S[i],c=sim.C[i];
      assert(s>-1e-9&&c>-1e-9&&c<=e0+1e-9&&s+c<=s0+1e-9);
      if(i){p+=kc*(sim.C[i-1]+c)/2*(10/200);} // product by the trapezoid rule
    }
    close(sim.S[200]+sim.C[200]+p,s0,2e-3*s0);
  }
});

test('with little enzyme the full model approaches the reduced model, with error of order epsilon',()=>{
  // With k1 = 1, e0 >= Vmax/K_M, so a small epsilon = e0/(s0 + K_M) needs a small Vmax/K_M.
  for(const [s0,v,k] of [[10,0.02,5],[5,0.01,4],[2,0.01,3]])for(const eps of [.01,.002]){
    const e0=eps*(s0+k);assert(e0>=m.minEnzyme(v,k));
    const {kc,kr}=m.fullRates(v,k,e0),sim=m.simulateFull(e0,kr,kc,s0,10,200);
    assert(m.maxRelativeGap(sim,s0,v,k,10)<2*eps);
    close(m.peakRate(e0,kr,kc,s0),m.rate(s0,v,k),2*eps*m.rate(s0,v,k));
  }
});

test('with a lot of enzyme the reduced model fails and the measured rate stays below Vmax',()=>{
  const [s0,v,k,e0]=[1,1,1,100],{kc,kr}=m.fullRates(v,k,e0);
  const sim=m.simulateFull(e0,kr,kc,s0,10,200);
  assert(m.maxRelativeGap(sim,s0,v,k,10)>0.3);
  for(const s of [.25,1,5,10]){const r=m.peakRate(e0,kr,kc,s);assert(r>0&&r<=v+1e-12);}
});
