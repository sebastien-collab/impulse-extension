/**
 * IMPULSE — Background Service Worker
 *
 * Responsibilities:
 * 1. Register MAIN world content script (injected.js)
 * 2. Monitor network requests via webRequest API
 * 3. Receive pixel data from content scripts
 * 4. Maintain per-tab state (pixels + events)
 * 5. Update toolbar badge
 * 6. Respond to popup queries
 */

importScripts('../shared/pixels.js');

// ═══════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// Map<tabId, { pixels: Map<platform, PixelData>, events: Array }>
var tabStore = new Map();

function getTabData(tabId) {
  if (!tabStore.has(tabId)) {
    tabStore.set(tabId, {
      pixels: new Map(),
      events: []
    });
  }
  return tabStore.get(tabId);
}

function addPixelDetection(tabId, platform, pixelId, source) {
  var config = self.IMPULSE_PIXELS[platform];
  if (!config) return;

  var tabData = getTabData(tabId);

  if (!tabData.pixels.has(platform)) {
    tabData.pixels.set(platform, {
      platform: platform,
      name: config.name,
      shortName: config.shortName,
      color: config.color,
      iconLetter: config.iconLetter,
      ids: new Set(),
      detectedVia: new Set(),
      firstSeen: Date.now(),
      lastSeen: Date.now()
    });
  }

  var pixel = tabData.pixels.get(platform);
  if (pixelId) pixel.ids.add(pixelId);
  pixel.detectedVia.add(source);
  pixel.lastSeen = Date.now();

  updateBadge(tabId);
  persistTabData(tabId);
}

function addEvent(tabId, platform, eventData) {
  var tabData = getTabData(tabId);

  tabData.events.push({
    platform: platform,
    fn: eventData.fn || eventData.function || 'unknown',
    args: eventData.args || null,
    timestamp: eventData.timestamp || Date.now()
  });

  // Cap at 500 events per tab
  if (tabData.events.length > 500) {
    tabData.events = tabData.events.slice(-500);
  }

  // Mark pixel as detected if not already
  addPixelDetection(tabId, platform, null, 'event');
}

// ═══════════════════════════════════════════════════════════════
// PERSISTENCE — chrome.storage.session
// ═══════════════════════════════════════════════════════════════

function persistTabData(tabId) {
  var tabData = tabStore.get(tabId);
  if (!tabData) return;

  var serializable = {
    pixels: {},
    events: tabData.events
  };

  tabData.pixels.forEach(function(pixel, platform) {
    serializable.pixels[platform] = {
      platform: pixel.platform,
      name: pixel.name,
      shortName: pixel.shortName,
      color: pixel.color,
      iconLetter: pixel.iconLetter,
      ids: Array.from(pixel.ids),
      detectedVia: Array.from(pixel.detectedVia),
      firstSeen: pixel.firstSeen,
      lastSeen: pixel.lastSeen
    };
  });

  chrome.storage.session.set({ ['tab_' + tabId]: serializable }).catch(function() {});
}

function restoreTabData(tabId) {
  return chrome.storage.session.get('tab_' + tabId).then(function(result) {
    var stored = result['tab_' + tabId];
    if (!stored) return null;

    var tabData = {
      pixels: new Map(),
      events: stored.events || []
    };

    Object.keys(stored.pixels).forEach(function(platform) {
      var p = stored.pixels[platform];
      tabData.pixels.set(platform, {
        platform: p.platform,
        name: p.name,
        shortName: p.shortName,
        color: p.color,
        iconLetter: p.iconLetter,
        ids: new Set(p.ids),
        detectedVia: new Set(p.detectedVia),
        firstSeen: p.firstSeen,
        lastSeen: p.lastSeen
      });
    });

    tabStore.set(tabId, tabData);
    return tabData;
  }).catch(function() { return null; });
}

// ═══════════════════════════════════════════════════════════════
// BADGE
// ═══════════════════════════════════════════════════════════════

function updateBadge(tabId) {
  var tabData = tabStore.get(tabId);
  var count = tabData ? tabData.pixels.size : 0;

  chrome.action.setBadgeText({
    text: count > 0 ? String(count) : '',
    tabId: tabId
  }).catch(function() {});

  chrome.action.setBadgeBackgroundColor({
    color: count > 0 ? '#6366F1' : '#666666',
    tabId: tabId
  }).catch(function() {});
}

// ═══════════════════════════════════════════════════════════════
// NETWORK MONITORING (webRequest)
// ═══════════════════════════════════════════════════════════════

// Build URL patterns from pixel config
var urlPatterns = self.IMPULSE_URL_FILTERS || ['<all_urls>'];

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (details.tabId < 0) return; // non-tab requests (e.g., service worker)

    var url = details.url;
    var pixelKeys = Object.keys(self.IMPULSE_PIXELS);

    for (var i = 0; i < pixelKeys.length; i++) {
      var platform = pixelKeys[i];
      var config = self.IMPULSE_PIXELS[platform];

      for (var j = 0; j < config.networkPatterns.length; j++) {
        if (config.networkPatterns[j].test(url)) {
          // Extract pixel ID from URL
          var extractedId = null;
          for (var k = 0; k < config.idPatterns.length; k++) {
            var idMatch = url.match(config.idPatterns[k]);
            if (idMatch) {
              extractedId = idMatch[0];
              break;
            }
          }

          addPixelDetection(details.tabId, platform, extractedId, 'network');
          addEvent(details.tabId, platform, {
            fn: 'network_request',
            args: {
              url: url,
              method: details.method || 'GET',
              type: details.type
            }
          });

          return; // matched — stop checking other platforms for this request
        }
      }
    }
  },
  { urls: urlPatterns }
);

// ═══════════════════════════════════════════════════════════════
// MESSAGE HANDLING
// ═══════════════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  // Messages from content scripts have sender.tab
  var tabId = sender.tab ? sender.tab.id : null;

  // Message from popup (no tab)
  if (!tabId) {
    if (message.type === 'get_tab_data') {
      handleGetTabData(message.tabId, sendResponse);
      return true; // async response
    }
    return;
  }

  // Messages from content script
  switch (message.type) {

    case 'global_found':
      if (message.data && message.data.platform) {
        addPixelDetection(tabId, message.data.platform, null, 'global:' + (message.data.global || ''));
      }
      break;

    case 'event_captured':
      if (message.data && message.data.platform) {
        var platform = message.data.platform;

        // Classify gtag calls: GA4 vs Google Ads
        if (platform === 'ga4' && message.data.args) {
          var argsStr = typeof message.data.args === 'string'
            ? message.data.args
            : JSON.stringify(message.data.args);
          if (argsStr.indexOf('AW-') !== -1) {
            platform = 'gads';
          }
        }

        addEvent(tabId, platform, {
          fn: message.data.fn,
          args: message.data.args
        });

        // Try to extract pixel ID from event args
        extractIdFromArgs(tabId, platform, message.data.args);
      }
      break;

    case 'dom_scan_results':
      if (Array.isArray(message.data)) {
        for (var i = 0; i < message.data.length; i++) {
          var item = message.data[i];
          addPixelDetection(tabId, item.platform, item.id, 'dom:' + item.source);
        }
      }
      break;
  }
});

function extractIdFromArgs(tabId, platform, args) {
  if (!args) return;
  var config = self.IMPULSE_PIXELS[platform];
  if (!config) return;

  var argsStr = typeof args === 'string' ? args : JSON.stringify(args);

  for (var i = 0; i < config.idPatterns.length; i++) {
    var match = argsStr.match(config.idPatterns[i]);
    if (match) {
      addPixelDetection(tabId, platform, match[0], 'event_args');
      return;
    }
  }
}

function handleGetTabData(tabId, sendResponse) {
  var tabData = tabStore.get(tabId);

  if (tabData) {
    sendResponse(serializeTabData(tabData));
    return;
  }

  // Try restoring from session storage
  restoreTabData(tabId).then(function(restored) {
    if (restored) {
      sendResponse(serializeTabData(restored));
    } else {
      sendResponse({ pixels: [], events: [] });
    }
  });
}

function serializeTabData(tabData) {
  var pixels = [];
  tabData.pixels.forEach(function(pixel) {
    pixels.push({
      platform: pixel.platform,
      name: pixel.name,
      shortName: pixel.shortName,
      color: pixel.color,
      iconLetter: pixel.iconLetter,
      ids: Array.from(pixel.ids),
      detectedVia: Array.from(pixel.detectedVia),
      firstSeen: pixel.firstSeen,
      lastSeen: pixel.lastSeen
    });
  });

  // Return last 200 events
  var events = tabData.events.slice(-200);

  return { pixels: pixels, events: events };
}

// ═══════════════════════════════════════════════════════════════
// TAB LIFECYCLE
// ═══════════════════════════════════════════════════════════════

chrome.tabs.onRemoved.addListener(function(tabId) {
  tabStore.delete(tabId);
  chrome.storage.session.remove('tab_' + tabId).catch(function() {});
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
  if (changeInfo.status === 'loading') {
    // Page navigation — clear old data
    tabStore.delete(tabId);
    chrome.storage.session.remove('tab_' + tabId).catch(function() {});
    updateBadge(tabId);
  }
});

// ═══════════════════════════════════════════════════════════════
// INSTALL / STARTUP — Register MAIN world content script
// ═══════════════════════════════════════════════════════════════

async function registerInjectedScript() {
  try {
    await chrome.scripting.unregisterContentScripts({ ids: ['impulse-injected'] });
  } catch (e) {
    // Not registered yet — that's fine
  }

  await chrome.scripting.registerContentScripts([{
    id: 'impulse-injected',
    matches: ['http://*/*', 'https://*/*'],
    js: ['content/injected.js'],
    runAt: 'document_start',
    world: 'MAIN',
    allFrames: false
  }]);
}

chrome.runtime.onInstalled.addListener(function() {
  registerInjectedScript();
});

chrome.runtime.onStartup.addListener(function() {
  registerInjectedScript();
});
