(() => {
  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const control = document.querySelector('[data-motion-control]');
  let manualOff = false;
  try { manualOff = localStorage.getItem('portfolio-motion') === 'off'; } catch {}
  const hero = document.querySelector('.hero');
  const portrait = document.querySelector('.hero .photo');
  const headline = document.querySelector('.hero h1');
  let frame = 0;
  let entrance = [];
  let observer;
  const enabled = () => !manualOff && !preference.matches;
  function update() {
    frame = 0;
    if (!enabled() || !hero) return;
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const mobile = innerWidth < 760;
    const travel = Math.max(0, Math.min(1, -rect.top / rect.height));
    if (portrait) portrait.style.transform = `translate3d(0,${travel * (mobile ? 18 : 62)}px,0) rotate(${travel * (mobile ? .5 : 1.6)}deg)`;
    if (headline) headline.style.transform = `translate3d(0,${travel * -28}px,0)`;
  }
  function schedule() { if (!frame && enabled()) frame = requestAnimationFrame(update); }
  function sync() {
    root.dataset.motion = enabled() ? 'on' : 'off';
    if (control) {
      control.hidden = false;
      control.textContent = preference.matches ? 'Движение отключено системой' : enabled() ? 'Отключить анимацию' : 'Включить анимацию';
      control.disabled = preference.matches;
      control.setAttribute('aria-pressed', String(enabled()));
    }
    if (!enabled()) {
      entrance.forEach(animation => animation.cancel());
      observer?.disconnect();
      if (portrait) portrait.style.transform = '';
      if (headline) headline.style.transform = '';
      document.querySelectorAll('.fade').forEach(element => element.getAnimations().forEach(animation => animation.cancel()));
    } else schedule();
  }
  control?.addEventListener('click', () => {
    manualOff = !manualOff;
    try { localStorage.setItem('portfolio-motion', manualOff ? 'off' : 'on'); } catch {}
    sync();
  });
  preference.addEventListener('change', sync);
  sync();
  if (enabled() && Element.prototype.animate) {
    entrance = [...document.querySelectorAll('.hero h1,.hero .sub,.hero__cta,.hero .photo')].map((element,index) => element.animate(
      [{opacity:0,transform:`translate3d(0,${index === 3 ? 30 : 22}px,0)`},{opacity:1,transform:'translate3d(0,0,0)'}],
      {duration:index === 3 ? 900 : 650,delay:index*85,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}
    ));
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        const element=entry.target;
        if (enabled() && !(element.matches('.work') && CSS.supports('animation-timeline:view()'))) {
          element.animate([{opacity:.3,transform:'translate3d(0,34px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
        }
        observer.unobserve(element);
      }
    },{threshold:.08});
    document.querySelectorAll('.fade').forEach(element => observer.observe(element));
  }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
})();
