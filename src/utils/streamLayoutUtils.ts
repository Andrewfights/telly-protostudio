import type { StreamLayout, StreamLayoutPreset, StreamCell, VideoSourceConfig } from '../types';

// Get preset configuration (rows and cols)
export function getPresetConfig(preset: StreamLayoutPreset): { rows: number; cols: number } {
  switch (preset) {
    case 'full':
      return { rows: 1, cols: 1 };
    case '1x2':
      return { rows: 1, cols: 2 };
    case '1x3':
      return { rows: 1, cols: 3 };
    case '2x2':
      return { rows: 2, cols: 2 };
    case '2x3':
      return { rows: 2, cols: 3 };
    case '3x3':
      return { rows: 3, cols: 3 };
    default:
      return { rows: 1, cols: 1 };
  }
}

// Create initial cells for a preset
export function createCellsForPreset(preset: StreamLayoutPreset): StreamCell[] {
  const { rows, cols } = getPresetConfig(preset);
  const cells: StreamCell[] = [];

  for (let i = 0; i < rows * cols; i++) {
    cells.push({
      id: i,
      videoConfig: undefined,
      label: `Cell ${i + 1}`,
    });
  }

  return cells;
}

// Create a default stream layout
export function createDefaultStreamLayout(preset: StreamLayoutPreset = '2x2'): StreamLayout {
  const { rows, cols } = getPresetConfig(preset);
  return {
    preset,
    rows,
    cols,
    cells: createCellsForPreset(preset),
    globalOptions: {
      autoplay: true,
      muted: true,
      controls: false,
      gap: 4,
      theaterMode: false,
    },
  };
}

// Generate embed HTML for a single video source
export function generateCellEmbed(config: VideoSourceConfig): string {
  const { type, videoId, channelSlug, customUrl, autoplay, muted, loop, controls } = config;

  if (type === 'youtube' && videoId) {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      mute: muted ? '1' : '0',
      loop: loop ? '1' : '0',
      controls: controls ? '1' : '0',
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      fs: '0', // Disable fullscreen button
    });
    if (loop) {
      params.set('playlist', videoId);
    }

    // No allowfullscreen - keeps video contained in its cell
    return `<iframe
      src="https://www.youtube.com/embed/${videoId}?${params.toString()}"
      style="width:100%;height:100%;border:none;"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    ></iframe>`;
  }

  if (type === 'plutotv' && channelSlug) {
    // No allowfullscreen - keeps video contained in its cell
    return `<iframe
      src="https://pluto.tv/live-tv/${channelSlug}"
      style="width:100%;height:100%;border:none;"
      allow="autoplay; encrypted-media"
    ></iframe>`;
  }

  if (type === 'custom-url' && customUrl) {
    // No allowfullscreen - keeps video contained in its cell
    return `<iframe
      src="${customUrl}"
      style="width:100%;height:100%;border:none;"
      allow="autoplay; encrypted-media"
    ></iframe>`;
  }

  // Empty cell placeholder
  return `<div style="width:100%;height:100%;background:#1a1a2e;display:flex;align-items:center;justify-content:center;color:#666;">
    <span>No Source</span>
  </div>`;
}

