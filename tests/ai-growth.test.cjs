const test=require('node:test');
const assert=require('node:assert/strict');
const m=require('../src/ai-growth-model.cjs');
const close=(a,b,tol=1e-7)=>assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const config=(mode,extra={})=>({...m.fresh(),mode,...extra});

test('analytic curves satisfy their initial values and differential equations',()=>{
  for(const c of [config('exponential'),config('logistic'),config('logistic',{a0:10}),config('threshold'),config('threshold',{a0:3}),config('threshold',{a0:2}),config('threshold',{delta:0})]){
    close(m.value(c,0),c.a0);
    for(const t of [.05,.2,.6]){
      const h=1e-5,a=m.value(c,t);
      close((m.value(c,t+h)-m.value(c,t-h))/(2*h),m.slope(c,a),1e-6);
    }
  }
});
test('logistic equilibria and both sides of the limiting level are preserved',()=>{
  for(const a0 of [0,6])for(const t of [0,1,10,100])close(m.value(config('logistic',{a0}),t),a0);
  for(const a0 of [1,10]){
    const c=config('logistic',{a0}),v=m.value(c,4);
    assert(a0<6?v>a0&&v<6:v<a0&&v>6);
    close(m.value(c,100),6);
  }
});
test('exponential display includes the full time window without changing scale during playback',()=>{
  for(const a0 of [.01,1,16])for(const r of [.1,.5,1.5])for(const window of [4,8,16]){
    const c=config('exponential',{a0,r,window}),top=m.bounds(c),end=m.value(c,window);
    assert(Number.isFinite(top)&&top>end&&top<2*end);
    assert(m.curve(c,window).every(p=>p.a>=0&&p.a<top));
    assert.equal(m.bounds({...c,progress:1}),top);
    assert(m.bounds({...c,window:2*window})>top);
  }
  assert.equal(m.bounds(config('exponential')),60);
});
test('threshold equilibrium, asymptotic decay and finite-time blow-up are distinct',()=>{
  const low=config('threshold',{a0:1}),at=config('threshold',{a0:2}),high=config('threshold',{a0:3});
  assert.equal(m.blowup(low),Infinity);assert(m.value(low,40)<1e-8);
  assert.equal(m.blowup(at),Infinity);close(m.value(at,100),2);
  const T=m.blowup(high);close(T,2*Math.log(3));
  assert(m.value(high,T-1e-5)>1e5);
  assert.equal(m.value(high,T),null);assert.equal(m.value(high,T+.1),null);
  assert.equal(m.outcome(low).kind,'decay');assert.equal(m.outcome(at).kind,'equilibrium');assert.equal(m.outcome(high).kind,'blowup');
  assert(m.curve(high,8).every(p=>p.t<T&&Number.isFinite(p.a)&&p.a>0));
});
test('zero loss is the quadratic limit; near-threshold values stay on the correct side',()=>{
  const c=config('threshold',{delta:0,alpha:.5,a0:1});
  close(m.blowup(c),2);close(m.value(c,1),2);assert.equal(m.value(c,2),null);
  const low=config('threshold',{a0:2-1e-7}),high=config('threshold',{a0:2+1e-7});
  assert.equal(m.blowup(low),Infinity);assert(Number.isFinite(m.blowup(high)));
  assert(m.value(low,1)<low.a0);assert(m.value(high,1)>high.a0);
  for(const delta of [1e-8,1e-6])close(m.value({...c,delta},.5),m.value(c,.5),1e-5);
});
test('comparison matches the starting capacity and relative rate across all three laws',()=>{
  for(const a0 of [.1,1,6,16])for(const r of [.1,.5,1.5]){
    const configs=m.configurations(config('compare',{a0,r}));
    for(const c of configs){close(m.value(c,0),a0);close(m.relative(c,a0),r);close(m.slope(c,a0),a0*r);}
    close(m.blowup(configs[2]),Math.log(2)/r);
    assert.equal(m.value(configs[2],16),null);
    assert(m.value(configs[0],16)>0&&m.value(configs[1],16)>0);
  }
});
test('textbook exercise and observations matched by two models give their independent expected values',()=>{
  const c=config('threshold',{a0:100,alpha:.001,delta:.02});
  close(m.value(c,50*Math.log(9/8)),200);
  const exp=config('exponential',{r:Math.log(2)}),log=config('logistic',{K:10,r:Math.log(36)/3});
  close(m.value(exp,3),8);close(m.value(log,3),8);close(m.value(exp,6),64);close(m.value(log,6),288/29);
});
test('playback stops before a singularity while comparison can continue other models',()=>{
  const c=config('threshold',{a0:3,progress:1});
  assert(m.time(c)<m.blowup(c));assert(m.value(c,m.time(c))>0);
  assert.equal(m.time(config('compare',{progress:1})),8);
  assert.deepEqual(m.restore(null),m.fresh());
  const restored=m.restore({version:1,mode:'threshold',a0:-3,alpha:Infinity,delta:0,progress:8,window:16,revealed:true});
  assert.equal(restored.a0,.01);assert.equal(restored.alpha,.25);assert.equal(restored.progress,1);assert.equal(restored.window,16);assert.equal(restored.delta,0);
});
