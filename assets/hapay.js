/* =========================================================
   HAPAY — спільні налаштування для всіх сторінок сайту
   Пиксель / Google Ads / прийом заявок — заповнюємо ТУТ один раз
   ========================================================= */
var HAPAY_CFG = {
  PIXEL_ID: "2231438084083789",
  TT_PIXEL: "DB3O13RC77U534NEJBLG",       // TikTok Pixel          // Meta Pixel ID, напр. "1234567890123456"
  GADS_ID: "",           // Google Ads, напр. "AW-123456789"
  GADS_LEAD_LABEL: "",   // мітка конверсії "Заявка", напр. "AbCdEfGh"
  ORDER_ENDPOINT: "https://script.google.com/macros/s/AKfycbys8X1zj7HmTgMQv0IkFc-H-Ot2EFlFg4H5kP61iqcJOePnT3rxUEloQxwLxxBHBwBcMg/exec"  // таблиця + Telegram
};

(function(){
  var C = HAPAY_CFG, KEY = "hapay_src";
  /* ---- UTM / fbclid / gclid: перше джерело зберігаємо на 30 днів ---- */
  var q = new URLSearchParams(location.search), src = {};
  ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid","gclid","ttclid"].forEach(function(k){ if(q.get(k)) src[k]=q.get(k); });
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || "null"); } catch(e){}
  if (saved && Date.now() - saved.t > 30*864e5) saved = null;
  if (Object.keys(src).length){ saved = {t:Date.now(), p:src, landing:location.pathname}; try{localStorage.setItem(KEY, JSON.stringify(saved))}catch(e){} }

  /* ---- Meta Pixel ---- */
  if (C.PIXEL_ID){
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', C.PIXEL_ID); fbq('track','PageView');
  }
  /* ---- TikTok Pixel ---- */
  if (C.TT_PIXEL){
    !function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
    ttq.load(C.TT_PIXEL); ttq.page();}(window, document, 'ttq');
  }
  /* ---- Google Ads ---- */
  if (C.GADS_ID){
    var g=document.createElement("script"); g.async=true; g.src="https://www.googletagmanager.com/gtag/js?id="+C.GADS_ID; document.head.appendChild(g);
    window.dataLayer=window.dataLayer||[]; window.gtag=function(){dataLayer.push(arguments)}; gtag('js',new Date()); gtag('config',C.GADS_ID);
  }

  var fired = {};
  window.HAPAY = {
    /* подія по товару: HAPAY.track("ViewContent", {id:"tovar-1", name:"...", value:799}) */
    track: function(ev, p, once){
      if (once){ if(fired[ev]) return; fired[ev]=1; }
      var d = {content_ids:[p.id], content_name:p.name, content_type:"product", value:p.value, currency:"UAH"};
      if (window.fbq) fbq('track', ev, d);
      if (window.ttq) ttq.track(ev==="Lead"?"SubmitForm":ev, {contents:[{content_id:p.id, content_name:p.name, content_type:"product"}], value:p.value, currency:"UAH"});
      if (window.gtag){
        if (ev==="Lead" && C.GADS_LEAD_LABEL) gtag('event','conversion',{send_to:C.GADS_ID+"/"+C.GADS_LEAD_LABEL, value:p.value, currency:"UAH"});
        else gtag('event', ev==="ViewContent"?"view_item":ev==="InitiateCheckout"?"begin_checkout":ev, {value:p.value, currency:"UAH", items:[{item_id:p.id, item_name:p.name}]});
      }
    },
    /* джерело: поточні параметри або збережене перше джерело */
    source: function(){
      var cur = {}; q.forEach(function(v,k){cur[k]=v});
      return { now: cur, first: saved ? saved.p : {}, firstLanding: saved ? saved.landing : "" };
    },
    /* відправка заявки */
    order: function(data, done){
      var s = HAPAY.source();
      data.utm_source = s.now.utm_source || s.first.utm_source || "";
      data.utm_campaign = s.now.utm_campaign || s.first.utm_campaign || "";
      data.utm_content = s.now.utm_content || s.first.utm_content || "";
      data.src = JSON.stringify(s);
      data.page = location.origin + location.pathname;
      data.time = new Date().toISOString();
      if (!C.ORDER_ENDPOINT){ console.log("ORDER", data); done(); return; }
      fetch(C.ORDER_ENDPOINT,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain"},body:JSON.stringify(data)}).then(done).catch(done);
    }
  };
})();
