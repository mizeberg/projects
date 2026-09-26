package io.gatenova.app;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.Toast;
import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** A permission-free shell around the app's signed, bundled learning content. */
public class MainActivity extends ComponentActivity {
    private static final String ORIGIN = "https://appassets.androidplatform.net";
    private static final String START_URL = ORIGIN + "/assets/www/index.html";
    private static final int OPEN_NOTE = 1001;
    private static final int SAVE_NOTE = 1002;
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingExport;

    @SuppressLint("SetJavaScriptEnabled") // Only signed bundled assets can execute.
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(16,19,16));
        ViewCompat.setOnApplyWindowInsetsListener(root, (view, windowInsets) -> {
            Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout() | WindowInsetsCompat.Type.ime());
            view.setPadding(insets.left, insets.top, insets.right, insets.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(16,19,16));
        root.addView(webView, new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);
        WindowCompat.getInsetsController(getWindow(), root).setAppearanceLightStatusBars(false);
        WindowCompat.getInsetsController(getWindow(), root).setAppearanceLightNavigationBars(false);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // Explicit user-selected document URIs only.
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        webView.addJavascriptInterface(new NoteBridge(), "GateNovaAndroid");
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        webView.setWebViewClient(new WebViewClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if ("https".equals(url.getScheme()) && "appassets.androidplatform.net".equals(url.getHost())) {
                    WebResourceResponse response = loader.shouldInterceptRequest(url);
                    if (response != null) return response;
                }
                // Never fall back to a remote origin, including missing /api routes.
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not found", null,
                        new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && "appassets.androidplatform.net".equals(uri.getHost())
                        && "/assets/www/index.html".equals(uri.getPath())) return false;
                if (request.isForMainFrame() && request.hasGesture() && "https".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (ActivityNotFoundException ignored) { showMessage("No browser is available to open this link."); }
                }
                return true;
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request,
                    androidx.webkit.WebResourceErrorCompat error) {
                if (request.isForMainFrame()) new AlertDialog.Builder(MainActivity.this)
                        .setTitle("Let’s get back on your path")
                        .setMessage("Nova couldn’t open this screen. Your saved progress is still here.")
                        .setPositiveButton("Try again", (dialog, which) -> webView.loadUrl(START_URL))
                        .setNegativeButton("Close", (dialog, which) -> finish()).show();
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("text/plain");
                try { startActivityForResult(intent, OPEN_NOTE); }
                catch (ActivityNotFoundException ignored) {
                    fileCallback.onReceiveValue(null); fileCallback = null;
                    showMessage("A document picker is not available on this device.");
                }
                return true;
            }
        });
        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null)
            webView.loadUrl(START_URL);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() { handleBack(); }
        });
    }

    @Override public void onSaveInstanceState(Bundle state) {
        webView.saveState(state); super.onSaveInstanceState(state);
    }
    private void handleBack() {
        webView.evaluateJavascript("Boolean(window.__gatenovaBack && window.__gatenovaBack())", handled -> {
            if (!"true".equals(handled)) new AlertDialog.Builder(this)
                    .setTitle("Take a little break?")
                    .setMessage("Your learning progress is saved on this phone.")
                    .setPositiveButton("Close app", (dialog, which) -> finish())
                    .setNegativeButton("Keep exploring", null).show();
        });
    }

    private final class NoteBridge {
        @JavascriptInterface public void exportNote(String title, String body) {
            if (title == null || body == null || title.length() > 200 || body.length() > 50000) return;
            runOnUiThread(() -> {
                if (pendingExport != null) { showMessage("Finish your current export first."); return; }
                String currentUrl = webView.getUrl();
                if (currentUrl == null || !START_URL.equals(currentUrl.split("#", 2)[0])) return;
                pendingExport = body;
                String name = title.replaceAll("[^\\p{L}\\p{N} ._-]", "_").trim();
                if (name.isEmpty()) name = "GATENOVA note";
                if (!name.endsWith(".txt")) name += ".txt";
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("text/plain");
                intent.putExtra(Intent.EXTRA_TITLE, name);
                try { startActivityForResult(intent, SAVE_NOTE); }
                catch (ActivityNotFoundException ignored) { pendingExport = null; showMessage("No document picker is available."); }
            });
        }
    }
    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == OPEN_NOTE && fileCallback != null) {
            fileCallback.onReceiveValue(resultCode == RESULT_OK && data != null && data.getData() != null
                    ? new Uri[]{data.getData()} : null);
            fileCallback = null;
        }
        if (requestCode == SAVE_NOTE) {
            String content = pendingExport; pendingExport = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null && content != null) {
                try (OutputStream stream = getContentResolver().openOutputStream(data.getData())) {
                    if (stream == null) throw new IOException("Document unavailable");
                    stream.write(content.getBytes(StandardCharsets.UTF_8));
                    showMessage("Note exported.");
                } catch (IOException | SecurityException error) { showMessage("This note couldn’t be saved. Please try again."); }
            }
        }
    }
    private void showMessage(String message) { Toast.makeText(this, message, Toast.LENGTH_SHORT).show(); }
    @Override protected void onPause() { webView.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (webView != null) webView.onResume(); }
    @Override protected void onDestroy() {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        if (webView != null) { webView.removeJavascriptInterface("GateNovaAndroid"); webView.destroy(); }
        super.onDestroy();
    }
}
