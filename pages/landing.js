import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/Header';

export default function Landing() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>ProspectHub - Gestion Professionnelle de Prospects</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Gérez vos prospects de manière professionnelle avec ProspectHub" />
      </Head>

      <style jsx global>{`
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
          background: #ffffff;
          color: #1a1a1a;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .slide-up {
          animation: slideUp 0.8s ease-out forwards;
        }
      `}</style>

      {/* Unified Header - Non-authenticated state */}
      <Header isAuthenticated={false} />

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent} className="fade-in">
          <h1 style={styles.heroTitle}>
            Gérez vos prospects
            <br />
            <span style={styles.heroAccent}>avec simplicité</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Une solution minimaliste et moderne pour organiser, rechercher et contacter vos prospects professionnels.
          </p>
          <div style={styles.heroButtons}>
            <button onClick={() => router.push('/app')} style={styles.primaryButton}>
              Commencer gratuitement
            </button>
            <a href="#features" style={styles.secondaryButton}>
              Découvrir les fonctionnalités
            </a>
          </div>
        </div>
        <div style={styles.heroImage} className="slide-up">
          <div style={styles.screenshotContainer}>
            <img 
              src="https://res.cloudinary.com/dggbfnfdl/image/upload/v1763309806/Gemini_Generated_Image_u232ybu232ybu232_pa8utq.png" 
              alt="Dashboard ProspectHub - Interface professionnelle de gestion de prospects"
              style={styles.screenshot}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={styles.features}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Fonctionnalités principales</h2>
          <div style={styles.featuresGrid}>
            {[
              {
                icon: '🔍',
                title: 'Recherche avancée',
                description: 'Recherche instantanée par nom, ville, catégorie, téléphone et plus encore.'
              },
              {
                icon: '📊',
                title: 'Statistiques en temps réel',
                description: 'Visualisez vos KPIs et suivez vos performances en un coup d\'œil.'
              },
              {
                icon: '🏷️',
                title: 'Organisation intelligente',
                description: 'Filtrez par ville, catégorie, statut de contact et site web.'
              },
              {
                icon: '📥',
                title: 'Import/Export CSV',
                description: 'Importez vos données en masse et exportez vos prospects filtrés.'
              },
              {
                icon: '⌨️',
                title: 'Raccourcis clavier',
                description: 'Navigation rapide avec ⌘K, ⌘N, ⌘I pour gagner du temps.'
              },
              {
                icon: '📱',
                title: '100% Responsive',
                description: 'Interface optimisée pour desktop, tablette et mobile.'
              },
            ].map((feature, i) => (
              <div key={i} style={styles.featureCard}>
                <div style={styles.featureIcon}>{feature.icon}</div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={styles.benefits}>
        <div style={styles.container}>
          <div style={styles.benefitsContent}>
            <h2 style={styles.benefitsTitle}>Pourquoi ProspectHub ?</h2>
            <ul style={styles.benefitsList}>
              <li style={styles.benefitItem}>
                <span style={styles.benefitIcon}>✓</span>
                <span>Interface minimaliste et intuitive</span>
              </li>
              <li style={styles.benefitItem}>
                <span style={styles.benefitIcon}>✓</span>
                <span>Détection automatique des sites web</span>
              </li>
              <li style={styles.benefitItem}>
                <span style={styles.benefitIcon}>✓</span>
                <span>Aucune installation requise</span>
              </li>
              <li style={styles.benefitItem}>
                <span style={styles.benefitIcon}>✓</span>
                <span>Données sécurisées avec Supabase</span>
              </li>
              <li style={styles.benefitItem}>
                <span style={styles.benefitIcon}>✓</span>
                <span>Gratuit et open source</span>
              </li>
            </ul>
          </div>
          <div style={styles.benefitsImage}>
            <div style={styles.benefitsBox}>
              <div style={styles.benefitsBoxTitle}>Gagnez du temps</div>
              <div style={styles.benefitsBoxStat}>
                <span style={styles.benefitsBoxNumber}>75%</span>
                <span style={styles.benefitsBoxLabel}>plus rapide</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.cta}>
        <div style={styles.container}>
          <h2 style={styles.ctaTitle}>Prêt à commencer ?</h2>
          <p style={styles.ctaSubtitle}>
            Commencez à gérer vos prospects dès maintenant. Aucune carte de crédit requise.
          </p>
          <button onClick={() => router.push('/app')} style={styles.ctaButton}>
            Accéder à l'application
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.container}>
          <div style={styles.footerContent}>
            <div style={styles.footerBrand}>
              <span style={styles.logoIcon}>📊</span>
              <span style={styles.logoText}>ProspectHub</span>
            </div>
            <p style={styles.footerText}>
              Gestion professionnelle de prospects
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

const styles = {
  logoIcon: {
    fontSize: '1.5rem',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  hero: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '80px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '60px',
  },
  heroContent: {
    animationDelay: '0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: '3.5rem',
    fontWeight: '600',
    lineHeight: '1.1',
    marginBottom: '24px',
    color: '#1a1a1a',
  },
  heroAccent: {
    color: '#666',
    fontWeight: '400',
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: '#666',
    marginBottom: '40px',
    lineHeight: '1.6',
    maxWidth: '600px',
  },
  heroButtons: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    padding: '16px 40px',
    background: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1.1rem',
    transition: 'all 0.15s ease',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
  },
  secondaryButton: {
    padding: '16px 40px',
    background: 'transparent',
    color: '#1a1a1a',
    border: '2px solid #e5e5e5',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '1.1rem',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'all 0.15s ease',
  },
  heroImage: {
    animationDelay: '0.4s',
    width: '100%',
    maxWidth: '1000px',
  },
  screenshotContainer: {
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    border: '1px solid #e5e5e5',
  },
  screenshot: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  features: {
    background: '#fafafa',
    padding: '100px 20px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: '2.5rem',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '60px',
    color: '#1a1a1a',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
  },
  featureCard: {
    background: 'white',
    padding: '32px',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
  },
  featureIcon: {
    fontSize: '2.5rem',
    marginBottom: '16px',
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#1a1a1a',
  },
  featureDescription: {
    fontSize: '0.95rem',
    color: '#666',
    lineHeight: '1.6',
  },
  benefits: {
    padding: '100px 20px',
  },
  benefitsContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '60px',
    alignItems: 'center',
  },
  benefitsTitle: {
    fontSize: '2.5rem',
    fontWeight: '600',
    marginBottom: '32px',
    color: '#1a1a1a',
  },
  benefitsList: {
    listStyle: 'none',
  },
  benefitItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    fontSize: '1.1rem',
    color: '#333',
  },
  benefitIcon: {
    fontSize: '1.2rem',
    color: '#1a1a1a',
    fontWeight: '600',
  },
  benefitsImage: {
    display: 'flex',
    justifyContent: 'center',
  },
  benefitsBox: {
    background: '#1a1a1a',
    color: 'white',
    padding: '48px',
    borderRadius: '16px',
    textAlign: 'center',
    minWidth: '280px',
  },
  benefitsBoxTitle: {
    fontSize: '1.1rem',
    marginBottom: '24px',
    opacity: 0.9,
  },
  benefitsBoxStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  benefitsBoxNumber: {
    fontSize: '4rem',
    fontWeight: '600',
  },
  benefitsBoxLabel: {
    fontSize: '1.2rem',
    opacity: 0.8,
  },
  cta: {
    background: '#1a1a1a',
    color: 'white',
    padding: '100px 20px',
    textAlign: 'center',
  },
  ctaTitle: {
    fontSize: '2.5rem',
    fontWeight: '600',
    marginBottom: '16px',
  },
  ctaSubtitle: {
    fontSize: '1.2rem',
    opacity: 0.9,
    marginBottom: '40px',
  },
  ctaButton: {
    padding: '16px 48px',
    background: 'white',
    color: '#1a1a1a',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1.1rem',
  },
  footer: {
    background: '#fafafa',
    borderTop: '1px solid #e5e5e5',
    padding: '40px 20px',
  },
  footerContent: {
    textAlign: 'center',
  },
  footerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  footerText: {
    color: '#666',
    fontSize: '0.9rem',
  },
};
