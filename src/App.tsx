import React from "react";
import { ProjectProvider } from "./context/ProjectContext";
import { Workspace } from "./components/Workspace";
import "./App.css";

function App() {
  return (
    <div className="app">
      <ProjectProvider>
        <Workspace />
      </ProjectProvider>
    </div>
  );
}

export default App;