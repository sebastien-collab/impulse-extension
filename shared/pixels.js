/**
 * IMPULSION — Universal Pixel Definitions
 * Central configuration for all supported tracking platforms.
 * Used by: injected.js, content.js, service-worker.js, popup.js
 */
(function(root) {
  'use strict';

  root.IMPULSION_PIXELS = {

    // ─── Google Tag Manager ───────────────────────────────────
    gtm: {
      name: 'Google Tag Manager',
      shortName: 'GTM',
      color: '#4285F4',
      iconLetter: 'GTM',
      globals: ['google_tag_manager'],
      arrayGlobals: ['dataLayer'],
      intercept: [
        { path: 'dataLayer.push', label: 'dataLayer.push' }
      ],
      scriptPatterns: [
        /googletagmanager\.com\/gtm\.js/
      ],
      networkPatterns: [
        /googletagmanager\.com\/gtm\.js/
      ],
      idPatterns: [
        /GTM-[A-Z0-9]{4,8}/
      ],
      domains: ['www.googletagmanager.com']
    },

    // ─── Google Analytics 4 ───────────────────────────────────
    ga4: {
      name: 'Google Analytics 4',
      shortName: 'GA4',
      color: '#E37400',
      iconLetter: 'GA4',
      globals: ['gtag'],
      arrayGlobals: [],
      intercept: [
        { path: 'gtag', label: 'gtag' }
      ],
      scriptPatterns: [
        /googletagmanager\.com\/gtag\/js\?id=G-/
      ],
      networkPatterns: [
        /google-analytics\.com/,
        /analytics\.google\.com/,
        /googletagmanager\.com\/gtag\/js\?id=G-/
      ],
      idPatterns: [
        /G-[A-Z0-9]{6,12}/
      ],
      domains: ['www.google-analytics.com', 'analytics.google.com']
    },

    // ─── Google Ads ───────────────────────────────────────────
    gads: {
      name: 'Google Ads',
      shortName: 'GAds',
      color: '#FBBC04',
      iconLetter: 'AW',
      globals: [],
      arrayGlobals: [],
      intercept: [],
      scriptPatterns: [
        /googletagmanager\.com\/gtag\/js\?id=AW-/
      ],
      networkPatterns: [
        /googleads\.g\.doubleclick\.net/,
        /www\.googleadservices\.com\/pagead/,
        /googletagmanager\.com\/gtag\/js\?id=AW-/
      ],
      idPatterns: [
        /AW-\d{7,12}(?:\/[A-Za-z0-9_-]+)?/
      ],
      domains: ['googleads.g.doubleclick.net', 'www.googleadservices.com']
    },

    // ─── Meta / Facebook Pixel ────────────────────────────────
    meta: {
      name: 'Meta Pixel',
      shortName: 'Meta',
      color: '#0081FB',
      iconLetter: 'f',
      globals: ['fbq', '_fbq'],
      arrayGlobals: [],
      intercept: [
        { path: 'fbq', label: 'fbq' }
      ],
      scriptPatterns: [
        /connect\.facebook\.net\/.*\/fbevents\.js/
      ],
      networkPatterns: [
        /www\.facebook\.com\/tr/,
        /connect\.facebook\.net\/.*\/fbevents\.js/
      ],
      idPatterns: [
        /\b\d{15,16}\b/
      ],
      domains: ['connect.facebook.net', 'www.facebook.com']
    },

    // ─── TikTok Pixel ────────────────────────────────────────
    tiktok: {
      name: 'TikTok Pixel',
      shortName: 'TikTok',
      color: '#000000',
      iconLetter: 'TT',
      globals: ['ttq'],
      arrayGlobals: [],
      intercept: [
        { path: 'ttq.load', label: 'ttq.load' },
        { path: 'ttq.page', label: 'ttq.page' },
        { path: 'ttq.track', label: 'ttq.track' },
        { path: 'ttq.identify', label: 'ttq.identify' }
      ],
      scriptPatterns: [
        /analytics\.tiktok\.com/
      ],
      networkPatterns: [
        /analytics\.tiktok\.com/
      ],
      idPatterns: [
        /[A-Z0-9]{20}/
      ],
      domains: ['analytics.tiktok.com']
    },

    // ─── LinkedIn Insight Tag ─────────────────────────────────
    linkedin: {
      name: 'LinkedIn Insight',
      shortName: 'LinkedIn',
      color: '#0A66C2',
      iconLetter: 'in',
      globals: ['_linkedin_data_partner_ids', '_linkedin_data_partner_id'],
      arrayGlobals: [],
      intercept: [],
      scriptPatterns: [
        /snap\.licdn\.com\/li\.lms-analytics/
      ],
      networkPatterns: [
        /px\.ads\.linkedin\.com/,
        /snap\.licdn\.com/,
        /ads\.linkedin\.com/
      ],
      idPatterns: [
        /\b\d{5,10}\b/
      ],
      domains: ['px.ads.linkedin.com', 'snap.licdn.com', 'ads.linkedin.com']
    },

    // ─── Pinterest Tag ────────────────────────────────────────
    pinterest: {
      name: 'Pinterest Tag',
      shortName: 'Pinterest',
      color: '#E60023',
      iconLetter: 'P',
      globals: ['pintrk'],
      arrayGlobals: [],
      intercept: [
        { path: 'pintrk', label: 'pintrk' }
      ],
      scriptPatterns: [
        /s\.pinimg\.com\/ct\/core\.js/
      ],
      networkPatterns: [
        /ct\.pinterest\.com/,
        /s\.pinimg\.com\/ct/
      ],
      idPatterns: [
        /\b\d{13}\b/
      ],
      domains: ['ct.pinterest.com', 's.pinimg.com']
    },

    // ─── Snapchat Pixel ──────────────────────────────────────
    snapchat: {
      name: 'Snapchat Pixel',
      shortName: 'Snap',
      color: '#FFFC00',
      iconLetter: 'S',
      globals: ['snaptr'],
      arrayGlobals: [],
      intercept: [
        { path: 'snaptr', label: 'snaptr' }
      ],
      scriptPatterns: [
        /sc-static\.net\/scevent\.min\.js/
      ],
      networkPatterns: [
        /tr\.snapchat\.com/,
        /sc-static\.net\/scevent/
      ],
      idPatterns: [
        /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/
      ],
      domains: ['tr.snapchat.com', 'sc-static.net']
    },

    // ─── Twitter / X Pixel ───────────────────────────────────
    twitter: {
      name: 'Twitter/X Pixel',
      shortName: 'X',
      color: '#000000',
      iconLetter: 'X',
      globals: ['twq'],
      arrayGlobals: [],
      intercept: [
        { path: 'twq', label: 'twq' }
      ],
      scriptPatterns: [
        /static\.ads-twitter\.com\/uwt\.js/
      ],
      networkPatterns: [
        /ads-twitter\.com/,
        /analytics\.twitter\.com/,
        /t\.co\/i\/adsct/
      ],
      idPatterns: [
        /[a-z0-9]{5,}/
      ],
      domains: ['static.ads-twitter.com', 'analytics.twitter.com']
    },

    // ─── Microsoft / Bing UET ────────────────────────────────
    bing: {
      name: 'Microsoft UET',
      shortName: 'Bing',
      color: '#00A4EF',
      iconLetter: 'B',
      globals: [],
      arrayGlobals: ['uetq'],
      intercept: [
        { path: 'uetq.push', label: 'uetq.push' }
      ],
      scriptPatterns: [
        /bat\.bing\.com\/bat\.js/
      ],
      networkPatterns: [
        /bat\.bing\.com/
      ],
      idPatterns: [
        /\b\d{7,9}\b/
      ],
      domains: ['bat.bing.com']
    }
  };

  // Build flat list of all domains for webRequest filter
  root.IMPULSION_ALL_DOMAINS = [];
  var seen = {};
  Object.keys(root.IMPULSION_PIXELS).forEach(function(key) {
    root.IMPULSION_PIXELS[key].domains.forEach(function(d) {
      if (!seen[d]) {
        seen[d] = true;
        root.IMPULSION_ALL_DOMAINS.push(d);
      }
    });
  });

  // Build webRequest URL filter patterns
  root.IMPULSION_URL_FILTERS = root.IMPULSION_ALL_DOMAINS.map(function(d) {
    return '*://' + d + '/*';
  });

})(typeof window !== 'undefined' ? window : self);
