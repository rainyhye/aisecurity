import { API } from "./analysisPaths.js";
/** 공통 POST(JSON) 래퍼 */
export async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      if (j && j.detail) {
        msg += ` - ${
          typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail)
        }`;
      }
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

/** 보고서 파일 목록 { project, base_path, reports } */
export function fetchReportListJSON(projectKey) {
  return postJson(API.list, { project: projectKey });
}

/** 기본 unified_report.json 내용(JSON) */
export function fetchUnifiedJSON(projectKey, file = "unified_report.json") {
  return postJson(API.unified, { project: projectKey, file });
}

// src/lib/api.js
export async function fetchSecureCode(projectKey) {
  const API_BASE = import.meta?.env?.VITE_API_BASE || "";
  const url = `${API_BASE}/analysis/${projectKey}/secure_code?cacheBust=${Date.now()}`;
  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const j = await res.json();
    // 서버 스키마 불확실 → 흔한 필드 우선 사용, 없으면 전체 JSON을 문자열로
    return (
      j.patched ||
      j.code ||
      j.text ||
      j.suggestion ||
      j.secure_code ||
      JSON.stringify(j, null, 2)
    );
  }
  return await res.text(); // text/plain 지원
}
