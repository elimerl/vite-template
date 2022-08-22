import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Signup from "./signup";
import Signin from "./signin";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="signup" element={<Signup />} />
        <Route path="signin" element={<Signin />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
