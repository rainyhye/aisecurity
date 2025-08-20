// Vite라면 import.meta.env 사용, 아니면 빈 문자열로 둬도 됩니다.
const API_BASE =
  (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) || "";

/** 파일명/라벨 → projectKey (확장자 제거 + 안전한 슬러그) */
export function toProjectKey(filenameOrLabel) {
  const base = filenameOrLabel.replace(/\.[^/.]+$/, "");
  return base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // 결합문자 제거
    .replace(/[^a-zA-Z0-9가-힣._-]+/g, "-") // 비허용문자 → -
    .replace(/-+/g, "-") // 연속 - 정리
    .replace(/^-|-$/g, "") // 양끝 - 제거
    .toLowerCase();
}

export const API = {
  list: `${API_BASE}/analysis/list`,
  unified: `${API_BASE}/analysis/unified`,
};
