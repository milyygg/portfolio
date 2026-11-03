/* Local dictionaries only: no visitor text is sent to a translation service. */
(() => {
  const key = 'miloserdov-language';
  const query = new URLSearchParams(location.search).get('lang');
  let saved;
  try { saved = localStorage.getItem(key); } catch {}
  let language = ['ru', 'en'].includes(query) ? query : ['ru', 'en'].includes(saved) ? saved : (navigator.languages?.[0] || navigator.language || 'en').toLowerCase().startsWith('ru') ? 'ru' : 'en';
  const dictionaries = window.portfolioTranslations || {};
  const originals = new WeakMap();
  const attributes = new WeakMap();
  const imageSources = new WeakMap();
  let observer;
  let control;
  function translated(value) {
    const trimmed = value.trim();
    if (language === 'ru') return value;
    if(document.body?.hasAttribute('data-service-currency') && /₽/.test(value))return (dictionaries[value.trim()]||value).replace(/([\d\s\u00a0]+)\s*₽/g,(_,n)=>{const rub=Number(n.replace(/\s/g,''));return ' $'+Math.ceil(rub/80.9734)+' / €'+Math.ceil(rub/90.4635);});
    let result = dictionaries[trimmed];
    if (!result) {
      const count = /^(Все проекты|Показано): (\d+)$/.exec(trimmed);
      if (count) result = `${count[1] === 'Все проекты' ? 'All projects' : 'Showing'}: ${count[2]}`;
      const open = /^Открыть (.+) в новой вкладке$/.exec(trimmed);
      if (open) result = `Open ${dictionaries[open[1]] || open[1]} in a new tab`;
      const preview = /^(.+): предпросмотр работы$/.exec(trimmed);
      if (preview) result = `${dictionaries[preview[1]] || preview[1]}: project preview`;
      const visit = /^(Открыть сайт|Смотреть): (.+) \(новая вкладка\)$/.exec(trimmed);
      if (visit) result = `${visit[1] === 'Смотреть' ? 'View' : 'Visit website'}: ${dictionaries[visit[2]] || visit[2]} (new tab)`;
      const addPrice = /^В корзину · (.+)$/.exec(trimmed);
      if (addPrice) result = `Add to cart · ${addPrice[1]}`;
      const addProduct = /^Добавить (.+) в корзину$/.exec(trimmed);
      if (addProduct) result = `Add ${dictionaries[addProduct[1]] || addProduct[1]} to cart`;
      const product = /^(.+) - (.+)$/.exec(trimmed);
      if (product && dictionaries[product[1]] && dictionaries[product[2]]) result = `${dictionaries[product[1]]} - ${dictionaries[product[2]]}`;
      const slide = /^Работа (\d+) из (\d+)$/.exec(trimmed);
      if (slide) result = `Project ${slide[1]} of ${slide[2]}`;
      const artwork = /^(\d+ \/ \d+ · )(.+?)( · Загрузка…| · Не удалось загрузить\. Откройте оригинал\.)?$/.exec(trimmed);
      if (artwork) result = artwork[1] + (dictionaries[artwork[2]] || artwork[2]) + (artwork[3] ? artwork[3].includes('Загрузка') ? ' · Loading…' : ' · Could not load. Open the original.' : '');
      const illustration = /^(.+)\. Иллюстрация создана ИИ\.$/.exec(trimmed);
      if (illustration) result = `${dictionaries[illustration[1]] || illustration[1]}. AI-generated illustration.`;
      const action = /^(Рассмотреть|Настроить|Демонстрационное изображение|В избранное): (.+)$/.exec(trimmed);
      if (action) result = `${{'Рассмотреть':'View','Настроить':'Customize','Демонстрационное изображение':'Demo image','В избранное':'Add to favorites'}[action[1]]}: ${dictionaries[action[2]] || action[2]}`;
      const title = /^(.+) \| (LUMÉ CANDLES|Михаил Милосердов)$/.exec(trimmed);
      if (title && dictionaries[title[1]]) result = `${dictionaries[title[1]]} | ${title[2] === 'Михаил Милосердов' ? 'Mikhail Miloserdov' : title[2]}`;
      const details = /^(.*) Выберите размер, воск и аромат\. Оттенок и детали оформления обсудим при согласовании заказа\.$/.exec(trimmed);
      if (details && dictionaries[details[1]]) result = dictionaries[details[1]] + ' Choose your size, wax and scent. We will discuss the shade and finishing details when confirming your order.';
      const size = /^(\d+-\d+) см$/.exec(trimmed);
      if (size) result = size[1] + ' cm';
      const cart = /^Корзина, (\d+) товар(?:ов|а)?$/.exec(trimmed);
      if (cart) result = `Cart, ${cart[1]} ${cart[1] === '1' ? 'item' : 'items'}`;
      const total = /^Итого: (.+)$/.exec(trimmed);
      if(total)result='Total: '+total[1];
      const stock = /^Артикул (.+) · (Нет в наличии|В наличии: \d+)$/.exec(trimmed);
      if(stock)result=`SKU ${stock[1]} · ${stock[2]==='Нет в наличии'?'Out of stock':stock[2].replace('В наличии:','In stock:')}`;
      const found = /^Найдено: (\d+) · Демонстрационные товары и цены$/.exec(trimmed);
      if(found)result=`Found: ${found[1]} · Demo products and prices`;
      const badge = /^(Избранное|Корзина): (\d+)$/.exec(trimmed);
      if(badge)result=`${badge[1]==='Корзина'?'Cart':'Favorites'}: ${badge[2]}`;
    }
    return result ? value.replace(trimmed, result) : value;
  }
  function update(root = document) {
    observer?.disconnect();
    document.documentElement.lang = language;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest('script,style,[data-language-control]')) continue;
      const previous = originals.get(node);
      const source = previous && node.data === previous.rendered ? previous.source : node.data;
      const rendered = translated(source);
      if (node.data !== rendered) node.data = rendered;
      originals.set(node, {source, rendered});
    }
    for (const element of root.querySelectorAll('[title],[alt],[placeholder],[aria-label],[data-loading-label],meta[name="description"],meta[property="og:title"],meta[property="og:description"]')) {
      if (element.closest('[data-language-control]')) continue;
      const state = attributes.get(element) || {};
      for (const name of ['title','alt','placeholder','aria-label','data-loading-label', ...(element.tagName === 'META' ? ['content'] : [])]) {
        if (!element.hasAttribute(name)) continue;
        const value = element.getAttribute(name);
        const old = state[name];
        const source = old && value === old.rendered ? old.source : value;
        const rendered = translated(source);
        if (value !== rendered) element.setAttribute(name, rendered);
        state[name] = {source,rendered};
      }
      attributes.set(element,state);
    }
    for(const a of root.querySelectorAll('a[data-href-en]')){if(!a.dataset.hrefRu)a.dataset.hrefRu=a.getAttribute('href');a.setAttribute('href',language==='en'?a.dataset.hrefEn:a.dataset.hrefRu);}
    for(const a of root.querySelectorAll('a[data-href-en]')){if(!a.dataset.hrefRu)a.dataset.hrefRu=a.getAttribute('href');a.setAttribute('href',language==='en'?a.dataset.hrefEn:a.dataset.hrefRu);}
    if (control) {
      control.setAttribute('aria-label', language === 'en' ? 'Language' : 'Язык');
      for (const button of control.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.language === language));
    }
    for (const image of root.querySelectorAll('img')) {
      const old = imageSources.get(image);
      const current = image.getAttribute('src');
      const source = old && current === old.rendered ? old.source : current;
      const english = image.dataset.srcEn || window.portfolioLocalizedImages?.[source];
      const rendered = language === 'en' && english ? english : source;
      if(english && image.hasAttribute('srcset')){if(!image.dataset.originalSrcset)image.dataset.originalSrcset=image.getAttribute('srcset');if(language==='en')image.removeAttribute('srcset');else image.setAttribute('srcset',image.dataset.originalSrcset);}
      if (current !== rendered) image.setAttribute('src',rendered);
      imageSources.set(image,{source,rendered});
    }
    observer?.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','alt','placeholder','aria-label','content']});
  }
  function select(value, persist = true) {
    language = value;
    if (persist) { try { localStorage.setItem(key,value); } catch {} }
    const url = new URL(location.href);
    if (url.searchParams.has('lang')) {
      url.searchParams.set('lang', value);
      history.replaceState(history.state, '', url.href);
    }
    update();
    window.dispatchEvent(new CustomEvent('portfolio:language',{detail:{language:value}}));
  }
  window.portfolioLanguage = {get language(){return language;},select,translate:translated};
  function start() {
    const style=document.createElement('style');
    style.textContent='[data-language-control]{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:1000;display:flex;align-items:center;background:#17191e;color:#fff;border:1px solid #666;border-radius:9px;padding:2px;box-shadow:0 3px 16px #0003;font:600 13px/1.2 system-ui,sans-serif}[data-language-control] button{font:inherit;min-width:48px;min-height:44px;border:0;border-radius:5px;background:transparent;color:inherit;cursor:pointer}[data-language-control] button[aria-pressed=true]{background:transparent;color:#ff8a5b;text-decoration:underline;text-underline-offset:5px}[data-language-control] button:focus-visible{outline:3px solid #ff8a5b;outline-offset:2px}';
    document.head.append(style);
    control=document.createElement('div');
    control.dataset.languageControl='';control.setAttribute('role','group');control.setAttribute('aria-label','Language / Язык');
    for(const [value,label] of [['ru','RUS'],['en','ENG']]){
      if(value==='en')control.append(document.createTextNode(' / '));
      const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.language=value;button.lang=value;button.addEventListener('click',()=>select(value));control.append(button);
    }
    document.body.append(control);
    observer=new MutationObserver(()=>update());
    update();
    window.dispatchEvent(new CustomEvent('portfolio:language',{detail:{language}}));
    document.addEventListener('click',event=>{
      const anchor=event.target.closest('a[href]');if(!anchor || anchor.hasAttribute('download'))return;
      const url=new URL(anchor.href,location.href);
      if(url.origin === location.origin && url.pathname === location.pathname && url.hash)return;
      if(url.hostname==='milyygg.github.io' && !/\.(png|jpe?g|webp|pdf|zip)$/i.test(url.pathname)){
        url.searchParams.set('lang',language);anchor.href=url.href;
      }
    },true);
    window.addEventListener('storage',event=>{if(event.key===key && ['ru','en'].includes(event.newValue))select(event.newValue,false);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
