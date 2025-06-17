import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FileSelector from "./components/FileSelector";
import Selector from "./components/PDFSelector";

const App = () => {
  return (
    <Router basename="/pdf-selector-app">
      <Routes>
        <Route path="/" element={<FileSelector />} />
        <Route path="/select" element={<Selector />} />
      </Routes>
    </Router>
  );
};

export default App;
