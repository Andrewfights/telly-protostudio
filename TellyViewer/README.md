# Telly Prototype Viewer

A standalone Android app for viewing prototypes created in Telly ProtoStudio.

## Overview

Instead of building a separate APK for each prototype, the Telly Viewer app provides a single, reusable viewer that can load any `.telly` bundle file. This makes it easy to:

- Export prototypes from ProtoStudio
- Transfer to your Telly device
- View and iterate quickly without rebuilding

## Installation

### Option 1: Download Pre-built APK (Recommended)

1. Go to the [Releases page](https://github.com/your-repo/telly-protostudio/releases)
2. Download `TellyViewer-debug.apk`
3. Transfer to your Telly device (USB, cloud storage, etc.)
4. Install via Settings > Security > Allow unknown sources
5. Open "Telly Prototype Viewer" from the app drawer

### Option 2: Build from Source

Requirements:
- Android Studio Arctic Fox or newer
- JDK 17+
- Android SDK 33+

```bash
cd TellyViewer
./gradlew assembleDebug
# APK will be at app/build/outputs/apk/debug/app-debug.apk
```

## Usage

### Exporting Prototypes

1. In ProtoStudio, open your prototype
2. Click **Export** > **Telly Bundle (.telly)**
3. Save the `.telly` file

### Loading Prototypes on Telly

**Method 1: Downloads Folder**
1. Copy the `.telly` file to your Telly's Downloads folder
2. Open the Telly Viewer app
3. Select your prototype from the list
4. Tap to launch fullscreen

**Method 2: Direct Open**
1. Open a file manager on your Telly
2. Navigate to your `.telly` file
3. Open with "Telly Prototype Viewer"

## Features

- **6-Zone Layout**: Full support for Telly's zone system (A-F)
- **Zone Priority**: Proper rendering logic (B > F > C+D+E)
- **Hardware Acceleration**: Optimized WebView rendering
- **Auto-Refresh**: Automatically detects new bundles

## .telly Bundle Format

A `.telly` file is a ZIP archive containing:

```
prototype.telly/
├── manifest.json      # Metadata and zone configuration
├── zones/
│   ├── zone_a.html
│   ├── zone_b.html
│   ├── zone_c.html
│   ├── zone_d.html
│   ├── zone_e.html
│   └── zone_f.html
└── assets/
    ├── images/
    ├── videos/
    └── audio/
```

## Zone Dimensions

| Zone | Width | Height | Description |
|------|-------|--------|-------------|
| A    | 1920  | 1080   | Main content area |
| B    | 1920  | 360    | Full-width bottom panel |
| C    | 1280  | 300    | Bottom left panel |
| D    | 640   | 300    | Bottom right panel |
| E    | 1920  | 60     | Ticker strip |
| F    | 1920  | 300    | Combined C+D area |

## Troubleshooting

**App doesn't see my .telly files**
- Ensure files are in the Downloads folder
- Check file extension is `.telly` (not `.telly.zip`)
- Restart the app after adding new files

**Prototype looks wrong**
- Check zone content in ProtoStudio preview first
- Verify zone HTML is self-contained (inline styles/scripts)

**Performance issues**
- Reduce video/animation complexity
- Use hardware-accelerated CSS transforms
- Avoid heavy JavaScript calculations

## License

MIT License - See main project LICENSE file.
