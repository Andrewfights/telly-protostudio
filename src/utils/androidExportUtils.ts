import JSZip from 'jszip';
import type { Prototype, AndroidExportConfig, ZoneId, ZoneContent } from '../types';
import {
  ANDROID_MANIFEST_TEMPLATE,
  MAIN_ACTIVITY_TEMPLATE,
  ACTIVITY_MAIN_XML_TEMPLATE,
  BOTTOM_SECTION_FULL_TEMPLATE,
  BOTTOM_SECTION_ZONES_TEMPLATE,
  BOTTOM_SECTION_F_TEMPLATE,
  BUILD_GRADLE_APP_TEMPLATE,
  BUILD_GRADLE_ROOT_TEMPLATE,
  SETTINGS_GRADLE_TEMPLATE,
  STYLES_XML_TEMPLATE,
  COLORS_XML_TEMPLATE,
  STRINGS_XML_TEMPLATE,
  PROGUARD_RULES_TEMPLATE,
  README_TEMPLATE,
  GRADLE_WRAPPER_PROPERTIES,
  ZONE_HTML_WRAPPER,
} from '../templates/android/templates';

// Default export configuration
export const DEFAULT_ANDROID_CONFIG: Partial<AndroidExportConfig> = {
  minSdk: 28,
  targetSdk: 33,
  versionCode: 1,
  versionName: '1.0.0',
  includeMedia: true,
};

// Convert app name to valid package name
export function toPackageName(appName: string): string {
  const sanitized = appName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
  return `com.telly.prototype.${sanitized || 'app'}`;
}

// Convert app name to valid project folder name
export function toProjectName(appName: string): string {
  return appName
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50) || 'TellyPrototype';
}

// Extract data URLs from HTML content
interface ExtractedAsset {
  originalUrl: string;
  filename: string;
  data: string;
  mimeType: string;
}

