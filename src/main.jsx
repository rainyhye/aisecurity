import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import Landing from "./pages/Landing.jsx";
import DashboardLayout from "./pages/DashboardLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Introduction from "./pages/Introduction.jsx";
import Method from "./pages/Method.jsx";
import Findings from "./pages/Findings.jsx";
import { ThemeProvider } from "./components/ThemeProvider.jsx";

const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: "/", element: <Landing /> },
      {
        path: "/app",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Dashboard /> }, // /app
          { path: "introduction", element: <Introduction /> }, // /app/introduction
          { path: "method", element: <Method /> }, // /app/method
          { path: "findings", element: <Findings /> }, // /app/findings
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
