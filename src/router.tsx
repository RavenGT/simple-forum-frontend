import { createBrowserRouter } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";

export const router = createBrowserRouter([
  { path: "/", element: <div className="p-8">Home (placeholder)</div> },
  { path: "/login", element: <LoginPage /> },
  { path: "*", element: <div className="p-8">Not found (placeholder)</div> },
]);
