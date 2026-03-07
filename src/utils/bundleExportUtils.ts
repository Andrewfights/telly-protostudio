import JSZip from 'jszip';
import type { Prototype, ZoneId, ZoneContent, LEDSettings } from '../types';

// Bundle manifest structure
export interface TellyBundleManifest {
  version: '1.0';
  type: 'telly-prototype-bundle';
  name: string;
  description?: string;
  createdAt: string;
  zones: {
    id: ZoneId;
    hasContent: boolean;
    file: string;
  }[];
  ledSettings?: LEDSettings;
  assets: {
    filename: string;
    type: 'image' | 'video' | 'audio';
    originalSize: number;
  }[];
}

// Extract data URLs from HTML and convert to external files
interface ExtractedAsset {
  originalUrl: string;
  filename: string;
  data: Uint8Array;
  type: 'image' | 'video' | 'audio';
  size: number;
}

function extractAndConvertDataUrls(html: string, prefix: string): {
  processedHtml: string;
  assets: ExtractedAsset[];
} {
  const assets: ExtractedAsset[] = [];
  let processedHtml = html;
  const dataUrlRegex = /data:(image|video|audio)\/([^;]+);base64,([^"'\s)]+)/g;
  let match;
  let index = 0;

  while ((match = dataUrlRegex.exec(html)) !== null) {
    const [fullMatch, mediaType, format, base64Data] = match;
    const extension = format.split(';')[0];
    const filename = `${prefix}_${index}.${extension}`;

    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    assets.push({
      originalUrl: fullMatch,
      filename,
      data: bytes,
      type: mediaType as 'image' | 'video' | 'audio',
      size: bytes.length,
    });

    // Replace data URL with relative asset path
    processedHtml = processedHtml.replace(fullMatch, `assets/${filename}`);
    index++;
  }

  return { processedHtml, assets };
}

// Generate the .telly bundle
export async function generateTellyBundle(prototype: Prototype): Promise<Blob> {
  const zip = new JSZip();
  const allAssets: ExtractedAsset[] = [];
  const zoneFiles: { id: ZoneId; hasContent: boolean; file: string }[] = [];

  // Process each zone
  for (const zone of ['A', 'B', 'C', 'D', 'E', 'F'] as ZoneId[]) {
    const content = prototype.zoneContent[zone];
    const hasContent = Boolean(content && content.trim());
    const filename = `zone_${zone.toLowerCase()}.html`;

    if (hasContent) {
      // Extract assets and update HTML
      const { processedHtml, assets } = extractAndConvertDataUrls(content, `zone_${zone.toLowerCase()}`);
      allAssets.push(...assets);

      // Wrap content if needed
      let htmlContent = processedHtml;
      if (!processedHtml.toLowerCase().includes('<!doctype')) {
        htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
  </style>
</head>
<body>
${processedHtml}
</body>
</html>`;
      }

      zip.file(`zones/${filename}`, htmlContent);
    }

    zoneFiles.push({ id: zone, hasContent, file: filename });
  }

  // Add assets to bundle
  for (const asset of allAssets) {
    zip.file(`assets/${asset.filename}`, asset.data);
  }

  // Create manifest
  const manifest: TellyBundleManifest = {
    version: '1.0',
    type: 'telly-prototype-bundle',
    name: prototype.name,
    description: prototype.description,
    createdAt: new Date().toISOString(),
    zones: zoneFiles,
    ledSettings: prototype.ledSettings,
    assets: allAssets.map(a => ({
      filename: a.filename,
      type: a.type,
      originalSize: a.size,
    })),
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // Add a simple README
  zip.file('README.txt', `Telly Prototype Bundle
======================
Name: ${prototype.name}
Created: ${new Date().toISOString()}

To use this bundle:
1. Install the Telly Prototype Viewer APK on your Telly device
2. Copy this .telly file to your Telly's Downloads folder
3. Open the Telly Prototype Viewer app
4. Select this prototype from the list

Zones included:
${zoneFiles.filter(z => z.hasContent).map(z => `- Zone ${z.id}`).join('\n')}

Assets: ${allAssets.length} files
`);

  return await zip.generateAsync({ type: 'blob' });
}

// Download the bundle
export async function downloadTellyBundle(prototype: Prototype): Promise<void> {
  const blob = await generateTellyBundle(prototype);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  // Sanitize filename
  const safeName = prototype.name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50) || 'prototype';

  a.download = `${safeName}.telly`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
