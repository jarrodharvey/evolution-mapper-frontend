import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './Navigation';
import EvolutionMapper from './EvolutionMapper';
import About from './About';
import AttributionsPage from './AttributionsPage';
import './App.css';

function App() {
  const [isTreeView, setIsTreeView] = useState(false);

  return (
    <Router>
      <div className={`App ${isTreeView ? 'tree-view' : ''}`}>
        <Navigation hideInTreeView={isTreeView} />
        <Routes>
          <Route path="/" element={<EvolutionMapper onTreeViewChange={setIsTreeView} />} />
          <Route path="/about" element={<About />} />
          <Route path="/attributions" element={<AttributionsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;