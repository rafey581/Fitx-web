package com.fitx.admin;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

/**
 * The studio's web admin in a full-screen WebView, so the app is exactly the
 * admin pages — one codebase, nothing to keep in sync.
 *
 * There is no sign-in screen in the app: if the session has expired the site's
 * own /admin/login page appears. Cookies persist between launches, so signing
 * in once is enough. The server address can be changed by long-pressing the app
 * icon and choosing "Server address" (or from the "can't connect" screen).
 */
public class MainActivity extends Activity {

    private static final String PREFS = "fitx-admin";
    private static final String KEY_URL = "server-url";
    private static final String DEFAULT_URL = "https://fitxfitnessstudio.com/admin";
    private static final String ACTION_SET_SERVER = "com.fitx.admin.SET_SERVER";
    private static final int REQUEST_FILES = 1001;

    private SharedPreferences prefs;
    private WebView webView;
    private View errorView;
    private ProgressBar progress;
    private ValueCallback<Uri[]> pendingFiles;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);

        FrameLayout root = new FrameLayout(this);

        webView = new WebView(this);
        configureWebView();
        root.addView(webView, matchParent());

        progress = new ProgressBar(this);
        progress.setVisibility(View.GONE);
        root.addView(
                progress,
                new FrameLayout.LayoutParams(dp(32), dp(32), Gravity.CENTER));

        errorView = buildErrorView();
        errorView.setVisibility(View.GONE);
        root.addView(errorView, matchParent());

        setContentView(root);

        if (savedInstanceState == null) {
            webView.loadUrl(serverUrl());
        }
        if (ACTION_SET_SERVER.equals(getIntent().getAction())) {
            showServerDialog();
        }
    }

    @SuppressWarnings("deprecation")
    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        // window.open() targets stay in this view instead of opening a popup.
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);

        webView.setBackgroundColor(Color.WHITE);
        webView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return openExternally(request.getUrl());
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                progress.setVisibility(View.VISIBLE);
                errorView.setVisibility(View.GONE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (!request.isForMainFrame()) {
                    return;
                }
                progress.setVisibility(View.GONE);
                errorView.setVisibility(View.VISIBLE);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                    WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pendingFiles != null) {
                    pendingFiles.onReceiveValue(null);
                }
                pendingFiles = callback;
                try {
                    startActivityForResult(params.createIntent(), REQUEST_FILES);
                } catch (ActivityNotFoundException notFound) {
                    pendingFiles = null;
                    callback.onReceiveValue(null);
                    Toast.makeText(MainActivity.this, "No file picker on this device.", Toast.LENGTH_SHORT)
                            .show();
                    return false;
                }
                return true;
            }
        });

        // Exports and other downloads belong to the browser, which handles them.
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(
                    String url, String userAgent, String contentDisposition, String mimeType, long size) {
                openInBrowser(Uri.parse(url));
            }
        });
    }

    /** Keeps the admin inside the app; sends everything else to the browser or dialer. */
    private boolean openExternally(Uri uri) {
        if (uri == null) {
            return false;
        }
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        boolean web = scheme.equals("http") || scheme.equals("https");
        if (web && isAdminHost(uri)) {
            return false;
        }
        boolean external = web
                || scheme.equals("tel")
                || scheme.equals("mailto")
                || scheme.equals("sms")
                || scheme.equals("whatsapp")
                || scheme.equals("intent");
        if (external) {
            openInBrowser(uri);
        }
        return external;
    }

    private boolean isAdminHost(Uri uri) {
        String host = uri.getHost();
        String adminHost = Uri.parse(serverUrl()).getHost();
        return host != null && adminHost != null && host.equalsIgnoreCase(adminHost);
    }

    private void openInBrowser(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException notFound) {
            Toast.makeText(this, "Nothing on this device can open that link.", Toast.LENGTH_SHORT).show();
        }
    }

    private String serverUrl() {
        String url = prefs.getString(KEY_URL, DEFAULT_URL);
        return url == null || url.trim().isEmpty() ? DEFAULT_URL : url.trim();
    }

    private View buildErrorView() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setBackgroundColor(Color.WHITE);
        box.setClickable(true);
        int pad = dp(28);
        box.setPadding(pad, pad, pad, pad);

        TextView title = new TextView(this);
        title.setText(R.string.error_title);
        title.setTextSize(18f);
        title.setTextColor(Color.parseColor("#0D0A10"));
        title.setGravity(Gravity.CENTER);
        box.addView(title);

        TextView hint = new TextView(this);
        hint.setText(R.string.error_hint);
        hint.setTextSize(14f);
        hint.setTextColor(Color.parseColor("#5B5F6B"));
        hint.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams hintParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        hintParams.topMargin = dp(10);
        box.addView(hint, hintParams);

        Button retry = new Button(this);
        retry.setText(R.string.error_retry);
        retry.setOnClickListener(v -> {
            errorView.setVisibility(View.GONE);
            webView.reload();
        });
        LinearLayout.LayoutParams retryParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        retryParams.topMargin = dp(18);
        box.addView(retry, retryParams);

        Button change = new Button(this);
        change.setText(R.string.server_title);
        change.setOnClickListener(v -> showServerDialog());
        box.addView(change);
        return box;
    }

    private void showServerDialog() {
        EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_TEXT_VARIATION_URI);
        input.setSingleLine(true);
        input.setImeOptions(EditorInfo.IME_ACTION_GO);
        input.setText(serverUrl());

        FrameLayout wrap = new FrameLayout(this);
        wrap.setPadding(dp(20), dp(8), dp(20), 0);
        wrap.addView(input, matchParent());

        new AlertDialog.Builder(this)
                .setTitle(R.string.server_title)
                .setMessage(R.string.server_hint)
                .setView(wrap)
                .setPositiveButton(R.string.server_save, (dialog, which) -> {
                    String url = input.getText().toString().trim();
                    if (!url.startsWith("http://") && !url.startsWith("https://")) {
                        Toast.makeText(this, R.string.server_bad_url, Toast.LENGTH_LONG).show();
                        return;
                    }
                    prefs.edit().putString(KEY_URL, url).apply();
                    errorView.setVisibility(View.GONE);
                    webView.loadUrl(url);
                })
                .setNegativeButton(R.string.server_cancel, null)
                .show();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (ACTION_SET_SERVER.equals(intent.getAction())) {
            showServerDialog();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_FILES) {
            if (pendingFiles != null) {
                pendingFiles.onReceiveValue(
                        WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                pendingFiles = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        // Keep the signed-in session after the app is closed.
        CookieManager.getInstance().flush();
        super.onPause();
    }

    private FrameLayout.LayoutParams matchParent() {
        return new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
