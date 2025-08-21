import { API } from "./analysisPaths.js";

/** [추가] 공통 GET(JSON) 래퍼 */
export async function getJson(url) {
  const res = await fetch(url, {
    method: "GET", // 메서드를 GET으로 변경
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
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

/** 보안 코딩 가이드 JSON 내용  */
export function fetchSecureCodeGuide(projectKey) {
  const url = API.secure_code(projectKey);
  // [수정] postJson 대신 새로 만든 getJson 함수를 사용합니다.
  return getJson(url);
}
