import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // 프론트에서 /api/unified 로 호출하면
      // 실제 서버의 unified_report.json으로 프록시됩니다.
      "/api/unified": {
        target: "http://128.134.233.158",
        changeOrigin: true,
        rewrite: () => "~/forti/backend/analysis/vulnbank/unified_report.json",
      },

      // (선택) 필요하면 개별 리포트에도 프록시 열어두기
      // "/api/semgrep": {
      //   target: "http://128.134.233.158",
      //   changeOrigin: true,
      //   rewrite: () =>
      //     "/forti/backend/analysis/vulnbank/semgrep_report.json",
      // },
      // "/api/bandit": {
      //   target: "http://128.134.233.158",
      //   changeOrigin: true,
      //   rewrite: () =>
      //     "/forti/backend/analysis/vulnbank/bandit_report.json",
      // },
      // "/api/pytest": {
      //   target: "http://128.134.233.158",
      //   changeOrigin: true,
      //   rewrite: () =>
      //     "/forti/backend/analysis/vulnbank/vulnbank_pytest.json",
      // },
      // "/api/summary": {
      //   target: "http://128.134.233.158",
      //   changeOrigin: true,
      //   rewrite: () =>
      //     "/forti/backend/analysis/vulnbank/summary.json",
      // },
    },
  },
});
