import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({});
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prospectsRes, statsRes] = await Promise.all([
        fetch('/api/prospects'),
        fetch('/api/stats')
      ]);

      let prospectsData = [];
      try {
        const parsed = await prospectsRes.json();
        prospectsData = Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.error('Failed to parse prospects', err);
      }

      let statsData = {};
      try {
        const parsed = await statsRes.json();
        statsData = parsed || {};
      } catch (err) {
        console.error('Failed to parse stats', err);
      }

      setProspects(prospectsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate advanced analytics
  const analytics = {
    conversionRate: stats.total > 0 ? ((stats.contactes || 0) / stats.total * 100).toFixed(1) : 0,
    pendingContacts: (stats.prospectContacter || 0) - (stats.contactes || 0),
    citiesCount: [...new Set(prospects.map(p => p.city).filter(Boolean))].length,
    categoriesCount: [...new Set(prospects.map(p => p.category).filter(Boolean))].length,
    recentActivity: prospects.filter(p => {
      const created = new Date(p.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    }).length,
  };

  // Get top cities
  const cityStats = prospects.reduce((acc, p) => {
    if (p.city) {
      acc[p.city] = (acc[p.city] || 0) + 1;
    }
    return acc;
  }, {});

  const topCities = Object.entries(cityStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Chart data
  const statusChartData = {
    labels: ['Contactés', 'À Contacter', 'Avec Site Web', 'Autres'],
    datasets: [{
      label: 'Prospects par statut',
      data: [
        stats.contactes || 0,
        (stats.prospectContacter || 0) - (stats.contactes || 0),
        stats.avecSiteWeb || 0,
        (stats.total || 0) - (stats.contactes || 0) - ((stats.prospectContacter || 0) - (stats.contactes || 0)) - (stats.avecSiteWeb || 0)
      ],
      backgroundColor: ['#16a34a', '#dc2626', '#3b82f6', '#9ca3af'],
      borderWidth: 0,
    }]
  };

  const cityChartData = {
    labels: topCities.map(([city]) => city),
    datasets: [{
      label: 'Prospects par ville',
      data: topCities.map(([, count]) => count),
      backgroundColor: '#1a1a1a',
      borderWidth: 0,
    }]
  };

  const activityChartData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [{
      label: 'Activité cette semaine',
      data: (() => {
        const weekData = [0, 0, 0, 0, 0, 0, 0];
        prospects.forEach(p => {
          const created = new Date(p.created_at);
          const dayOfWeek = created.getDay();
          weekData[dayOfWeek === 0 ? 6 : dayOfWeek - 1]++;
        });
        return weekData;
      })(),
      borderColor: '#1a1a1a',
      backgroundColor: 'rgba(26, 26, 26, 0.1)',
      tension: 0.4,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Chargement des analytics...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - ProspectHub</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #fafafa;
          color: #1a1a1a;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Unified Header - Authenticated state */}
      <Header isAuthenticated={true} />

      <main style={styles.container}>
        {/* Charts Toggle Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <button 
            onClick={() => setShowCharts(!showCharts)} 
            style={{
              padding: '12px 24px',
              background: showCharts ? '#1a1a1a' : 'white',
              color: showCharts ? 'white' : '#1a1a1a',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.95rem',
            }}
          >
            {showCharts ? '📊 Masquer les graphiques' : '📈 Afficher les graphiques'}
          </button>
        </div>

        {/* Charts Section - Toggle */}
        {showCharts && (
          <div style={styles.chartsSection}>
            <h2 style={styles.sectionTitle}>📊 Graphiques de données</h2>
            <div style={styles.chartsGrid}>
              <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Répartition par statut</h3>
                <div style={styles.chartContainer}>
                  <Pie data={statusChartData} options={chartOptions} />
                </div>
              </div>

              <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Top villes</h3>
                <div style={styles.chartContainer}>
                  <Bar data={cityChartData} options={chartOptions} />
                </div>
              </div>

              <div style={styles.chartCard} style={{...styles.chartCard, gridColumn: '1 / -1'}}>
                <h3 style={styles.chartTitle}>Activité hebdomadaire</h3>
                <div style={styles.chartContainer}>
                  <Line data={activityChartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricHeader}>
              <span style={styles.metricIcon}>📈</span>
              <span style={styles.metricLabel}>Taux de conversion</span>
            </div>
            <div style={styles.metricValue}>{analytics.conversionRate}%</div>
            <div style={styles.metricChange}>
              {stats.contactes || 0} / {stats.total || 0} contactés
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricHeader}>
              <span style={styles.metricIcon}>⏳</span>
              <span style={styles.metricLabel}>En attente</span>
            </div>
            <div style={styles.metricValue}>{analytics.pendingContacts}</div>
            <div style={styles.metricChange}>prospects à contacter</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricHeader}>
              <span style={styles.metricIcon}>📍</span>
              <span style={styles.metricLabel}>Villes couvertes</span>
            </div>
            <div style={styles.metricValue}>{analytics.citiesCount}</div>
            <div style={styles.metricChange}>villes différentes</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricHeader}>
              <span style={styles.metricIcon}>🔥</span>
              <span style={styles.metricLabel}>Activité récente</span>
            </div>
            <div style={styles.metricValue}>{analytics.recentActivity}</div>
            <div style={styles.metricChange}>cette semaine</div>
          </div>
        </div>

        {/* Charts Row */}
        <div style={styles.chartsGrid}>
          {/* Progress Chart */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>État des prospects</h3>
            <div style={styles.progressBars}>
              <div style={styles.progressItem}>
                <div style={styles.progressLabel}>
                  <span>Contactés</span>
                  <span style={styles.progressPercent}>
                    {((stats.contactes || 0) / (stats.total || 1) * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${((stats.contactes || 0) / (stats.total || 1) * 100)}%`,
                    background: '#16a34a',
                  }}></div>
                </div>
              </div>

              <div style={styles.progressItem}>
                <div style={styles.progressLabel}>
                  <span>À contacter</span>
                  <span style={styles.progressPercent}>
                    {((stats.prospectContacter || 0) / (stats.total || 1) * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${((stats.prospectContacter || 0) / (stats.total || 1) * 100)}%`,
                    background: '#dc2626',
                  }}></div>
                </div>
              </div>

              <div style={styles.progressItem}>
                <div style={styles.progressLabel}>
                  <span>Avec site web</span>
                  <span style={styles.progressPercent}>
                    {((stats.avecSiteWeb || 0) / (stats.total || 1) * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${((stats.avecSiteWeb || 0) / (stats.total || 1) * 100)}%`,
                    background: '#3b82f6',
                  }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Cities */}
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Top 5 villes</h3>
            <div style={styles.cityList}>
              {topCities.length > 0 ? (
                topCities.map(([city, count], i) => (
                  <div key={i} style={styles.cityItem}>
                    <div style={styles.cityRank}>{i + 1}</div>
                    <div style={styles.cityInfo}>
                      <div style={styles.cityName}>{city}</div>
                      <div style={styles.cityCount}>{count} prospects</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.emptyState}>Aucune donnée disponible</div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div style={styles.summaryCard}>
          <h3 style={styles.summaryTitle}>Résumé global</h3>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Total prospects</div>
              <div style={styles.summaryValue}>{stats.total || 0}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Catégories</div>
              <div style={styles.summaryValue}>{analytics.categoriesCount}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Note moyenne</div>
              <div style={styles.summaryValue}>{stats.ratingMoyen || 0} ⭐</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Total avis</div>
              <div style={styles.summaryValue}>{stats.totalAvis || 0}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={styles.actionsCard}>
          <h3 style={styles.actionsTitle}>Actions rapides</h3>
          <div style={styles.actionsGrid}>
            <button onClick={() => router.push('/app')} style={styles.actionButton}>
              <span style={styles.actionIcon}>➕</span>
              <span>Ajouter un prospect</span>
            </button>
            <button onClick={() => router.push('/app')} style={styles.actionButton}>
              <span style={styles.actionIcon}>📥</span>
              <span>Importer des données</span>
            </button>
            <button onClick={() => router.push('/app')} style={styles.actionButton}>
              <span style={styles.actionIcon}>📊</span>
              <span>Exporter le rapport</span>
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    gap: '16px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f0f0f0',
    borderTop: '3px solid #1a1a1a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '30px 20px',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '24px',
    color: '#1a1a1a',
  },
  chartsSection: {
    marginBottom: '40px',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  chartContainer: {
    height: '300px',
    position: 'relative',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  metricCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  metricIcon: {
    fontSize: '1.2rem',
  },
  metricLabel: {
    fontSize: '0.85rem',
    color: '#666',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: '2.5rem',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  metricChange: {
    fontSize: '0.85rem',
    color: '#999',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  chartCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
  },
  chartTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#1a1a1a',
  },
  progressBars: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  progressItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: '500',
  },
  progressPercent: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  progressBar: {
    height: '10px',
    background: '#f0f0f0',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '5px',
    transition: 'width 0.3s ease',
  },
  cityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#fafafa',
    borderRadius: '8px',
  },
  cityRank: {
    width: '32px',
    height: '32px',
    background: '#1a1a1a',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: '2px',
  },
  cityCount: {
    fontSize: '0.85rem',
    color: '#666',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
  },
  summaryCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
    marginBottom: '30px',
  },
  summaryTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#1a1a1a',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  summaryItem: {
    textAlign: 'center',
    padding: '16px',
    background: '#fafafa',
    borderRadius: '8px',
  },
  summaryLabel: {
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '8px',
  },
  summaryValue: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  actionsCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e5e5',
  },
  actionsTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#1a1a1a',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  actionButton: {
    padding: '16px',
    background: '#fafafa',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontWeight: '500',
    fontSize: '0.9rem',
    color: '#1a1a1a',
    transition: 'all 0.15s',
  },
  actionIcon: {
    fontSize: '1.2rem',
  },
};
