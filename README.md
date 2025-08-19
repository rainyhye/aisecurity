Backend API contracts (제안)

**취약점 탐지 실행 (정적+동적 합성)**

````POST /api/detect-vulns (multipart/form-data)
file: 업로드 파일 (zip, tgz, 단일 코드 등)
code: 직접 입력 코드를 text/plain로 보낼 때 (선택)
Response 200 (JSON)```

```{
"runId": "uuid-...",
"counts": {
"total": 23,
"bySeverity": {"Critical":2, "High":7, "Medium":10, "Low":4},
"byType": {"SQL Injection":5, "XSS":4, "Hardcoded Secret":6}
},
"findings": [
{
"id": "F-001",
"title": "...",
"severity": "High",
"type": "SQL Injection",
"file": "path/to/file.js",
"lineStart": 42,
"lineEnd": 58,
"cwe": "CWE-89",
"cvss": 8.0,
"recommendation": "...",
"evidence": "(선택) 스택/요청/스크린샷",
"tool": "semgrep|zap|custom-dyn"
}
],
"createdAt": "2025-08-19T07:00:00Z"
}
````

**RAG 시큐어 코딩 가이드라인**
POST /api/guidelines

```{
"runId": "uuid-...",
"selection": ["F-001", "F-002"]
}

```

Response 200

```{
"runId": "uuid-...",
"guidelines": [
{ "findingId": "F-001", "cwe": "CWE-89", "howToFix": "...", "codeExample": "...", "references": ["..."] },
{ "findingId": "F-002", "cwe": "CWE-798", "howToFix": "...", "references": ["..."] }
]
}
```

**결과 조회/다운로드**

```GET /api/findings?runId=... → 위와 동일한 JSON

GET /api/report?runId=...&format=json|csv|pdf → 파일 스트리밍

(선택) GET /api/run/:id/status → 큐/진행상황(percentage, stage)

프론트는 /api/detect-vulns 완료 응답 받으면 runId와 JSON을 localStorage에 저장하고, 차트/미리보기/다운로드 활성화.
```

- Dashboard.jsx의 handleAnalyze()에서 POST /api/detect-vulns 호출로 교체
- handleDownload(format)에서 GET /api/report?runId=...&format=...로 교체
- "더보기"는 /app/findings 새 탭; 이 페이지는 최근 실행 결과(localStorage)를 읽거나 추후 runId를 쿼리로 받아 /api/findings 호출하도록 확장 가능

---

- POST /api/detect-vulns (multipart: file, code) → runId, counts, findings[] 반환
- POST /api/guidelines (body: runId, selection[]) → 각 취약점별 가이드라인 반환
- GET /api/findings?runId=... → 전체 결과 JSON
- GET /api/report?runId=...&format=json|csv|pdf → 파일 다운로드
- (선택) GET /api/run/:id/status → 진행상황(큐/퍼센트)
