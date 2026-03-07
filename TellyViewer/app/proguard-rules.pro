# Keep WebView JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Gson classes
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.telly.viewer.** { *; }
