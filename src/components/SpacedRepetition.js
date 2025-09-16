import React, { useState, useEffect } from 'react';
import './SpacedRepetition.css';
import { 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Settings, 
  BarChart3,
  Brain,
  Zap,
  CheckCircle
} from 'lucide-react';
import { useSpacedRepetition } from '../services/SpacedRepetitionService';
import './SpacedRepetition.css';

const SpacedRepetition = ({ 
  cards = [], 
  onStudyCard, 
  onClose,
  isVisible = true 
}) => {
  const {
    cardsToReview,
    newCards,
    stats,
    recommendations,
    settings,
    recordReview,
    updateSettings,
    optimizeSchedule
  } = useSpacedRepetition(cards);

  const [activeTab, setActiveTab] = useState('today');
  const [showSettings, setShowSettings] = useState(false);
  const [currentStudyCard, setCurrentStudyCard] = useState(null);
  // Removed unused studyMode state to satisfy ESLint

  // États pour les paramètres
  const [tempSettings, setTempSettings] = useState(settings);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  // Gérer l'étude d'une carte
  const handleStudyCard = (card, rating) => {
    const result = recordReview(card.cardId, rating, {
      responseTime: Date.now() - (currentStudyCard?.startTime || Date.now()),
      attempts: 1
    });

    // Notifier le parent si nécessaire
    if (onStudyCard) {
      onStudyCard(card, rating, result);
    }

    // Passer à la carte suivante
    setCurrentStudyCard(null);
  };

  // Démarrer une session d'étude
  const startStudySession = (mode = 'review') => {
    let cardsToStudy = [];
    
    switch (mode) {
      case 'review':
        cardsToStudy = cardsToReview.slice(0, 20);
        break;
      case 'new':
        cardsToStudy = newCards.slice(0, 10);
        break;
      case 'mixed':
        cardsToStudy = [
          ...cardsToReview.slice(0, 15),
          ...newCards.slice(0, 5)
        ];
        break;
      default:
        cardsToStudy = cardsToReview.slice(0, 20);
    }

    if (cardsToStudy.length > 0) {
      setCurrentStudyCard({
        ...cardsToStudy[0],
        startTime: Date.now(),
        remaining: cardsToStudy.length - 1
      });
  // study mode previously tracked but unused
    }
  };

  // Sauvegarder les paramètres
  const saveSettings = () => {
    updateSettings(tempSettings);
    setShowSettings(false);
  };

  // Optimisation automatique
  const handleOptimization = () => {
    const result = optimizeSchedule();
    alert(`Planification optimisée ! ${result.adjustments} ajustements effectués.`);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="spaced-repetition">
      <div className="sr-header">
        <div className="sr-title">
          <Brain size={24} />
          <h3>Révision Espacée</h3>
        </div>
        <div className="sr-actions">
          <button 
            className="btn-optimize"
            onClick={handleOptimization}
            title="Optimiser automatiquement"
          >
            <Zap size={16} />
          </button>
          <button 
            className="btn-settings"
            onClick={() => setShowSettings(true)}
            title="Paramètres"
          >
            <Settings size={16} />
          </button>
          {onClose && (
            <button className="btn-close" onClick={onClose}>×</button>
          )}
        </div>
      </div>

      <div className="sr-tabs">
        <button 
          className={`sr-tab ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          <Calendar size={16} />
          Aujourd'hui
        </button>
        <button 
          className={`sr-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <BarChart3 size={16} />
          Statistiques
        </button>
        <button 
          className={`sr-tab ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          <Target size={16} />
          Conseils
        </button>
      </div>

      <div className="sr-content">
        {activeTab === 'today' && (
          <div className="sr-today">
            {/* Vue d'ensemble du jour */}
            <div className="sr-overview">
              <div className="overview-card reviews">
                <div className="card-header">
                  <Clock size={20} />
                  <span>À réviser</span>
                </div>
                <div className="card-value">{cardsToReview.length}</div>
                <div className="card-detail">
                  {cardsToReview.filter(c => c.daysSince > 0).length} en retard
                </div>
              </div>

              <div className="overview-card new">
                <div className="card-header">
                  <Target size={20} />
                  <span>Nouvelles</span>
                </div>
                <div className="card-value">{newCards.length}</div>
                <div className="card-detail">
                  Limite: {settings.newCardsPerDay}/jour
                </div>
              </div>

              <div className="overview-card streak">
                <div className="card-header">
                  <TrendingUp size={20} />
                  <span>Série</span>
                </div>
                <div className="card-value">{stats?.streakDays || 0}</div>
                <div className="card-detail">jours consécutifs</div>
              </div>
            </div>

            {/* Actions d'étude */}
            <div className="sr-study-actions">
              <button 
                className="study-btn primary"
                onClick={() => startStudySession('mixed')}
                disabled={cardsToReview.length === 0 && newCards.length === 0}
              >
                <Brain size={20} />
                Étudier ({Math.min(20, cardsToReview.length + newCards.length)} cartes)
              </button>

              <div className="study-options">
                <button 
                  className="study-btn secondary"
                  onClick={() => startStudySession('review')}
                  disabled={cardsToReview.length === 0}
                >
                  Révisions seulement ({cardsToReview.length})
                </button>
                <button 
                  className="study-btn secondary"
                  onClick={() => startStudySession('new')}
                  disabled={newCards.length === 0}
                >
                  Nouvelles cartes ({newCards.length})
                </button>
              </div>
            </div>

            {/* Cartes urgentes */}
            {cardsToReview.filter(c => c.daysSince > 2).length > 0 && (
              <div className="sr-urgent">
                <h4>⚠️ Cartes urgentes (retard &gt; 2 jours)</h4>
                <div className="urgent-cards">
                  {cardsToReview
                    .filter(c => c.daysSince > 2)
                    .slice(0, 5)
                    .map((card, index) => (
                      <div key={card.cardId} className="urgent-card">
                        <span className="card-text">Carte #{card.cardId}</span>
                        <span className="days-late">+{card.daysSince} jours</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div className="sr-stats">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <CheckCircle size={18} />
                  <span>Taux de réussite</span>
                </div>
                <div className="stat-value">{stats.retentionRate}%</div>
                <div className="stat-trend">
                  {stats.retentionRate >= 80 ? '📈' : stats.retentionRate >= 70 ? '📊' : '📉'}
                  {stats.retentionRate >= 80 ? 'Excellent' : stats.retentionRate >= 70 ? 'Correct' : 'À améliorer'}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <BarChart3 size={18} />
                  <span>Révisions (30j)</span>
                </div>
                <div className="stat-value">{stats.totalReviews}</div>
                <div className="stat-trend">
                  Moyenne: {Math.round(stats.totalReviews / 30)} par jour
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <Clock size={18} />
                  <span>Note moyenne</span>
                </div>
                <div className="stat-value">{stats.averageRating?.toFixed(1) || 'N/A'}</div>
                <div className="stat-trend">
                  {stats.averageRating >= 3.5 ? 'Très bien' : stats.averageRating >= 3 ? 'Bien' : 'Difficile'}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <TrendingUp size={18} />
                  <span>Série actuelle</span>
                </div>
                <div className="stat-value">{stats.streakDays}</div>
                <div className="stat-trend">
                  {stats.streakDays > 7 ? 'Excellent!' : stats.streakDays > 0 ? 'Bon rythme' : 'Recommencer'}
                </div>
              </div>
            </div>

            {/* Distribution des difficultés */}
            <div className="difficulty-distribution">
              <h4>Distribution des cartes</h4>
              <div className="distribution-chart">
                <div className="distribution-item">
                  <div className="distribution-bar">
                    <div 
                      className="bar-fill easy"
                      style={{ 
                        width: `${(stats.difficultyDistribution.easy / 
                          (stats.difficultyDistribution.easy + stats.difficultyDistribution.medium + stats.difficultyDistribution.hard)) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span>Faciles: {stats.difficultyDistribution.easy}</span>
                </div>
                <div className="distribution-item">
                  <div className="distribution-bar">
                    <div 
                      className="bar-fill medium"
                      style={{ 
                        width: `${(stats.difficultyDistribution.medium / 
                          (stats.difficultyDistribution.easy + stats.difficultyDistribution.medium + stats.difficultyDistribution.hard)) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span>Moyennes: {stats.difficultyDistribution.medium}</span>
                </div>
                <div className="distribution-item">
                  <div className="distribution-bar">
                    <div 
                      className="bar-fill hard"
                      style={{ 
                        width: `${(stats.difficultyDistribution.hard / 
                          (stats.difficultyDistribution.easy + stats.difficultyDistribution.medium + stats.difficultyDistribution.hard)) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span>Difficiles: {stats.difficultyDistribution.hard}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="sr-recommendations">
            <h4>💡 Recommandations personnalisées</h4>
            
            {recommendations.length > 0 ? (
              <div className="recommendations-list">
                {recommendations.map((rec, index) => (
                  <div key={index} className={`recommendation ${rec.type}`}>
                    <div className="rec-icon">
                      {rec.type === 'urgent' && <AlertTriangle size={20} />}
                      {rec.type === 'warning' && <AlertTriangle size={20} />}
                      {rec.type === 'info' && <Target size={20} />}
                      {rec.type === 'motivation' && <TrendingUp size={20} />}
                    </div>
                    <div className="rec-content">
                      <h5>{rec.title}</h5>
                      <p>{rec.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-recommendations">
                <CheckCircle size={48} />
                <h5>Parfait !</h5>
                <p>Votre routine d'étude est optimale. Continuez comme ça !</p>
              </div>
            )}

            {/* Conseils généraux */}
            <div className="general-tips">
              <h5>💡 Conseils d'étude</h5>
              <ul>
                <li>Étudiez régulièrement, même 10 minutes par jour</li>
                <li>Soyez honnête dans vos auto-évaluations</li>
                <li>Prenez des pauses entre les sessions</li>
                <li>Révisez dans un environnement calme</li>
                <li>Variez les types d'exercices</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Modal de paramètres */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Paramètres de révision espacée</h3>
              <button onClick={() => setShowSettings(false)}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="settings-section">
                <h4>Quotas journaliers</h4>
                <div className="setting-item">
                  <label>Nouvelles cartes par jour</label>
                  <input
                    type="number"
                    value={tempSettings.newCardsPerDay}
                    onChange={e => setTempSettings({
                      ...tempSettings,
                      newCardsPerDay: parseInt(e.target.value) || 20
                    })}
                    min="1"
                    max="100"
                  />
                </div>
                <div className="setting-item">
                  <label>Révisions par jour</label>
                  <input
                    type="number"
                    value={tempSettings.reviewsPerDay}
                    onChange={e => setTempSettings({
                      ...tempSettings,
                      reviewsPerDay: parseInt(e.target.value) || 100
                    })}
                    min="10"
                    max="500"
                  />
                </div>
              </div>

              <div className="settings-section">
                <h4>Algorithme</h4>
                <div className="setting-item">
                  <label>Type d'algorithme</label>
                  <select
                    value={tempSettings.algorithm}
                    onChange={e => setTempSettings({
                      ...tempSettings,
                      algorithm: e.target.value
                    })}
                  >
                    <option value="sm2">SM-2 Classique</option>
                    <option value="sm2-plus">SM-2 Plus (recommandé)</option>
                    <option value="anki-like">Style Anki</option>
                  </select>
                </div>
              </div>

              <div className="settings-section">
                <h4>Intervalles</h4>
                <div className="setting-item">
                  <label>Intervalle minimum (jours)</label>
                  <input
                    type="number"
                    value={tempSettings.minInterval}
                    onChange={e => setTempSettings({
                      ...tempSettings,
                      minInterval: parseInt(e.target.value) || 1
                    })}
                    min="1"
                    max="7"
                  />
                </div>
                <div className="setting-item">
                  <label>Intervalle maximum (jours)</label>
                  <input
                    type="number"
                    value={tempSettings.maxInterval}
                    onChange={e => setTempSettings({
                      ...tempSettings,
                      maxInterval: parseInt(e.target.value) || 365
                    })}
                    min="30"
                    max="3650"
                  />
                </div>
              </div>

              <div className="settings-section">
                <h4>Options avancées</h4>
                <div className="setting-item checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={tempSettings.enableLeeches}
                      onChange={e => setTempSettings({
                        ...tempSettings,
                        enableLeeches: e.target.checked
                      })}
                    />
                    Détecter les cartes difficiles (leeches)
                  </label>
                </div>
                {tempSettings.enableLeeches && (
                  <div className="setting-item">
                    <label>Seuil de détection (échecs)</label>
                    <input
                      type="number"
                      value={tempSettings.leechThreshold}
                      onChange={e => setTempSettings({
                        ...tempSettings,
                        leechThreshold: parseInt(e.target.value) || 8
                      })}
                      min="3"
                      max="20"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowSettings(false)} className="btn-secondary">
                Annuler
              </button>
              <button onClick={saveSettings} className="btn-primary">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'étude (si nécessaire) */}
      {currentStudyCard && (
        <div className="study-modal-overlay">
          <div className="study-modal">
            <div className="study-header">
              <span>Carte {currentStudyCard.remaining} restantes</span>
              <button onClick={() => setCurrentStudyCard(null)}>×</button>
            </div>
            
            <div className="study-content">
              <div className="study-card">
                <p>Carte ID: {currentStudyCard.cardId}</p>
                <p>Difficulté: {currentStudyCard.difficulty}</p>
                <p>Intervalle: {currentStudyCard.interval} jour(s)</p>
              </div>

              <div className="study-buttons">
                <button 
                  className="study-btn again"
                  onClick={() => handleStudyCard(currentStudyCard, 1)}
                >
                  Encore (1)
                </button>
                <button 
                  className="study-btn hard"
                  onClick={() => handleStudyCard(currentStudyCard, 2)}
                >
                  Difficile (2)
                </button>
                <button 
                  className="study-btn good"
                  onClick={() => handleStudyCard(currentStudyCard, 3)}
                >
                  Correct (3)
                </button>
                <button 
                  className="study-btn easy"
                  onClick={() => handleStudyCard(currentStudyCard, 4)}
                >
                  Facile (4)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpacedRepetition;