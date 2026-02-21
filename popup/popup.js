/**
 * IMPULSE — Popup Logic
 *
 * Queries the service worker for the current tab's pixel data,
 * then renders the UI (pixel cards, events, summary bar).
 */
(function() {
  'use strict';

  var currentTabId = null;

  // ─── Init ──────────────────────────────────────────────────
  async function init() {
    try {
      var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || !tabs[0]) return;

      currentTabId = tabs[0].id;

      chrome.runtime.sendMessage(
        { type: 'get_tab_data', tabId: currentTabId },
        function(response) {
          if (chrome.runtime.lastError) {
            console.error('Impulse:', chrome.runtime.lastError.message);
            return;
          }
          render(response);
        }
      );
    } catch (e) {
      console.error('Impulse: init error', e);
    }
  }

  // ─── Render ────────────────────────────────────────────────
  function render(data) {
    var pixels = (data && data.pixels) || [];
    var events = (data && data.events) || [];

    // Update pixel count
    document.getElementById('pixelCount').textContent = pixels.length;

    // Summary bar
    renderSummaryBar(pixels);

    // Pixel list
    renderPixelList(pixels, events);
  }

  // ─── Summary Bar ───────────────────────────────────────────
  function renderSummaryBar(pixels) {
    var bar = document.getElementById('summaryBar');
    bar.innerHTML = '';

    if (pixels.length === 0) return;

    for (var i = 0; i < pixels.length; i++) {
      var p = pixels[i];
      var badge = document.createElement('div');
      badge.className = 'summary-badge';

      var dot = document.createElement('span');
      dot.className = 'badge-dot';
      dot.style.backgroundColor = p.color;

      var label = document.createElement('span');
      label.textContent = p.shortName;

      badge.appendChild(dot);
      badge.appendChild(label);
      bar.appendChild(badge);
    }
  }

  // ─── Pixel List ────────────────────────────────────────────
  function renderPixelList(pixels, events) {
    var list = document.getElementById('pixelList');
    var emptyState = document.getElementById('emptyState');

    // Remove existing cards
    var cards = list.querySelectorAll('.pixel-card');
    for (var c = 0; c < cards.length; c++) {
      cards[c].remove();
    }

    if (pixels.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    for (var i = 0; i < pixels.length; i++) {
      var pixelEvents = filterEvents(events, pixels[i].platform);
      var card = createPixelCard(pixels[i], pixelEvents);
      list.appendChild(card);
    }
  }

  function filterEvents(events, platform) {
    var result = [];
    for (var i = 0; i < events.length; i++) {
      if (events[i].platform === platform) {
        result.push(events[i]);
      }
    }
    return result;
  }

  // ─── Pixel Card ────────────────────────────────────────────
  function createPixelCard(pixel, pixelEvents) {
    var card = document.createElement('div');
    card.className = 'pixel-card';

    // Header
    var header = document.createElement('div');
    header.className = 'pixel-card-header';
    header.addEventListener('click', function() {
      card.classList.toggle('expanded');
    });

    // Icon
    var icon = document.createElement('div');
    icon.className = 'pixel-icon';
    icon.style.backgroundColor = pixel.color;
    // Special handling for dark backgrounds
    if (pixel.color === '#000000') {
      icon.style.backgroundColor = '#1A1A1A';
      icon.style.border = '1px solid #333';
    }
    if (pixel.color === '#FFFC00') {
      icon.style.color = '#000'; // Dark text on yellow (Snapchat)
    }
    icon.textContent = pixel.iconLetter || pixel.shortName;

    // Info
    var info = document.createElement('div');
    info.className = 'pixel-info';

    var name = document.createElement('div');
    name.className = 'pixel-name';
    name.textContent = pixel.name;

    var idText = document.createElement('div');
    idText.className = 'pixel-id';
    if (pixel.ids && pixel.ids.length > 0) {
      idText.textContent = pixel.ids.join(', ');
      idText.title = pixel.ids.join('\n');
    } else {
      idText.textContent = 'Detected (ID pending...)';
      idText.style.fontStyle = 'italic';
    }

    info.appendChild(name);
    info.appendChild(idText);

    // Meta (status + event count + chevron)
    var meta = document.createElement('div');
    meta.className = 'pixel-meta';

    var status = document.createElement('div');
    status.className = 'pixel-status';

    var eventCount = document.createElement('span');
    eventCount.className = 'pixel-event-count';
    eventCount.textContent = pixelEvents.length + ' evt' + (pixelEvents.length !== 1 ? 's' : '');

    var chevron = document.createElement('span');
    chevron.className = 'pixel-chevron';
    chevron.innerHTML = '&#9654;';

    meta.appendChild(status);
    meta.appendChild(eventCount);
    meta.appendChild(chevron);

    header.appendChild(icon);
    header.appendChild(info);
    header.appendChild(meta);

    // Detection badges
    var badges = document.createElement('div');
    badges.className = 'detection-badges';
    if (pixel.detectedVia && pixel.detectedVia.length > 0) {
      for (var d = 0; d < pixel.detectedVia.length; d++) {
        var badge = document.createElement('span');
        badge.className = 'detection-badge';
        badge.textContent = formatDetectionSource(pixel.detectedVia[d]);
        badges.appendChild(badge);
      }
    }

    // Events container
    var eventsContainer = document.createElement('div');
    eventsContainer.className = 'pixel-events';

    // Show last 50 events, newest first
    var recentEvents = pixelEvents.slice(-50).reverse();

    if (recentEvents.length === 0) {
      var noEvents = document.createElement('div');
      noEvents.className = 'event-item';
      noEvents.innerHTML = '<span class="event-name" style="color:#52525B;font-style:italic">No events captured yet</span>';
      eventsContainer.appendChild(noEvents);
    } else {
      for (var e = 0; e < recentEvents.length; e++) {
        eventsContainer.appendChild(createEventItem(recentEvents[e]));
      }
    }

    card.appendChild(header);
    card.appendChild(badges);
    card.appendChild(eventsContainer);

    return card;
  }

  // ─── Event Item ────────────────────────────────────────────
  function createEventItem(evt) {
    var item = document.createElement('div');
    item.className = 'event-item';

    var header = document.createElement('div');
    header.className = 'event-header';
    header.addEventListener('click', function(e) {
      e.stopPropagation();
      item.classList.toggle('expanded');
    });

    var eventName = extractEventName(evt);

    var nameEl = document.createElement('span');
    nameEl.className = 'event-name';
    nameEl.textContent = eventName;

    var funcEl = document.createElement('span');
    funcEl.className = 'event-function';
    funcEl.textContent = evt.fn || '';

    var timeEl = document.createElement('span');
    timeEl.className = 'event-time';
    timeEl.textContent = formatTime(evt.timestamp);

    header.appendChild(nameEl);
    header.appendChild(funcEl);
    header.appendChild(timeEl);

    // Payload
    var payload = document.createElement('div');
    payload.className = 'event-payload';
    payload.innerHTML = syntaxHighlight(evt.args);

    item.appendChild(header);
    item.appendChild(payload);

    return item;
  }

  // ─── Helpers ───────────────────────────────────────────────

  function extractEventName(evt) {
    var args = evt.args;

    if (!args) return evt.fn || 'Unknown';

    // Network requests
    if (evt.fn === 'network_request') {
      if (args && args.url) {
        try {
          var url = new URL(args.url);
          var path = url.pathname.split('/').pop();
          return path || url.hostname;
        } catch (e) {
          return 'request';
        }
      }
      return 'network';
    }

    // Function calls with array args: fbq('track', 'PageView') => 'PageView'
    if (Array.isArray(args)) {
      // gtag('config', 'G-XXX') => 'config: G-XXX'
      if (args.length >= 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
        return args[0] + ': ' + args[1];
      }
      if (args.length >= 1 && typeof args[0] === 'string') {
        return args[0];
      }
      // dataLayer.push with event key
      if (args.length >= 1 && typeof args[0] === 'object' && args[0] !== null) {
        if (args[0].event) return args[0].event;
        var keys = Object.keys(args[0]);
        if (keys.length > 0) return keys[0];
      }
    }

    return evt.fn || 'event';
  }

  function formatTime(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    var s = String(d.getSeconds()).padStart(2, '0');
    return h + ':' + m + ':' + s;
  }

  function formatDetectionSource(source) {
    if (!source) return '';
    return source
      .replace('global:', '')
      .replace('dom:', '')
      .replace('event_args', 'args')
      .replace('script_src', 'script')
      .replace('network', 'network')
      .replace('inline', 'inline')
      .replace('noscript', 'noscript');
  }

  function syntaxHighlight(obj) {
    var json;
    try {
      json = JSON.stringify(obj, null, 2);
    } catch (e) {
      return escapeHtml(String(obj));
    }

    if (!json) return 'null';

    return json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"([^"]+)"(?=\s*:)/g, '<span class="json-key">"$1"</span>')
      .replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
      .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span class="json-bool">$1</span>')
      .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ─── Start ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

})();
