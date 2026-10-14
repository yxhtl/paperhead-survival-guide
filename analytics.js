'use strict';

if (location.hostname === 'yxhtl.github.io' &&
    location.pathname.startsWith('/paperhead-survival-guide/')) {
  const measurementId = 'G-9JJPLVM56V';
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  const pageUrl = new URL(location.href);
  const debugMode = pageUrl.searchParams.get('analytics_debug') === '1';
  pageUrl.searchParams.delete('analytics_debug');
  window.gtag('config', measurementId, {
    cookie_prefix: 'paperhead',
    cookie_path: '/paperhead-survival-guide/',
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: pageUrl.href,
    ...(debugMode ? { debug_mode: true } : {})
  });
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(tag);
}