// Generate the full grid HTML with all cells
export function generateStreamGridHTML(layout: StreamLayout): string {
  const { rows, cols, cells, globalOptions } = layout;
  const { gap } = globalOptions;

  // Generate cell HTML with data attributes for audio control
  const cellsHTML = cells.map((cell, index) => {
    let cellContent: string;

    if (cell.videoConfig) {
      // Apply global options if cell doesn't have specific config
      const configWithGlobals: VideoSourceConfig = {
        ...cell.videoConfig,
        autoplay: globalOptions.autoplay,
        muted: true, // Always start muted, user clicks to unmute
        controls: globalOptions.controls,
      };
      cellContent = generateCellEmbed(configWithGlobals);
    } else {
      // Empty cell
      cellContent = `<div style="width:100%;height:100%;background:#1a1a2e;display:flex;align-items:center;justify-content:center;color:#444;font-family:system-ui;font-size:14px;">
        <span>Cell ${index + 1}</span>
      </div>`;
    }

    return `<div class="stream-cell" data-cell="${index}" data-muted="true" tabindex="0">${cellContent}</div>`;
  }).join('\n');

  // Embed layout config for later editing (escaped for HTML)
  const configJson = JSON.stringify(layout).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  // Full HTML document with audio control and cell maximize
  return `<!DOCTYPE html>
<html data-stream-layout="true">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script id="stream-layout-config" type="application/json">${configJson}</script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: #0a0a0a;
      overflow: hidden;
    }
    .stream-grid {
      display: grid;
      grid-template-columns: repeat(${cols}, 1fr);
      grid-template-rows: repeat(${rows}, 1fr);
      gap: ${gap}px;
      width: 100%;
      height: 100%;
      padding: ${gap}px;
      transition: all 0.3s ease;
    }
    .stream-grid.maximized {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr;
    }
    .stream-grid.maximized .stream-cell:not(.maximized-cell) {
      display: none;
    }
    .stream-cell {
      background: #111;
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      border: 4px solid #333;
      transition: all 0.2s ease;
    }
    .stream-cell:focus {
      outline: none;
    }
    /* Audio state indicators - corner badge instead of border */
    .stream-cell .audio-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      z-index: 5;
    }
    .stream-cell[data-muted="true"] .audio-badge {
      background: #ef4444;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
    }
    .stream-cell[data-muted="false"] .audio-badge {
      background: #22c55e;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
    }
    /* Focus state - cyan/blue border for navigation */
    .stream-cell.focused {
      border-color: #06b6d4 !important;
      box-shadow: 0 0 25px rgba(6, 182, 212, 0.5), inset 0 0 15px rgba(6, 182, 212, 0.1) !important;
    }
    /* Button focus mode - yellow border */
    .stream-cell.button-mode {
      border-color: #eab308 !important;
      box-shadow: 0 0 25px rgba(234, 179, 8, 0.5) !important;
    }
    .stream-cell iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: auto;
    }
    .stream-cell.maximized-cell iframe {
      pointer-events: auto;
    }
    .stream-cell.maximized-cell {
      border-color: #a855f7 !important;
      box-shadow: 0 0 30px rgba(168, 85, 247, 0.5) !important;
    }
    .cell-controls {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 12px;
      z-index: 10;
      opacity: 1;
      transition: opacity 0.2s ease;
    }
    .cell-btn {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      cursor: pointer;
      border: 3px solid transparent;
      transition: all 0.15s ease;
      background: rgba(0,0,0,0.8);
    }
    .cell-btn:focus {
      outline: none;
      border-color: #fff;
      transform: scale(1.1);
    }
    .cell-btn:hover {
      transform: scale(1.05);
    }
    .cell-btn.audio-btn {
      background: rgba(0,0,0,0.8);
    }
    .stream-cell[data-muted="true"] .audio-btn {
      background: rgba(239, 68, 68, 0.9);
    }
    .stream-cell[data-muted="false"] .audio-btn {
      background: rgba(34, 197, 94, 0.9);
    }
    .cell-btn.maximize-btn {
      background: rgba(99, 102, 241, 0.9);
    }
    .cell-btn.back-btn {
      background: rgba(239, 68, 68, 0.9);
    }
    .stream-cell.focused {
      border-color: #fff !important;
      box-shadow: 0 0 20px rgba(255,255,255,0.4) !important;
    }
    .cell-label {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(0,0,0,0.8);
      color: #fff;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 14px;
      font-family: system-ui;
      font-weight: bold;
    }
    .maximize-hint {
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.9);
      color: #fff;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-family: system-ui;
      opacity: 0;
      transition: opacity 0.2s ease;
      white-space: nowrap;
    }
    .stream-cell.maximized-cell .maximize-hint {
      opacity: 1;
    }
  </style>
</head>
<body>
  <div class="stream-grid" id="grid">
    ${cellsHTML}
  </div>

  <script>
    const grid = document.getElementById('grid');
    const cells = document.querySelectorAll('.stream-cell[data-cell]');
    let maximizedCell = null;
    let focusedCellIndex = 0;
    let focusedButtonIndex = -1; // -1 = cell focused, 0+ = button index

    // Add control buttons, labels, and audio badge to each cell
    cells.forEach((cell, cellIndex) => {
      // Cell label
      const label = document.createElement('div');
      label.className = 'cell-label';
      label.innerHTML = 'Channel ' + (cellIndex + 1);
      cell.appendChild(label);

      // Audio state badge (red=muted, green=unmuted)
      const audioBadge = document.createElement('div');
      audioBadge.className = 'audio-badge';
      cell.appendChild(audioBadge);

      const controls = document.createElement('div');
      controls.className = 'cell-controls';

      // Audio button
      const audioBtn = document.createElement('button');
      audioBtn.className = 'cell-btn audio-btn';
      audioBtn.setAttribute('data-btn', '0');
      audioBtn.innerHTML = cell.dataset.muted === 'true' ? '🔇' : '🔊';
      audioBtn.onclick = (e) => { e.stopPropagation(); toggleAudio(cell); };
      controls.appendChild(audioBtn);

      // Maximize button
      const maxBtn = document.createElement('button');
      maxBtn.className = 'cell-btn maximize-btn';
      maxBtn.setAttribute('data-btn', '1');
      maxBtn.innerHTML = '⛶';
      maxBtn.onclick = (e) => { e.stopPropagation(); toggleMaximize(cell); };
      controls.appendChild(maxBtn);

      // Back button (only shows when maximized)
      const backBtn = document.createElement('button');
      backBtn.className = 'cell-btn back-btn';
      backBtn.setAttribute('data-btn', '2');
      backBtn.innerHTML = '✕';
      backBtn.style.display = 'none';
      backBtn.onclick = (e) => { e.stopPropagation(); toggleMaximize(cell); };
      controls.appendChild(backBtn);

      cell.appendChild(controls);

      // Add hint for maximized state
      const hint = document.createElement('div');
      hint.className = 'maximize-hint';
      hint.innerHTML = 'Press BACK or ✕ to exit fullscreen';
      cell.appendChild(hint);
    });

    // Toggle cell maximize
    function toggleMaximize(cell) {
      const backBtn = cell.querySelector('.back-btn');
      const maxBtn = cell.querySelector('.maximize-btn');

      if (maximizedCell === cell) {
        // Restore grid view
        grid.classList.remove('maximized');
        cell.classList.remove('maximized-cell');
        if (backBtn) backBtn.style.display = 'none';
        if (maxBtn) maxBtn.style.display = 'flex';
        maximizedCell = null;
        focusedButtonIndex = -1;
        updateFocus();
      } else {
        // Maximize this cell
        if (maximizedCell) {
          maximizedCell.classList.remove('maximized-cell');
          const oldBack = maximizedCell.querySelector('.back-btn');
          const oldMax = maximizedCell.querySelector('.maximize-btn');
          if (oldBack) oldBack.style.display = 'none';
          if (oldMax) oldMax.style.display = 'flex';
        }
        grid.classList.add('maximized');
        cell.classList.add('maximized-cell');
        if (backBtn) backBtn.style.display = 'flex';
        if (maxBtn) maxBtn.style.display = 'none';
        maximizedCell = cell;

        // Auto-unmute when maximizing
        if (cell.dataset.muted === 'true') {
          toggleAudio(cell);
        }
      }
    }

    // Audio toggle
    function toggleAudio(cell) {
      const iframe = cell.querySelector('iframe');
      if (!iframe) return;

      const isMuted = cell.dataset.muted === 'true';
      const audioBtn = cell.querySelector('.audio-btn');

      if (isMuted) {
        // Unmute this cell, mute all others
        cells.forEach(c => {
          c.dataset.muted = 'true';
          const btn = c.querySelector('.audio-btn');
          if (btn) btn.innerHTML = '🔇';

          const otherIframe = c.querySelector('iframe');
          if (otherIframe && c !== cell && otherIframe.src.includes('youtube.com')) {
            otherIframe.src = otherIframe.src.replace(/mute=0/g, 'mute=1');
          }
        });

        cell.dataset.muted = 'false';
        if (audioBtn) audioBtn.innerHTML = '🔊';

        if (iframe.src.includes('youtube.com')) {
          iframe.src = iframe.src.replace(/mute=1/g, 'mute=0');
        }
      } else {
        cell.dataset.muted = 'true';
        if (audioBtn) audioBtn.innerHTML = '🔇';

        if (iframe.src.includes('youtube.com')) {
          iframe.src = iframe.src.replace(/mute=0/g, 'mute=1');
        }
      }
    }

    // Update focus display
    function updateFocus() {
      cells.forEach((cell, i) => {
        cell.classList.remove('focused', 'button-mode');
        const buttons = cell.querySelectorAll('.cell-btn');
        buttons.forEach(btn => btn.blur());

        if (i === focusedCellIndex) {
          if (focusedButtonIndex >= 0) {
            // Button selection mode - yellow border
            cell.classList.add('button-mode');
            const visibleBtns = Array.from(buttons).filter(b => b.style.display !== 'none');
            if (visibleBtns[focusedButtonIndex]) {
              visibleBtns[focusedButtonIndex].focus();
            }
          } else {
            // Cell navigation mode - cyan border
            cell.classList.add('focused');
          }
        }
      });
    }

    // Get visible buttons for current cell
    function getVisibleButtons() {
      const cell = cells[focusedCellIndex];
      const buttons = cell.querySelectorAll('.cell-btn');
      return Array.from(buttons).filter(b => b.style.display !== 'none');
    }

    // Handle key events from both direct keyboard and postMessage from parent
    function handleKeyEvent(key) {
      const cols = ${cols};
      const total = cells.length;
      const visibleBtns = getVisibleButtons();

      switch(key) {
        case 'Escape':
        case 'Backspace':
        case 'XF86Back':
          if (maximizedCell) {
            toggleMaximize(maximizedCell);
            return true;
          } else if (focusedButtonIndex >= 0) {
            focusedButtonIndex = -1;
            updateFocus();
            return true;
          }
          return false;

        case 'ArrowRight':
          if (focusedButtonIndex >= 0) {
            focusedButtonIndex = (focusedButtonIndex + 1) % visibleBtns.length;
          } else if (!maximizedCell) {
            focusedCellIndex = (focusedCellIndex + 1) % total;
          }
          updateFocus();
          return true;

        case 'ArrowLeft':
          if (focusedButtonIndex >= 0) {
            focusedButtonIndex = (focusedButtonIndex - 1 + visibleBtns.length) % visibleBtns.length;
          } else if (!maximizedCell) {
            focusedCellIndex = (focusedCellIndex - 1 + total) % total;
          }
          updateFocus();
          return true;

        case 'ArrowDown':
          if (focusedButtonIndex === -1 && !maximizedCell) {
            focusedButtonIndex = 0;
          } else if (!maximizedCell) {
            focusedCellIndex = (focusedCellIndex + cols) % total;
            focusedButtonIndex = -1;
          }
          updateFocus();
          return true;

        case 'ArrowUp':
          if (focusedButtonIndex >= 0) {
            focusedButtonIndex = -1;
          } else if (!maximizedCell) {
            focusedCellIndex = (focusedCellIndex - cols + total) % total;
          }
          updateFocus();
          return true;

        case 'Enter':
        case ' ':
          if (focusedButtonIndex >= 0 && visibleBtns[focusedButtonIndex]) {
            visibleBtns[focusedButtonIndex].click();
          } else {
            toggleMaximize(cells[focusedCellIndex]);
          }
          return true;

        case 'm':
        case 'M':
          toggleAudio(cells[focusedCellIndex]);
          return true;

        default:
          return false;
      }
    }

    // Listen for postMessage from parent (FullscreenView)
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'TELLY_REMOTE_KEY') {
        handleKeyEvent(e.data.key);
      }
    });

    document.addEventListener('keydown', (e) => {
      const handled = handleKeyEvent(e.key);
      if (handled) {
        e.preventDefault();
      }
    });

    // Click to select cell
    cells.forEach((cell, i) => {
      cell.addEventListener('click', () => {
        focusedCellIndex = i;
        focusedButtonIndex = -1;
        updateFocus();
      });
    });

    // Initial focus
    if (cells.length > 0) {
      updateFocus();
    }
  </script>
</body>
</html>`;
}

