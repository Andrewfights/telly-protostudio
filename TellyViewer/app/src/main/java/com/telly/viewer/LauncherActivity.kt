package com.telly.viewer

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.Settings
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.gson.Gson
import kotlinx.coroutines.*
import java.io.File
import java.io.FileInputStream
import java.util.zip.ZipInputStream

class LauncherActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var emptyView: View
    private lateinit var loadingView: View
    private val prototypes = mutableListOf<PrototypeInfo>()
    private val adapter = PrototypeAdapter()
    private val scope = CoroutineScope(Dispatchers.Main + Job())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_launcher)

        recyclerView = findViewById(R.id.recyclerView)
        emptyView = findViewById(R.id.emptyView)
        loadingView = findViewById(R.id.loadingView)

        recyclerView.layoutManager = GridLayoutManager(this, 3)
        recyclerView.adapter = adapter

        // Check if opened with a .telly file
        intent?.data?.let { uri ->
            handleIncomingFile(uri)
            return
        }

        checkPermissionsAndLoad()
    }

    private fun checkPermissionsAndLoad() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (!Environment.isExternalStorageManager()) {
                val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION)
                intent.data = Uri.parse("package:$packageName")
                startActivityForResult(intent, PERMISSION_REQUEST_CODE)
                return
            }
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)
                != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE),
                    PERMISSION_REQUEST_CODE
                )
                return
            }
        }

        loadPrototypes()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                loadPrototypes()
            } else {
                Toast.makeText(this, "Storage permission required to load prototypes", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun loadPrototypes() {
        loadingView.visibility = View.VISIBLE
        emptyView.visibility = View.GONE

        scope.launch {
            val found = withContext(Dispatchers.IO) {
                scanForTellyFiles()
            }

            prototypes.clear()
            prototypes.addAll(found)
            adapter.notifyDataSetChanged()

            loadingView.visibility = View.GONE
            emptyView.visibility = if (prototypes.isEmpty()) View.VISIBLE else View.GONE
            recyclerView.visibility = if (prototypes.isEmpty()) View.GONE else View.VISIBLE
        }
    }

    private fun scanForTellyFiles(): List<PrototypeInfo> {
        val results = mutableListOf<PrototypeInfo>()

        // Scan common directories
        val searchDirs = listOf(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS),
            File(Environment.getExternalStorageDirectory(), "Telly"),
            getExternalFilesDir(null)
        )

        for (dir in searchDirs) {
            if (dir?.exists() == true) {
                dir.listFiles { file -> file.extension == "telly" }?.forEach { file ->
                    try {
                        val info = readManifest(file)
                        if (info != null) {
                            results.add(info)
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        }

        return results.sortedByDescending { it.createdAt }
    }

    private fun readManifest(file: File): PrototypeInfo? {
        ZipInputStream(FileInputStream(file)).use { zip ->
            var entry = zip.nextEntry
            while (entry != null) {
                if (entry.name == "manifest.json") {
                    val content = zip.bufferedReader().readText()
                    val manifest = Gson().fromJson(content, TellyManifest::class.java)
                    return PrototypeInfo(
                        name = manifest.name,
                        description = manifest.description,
                        createdAt = manifest.createdAt,
                        zoneCount = manifest.zones.count { it.hasContent },
                        assetCount = manifest.assets.size,
                        filePath = file.absolutePath
                    )
                }
                entry = zip.nextEntry
            }
        }
        return null
    }

    private fun handleIncomingFile(uri: Uri) {
        // Copy file to app storage and open
        scope.launch {
            try {
                val tempFile = withContext(Dispatchers.IO) {
                    val inputStream = contentResolver.openInputStream(uri)
                    val tempFile = File(cacheDir, "temp_prototype.telly")
                    inputStream?.use { input ->
                        tempFile.outputStream().use { output ->
                            input.copyTo(output)
                        }
                    }
                    tempFile
                }

                openPrototype(tempFile.absolutePath)
            } catch (e: Exception) {
                Toast.makeText(this@LauncherActivity, "Failed to open file: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun openPrototype(filePath: String) {
        val intent = Intent(this, DisplayActivity::class.java)
        intent.putExtra("prototype_path", filePath)
        startActivity(intent)
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    // Adapter
    inner class PrototypeAdapter : RecyclerView.Adapter<PrototypeAdapter.ViewHolder>() {

        inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val card: CardView = view.findViewById(R.id.card)
            val nameText: TextView = view.findViewById(R.id.nameText)
            val descText: TextView = view.findViewById(R.id.descText)
            val infoText: TextView = view.findViewById(R.id.infoText)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_prototype, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val proto = prototypes[position]
            holder.nameText.text = proto.name
            holder.descText.text = proto.description ?: "No description"
            holder.infoText.text = "${proto.zoneCount} zones • ${proto.assetCount} assets"

            holder.card.setOnClickListener {
                openPrototype(proto.filePath)
            }
        }

        override fun getItemCount() = prototypes.size
    }

    companion object {
        private const val PERMISSION_REQUEST_CODE = 100
    }
}

data class PrototypeInfo(
    val name: String,
    val description: String?,
    val createdAt: String,
    val zoneCount: Int,
    val assetCount: Int,
    val filePath: String
)

data class TellyManifest(
    val version: String,
    val type: String,
    val name: String,
    val description: String?,
    val createdAt: String,
    val zones: List<ZoneInfo>,
    val assets: List<AssetInfo>
)

data class ZoneInfo(
    val id: String,
    val hasContent: Boolean,
    val file: String
)

data class AssetInfo(
    val filename: String,
    val type: String,
    val originalSize: Int
)
