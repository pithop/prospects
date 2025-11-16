import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Header({ isAuthenticated = true }) {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const currentPath = router.pathname;

  // Non-authenticated header (for landing page)
  if (!isAuthenticated) {
    return (
      <header style={styles.header}>
        <div style={styles.container}>
          <div style={styles.headerContent}>
            {/* Logo */}
            <Link href="/landing" style={styles.logoLink}>
              <div style={styles.logo}>
                <span style={styles.logoIcon}>📊</span>
                <span style={styles.logoText}>ProspectHub</span>
              </div>
            </Link>

            {/* Navigation */}
            <nav style={styles.nav}>
              <a href="#features" style={styles.navLink}>Fonctionnalités</a>
              <button onClick={() => router.push('/app')} style={styles.loginButton}>
                Connexion
              </button>
              <button onClick={() => router.push('/app')} style={styles.ctaButton}>
                S'inscrire
              </button>
            </nav>
          </div>
        </div>
      </header>
    );
  }

  // Authenticated header (for /app and /dashboard)
  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.headerContent}>
          {/* Logo */}
          <Link href="/app" style={styles.logoLink}>
            <div style={styles.logo}>
              <span style={styles.logoIcon}>📊</span>
              <span style={styles.logoText}>ProspectHub</span>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav style={styles.tabNav}>
            <Link 
              href="/app" 
              style={{
                ...styles.tab,
                ...(currentPath === '/app' ? styles.activeTab : {})
              }}
            >
              🔍 Recherche Prospects
            </Link>
            <Link 
              href="/dashboard" 
              style={{
                ...styles.tab,
                ...(currentPath === '/dashboard' ? styles.activeTab : {})
              }}
            >
              📊 Dashboard Analytics
            </Link>
          </nav>

          {/* Profile Menu */}
          <div style={styles.profileContainer}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={styles.profileButton}
              title="Menu profil"
            >
              <span style={styles.profileIcon}>👤</span>
            </button>

            {showProfileMenu && (
              <div style={styles.dropdown}>
                <button style={styles.dropdownItem} onClick={() => {
                  alert('Paramètres - À implémenter');
                  setShowProfileMenu(false);
                }}>
                  ⚙️ Paramètres
                </button>
                <button style={styles.dropdownItem} onClick={() => {
                  router.push('/landing');
                  setShowProfileMenu(false);
                }}>
                  🚪 Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          nav {
            flex-direction: column !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </header>
  );
}

const styles = {
  header: {
    background: '#ffffff',
    borderBottom: '1px solid #e5e5e5',
    padding: '16px 20px',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
  },
  logoLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  logoIcon: {
    fontSize: '1.5rem',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  navLink: {
    textDecoration: 'none',
    color: '#666',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'color 0.15s ease',
    cursor: 'pointer',
  },
  loginButton: {
    background: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#1a1a1a',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  ctaButton: {
    background: '#1a1a1a',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 20px',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabNav: {
    display: 'flex',
    gap: '8px',
    flex: 1,
    justifyContent: 'center',
  },
  tab: {
    textDecoration: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#666',
    background: 'transparent',
    border: '1px solid transparent',
    transition: 'all 0.15s ease',
    cursor: 'pointer',
  },
  activeTab: {
    background: '#1a1a1a',
    color: 'white',
    border: '1px solid #1a1a1a',
  },
  profileContainer: {
    position: 'relative',
  },
  profileButton: {
    background: '#f5f5f5',
    border: '1px solid #e5e5e5',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  profileIcon: {
    fontSize: '1.2rem',
  },
  dropdown: {
    position: 'absolute',
    top: '50px',
    right: '0',
    background: 'white',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    minWidth: '180px',
    overflow: 'hidden',
  },
  dropdownItem: {
    width: '100%',
    padding: '12px 16px',
    background: 'white',
    border: 'none',
    textAlign: 'left',
    fontSize: '0.9rem',
    color: '#1a1a1a',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};