// Get display name for preset
export function getPresetDisplayName(preset: StreamLayoutPreset): string {
  switch (preset) {
    case 'full':
      return 'Full';
    case '1x2':
      return '1x2';
    case '1x3':
      return '1x3';
    case '2x2':
      return '2x2';
    case '2x3':
      return '2x3';
    case '3x3':
      return '3x3';
    default:
      return preset;
  }
}

// Get video source display name
export function getVideoSourceName(config: VideoSourceConfig): string {
  if (config.type === 'youtube' && config.videoId) {
    return `YouTube: ${config.videoId.substring(0, 8)}...`;
  }
  if (config.type === 'plutotv' && config.channelSlug) {
    return `Pluto: ${config.channelSlug}`;
  }
  if (config.type === 'custom-url' && config.customUrl) {
    return 'Custom URL';
  }
  return 'Unknown';
}

// Check if HTML content is a stream layout
export function isStreamLayout(html: string): boolean {
  return html.includes('data-stream-layout="true"') && html.includes('stream-layout-config');
}

// Parse stream layout config from HTML
export function parseStreamLayoutFromHTML(html: string): StreamLayout | null {
  if (!isStreamLayout(html)) {
    return null;
  }

  try {
    // Extract JSON from script tag
    const match = html.match(/<script id="stream-layout-config" type="application\/json">(.+?)<\/script>/s);
    if (!match) {
      return null;
    }

    // Unescape the JSON
    const jsonStr = match[1].replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');
    const layout = JSON.parse(jsonStr) as StreamLayout;
    return layout;
  } catch (e) {
    console.error('Failed to parse stream layout:', e);
    return null;
  }
}
