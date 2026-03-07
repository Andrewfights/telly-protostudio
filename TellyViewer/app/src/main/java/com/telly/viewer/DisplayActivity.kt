package com.telly.viewer

import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.gson.Gson
import kotlinx.coroutines.*
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileInputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream

class DisplayActivity : AppCompatActivity() {

    private lateinit var rootLayout: FrameLayout
    private val webViews = mutableMapOf<String, WebView>()
    private var manifest: TellyManifest? = null
    private var bundleContents = mutableMapOf<String, ByteArray>()
    private val scope = CoroutineScope(Dispatchers.Main + Job())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Fullscreen immersive
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        )
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        rootLayout = FrameLayout(this)
        rootLayout.setBackgroundColor(0xFF000000.toInt())
        setContentView(rootLayout)

        val prototypePath = intent.getStringExtra("prototype_path")
        if (prototypePath == null) {
            Toast.makeText(this, "No prototype specified", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        loadBundle(prototypePath)
    }

    private fun loadBundle(path: String) {
        scope.launch {
            try {
                withContext(Dispatchers.IO) {
                    extractBundle(File(path))
                }

                manifest?.let { m ->
                    createLayout(m)
                }
            } catch (e: Exception) {
                Toast.makeText(this@DisplayActivity, "Failed to load: ${e.message}", Toast.LENGTH_LONG).show()
                finish()
            }
        }
    }

    private fun extractBundle(file: File) {
        ZipInputStream(FileInputStream(file)).use { zip ->
            var entry: ZipEntry? = zip.nextEntry
            while (entry != null) {
                val content = zip.readBytes()
                bundleContents[entry.name] = content

                if (entry.name == "manifest.json") {
                    manifest = Gson().fromJson(String(content), TellyManifest::class.java)
                }

                entry = zip.nextEntry
            }
        }
    }

    private fun createLayout(m: TellyManifest) {
        // Determine layout type
        val hasB = m.zones.find { it.id == "B" && it.hasContent } != null
        val hasF = m.zones.find { it.id == "F" && it.hasContent } != null
        val hasC = m.zones.find { it.id == "C" && it.hasContent } != null
        val hasD = m.zones.find { it.id == "D" && it.hasContent } != null
        val hasE = m.zones.find { it.id == "E" && it.hasContent } != null

        // Main vertical layout
        val mainLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }

        // Zone A (always present) - weight 1080
        val zoneA = createWebView("A")
        mainLayout.addView(zoneA, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1080f
        ))

        // Audio grille spacer - weight 100
        val spacer = View(this).apply {
            setBackgroundColor(0xFF1a1a1a.toInt())
        }
        mainLayout.addView(spacer, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 100f
        ))

        // Bottom section - weight 360
        when {
            hasB -> {
                // Full bottom zone B
                val zoneB = createWebView("B")
                mainLayout.addView(zoneB, LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, 0, 360f
                ))
            }
            hasF -> {
                // Zone F + E
                val bottomLayout = LinearLayout(this).apply {
                    orientation = LinearLayout.VERTICAL
                }

                val zoneF = createWebView("F")
                bottomLayout.addView(zoneF, LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, 0, 300f
                ))

                if (hasE) {
                    val zoneE = createWebView("E")
                    bottomLayout.addView(zoneE, LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT, 0, 60f
                    ))
                }

                mainLayout.addView(bottomLayout, LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, 0, 360f
                ))
            }
            else -> {
                // C + D row + E
                val bottomLayout = LinearLayout(this).apply {
                    orientation = LinearLayout.VERTICAL
                }

                // C + D row
                val cdRow = LinearLayout(this).apply {
                    orientation = LinearLayout.HORIZONTAL
                }

                if (hasC) {
                    val zoneC = createWebView("C")
                    cdRow.addView(zoneC, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1280f))
                }
                if (hasD) {
                    val zoneD = createWebView("D")
                    cdRow.addView(zoneD, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 640f))
                }

                if (hasC || hasD) {
                    bottomLayout.addView(cdRow, LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT, 0, 300f
                    ))
                }

                if (hasE) {
                    val zoneE = createWebView("E")
                    bottomLayout.addView(zoneE, LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT, 0, 60f
                    ))
                }

                if (hasC || hasD || hasE) {
                    mainLayout.addView(bottomLayout, LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT, 0, 360f
                    ))
                }
            }
        }

        rootLayout.addView(mainLayout)

        // Load content into WebViews
        loadZoneContent()
    }

    private fun createWebView(zoneId: String): WebView {
        val webView = WebView(this).apply {
            setBackgroundColor(0xFF000000.toInt())
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                mediaPlaybackRequiresUserGesture = false
                allowFileAccess = true
                allowContentAccess = true
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                cacheMode = WebSettings.LOAD_NO_CACHE
            }
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            webViewClient = BundleWebViewClient()
        }
        webViews[zoneId] = webView
        return webView
    }

    private fun loadZoneContent() {
        manifest?.zones?.forEach { zone ->
            if (zone.hasContent) {
                val webView = webViews[zone.id]
                val content = bundleContents["zones/${zone.file}"]
                if (webView != null && content != null) {
                    webView.loadDataWithBaseURL(
                        "file:///bundle/",
                        String(content),
                        "text/html",
                        "UTF-8",
                        null
                    )
                }
            }
        }
    }

    // WebViewClient that intercepts asset requests
    inner class BundleWebViewClient : WebViewClient() {
        override fun shouldInterceptRequest(
            view: WebView?,
            request: WebResourceRequest?
        ): WebResourceResponse? {
            val url = request?.url?.toString() ?: return null

            // Handle bundled assets
            if (url.startsWith("file:///bundle/assets/") || url.contains("assets/")) {
                val assetPath = url
                    .replace("file:///bundle/", "")
                    .replace("file:///android_asset/", "")

                val data = bundleContents[assetPath]
                if (data != null) {
                    val mimeType = when {
                        assetPath.endsWith(".png") -> "image/png"
                        assetPath.endsWith(".jpg") || assetPath.endsWith(".jpeg") -> "image/jpeg"
                        assetPath.endsWith(".gif") -> "image/gif"
                        assetPath.endsWith(".webp") -> "image/webp"
                        assetPath.endsWith(".mp4") -> "video/mp4"
                        assetPath.endsWith(".webm") -> "video/webm"
                        assetPath.endsWith(".mp3") -> "audio/mpeg"
                        assetPath.endsWith(".wav") -> "audio/wav"
                        assetPath.endsWith(".ogg") -> "audio/ogg"
                        else -> "application/octet-stream"
                    }
                    return WebResourceResponse(
                        mimeType,
                        "UTF-8",
                        ByteArrayInputStream(data)
                    )
                }
            }

            return super.shouldInterceptRequest(view, request)
        }
    }

    // Handle back button / remote back
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            finish()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onDestroy() {
        super.onDestroy()
        webViews.values.forEach { it.destroy() }
        scope.cancel()
    }
}
