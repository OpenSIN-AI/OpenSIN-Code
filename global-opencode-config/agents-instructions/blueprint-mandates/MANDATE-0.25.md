# MANDATE 0.25: SELBSTKRITIK & CRASHTESTS - CEO-MINDSET (V19.0 - 2026-01-28)

**EFFECTIVE:** 2026-01-28  
**SCOPE:** ALL AI coders, ALL code deliveries  
**STATUS:** QUALITY ASSURANCE MANDATE

**🎯 PRINZIP:** Sei dein SCHLIMMSTER PRÜFER und KONTROLLEUR.

**CEO-MINDSET:** "Vertrauen ist gut, Kontrolle ist besser."

**MANDATORY VALIDATION WORKFLOW:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🛡️  ZERO-DEFEKT VALIDATION - ABSOLUTE QUALITÄTSSICHERUNG                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🔍 SCHRITT 1: SCHWACHSTELLEN-ANALYSE                                       │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Wie könnte ich diesen Code zum Crashen bringen?                         │
│  • Welche Edge-Cases wurden vergessen?                                     │
│  • Ist die Fehlerbehandlung vollständig?                                   │
│  • Gibt es Race Conditions?                                                │
│  • Sind alle Input-Validierungen vorhanden?                                │
│                                                                              │
│  🔍 SCHRITT 2: CRASHTESTS                                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Ungültige Eingaben testen                                               │
│  • Grenzwerte testen (0, null, undefined, "", [], {})                      │
│  • Gleichzeitige Requests testen                                           │
│  • Netzwerk-Fehler simulieren                                              │
│  • Datenbank-Connection lost simulieren                                    │
│                                                                              │
│  🔍 SCHRITT 3: BROWSER-VERIFIKATION                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • UI im Browser öffnen und visuell prüfen                                 │
│  • Mobile/Responsive Testing                                               │
│  • Cross-Browser Testing (Chrome, Firefox, Safari)                         │
│                                                                              │
│  🔍 SCHRITT 4: INTEGRATIONSTESTS                                           │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • End-to-End Tests durchführen                                            │
│  • API-Integration testen                                                  │
│  • Datenbank-Operationen verifizieren                                      │
│  • Externe Services mocken und testen                                      │
│                                                                              │
│  🔍 SCHRITT 5: PERFORMANCE-TESTS                                           │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Load Testing (100+ gleichzeitige Requests)                              │
│  • Memory Leak Detection                                                   │
│  • Response Time Monitoring (< 200ms P95)                                  │
│                                                                              │
│  🔍 SCHRITT 6: SECURITY-AUDIT                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • OWASP Top 10 Check                                                      │
│  • SQL Injection Tests                                                     │
│  • XSS Vulnerability Scan                                                  │
│  • Secret-Leakage Check                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**SKEPTIZISMUS-CHECKLISTE:**

```markdown
## VOR DEM "FERTIG"-SAGEN:

### Code-Qualität
- [ ] Haben oeffentliche oder nicht offensichtliche APIs JSDoc/TSDoc mit echtem Mehrwert?
- [ ] Keine `any` Types in TypeScript?
- [ ] Error Handling an allen kritischen Punkten?
- [ ] Logging für Debugging vorhanden?

### Testing
- [ ] Unit Tests für alle neuen Funktionen?
- [ ] Integration Tests für API-Endpoints?
- [ ] E2E Tests für User Flows?
- [ ] Edge Cases abgedeckt?

### Performance
- [ ] Ladezeit < 3 Sekunden?
- [ ] Keine N+1 Queries?
- [ ] Caching implementiert wo nötig?
- [ ] Bundle Size optimiert?

### Security
- [ ] Input Validierung?
- [ ] Authentication/Authorization?
- [ ] Secrets nicht im Code?
- [ ] CORS korrekt konfiguriert?

### Dokumentation
- [ ] README aktualisiert?
- [ ] API Docs geschrieben?
- [ ] lastchanges.md aktualisiert?
- [ ] Breaking Changes dokumentiert?
- [ ] README, Doku und Issues enthalten Screenshots, Bilder, Diagramme und/oder Videos als Beweis?
```

**GEWISSENHAFTE ANTWORT:**
"Ich bin mir zu 100% sicher, dass alles funktioniert, weil:
1. Alle Tests bestehen (Unit, Integration, E2E)
2. Browser-Verifikation erfolgreich
3. Crashtests bestanden
4. Performance-Tests im grünen Bereich
5. Security-Audit ohne kritische Findings"

---

**Source:** ~/.config/opencode/Agents.md (Line 1781-1889)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
