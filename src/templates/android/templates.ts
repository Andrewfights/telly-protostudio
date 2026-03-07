// Android Project Templates for Telly ProtoStudio APK Export

export const ANDROID_MANIFEST_TEMPLATE = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="{{PACKAGE_NAME}}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="{{APP_NAME}}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.TellyPrototype"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:screenOrientation="landscape"
            android:theme="@style/Theme.TellyPrototype.Fullscreen">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

export const MAIN_ACTIVITY_TEMPLATE = `package {{PACKAGE_NAME}}

import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebSettings
import android.webkit.JavascriptInterface
import androidx.appcompat.app.AppCompatActivity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import androidx.localbroadcastmanager.content.LocalBroadcastManager

class MainActivity : AppCompatActivity() {

    private lateinit var zoneA: WebView
    private var zoneB: WebView? = null
    private var zoneC: WebView? = null
    private var zoneD: WebView? = null
    private var zoneE: WebView? = null
    private var zoneF: WebView? = null

    private val eventBus = TellyEventBus()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Fullscreen immersive mode
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        )
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContentView(R.layout.activity_main)

        initializeZones()
        loadZoneContent()
        setupEventBus()
    }

    private fun initializeZones() {
        zoneA = findViewById(R.id.zone_a)
        configureWebView(zoneA, "A")

        {{ZONE_B_INIT}}
        {{ZONE_C_INIT}}
        {{ZONE_D_INIT}}
        {{ZONE_E_INIT}}
        {{ZONE_F_INIT}}
    }

    private fun configureWebView(webView: WebView, zoneId: String) {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = true
            allowContentAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            setRenderPriority(WebSettings.RenderPriority.HIGH)
        }

        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        webView.webViewClient = TellyWebViewClient()
        webView.addJavascriptInterface(TellyJsBridge(eventBus, zoneId), "TellyBridge")
    }

    private fun loadZoneContent() {
        loadZoneFromRaw(zoneA, R.raw.zone_a)
        {{ZONE_LOADS}}
    }

    private fun loadZoneFromRaw(webView: WebView, resourceId: Int) {
        val content = resources.openRawResource(resourceId)
            .bufferedReader()
            .use { it.readText() }
        webView.loadDataWithBaseURL(
            "file:///android_asset/",
            content,
            "text/html",
            "UTF-8",
            null
        )
    }

    private fun setupEventBus() {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                val message = intent?.getStringExtra("message") ?: return
                val sourceZone = intent.getStringExtra("sourceZone") ?: return

                // Broadcast to all zones except source
                broadcastToZone(zoneA, "A", sourceZone, message)
                zoneB?.let { broadcastToZone(it, "B", sourceZone, message) }
                zoneC?.let { broadcastToZone(it, "C", sourceZone, message) }
                zoneD?.let { broadcastToZone(it, "D", sourceZone, message) }
                zoneE?.let { broadcastToZone(it, "E", sourceZone, message) }
                zoneF?.let { broadcastToZone(it, "F", sourceZone, message) }
            }
        }

        LocalBroadcastManager.getInstance(this)
            .registerReceiver(receiver, IntentFilter("TELLY_EVENT"))
    }

    private fun broadcastToZone(webView: WebView, zoneId: String, sourceZone: String, message: String) {
        if (zoneId != sourceZone) {
            webView.evaluateJavascript(
                "window.postMessage($message, '*');",
                null
            )
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        zoneA.destroy()
        zoneB?.destroy()
        zoneC?.destroy()
        zoneD?.destroy()
        zoneE?.destroy()
        zoneF?.destroy()
    }
}

class TellyWebViewClient : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
        return false
    }
}

class TellyJsBridge(private val eventBus: TellyEventBus, private val zoneId: String) {
    @JavascriptInterface
    fun postMessage(message: String) {
        eventBus.broadcast(message, zoneId)
    }
}

class TellyEventBus {
    fun broadcast(message: String, sourceZone: String) {
        val intent = Intent("TELLY_EVENT").apply {
            putExtra("message", message)
            putExtra("sourceZone", sourceZone)
        }
        // Note: Requires context - this is simplified
    }
}`;

export const ACTIVITY_MAIN_XML_TEMPLATE = `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#000000">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:orientation="vertical">

        <!-- Zone A: Main Screen (1920x1080) -->
        <WebView
            android:id="@+id/zone_a"
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="1080" />

        <!-- Audio Grille Space -->
        <View
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="100"
            android:background="#1a1a1a" />

        <!-- Bottom Section: 360px equivalent -->
        {{BOTTOM_SECTION_XML}}

    </LinearLayout>
</FrameLayout>`;

export const BOTTOM_SECTION_FULL_TEMPLATE = `
        <!-- Zone B: Full Bottom (1920x360) -->
        <WebView
            android:id="@+id/zone_b"
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="360" />`;

