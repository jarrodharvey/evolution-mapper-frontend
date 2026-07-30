import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './Navigation';
import EvolutionMapper from './EvolutionMapper';
import About from './About';
import AttributionsPage from './AttributionsPage';
import { isMobileViewport } from './utils/mobileDetection';
import './App.css';

const MOBILE_THEME_STORAGE_KEY = 'evolutionMapperMobileTheme';

const getStoredMobileTheme = () => {
  const storedTheme = window.localStorage.getItem(MOBILE_THEME_STORAGE_KEY);
  return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : null;
};

const getSystemMobileTheme = () => {
  if (!window.matchMedia) {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

function App() {
  const [isTreeView, setIsTreeView] = useState(false);
  const [isMobileViewportActive, setIsMobileViewportActive] = useState(() => isMobileViewport());
  const [mobileThemePreference, setMobileThemePreference] = useState(() => {
    return getStoredMobileTheme() || getSystemMobileTheme();
  });

  useEffect(() => {
    const updateViewportState = () => {
      setIsMobileViewportActive(isMobileViewport());
    };

    updateViewportState();
    window.addEventListener('resize', updateViewportState);
    window.addEventListener('orientationchange', updateViewportState);

    return () => {
      window.removeEventListener('resize', updateViewportState);
      window.removeEventListener('orientationchange', updateViewportState);
    };
  }, []);

  useEffect(() => {
    if (getStoredMobileTheme() || !window.matchMedia) {
      return undefined;
    }

    const colorPreferenceQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handlePreferenceChange = (event) => {
      setMobileThemePreference(event.matches ? 'dark' : 'light');
    };

    colorPreferenceQuery.addEventListener('change', handlePreferenceChange);

    return () => {
      colorPreferenceQuery.removeEventListener('change', handlePreferenceChange);
    };
  }, []);

  const isMobileDarkMode = isMobileViewportActive && mobileThemePreference === 'dark';

  const handleMobileThemeToggle = useCallback(() => {
    setMobileThemePreference((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(MOBILE_THEME_STORAGE_KEY, nextTheme);
      return nextTheme;
    });
  }, []);

  const appClasses = useMemo(() => [
    'App',
    isTreeView ? 'tree-view' : null,
    isMobileDarkMode ? 'mobile-dark-mode' : null,
  ].filter(Boolean).join(' '), [isTreeView, isMobileDarkMode]);

  return (
    <Router>
      <div className={appClasses}>
        <Navigation
          hideInTreeView={isTreeView}
          isMobileDarkMode={isMobileDarkMode}
          onMobileThemeToggle={handleMobileThemeToggle}
        />
        <Routes>
          <Route
            path="/"
            element={(
              <EvolutionMapper
                onTreeViewChange={setIsTreeView}
                isMobileDarkMode={isMobileDarkMode}
                onMobileThemeToggle={handleMobileThemeToggle}
              />
            )}
          />
          <Route path="/about" element={<About />} />
          <Route path="/attributions" element={<AttributionsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
