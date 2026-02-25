/* ===== NeurodiverseAdvices — script.js ===== */

(function () {
  'use strict';

  // ── Accordion ──────────────────────────────────────────────────────────
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach(function (item) {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');

    if (!trigger || !panel) return;

    trigger.addEventListener('click', function () {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

      // Close all other items in the same accordion group
      const siblings = item.closest('.accordion').querySelectorAll('.accordion-item');
      siblings.forEach(function (sibling) {
        if (sibling !== item) {
          const sibTrigger = sibling.querySelector('.accordion-trigger');
          const sibPanel = sibling.querySelector('.accordion-panel');
          if (sibTrigger) sibTrigger.setAttribute('aria-expanded', 'false');
          if (sibPanel) sibPanel.classList.remove('open');
        }
      });

      // Toggle this item
      trigger.setAttribute('aria-expanded', String(!isExpanded));
      panel.classList.toggle('open', !isExpanded);
    });

    // Keyboard support
    trigger.addEventListener('keydown', function (e) {
      const accordion = item.closest('.accordion');
      const items = Array.from(accordion.querySelectorAll('.accordion-trigger:not(:disabled)'));
      const idx = items.indexOf(trigger);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = items[idx + 1] || items[0];
        next.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = items[idx - 1] || items[items.length - 1];
        prev.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        items[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        items[items.length - 1].focus();
      }
    });
  });

  // ── Tab Filtering ───────────────────────────────────────────────────────
  const tabButtons = document.querySelectorAll('.tab-btn');
  const categorySections = document.querySelectorAll('.category-section');

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const target = btn.dataset.tab;

      // Update active state
      tabButtons.forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Show/hide sections
      categorySections.forEach(function (section) {
        if (target === 'all' || section.dataset.category === target) {
          section.classList.remove('hidden');
        } else {
          section.classList.add('hidden');
        }
      });

      // Clear search when switching tabs
      const searchInput = document.getElementById('search-input');
      if (searchInput && searchInput.value) {
        searchInput.value = '';
        clearBtn.classList.remove('visible');
        resetSearch();
      }
    });
  });

  // ── Search ──────────────────────────────────────────────────────────────
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.querySelector('.search-clear');
  const noResults = document.getElementById('no-results');

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightText(node, regex) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!regex.test(text)) return null;
      regex.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
        const mark = document.createElement('mark');
        mark.textContent = match[0];
        frag.appendChild(mark);
        lastIdx = match.index + match[0].length;
      }
      frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      return frag;
    }
    return null;
  }

  function highlightElement(el, regex) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.tagName !== 'MARK' && node.parentElement.closest('.accordion-icon') === null) {
        nodes.push(node);
      }
    }
    nodes.forEach(function (textNode) {
      const frag = highlightText(textNode, regex);
      if (frag) textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  function removeHighlights(el) {
    const marks = el.querySelectorAll('mark');
    marks.forEach(function (mark) {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
  }

  function resetSearch() {
    accordionItems.forEach(function (item) {
      item.classList.remove('hidden', 'highlight');
      removeHighlights(item);

      // Close all panels
      const trigger = item.querySelector('.accordion-trigger');
      const panel = item.querySelector('.accordion-panel');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (panel) panel.classList.remove('open');
    });

    categorySections.forEach(function (section) {
      const activeTab = document.querySelector('.tab-btn.active');
      const tabTarget = activeTab ? activeTab.dataset.tab : 'all';
      if (tabTarget === 'all' || section.dataset.category === tabTarget) {
        section.classList.remove('hidden');
      }
    });

    if (noResults) noResults.classList.remove('visible');
  }

  function doSearch(query) {
    if (!query) {
      resetSearch();
      return;
    }

    const regex = new RegExp(escapeRegex(query), 'gi');
    let totalVisible = 0;

    accordionItems.forEach(function (item) {
      removeHighlights(item);
      const text = item.textContent.toLowerCase();
      if (text.includes(query.toLowerCase())) {
        item.classList.remove('hidden');
        item.classList.add('highlight');
        totalVisible++;

        // Expand matching items
        const trigger = item.querySelector('.accordion-trigger');
        const panel = item.querySelector('.accordion-panel');
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
        if (panel) panel.classList.add('open');

        highlightElement(item, regex);
      } else {
        item.classList.add('hidden');
        item.classList.remove('highlight');
      }
    });

    // Show/hide category sections based on visible children
    categorySections.forEach(function (section) {
      const visibleItems = section.querySelectorAll('.accordion-item:not(.hidden)');
      if (visibleItems.length === 0) {
        section.classList.add('hidden');
      } else {
        section.classList.remove('hidden');
      }
    });

    if (noResults) {
      noResults.classList.toggle('visible', totalVisible === 0);
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const q = searchInput.value.trim();
      if (clearBtn) clearBtn.classList.toggle('visible', q.length > 0);
      doSearch(q);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (searchInput) searchInput.value = '';
      clearBtn.classList.remove('visible');
      resetSearch();
      searchInput.focus();
    });
  }
})();
