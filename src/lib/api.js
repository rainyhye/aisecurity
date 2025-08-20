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
