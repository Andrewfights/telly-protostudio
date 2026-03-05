import JSZip from 'jszip';
import type { Prototype, ZoneContent, ZoneId } from '../types';

const ZONE_DIMENSIONS: Record<ZoneId, { width: number; height: number; description: string }> = {
  A: { width: 1920, height: 1080, description: 'Main Screen' },
  B: { width: 1920, height: 360, description: 'Full Bottom Screen' },
  C: { width: 1280, height: 300, description: 'Bottom Left Widget' },
  D: { width: 640, height: 300, description: 'Bottom Right Ad Block' },
  E: { width: 1920, height: 60, description: 'News Ticker' },
  F: { width: 1920, height: 300, description: 'Combined C+D Area' },
};

function generateCombinedHtml(zoneContent: ZoneContent, name: string): string {
  const hasZoneB = zoneContent.B && zoneContent.B.trim();
  const hasZoneF = zoneContent.F && zoneContent.F.trim();

  // Determine bottom section layout:
  // Zone B > Zone F > C+D+E
  let bottomSection = '';
  if (hasZoneB) {
    bottomSection = `
    <!-- Zone B: Full Bottom -->
    <iframe class="zone-frame" src="zones/zone-B.html" width="1920" height="360"></iframe>`;
  } else if (hasZoneF) {
    bottomSection = `
    <!-- Zone F: Combined C+D Area -->
    <iframe class="zone-frame" src="zones/zone-F.html" width="1920" height="300"></iframe>

    <!-- Zone E: Ticker -->
    <iframe class="zone-frame" src="zones/zone-E.html" width="1920" height="60"></iframe>`;
  } else {
    bottomSection = `
    <!-- Zone C & D -->
    <div style="display: flex;">
      <iframe class="zone-frame" src="zones/zone-C.html" width="1280" height="300"></iframe>
      <iframe class="zone-frame" src="zones/zone-D.html" width="640" height="300"></iframe>
    </div>

    <!-- Zone E: Ticker -->
    <iframe class="zone-frame" src="zones/zone-E.html" width="1920" height="60"></iframe>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - Telly Prototype</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0a; overflow: hidden; }
    .telly-container { width: 1920px; height: 1540px; margin: 0 auto; transform-origin: top center; }
    .zone-frame { border: none; }
  </style>
</head>
<body>
  <div class="telly-container">
    <!-- Zone A: Main Screen -->
    <iframe class="zone-frame" src="zones/zone-A.html" width="1920" height="1080"></iframe>

    <!-- Audio Grille -->
    <div style="width: 1920px; height: 100px; background: linear-gradient(to bottom, #1a1a1a, #0a0a0a);"></div>

    ${bottomSection}
  </div>

  <script>
    // Event bus for cross-zone communication
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'TELLY_EVENT') {
        document.querySelectorAll('iframe').forEach(iframe => {
          if (iframe.contentWindow !== event.source) {
            iframe.contentWindow.postMessage(event.data, '*');
          }
        });
      }
    });

    // Auto-scale to fit viewport
    function scaleToFit() {
      const container = document.querySelector('.telly-container');
      const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1540, 1);
      container.style.transform = 'scale(' + scale + ')';
    }
    scaleToFit();
    window.addEventListener('resize', scaleToFit);
  </script>
</body>
</html>`;
}

function generateZoneHtml(content: string, zone: ZoneId): string {
  if (content && content.trim()) {
    return content;
  }

  const dim = ZONE_DIMENSIONS[zone];
  return `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 flex items-center justify-center" style="width: ${dim.width}px; height: ${dim.height}px; overflow: hidden;">
  <div class="text-center text-white/50">
    <div class="text-2xl font-bold">Zone ${zone}</div>
    <div class="text-sm">${dim.description}</div>
    <div class="text-xs mt-2">${dim.width}x${dim.height}</div>
  </div>
</body>
</html>`;
}

function generateReadme(prototype: Prototype): string {
  return `# ${prototype.name}

${prototype.description || 'A Telly prototype created with ProtoStudio.'}

## Zone Dimensions

| Zone | Dimensions | Purpose |
|------|-----------|---------|
| A | 1920x1080 | Main Screen |
| B | 1920x360 | Full Bottom Screen (overrides C+D+E+F) |
| C | 1280x300 | Bottom Left Widget |
| D | 640x300 | Bottom Right Ad Block |
| E | 1920x60 | News Ticker |
| F | 1920x300 | Combined C+D Area (overrides C+D, keeps E) |

## Usage

1. Open \`index.html\` in a browser to view the full prototype
2. Individual zone files are in the \`zones/\` folder
3. Each zone can communicate via postMessage events

## Event Bus

Zones can communicate using the event bus:

\`\`\`javascript
// Send an event from any zone
window.parent.postMessage({
  type: 'TELLY_EVENT',
  payload: { action: 'play', data: {} }
}, '*');

// Listen for events
window.addEventListener('message', (event) => {
  if (event.data?.type === 'TELLY_EVENT') {
    console.log('Received:', event.data.payload);
  }
});
\`\`\`

## Created

- Date: ${new Date(prototype.createdAt).toLocaleDateString()}
- Generated with Telly ProtoStudio
`;
}

export async function exportAsZip(prototype: Prototype): Promise<Blob> {
  const zip = new JSZip();

  // Add index.html
  zip.file('index.html', generateCombinedHtml(prototype.zoneContent, prototype.name));

  // Add zone files
  const zones = zip.folder('zones');
  if (zones) {
    (['A', 'B', 'C', 'D', 'E', 'F'] as ZoneId[]).forEach(zone => {
      const content = prototype.zoneContent[zone];
      zones.file(`zone-${zone}.html`, generateZoneHtml(content, zone));
    });
  }

  // Add README
  zip.file('README.md', generateReadme(prototype));

  return zip.generateAsync({ type: 'blob' });
}

export function exportSingleZone(content: string, zone: ZoneId, name: string): void {
  const html = content || generateZoneHtml('', zone);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}-zone-${zone}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportMultiZone(prototype: Prototype): Promise<void> {
  const blob = await exportAsZip(prototype);
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${prototype.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-telly-prototype.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAsJson(prototype: Prototype): void {
  const exportData = {
    version: '1.0',
    type: 'telly-prototype',
    prototype: {
      name: prototype.name,
      description: prototype.description,
      zoneContent: prototype.zoneContent,
      createdAt: prototype.createdAt,
    },
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${prototype.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.telly.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ImportedPrototype {
  name: string;
  description?: string;
  zoneContent: ZoneContent;
}

export function parseImportedJson(jsonString: string): ImportedPrototype {
  const data = JSON.parse(jsonString);

  if (data.type !== 'telly-prototype' || !data.prototype?.zoneContent) {
    throw new Error('Invalid Telly prototype file');
  }

  return {
    name: data.prototype.name || 'Imported Prototype',
    description: data.prototype.description,
    zoneContent: data.prototype.zoneContent,
  };
}
