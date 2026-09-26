package io.gatenova.app;

import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.os.Bundle;
import android.os.ParcelFileDescriptor;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import androidx.activity.ComponentActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Isolated native PDF reader. Documents never execute JavaScript or access the app bridge. */
public class DocumentActivity extends ComponentActivity {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private volatile boolean destroyed;
    private volatile HttpURLConnection connection;
    private PdfRenderer renderer; // Confined to worker.
    private Bitmap displayed;
    private ImageView image;
    private TextView status;
    private Button previous, next, smaller, larger, retry;
    private ScrollView scroll;
    private int pageIndex, pageCount;
    private float zoom = 1;
    private String documentId;
    private JSONObject document;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        documentId = getIntent().getStringExtra("documentId");
        if (!DocumentPolicy.validId(documentId)) { finish(); return; }
        if (state != null) { pageIndex = state.getInt("page", 0); zoom = state.getFloat("zoom", 1); }
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(17,23,16));
        ViewCompat.setOnApplyWindowInsetsListener(root, (view, insets) -> {
            Insets i = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            view.setPadding(i.left + dp(12), i.top + dp(8), i.right + dp(12), i.bottom + dp(8));
            return WindowInsetsCompat.CONSUMED;
        });
        setContentView(root);
        WindowCompat.getInsetsController(getWindow(), root).setAppearanceLightStatusBars(false);
        WindowCompat.getInsetsController(getWindow(), root).setAppearanceLightNavigationBars(false);
        LinearLayout heading = row(); root.addView(heading);
        Button back = button("Back", view -> finish()); heading.addView(back);
        TextView title = label("GATENOVA · Document reader", 16); heading.addView(title, new LinearLayout.LayoutParams(0,-2,1));
        status = label("Opening your document…", 13); status.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE); root.addView(status);
        retry = button("Try again", view -> load()); retry.setVisibility(View.GONE); root.addView(retry);
        LinearLayout controls = row(); root.addView(controls);
        previous = button("Previous", view -> {pageIndex--; render();});
        next = button("Next", view -> {pageIndex++; render();});
        smaller = button("−", view -> {zoom = Math.max(1,zoom - 0.5f); render();});
        smaller.setContentDescription("Zoom out");
        larger = button("+", view -> {zoom = Math.min(3,zoom + 0.5f); render();});
        larger.setContentDescription("Zoom in");
        controls.addView(previous, new LinearLayout.LayoutParams(0,-2,1));
        controls.addView(next, new LinearLayout.LayoutParams(0,-2,1));
        controls.addView(smaller, new LinearLayout.LayoutParams(dp(56),-2));
        controls.addView(larger, new LinearLayout.LayoutParams(dp(56),-2));
        scroll = new ScrollView(this); root.addView(scroll, new LinearLayout.LayoutParams(-1,0,1));
        HorizontalScrollView horizontal = new HorizontalScrollView(this); scroll.addView(horizontal);
        image = new ImageView(this); image.setAdjustViewBounds(true); image.setScaleType(ImageView.ScaleType.FIT_CENTER); horizontal.addView(image);
        TextView help = label("Use + to enlarge. Swipe to pan. The app’s syllabus view also offers readable, searchable text.",12); root.addView(help);
        load();
    }
    private void load() {
        retry.setVisibility(View.GONE); setBusy(); status.setText(R.string.document_opening);
        worker.execute(() -> {
            try {
                if (renderer != null) { renderer.close(); renderer = null; }
                if (document == null) {
                    try (InputStream in = getAssets().open("www/library/catalog.json")) {
                        JSONArray catalog = new JSONArray(new String(readCatalog(in), StandardCharsets.UTF_8));
                        for (int i = 0; i < catalog.length(); i++) {
                            JSONObject item = catalog.getJSONObject(i);
                            if (documentId.equals(item.getString("id"))) { document = item; break; }
                        }
                    }
                }
                if (document == null || !DocumentPolicy.allowedSource(document.getString("source"))) throw new IOException("Unknown document");
                File directory = new File(getFilesDir(),"library");
                if (!directory.isDirectory() && !directory.mkdirs()) throw new IOException("Storage unavailable");
                File file = new File(directory, documentId + ".pdf");
                if (!file.exists()) {
                    File temporary = new File(directory, documentId + ".partial");
                    try {
                        if (directory.getUsableSpace() < document.getLong("bytes") + 20L*1024*1024) throw new IOException("Storage low");
                        download(temporary);
                        try (FileInputStream in = new FileInputStream(temporary)) {
                            byte[] header = new byte[5];
                            if (in.read(header) != 5 || !DocumentPolicy.isPdf(header)) throw new IOException("Invalid document");
                        }
                        // Reject invalid PDFs before they become persistent offline downloads.
                        try (PdfRenderer check = openPdf(temporary)) {
                            if (check.getPageCount() < 1) throw new IOException("Empty document");
                        }
                        if (destroyed || !temporary.renameTo(file)) throw new IOException("Download interrupted");
                    } finally { if (temporary.exists()) temporary.delete(); }
                }
                try { renderer = openPdf(file); }
                catch (IOException | RuntimeException error) { file.delete(); throw error; }
                pageCount = renderer.getPageCount(); pageIndex = Math.min(Math.max(0,pageIndex),pageCount-1);
                if (!destroyed) runOnUiThread(this::render);
            } catch (Exception error) { showError(); }
        });
    }
    private PdfRenderer openPdf(File file) throws IOException {
        ParcelFileDescriptor descriptor = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
        try { return new PdfRenderer(descriptor); }
        catch (IOException | RuntimeException error) {
            try { descriptor.close(); } catch (IOException ignored) { /* Preserve the original failure. */ }
            throw error;
        }
    }
    private byte[] readCatalog(InputStream input) throws IOException {
        ByteArrayOutputStream result = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192]; int count;
        while ((count = input.read(buffer)) != -1) {
            if (result.size() + count > 256 * 1024) throw new IOException("Catalog too large");
            result.write(buffer, 0, count);
        }
        return result.toByteArray();
    }
    private void download(File destination) throws Exception {
        if (document.getBoolean("bundled")) {
            try (InputStream input = getAssets().open("www/library/" + documentId + ".pdf")) {
                String digest = copy(input, destination, document.getLong("bytes"));
                if (!digest.equals(document.getString("sha256"))) throw new IOException("Content mismatch");
            }
            return;
        }
        updateStatus("Downloading official PDF… Internet is needed the first time.");
        HttpURLConnection request = (HttpURLConnection) new URL(document.getString("source")).openConnection();
        connection = request;
        try {
            request.setInstanceFollowRedirects(false);
            request.setConnectTimeout(15000); request.setReadTimeout(20000);
            request.setRequestProperty("Accept","application/pdf");
            if (request.getResponseCode() != 200) throw new IOException("Source unavailable");
            long size = request.getContentLengthLong();
            if (size > DocumentPolicy.MAX_BYTES) throw new IOException("Document too large");
            try (InputStream input = request.getInputStream()) { copy(input,destination,size); }
        } finally { request.disconnect(); connection = null; }
    }
    private String copy(InputStream input, File file, long expected) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        long total = 0, lastUpdate = 0, started = System.currentTimeMillis();
        try (FileOutputStream out = new FileOutputStream(file)) {
            byte[] buffer = new byte[32768]; int size;
            while ((size = input.read(buffer)) != -1) {
                if (destroyed || System.currentTimeMillis()-started > 120000) throw new IOException("Cancelled");
                total += size;
                if (total > DocumentPolicy.MAX_BYTES) throw new IOException("Document too large");
                out.write(buffer,0,size); digest.update(buffer,0,size);
                if (total-lastUpdate > 512*1024) {
                    lastUpdate = total;
                    updateStatus(String.format(java.util.Locale.ROOT,"Downloading %.1f MB%s",total/1048576.0,
                            expected > 0 ? String.format(java.util.Locale.ROOT," of %.1f MB",expected/1048576.0) : ""));
                }
            }
            if (expected > 0 && total != expected) throw new IOException("Incomplete download");
        }
        StringBuilder hex = new StringBuilder();
        for (byte b : digest.digest()) hex.append(String.format(java.util.Locale.ROOT,"%02x",b & 255));
        return hex.toString();
    }
    private void render() {
        if (destroyed) return;
        setBusy();
        status.setText(getString(R.string.document_rendering, pageIndex+1));
        final int page = pageIndex;
        final float magnification = zoom;
        final int screenWidth = getResources().getDisplayMetrics().widthPixels - dp(24);
        worker.execute(() -> {
            if (destroyed || renderer == null) return;
            try (PdfRenderer.Page current = renderer.openPage(page)) {
                float scale = Math.min((screenWidth*magnification)/current.getWidth(),
                        (float)Math.sqrt(4000000.0/(current.getWidth()*(double)current.getHeight())));
                int width = Math.max(1,(int)(current.getWidth()*scale));
                int height = Math.max(1,(int)(current.getHeight()*scale));
                Bitmap bitmap = Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);
                bitmap.eraseColor(Color.WHITE);
                current.render(bitmap,null,null,PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
                runOnUiThread(() -> {
                    if (destroyed) { bitmap.recycle(); return; }
                    Bitmap old = displayed; displayed = bitmap;
                    image.setImageBitmap(bitmap); image.setLayoutParams(new android.widget.FrameLayout.LayoutParams(width,height));
                    image.setContentDescription("Official PDF page " + (page+1) + " of " + pageCount);
                    if (old != null) old.recycle();
                    scroll.scrollTo(0,0);
                    status.setText(getString(R.string.document_status, document.optString("title"), document.optInt("year"), page+1, pageCount));
                    previous.setEnabled(pageIndex>0); next.setEnabled(pageIndex<pageCount-1);
                    smaller.setEnabled(zoom>1); larger.setEnabled(zoom<3);
                });
            } catch (Exception | OutOfMemoryError error) { showError(); }
        });
    }
    private void setBusy() { previous.setEnabled(false); next.setEnabled(false); smaller.setEnabled(false); larger.setEnabled(false); }
    private void showError() {
        if (!destroyed) runOnUiThread(() -> {
            if (destroyed) return;
            status.setText(R.string.document_error);
            retry.setVisibility(View.VISIBLE);
        });
    }
    private void updateStatus(String text) { if (!destroyed) runOnUiThread(() -> {if (!destroyed) status.setText(text);}); }
    private int dp(int value) { return Math.round(value*getResources().getDisplayMetrics().density); }
    private LinearLayout row() { LinearLayout view = new LinearLayout(this); view.setGravity(Gravity.CENTER_VERTICAL); return view; }
    private TextView label(String text,int size) { TextView view = new TextView(this); view.setText(text); view.setTextSize(size); view.setTextColor(Color.rgb(220,235,209)); view.setPadding(dp(8),dp(8),dp(8),dp(8)); return view; }
    private Button button(String text,View.OnClickListener listener) { Button view = new Button(this); view.setText(text); view.setTextSize(12); view.setMinHeight(dp(48)); view.setOnClickListener(listener); return view; }
    @Override public void onSaveInstanceState(Bundle state) { state.putInt("page",pageIndex); state.putFloat("zoom",zoom); super.onSaveInstanceState(state); }
    @Override protected void onDestroy() {
        destroyed = true;
        HttpURLConnection active = connection; if (active != null) active.disconnect();
        worker.execute(() -> {if (renderer != null) { renderer.close(); renderer = null; }});
        worker.shutdown();
        if (image != null) image.setImageDrawable(null); if (displayed != null) displayed.recycle();
        super.onDestroy();
    }
}
