package io.gatenova.app;
import org.junit.Test;
import static org.junit.Assert.*;
public class DocumentPolicyTest {
    @Test public void permitsOnlyOfficialHttpsPdfPaths() {
        assertTrue(DocumentPolicy.allowedSource("https://gate2026.iitg.ac.in/doc/download/2026/QPs/EC.pdf"));
        assertTrue(DocumentPolicy.allowedSource("https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/EC_GATE2027_Syllabus.pdf"));
        String[] denied = {"http://gate2026.iitg.ac.in/doc/a.pdf", "https://gate2026.iitg.ac.in.evil.test/doc/a.pdf",
            "https://gate2026.iitg.ac.in@evil.test/doc/a.pdf", "https://evil.test/doc/a.pdf", "file:///doc/a.pdf",
            "https://gate2026.iitg.ac.in:8443/doc/a.pdf", "https://gate2026.iitg.ac.in/doc/../private.pdf",
            "https://gate2026.iitg.ac.in/doc/a.pdf?url=https://evil.test", "https://gate2026.iitg.ac.in/doc/a.html"};
        for (String url : denied) assertFalse(url,DocumentPolicy.allowedSource(url));
    }
    @Test public void rejectsPathTraversalAndNonPdfFiles() {
        assertTrue(DocumentPolicy.validId("paper-2026-CE_1"));
        assertFalse(DocumentPolicy.validId("../secrets"));
        assertFalse(DocumentPolicy.validId(null));
        assertFalse(DocumentPolicy.validId("a/b"));
        assertTrue(DocumentPolicy.isPdf(new byte[]{37,80,68,70,45}));
        assertFalse(DocumentPolicy.isPdf("<html>".getBytes()));
        assertFalse(DocumentPolicy.isPdf(new byte[0]));
    }
}
