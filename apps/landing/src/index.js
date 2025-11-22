import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import PrivacyPage from './PrivacyPage';
import TermsPage from './TermsPage';

// Simple hash-based routing
function Router() {
  const [currentPath, setCurrentPath] = React.useState(window.location.hash || '#/');

  React.useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Route matching
  if (currentPath === '#/privacy') {
    return <PrivacyPage />;
  }

  if (currentPath === '#/terms') {
    return <TermsPage />;
  }

  return <App />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