function extractDataUrls(html: string): ExtractedAsset[] {
  const assets: ExtractedAsset[] = [];
  const dataUrlRegex = /data:(image|video|audio)\/([^;]+);base64,([^"'\s)]+)/g;
  let match;
  let index = 0;

  while ((match = dataUrlRegex.exec(html)) !== null) {
    const [fullMatch, mediaType, format, data] = match;
    const extension = format.split(';')[0];
    const filename = `${mediaType}_${index}.${extension}`;
    assets.push({
      originalUrl: fullMatch,
      filename,
      data,
      mimeType: `${mediaType}/${format}`,
    });
    index++;
  }

  return assets;
}

// Rewrite HTML to use Android asset paths
function rewriteAssetUrls(html: string, assets: ExtractedAsset[]): string {
  let result = html;
  for (const asset of assets) {
    const assetPath = `file:///android_asset/${asset.mimeType.split('/')[0]}s/${asset.filename}`;
    result = result.replace(asset.originalUrl, assetPath);
  }
  return result;
}

// Determine which zones have content
function getActiveZones(zoneContent: ZoneContent): Set<ZoneId> {
  const active = new Set<ZoneId>();
  for (const [zone, content] of Object.entries(zoneContent) as [ZoneId, string][]) {
    if (content && content.trim()) {
      active.add(zone);
    }
  }
  return active;
}

// Determine bottom section layout type
function getBottomLayoutType(zoneContent: ZoneContent): 'B' | 'F' | 'CDE' {
  if (zoneContent.B && zoneContent.B.trim()) return 'B';
  if (zoneContent.F && zoneContent.F.trim()) return 'F';
  return 'CDE';
}

// Generate zone initialization code for MainActivity
function generateZoneInit(zone: ZoneId, hasContent: boolean): string {
  if (!hasContent) return '';

  const zoneVar = `zone${zone}`;
  return `
        ${zoneVar} = findViewById(R.id.zone_${zone.toLowerCase()})
        configureWebView(${zoneVar}!!, "${zone}")`;
}

// Generate zone load code
function generateZoneLoad(zone: ZoneId, hasContent: boolean): string {
  if (!hasContent) return '';
  return `        loadZoneFromRaw(zone${zone}!!, R.raw.zone_${zone.toLowerCase()})`;
}

// Generate the Android project
export async function generateAndroidProject(config: AndroidExportConfig): Promise<Blob> {
  const { prototype, packageName, appName, versionCode, versionName, minSdk, targetSdk, includeMedia } = config;
  const zip = new JSZip();
  const projectName = toProjectName(appName);

  // Determine active zones
  const activeZones = getActiveZones(prototype.zoneContent);
  const bottomLayout = getBottomLayoutType(prototype.zoneContent);

  // Collect all assets from zone content
  const allAssets: { zone: ZoneId; assets: ExtractedAsset[] }[] = [];
  const processedZoneContent: Record<ZoneId, string> = { A: '', B: '', C: '', D: '', E: '', F: '' };

  for (const zone of ['A', 'B', 'C', 'D', 'E', 'F'] as ZoneId[]) {
    const content = prototype.zoneContent[zone];
    if (content && content.trim()) {
      const assets = includeMedia ? extractDataUrls(content) : [];
      allAssets.push({ zone, assets });
      processedZoneContent[zone] = includeMedia ? rewriteAssetUrls(content, assets) : content;
    }
  }

  // Create directory structure
  const appPath = `${projectName}/app`;
  const mainPath = `${appPath}/src/main`;
  const javaPath = `${mainPath}/java/${packageName.replace(/\./g, '/')}`;
  const resPath = `${mainPath}/res`;

  // === Root files ===
  zip.file(`${projectName}/build.gradle.kts`, BUILD_GRADLE_ROOT_TEMPLATE);

  zip.file(
    `${projectName}/settings.gradle.kts`,
    SETTINGS_GRADLE_TEMPLATE.replace(/\{\{APP_NAME\}\}/g, appName)
  );

  zip.file(`${projectName}/gradle.properties`, `org.gradle.jvmargs=-Xmx2048m
android.useAndroidX=true`);

  zip.file(`${projectName}/gradlew`, '#!/bin/bash\necho "Run: ./gradlew assembleDebug"');
  zip.file(`${projectName}/gradlew.bat`, '@echo off\necho Run: gradlew assembleDebug');

  // === Gradle wrapper ===
  zip.file(`${projectName}/gradle/wrapper/gradle-wrapper.properties`, GRADLE_WRAPPER_PROPERTIES);

  // === App build.gradle ===
  zip.file(
    `${appPath}/build.gradle.kts`,
    BUILD_GRADLE_APP_TEMPLATE
      .replace(/\{\{PACKAGE_NAME\}\}/g, packageName)
      .replace(/\{\{MIN_SDK\}\}/g, String(minSdk))
      .replace(/\{\{TARGET_SDK\}\}/g, String(targetSdk))
      .replace(/\{\{VERSION_CODE\}\}/g, String(versionCode))
      .replace(/\{\{VERSION_NAME\}\}/g, versionName)
  );

  zip.file(`${appPath}/proguard-rules.pro`, PROGUARD_RULES_TEMPLATE);

  // === AndroidManifest ===
  zip.file(
    `${mainPath}/AndroidManifest.xml`,
    ANDROID_MANIFEST_TEMPLATE
      .replace(/\{\{PACKAGE_NAME\}\}/g, packageName)
      .replace(/\{\{APP_NAME\}\}/g, appName)
  );

  // === MainActivity.kt ===
  let mainActivityCode = MAIN_ACTIVITY_TEMPLATE
    .replace(/\{\{PACKAGE_NAME\}\}/g, packageName);

  // Generate zone initializations
  const zoneInits: string[] = [];
  const zoneLoads: string[] = [];

  if (bottomLayout === 'B') {
    zoneInits.push(generateZoneInit('B', true));
    zoneLoads.push(generateZoneLoad('B', true));
  } else if (bottomLayout === 'F') {
    zoneInits.push(generateZoneInit('F', true));
    zoneInits.push(generateZoneInit('E', activeZones.has('E')));
    zoneLoads.push(generateZoneLoad('F', true));
    if (activeZones.has('E')) zoneLoads.push(generateZoneLoad('E', true));
  } else {
    zoneInits.push(generateZoneInit('C', activeZones.has('C')));
    zoneInits.push(generateZoneInit('D', activeZones.has('D')));
    zoneInits.push(generateZoneInit('E', activeZones.has('E')));
    if (activeZones.has('C')) zoneLoads.push(generateZoneLoad('C', true));
    if (activeZones.has('D')) zoneLoads.push(generateZoneLoad('D', true));
    if (activeZones.has('E')) zoneLoads.push(generateZoneLoad('E', true));
  }

  mainActivityCode = mainActivityCode
    .replace('{{ZONE_B_INIT}}', activeZones.has('B') ? 'zoneB = findViewById(R.id.zone_b)\n        configureWebView(zoneB!!, "B")' : '')
    .replace('{{ZONE_C_INIT}}', activeZones.has('C') ? 'zoneC = findViewById(R.id.zone_c)\n        configureWebView(zoneC!!, "C")' : '')
    .replace('{{ZONE_D_INIT}}', activeZones.has('D') ? 'zoneD = findViewById(R.id.zone_d)\n        configureWebView(zoneD!!, "D")' : '')
    .replace('{{ZONE_E_INIT}}', activeZones.has('E') ? 'zoneE = findViewById(R.id.zone_e)\n        configureWebView(zoneE!!, "E")' : '')
    .replace('{{ZONE_F_INIT}}', activeZones.has('F') ? 'zoneF = findViewById(R.id.zone_f)\n        configureWebView(zoneF!!, "F")' : '')
    .replace('{{ZONE_LOADS}}', zoneLoads.join('\n'));

  zip.file(`${javaPath}/MainActivity.kt`, mainActivityCode);

  // === Layout XML ===
  let bottomSectionXml = BOTTOM_SECTION_ZONES_TEMPLATE;
  if (bottomLayout === 'B') {
    bottomSectionXml = BOTTOM_SECTION_FULL_TEMPLATE;
  } else if (bottomLayout === 'F') {
    bottomSectionXml = BOTTOM_SECTION_F_TEMPLATE;
  }

  zip.file(
    `${resPath}/layout/activity_main.xml`,
    ACTIVITY_MAIN_XML_TEMPLATE.replace('{{BOTTOM_SECTION_XML}}', bottomSectionXml)
  );

  // === Resource values ===
  zip.file(`${resPath}/values/styles.xml`, STYLES_XML_TEMPLATE);
  zip.file(`${resPath}/values/colors.xml`, COLORS_XML_TEMPLATE);
  zip.file(
    `${resPath}/values/strings.xml`,
    STRINGS_XML_TEMPLATE.replace(/\{\{APP_NAME\}\}/g, appName)
  );

  // === Zone HTML files (in res/raw) ===
  for (const zone of ['A', 'B', 'C', 'D', 'E', 'F'] as ZoneId[]) {
    const content = processedZoneContent[zone];
    if (content && content.trim()) {
      // Wrap content if it doesn't have full HTML structure
      let htmlContent = content;
      if (!content.toLowerCase().includes('<!doctype')) {
        htmlContent = ZONE_HTML_WRAPPER.replace('{{CONTENT}}', content);
      }
      zip.file(`${resPath}/raw/zone_${zone.toLowerCase()}.html`, htmlContent);
    } else {
      // Create empty placeholder
      zip.file(
        `${resPath}/raw/zone_${zone.toLowerCase()}.html`,
        ZONE_HTML_WRAPPER.replace('{{CONTENT}}', `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#333;">Zone ${zone}</div>`)
      );
    }
  }

  // === Media assets ===
  if (includeMedia) {
    for (const { zone, assets } of allAssets) {
      for (const asset of assets) {
        const folder = asset.mimeType.split('/')[0] + 's'; // images, videos, audios
        const binaryData = Uint8Array.from(atob(asset.data), c => c.charCodeAt(0));
        zip.file(`${mainPath}/assets/${folder}/${asset.filename}`, binaryData);
      }
    }
  }

  // === README ===
  zip.file(
    `${projectName}/README.md`,
    README_TEMPLATE
      .replace(/\{\{APP_NAME\}\}/g, appName)
      .replace(/\{\{TARGET_SDK\}\}/g, String(targetSdk))
  );

  // Generate ZIP
  return await zip.generateAsync({ type: 'blob' });
}

// Download the generated project
export async function downloadAndroidProject(config: AndroidExportConfig): Promise<void> {
  const blob = await generateAndroidProject(config);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${toProjectName(config.appName)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
