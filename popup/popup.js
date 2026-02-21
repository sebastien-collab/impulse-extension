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
    var consent = (data && data.consent) || null;

    // Update pixel count
    document.getElementById('pixelCount').textContent = pixels.length;

    // Summary bar
    renderSummaryBar(pixels);

    // Consent Mode V2
    renderConsentSection(consent);

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

  // ─── Consent Mode V2 ───────────────────────────────────────

  var CONSENT_PARAM_LABELS = {
    ad_storage:              { label: 'Ad Storage',              v2: false },
    analytics_storage:       { label: 'Analytics Storage',       v2: false },
    ad_user_data:            { label: 'Ad User Data',            v2: true  },
    ad_personalization:      { label: 'Ad Personalization',      v2: true  },
    functionality_storage:   { label: 'Functionality Storage',   v2: false },
    personalization_storage: { label: 'Personalization Storage', v2: false },
    security_storage:        { label: 'Security Storage',        v2: false }
  };

  function renderConsentSection(consent) {
    var section = document.getElementById('consentSection');

    if (!consent || !consent.detected) {
      section.classList.add('hidden');
      return;
    }

    section.classList.remove('hidden');

    // Mode badge
    var modeBadge = document.getElementById('consentModeBadge');
    if (consent.mode === 'advanced') {
      modeBadge.textContent = 'Advanced';
      modeBadge.className = 'consent-mode-badge mode-advanced';
    } else if (consent.mode === 'basic') {
      modeBadge.textContent = 'Basic';
      modeBadge.className = 'consent-mode-badge mode-basic';
    } else {
      modeBadge.textContent = '';
      modeBadge.className = 'consent-mode-badge';
    }

    // Issue count
    var issueCount = document.getElementById('consentIssueCount');
    var errors = 0;
    var warnings = 0;
    for (var i = 0; i < consent.issues.length; i++) {
      if (consent.issues[i].severity === 'error') errors++;
      else warnings++;
    }
    if (errors > 0) {
      issueCount.textContent = errors + ' error' + (errors > 1 ? 's' : '');
      issueCount.className = 'consent-issue-count issue-error';
    } else if (warnings > 0) {
      issueCount.textContent = warnings + ' warning' + (warnings > 1 ? 's' : '');
      issueCount.className = 'consent-issue-count issue-warning';
    } else {
      issueCount.textContent = 'OK';
      issueCount.className = 'consent-issue-count issue-ok';
    }

    // Toggle expand on header click (replace to remove old listeners)
    var header = document.getElementById('consentHeader');
    var detail = document.getElementById('consentDetail');
    var newHeader = header.cloneNode(true);
    header.parentNode.replaceChild(newHeader, header);
    newHeader.addEventListener('click', function() {
      detail.classList.toggle('hidden');
      newHeader.classList.toggle('expanded');
    });

    // Render sub-sections
    renderConsentParams(consent.state);
    renderConsentIssues(consent.issues);
    renderConsentTimeline(consent.timeline);
  }

  function renderConsentParams(state) {
    var container = document.getElementById('consentParams');
    container.innerHTML = '';

    var keys = Object.keys(CONSENT_PARAM_LABELS);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var config = CONSENT_PARAM_LABELS[key];
      var value = state[key];

      var row = document.createElement('div');
      row.className = 'consent-param-row';

      var nameEl = document.createElement('span');
      nameEl.className = 'consent-param-name';
      nameEl.textContent = config.label;
      if (config.v2) {
        var v2Tag = document.createElement('span');
        v2Tag.className = 'consent-v2-tag';
        v2Tag.textContent = 'V2';
        nameEl.appendChild(v2Tag);
      }

      var valueEl = document.createElement('span');
      if (value === 'granted') {
        valueEl.className = 'consent-param-value value-granted';
        valueEl.textContent = 'granted';
      } else if (value === 'denied') {
        valueEl.className = 'consent-param-value value-denied';
        valueEl.textContent = 'denied';
      } else {
        valueEl.className = 'consent-param-value value-unset';
        valueEl.textContent = 'not set';
      }

      row.appendChild(nameEl);
      row.appendChild(valueEl);
      container.appendChild(row);
    }
  }

  function renderConsentIssues(issues) {
    var container = document.getElementById('consentIssues');
    container.innerHTML = '';

    if (issues.length === 0) {
      var ok = document.createElement('div');
      ok.className = 'consent-issue-item issue-ok';
      ok.textContent = 'No compliance issues detected';
      container.appendChild(ok);
      return;
    }

    for (var i = 0; i < issues.length; i++) {
      var issue = issues[i];
      var item = document.createElement('div');
      item.className = 'consent-issue-item issue-' + issue.severity;

      var icon = document.createElement('span');
      icon.className = 'consent-issue-icon';
      icon.textContent = issue.severity === 'error' ? '\u2716' : '\u26A0';

      var msg = document.createElement('span');
      msg.className = 'consent-issue-message';
      msg.textContent = issue.message;

      item.appendChild(icon);
      item.appendChild(msg);
      container.appendChild(item);
    }
  }

  function renderConsentTimeline(timeline) {
    var container = document.getElementById('consentTimeline');
    container.innerHTML = '';

    if (timeline.length === 0) return;

    var title = document.createElement('div');
    title.className = 'consent-timeline-title';
    title.textContent = 'Timeline';
    container.appendChild(title);

    for (var i = 0; i < timeline.length; i++) {
      var entry = timeline[i];
      var item = document.createElement('div');
      item.className = 'consent-timeline-item';

      var dot = document.createElement('span');
      dot.className = 'consent-timeline-dot ' + (entry.type === 'default' ? 'dot-default' : 'dot-update');

      var typeEl = document.createElement('span');
      typeEl.className = 'consent-timeline-type';
      typeEl.textContent = 'consent.' + entry.type;

      var sourceEl = document.createElement('span');
      sourceEl.className = 'consent-timeline-source';
      sourceEl.textContent = entry.source;

      var timeEl = document.createElement('span');
      timeEl.className = 'consent-timeline-time';
      timeEl.textContent = formatTime(entry.timestamp);

      var paramsEl = document.createElement('div');
      paramsEl.className = 'consent-timeline-params';
      var paramKeys = Object.keys(entry.params);
      for (var p = 0; p < paramKeys.length; p++) {
        var tag = document.createElement('span');
        var val = entry.params[paramKeys[p]];
        tag.className = 'consent-param-tag ' + (val === 'granted' ? 'tag-granted' : 'tag-denied');
        tag.textContent = paramKeys[p] + ': ' + val;
        paramsEl.appendChild(tag);
      }

      item.appendChild(dot);
      item.appendChild(typeEl);
      item.appendChild(sourceEl);
      item.appendChild(timeEl);
      item.appendChild(paramsEl);
      container.appendChild(item);
    }
  }

  // ─── Start ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

})();
