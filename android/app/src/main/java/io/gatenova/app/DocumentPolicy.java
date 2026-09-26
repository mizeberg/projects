package io.gatenova.app;

import java.net.URI;

/** Defense in depth: only catalog IDs and exact official PDF origins are accepted. */
public final class DocumentPolicy {
    public static final long MAX_BYTES = 32L * 1024 * 1024;
    private DocumentPolicy() {}
    public static boolean validId(String id) {
        return id != null && id.matches("[A-Za-z0-9_-]{1,100}");
    }
    public static boolean allowedSource(String source) {
        try {
            URI uri = new URI(source);
            if (!"https".equals(uri.getScheme()) || uri.getUserInfo() != null
                    || uri.getPort() != -1 || uri.getQuery() != null || uri.getFragment() != null) return false;
            String path = uri.getPath();
            if (path == null || !path.endsWith(".pdf") || path.contains("..")) return false;
            return ("gate2026.iitg.ac.in".equals(uri.getHost()) && path.startsWith("/doc/"))
                    || ("gate2027.iitm.ac.in".equals(uri.getHost()) && path.startsWith("/static/doc/"));
        } catch (Exception ignored) { return false; }
    }
    public static boolean isPdf(byte[] header) {
        return header.length >= 5 && header[0] == '%' && header[1] == 'P'
                && header[2] == 'D' && header[3] == 'F' && header[4] == '-';
    }
}