export const BOTTOM_SECTION_ZONES_TEMPLATE = `
        <!-- Bottom Zones -->
        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="360"
            android:orientation="vertical">

            <!-- C + D Row (300px) -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="0dp"
                android:layout_weight="300"
                android:orientation="horizontal">

                <!-- Zone C: Left Widget (1280x300) -->
                <WebView
                    android:id="@+id/zone_c"
                    android:layout_width="0dp"
                    android:layout_height="match_parent"
                    android:layout_weight="1280" />

                <!-- Zone D: Right Ad Block (640x300) -->
                <WebView
                    android:id="@+id/zone_d"
                    android:layout_width="0dp"
                    android:layout_height="match_parent"
                    android:layout_weight="640" />
            </LinearLayout>

            <!-- Zone E: Ticker (1920x60) -->
            <WebView
                android:id="@+id/zone_e"
                android:layout_width="match_parent"
                android:layout_height="0dp"
                android:layout_weight="60" />

        </LinearLayout>`;

export const BOTTOM_SECTION_F_TEMPLATE = `
        <!-- Bottom with Zone F -->
        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="360"
            android:orientation="vertical">

            <!-- Zone F: Combined C+D Area (1920x300) -->
            <WebView
                android:id="@+id/zone_f"
                android:layout_width="match_parent"
                android:layout_height="0dp"
                android:layout_weight="300" />

            <!-- Zone E: Ticker (1920x60) -->
            <WebView
                android:id="@+id/zone_e"
                android:layout_width="match_parent"
                android:layout_height="0dp"
                android:layout_weight="60" />

        </LinearLayout>`;

export const BUILD_GRADLE_APP_TEMPLATE = `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "{{PACKAGE_NAME}}"
    compileSdk = {{TARGET_SDK}}

    defaultConfig {
        applicationId = "{{PACKAGE_NAME}}"
        minSdk = {{MIN_SDK}}
        targetSdk = {{TARGET_SDK}}
        versionCode = {{VERSION_CODE}}
        versionName = "{{VERSION_NAME}}"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.localbroadcastmanager:localbroadcastmanager:1.1.0")
}`;

export const BUILD_GRADLE_ROOT_TEMPLATE = `plugins {
    id("com.android.application") version "8.1.4" apply false
    id("org.jetbrains.kotlin.android") version "1.9.20" apply false
}`;

export const SETTINGS_GRADLE_TEMPLATE = `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "{{APP_NAME}}"
include(":app")`;

export const STYLES_XML_TEMPLATE = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.TellyPrototype" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="colorPrimary">#6366f1</item>
        <item name="colorPrimaryDark">#4f46e5</item>
        <item name="colorAccent">#818cf8</item>
        <item name="android:windowBackground">#000000</item>
    </style>

    <style name="Theme.TellyPrototype.Fullscreen" parent="Theme.TellyPrototype">
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
    </style>
</resources>`;

export const COLORS_XML_TEMPLATE = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="black">#FF000000</color>
    <color name="white">#FFFFFFFF</color>
    <color name="primary">#6366f1</color>
    <color name="primary_dark">#4f46e5</color>
    <color name="accent">#818cf8</color>
</resources>`;

export const STRINGS_XML_TEMPLATE = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">{{APP_NAME}}</string>
</resources>`;

export const PROGUARD_RULES_TEMPLATE = `# Keep WebView JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Kotlin metadata
-keep class kotlin.Metadata { *; }`;

export const README_TEMPLATE = `# {{APP_NAME}}

Generated by Telly ProtoStudio

## Building the APK

### Prerequisites
- Android Studio Arctic Fox or later
- JDK 11 or later
- Android SDK with API level {{TARGET_SDK}}

### Build Steps

1. Open this project in Android Studio
2. Wait for Gradle sync to complete
3. Select Build > Build Bundle(s) / APK(s) > Build APK(s)
4. Find the APK in \`app/build/outputs/apk/debug/\`

### Installing on Telly

1. Enable "Install from unknown sources" in Telly settings
2. Copy the APK to Telly via USB or network
3. Open a file manager and install the APK
4. Launch "{{APP_NAME}}" from the app drawer

## Zone Layout

| Zone | Dimensions | Purpose |
|------|-----------|---------|
| A | 1920x1080 | Main Screen |
| B | 1920x360 | Full Bottom (if used) |
| C | 1280x300 | Bottom Left Widget |
| D | 640x300 | Bottom Right Block |
| E | 1920x60 | News Ticker |
| F | 1920x300 | Combined C+D Area |

## Cross-Zone Communication

Zones can communicate via the event bus:

\`\`\`javascript
// Send message from one zone
window.TellyBridge.postMessage(JSON.stringify({
  type: 'MY_EVENT',
  data: { foo: 'bar' }
}));

// Receive in another zone
window.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'MY_EVENT') {
    console.log('Received:', data.data);
  }
});
\`\`\`

## License

Generated content - please add your own license.
`;

export const GRADLE_WRAPPER_PROPERTIES = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`;

export const ZONE_HTML_WRAPPER = `<!DOCTYPE html>
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
{{CONTENT}}
</body>
</html>`;
