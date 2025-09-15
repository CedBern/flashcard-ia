import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Languages, 
  BookOpen, 
  MessageCircle,
  Sparkles,
  Shuffle,
  Volume2,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Wand2,
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Award
} from 'lucide-react';
import './App.css';

// Données de démonstration enrichies
const demoCards = [
  {
    id: 1,
    type: 'vocabulary',
    french: 'Le pain',
    translations: {
      english: 'Bread',
      spanish: 'El pan',
      spanishMexico: 'El pan',
      spanishSpain: 'El pan'
    },
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400',
    audio: null,
    notes: 'Nom masculin - Un aliment de base'
  },
  {
    id: 2,
    type: 'expression',
    french: 'Avoir le cafard',
    translations: {
      english: 'To feel blue / To be down',
      spanish: 'Estar deprimido',
      spanishMexico: 'Andar agüitado',
      spanishSpain: 'Estar de bajón'
    },
    image: 'https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?w=400',
    audio: null,
    notes: 'Expression familière pour exprimer la tristesse'
  },
  {
    id: 3,
    type: 'conjugation',
    french: 'Être (Présent)',
    translations: {
      english: 'To be: I am, You are, He/She is, We are, You are, They are',
      spanish: 'Ser/Estar: Soy/Estoy, Eres/Estás, Es/Está, Somos/Estamos, Sois/Estáis, Son/Están',
      spanishMexico: 'Ser/Estar: Soy/Estoy, Eres/Estás, Es/Está, Somos/Estamos, Son/Están, Son/Están',
      spanishSpain: 'Ser/Estar: Soy/Estoy, Eres/Estás, Es/Está, Somos/Estamos, Sois/Estáis, Son/Están'
    },
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    audio: null,
    notes: 'Je suis, Tu es, Il/Elle est, Nous sommes, Vous êtes, Ils/Elles sont'
  }
];

// Composant Flag pour afficher les drapeaux
const Flag = ({ country, size = 24 }) => {
  const flags = {
    france: '🇫🇷',
    english: '🇬🇧',
    spanish: '🇪🇸',
    spanishMexico: '🇲🇽',
    spanishSpain: '🇪🇸',
    usa: '🇺🇸'
  };
  
  return (
    <span style={{ fontSize: size, marginRight: '8px' }}>
      {flags[country] || '🏳️'}
    </span>
  );
};

// Composant principal de l'application
function App() {
  // ==========================================
  // FONCTIONS DE SAUVEGARDE SÉCURISÉE DES STATISTIQUES
  // ==========================================
  const validateStats = (stats) => {
    return {
      cardsViewed: Number(stats.cardsViewed) || 0,
      cardsReviewed: Number(stats.cardsReviewed) || 0,
      totalStudyTime: Number(stats.totalStudyTime) || 0,
      streakDays: Number(stats.streakDays) || 0,
      averageResponseTime: Number(stats.averageResponseTime) || 0,
      totalCards: Number(stats.totalCards) || 0,
      lastStudyDate: stats.lastStudyDate || null,
      cardStats: stats.cardStats || {},
      dailyStats: stats.dailyStats || {}
    };
  };

  const loadStatsSecurely = () => {
    try {
      const saved = localStorage.getItem('fleStats');
      if (saved) {
        return validateStats(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
    
    return {
      cardsViewed: 0,
      cardsReviewed: 0,
      totalStudyTime: 0,
      streakDays: 0,
      averageResponseTime: 0,
      totalCards: 0,
      lastStudyDate: null,
      cardStats: {},
      dailyStats: {}
    };
  };

  const saveStatsSecurely = (stats) => {
    try {
      const validatedStats = validateStats(stats);
      localStorage.setItem('fleStats', JSON.stringify(validatedStats));
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde stats:', error);
      return false;
    }
  };

  // Charger les cartes depuis localStorage
  const loadCards = () => {
    const saved = localStorage.getItem('fleCards');
    if (saved) {
      try {
        const parsedCards = JSON.parse(saved);
        return parsedCards.length > 0 ? parsedCards : demoCards;
      } catch (e) {
        console.error('Erreur lors du chargement des cartes:', e);
        return demoCards;
      }
    }
    return demoCards;
  };

  const [cards, setCards] = useState(loadCards());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('flePreferredLanguage') || 'english';
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // États pour les statistiques
  const [stats, setStats] = useState(() => {
    return loadStatsSecurely();
  });

  const [sessionStart, setSessionStart] = useState(Date.now());
  const [cardStartTime, setCardStartTime] = useState(Date.now());

  // États pour le nouveau/édition de carte
  const [newCard, setNewCard] = useState({
    type: 'vocabulary',
    french: '',
    translations: {
      english: '',
      spanish: '',
      spanishMexico: '',
      spanishSpain: ''
    },
    image: '',
    notes: ''
  });

  // Fonction helper pour vérifier les jours consécutifs
  const isConsecutiveDay = (lastDate, currentDate) => {
    const last = new Date(lastDate);
    const current = new Date(currentDate);
    const diffTime = current - last;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  };

  // Fonctions de tracking des statistiques

  // Fonctions de tracking des statistiques
  const updateStats = (action, data = {}) => {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = Date.now();
    
    setStats(prevStats => {
      const newStats = { ...prevStats };
      
      switch (action) {
        case 'VIEW_CARD':
          newStats.cardsViewed += 1;
          newStats.totalCards = Math.max(newStats.totalCards, cards.length);
          
          // Stats par carte
          const cardId = data.cardId;
          if (!newStats.cardStats[cardId]) {
            newStats.cardStats[cardId] = { views: 0, correctAnswers: 0, avgTime: 0 };
          }
          newStats.cardStats[cardId].views += 1;
          
          // Stats quotidiennes
          if (!newStats.dailyStats[today]) {
            newStats.dailyStats[today] = { cardsViewed: 0, studyTime: 0 };
          }
          newStats.dailyStats[today].cardsViewed += 1;
          
          break;
          
        case 'FLIP_CARD':
          const responseTime = currentTime - cardStartTime;
          newStats.cardsReviewed += 1;
          
          // Mettre à jour le temps de réponse moyen
          const totalResponses = newStats.cardsReviewed;
          newStats.averageResponseTime = ((newStats.averageResponseTime * (totalResponses - 1)) + responseTime) / totalResponses;
          
          // Temps par carte
          const currentCardId = data.cardId;
          if (newStats.cardStats[currentCardId]) {
            const cardViews = newStats.cardStats[currentCardId].views;
            const prevAvgTime = newStats.cardStats[currentCardId].avgTime || 0;
            newStats.cardStats[currentCardId].avgTime = ((prevAvgTime * (cardViews - 1)) + responseTime) / cardViews;
          }
          
          break;
          
        case 'UPDATE_STUDY_TIME':
          const sessionTime = currentTime - sessionStart;
          newStats.totalStudyTime += sessionTime;
          
          if (newStats.dailyStats[today]) {
            newStats.dailyStats[today].studyTime += sessionTime;
          }
          
          // Calcul de la streak
          const lastDate = newStats.lastStudyDate;
          if (lastDate === today) {
            // Même jour, pas de changement de streak
          } else if (lastDate && isConsecutiveDay(lastDate, today)) {
            newStats.streakDays += 1;
          } else {
            newStats.streakDays = 1; // Nouvelle streak
          }
          
          newStats.lastStudyDate = today;
          break;
          
        default:
          break;
      }
      
      return newStats;
    });
  };

  // Sauvegarder les cartes dans localStorage à chaque modification
  useEffect(() => {
    if (cards.length > 0) {
      localStorage.setItem('fleCards', JSON.stringify(cards));
    }
  }, [cards]);

  // Sauvegarder la langue préférée
  useEffect(() => {
    localStorage.setItem('flePreferredLanguage', selectedLanguage);
  }, [selectedLanguage]);

  // Sauvegarder les statistiques avec validation
  useEffect(() => {
    saveStatsSecurely(stats);
  }, [stats, saveStatsSecurely]);

  // Initialiser le temps de début de carte à chaque changement
  useEffect(() => {
    setCardStartTime(Date.now());
  }, [currentIndex]);

  // Tracker la fin de session
  useEffect(() => {
    const handleBeforeUnload = () => {
      updateStats('UPDATE_STUDY_TIME');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateStats('UPDATE_STUDY_TIME');
        setSessionStart(Date.now()); // Redémarrer le compteur pour la prochaine session
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionStart, updateStats]);

  // Tracker la première vue de carte au chargement
  useEffect(() => {
    if (currentCard) {
      updateStats('VIEW_CARD', { cardId: currentCard.id });
    }
  }, []); // Seulement au premier chargement

  // Gestion du clavier
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (showAddModal) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          previousCard();
          break;
        case 'ArrowRight':
          nextCard();
          break;
        case ' ':
          e.preventDefault();
          const newFlipped = !isFlipped;
          setIsFlipped(newFlipped);
          
          // Tracker le flip de carte (révision)
          if (newFlipped && currentCard) {
            updateStats('FLIP_CARD', { cardId: currentCard.id });
          }
          break;
        case '1':
          setSelectedLanguage('english');
          break;
        case '2':
          setSelectedLanguage('spanish');
          break;
        case '3':
          setSelectedLanguage('spanishMexico');
          break;
        case '4':
          setSelectedLanguage('spanishSpain');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFlipped, showAddModal, currentIndex]);

  // Navigation entre les cartes
  const nextCard = () => {
    const filteredCards = getFilteredCards();
    const newIndex = (currentIndex + 1) % filteredCards.length;
    setCurrentIndex(newIndex);
    setIsFlipped(false);
    
    // Tracker la vue de la nouvelle carte
    const newCard = filteredCards[newIndex];
    if (newCard) {
      updateStats('VIEW_CARD', { cardId: newCard.id });
    }
  };

  const previousCard = () => {
    const filteredCards = getFilteredCards();
    const newIndex = (currentIndex - 1 + filteredCards.length) % filteredCards.length;
    setCurrentIndex(newIndex);
    setIsFlipped(false);
    
    // Tracker la vue de la nouvelle carte
    const newCard = filteredCards[newIndex];
    if (newCard) {
      updateStats('VIEW_CARD', { cardId: newCard.id });
    }
  };

  // Mélanger les cartes
  const shuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Filtrer les cartes par type
  const getFilteredCards = () => {
    if (filterType === 'all') return cards;
    return cards.filter(card => card.type === filterType);
  };

  const filteredCards = getFilteredCards();
  const currentCard = filteredCards[currentIndex];

  // Ajouter ou éditer une carte
  const saveCard = () => {
    if (!newCard.french || !newCard.translations.english) {
      alert('Veuillez remplir au moins le français et l\'anglais');
      return;
    }

    if (editingCard) {
      setCards(cards.map(card => 
        card.id === editingCard.id 
          ? { ...newCard, id: editingCard.id }
          : card
      ));
    } else {
      const newCardWithId = {
        ...newCard,
        id: Date.now()
      };
      setCards([...cards, newCardWithId]);
    }

    resetForm();
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setNewCard({
      type: 'vocabulary',
      french: '',
      translations: {
        english: '',
        spanish: '',
        spanishMexico: '',
        spanishSpain: ''
      },
      image: '',
      notes: ''
    });
    setEditingCard(null);
    setShowAddModal(false);
  };

  // Supprimer une carte
  const deleteCard = (id) => {
    setCards(cards.filter(card => card.id !== id));
    if (currentIndex >= cards.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  // Éditer une carte
  const startEdit = (card) => {
    setNewCard(card);
    setEditingCard(card);
    setShowAddModal(true);
  };

  // Génération automatique avec IA - Version optimisée
  const generateWithAI = async () => {
    if (!newCard.french) {
      alert('Veuillez entrer le texte en français d\'abord');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Traduction vers l'anglais avec MyMemory
      const urlEn = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(newCard.french)}&langpair=fr|en`;
      const responseEn = await fetch(urlEn);
      const dataEn = await responseEn.json();
      
      // Traduction vers l'espagnol avec MyMemory
      const urlEs = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(newCard.french)}&langpair=fr|es`;
      const responseEs = await fetch(urlEs);
      const dataEs = await responseEs.json();
      
      if (dataEn.responseData && dataEs.responseData) {
        setNewCard({
          ...newCard,
          translations: {
            english: dataEn.responseData.translatedText,
            spanish: dataEs.responseData.translatedText,
            spanishMexico: dataEs.responseData.translatedText,
            spanishSpain: dataEs.responseData.translatedText
          }
        });
      }
    } catch (error) {
      console.error('Erreur génération:', error);
      alert('Erreur lors de la génération. Veuillez réessayer.');
    } finally {
      setIsGenerating(false);
    }
  };
  // Fonction de synthèse vocale
  const speak = (text, lang) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'french' ? 'fr-FR' : 
                       lang === 'english' ? 'en-US' : 
                       lang === 'spanish' ? 'es-ES' : 
                       lang === 'spanishMexico' ? 'es-MX' : 'es-ES';
      speechSynthesis.speak(utterance);
    }
  };

  // Exporter les cartes en JSON
  const exportCards = () => {
    const dataStr = JSON.stringify(cards, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fle-cards-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Importer des cartes depuis un fichier JSON
  const importCards = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedCards = JSON.parse(e.target.result);
          if (Array.isArray(importedCards)) {
            const shouldReplace = window.confirm(
              'Voulez-vous remplacer toutes les cartes existantes ?\n' +
              'OK = Remplacer tout\n' +
              'Annuler = Ajouter aux cartes existantes'
            );
            
            if (shouldReplace) {
              setCards(importedCards);
            } else {
              const newCards = importedCards.map(card => ({
                ...card,
                id: Date.now() + Math.random()
              }));
              setCards([...cards, ...newCards]);
            }
            alert(`${importedCards.length} carte(s) importée(s) avec succès !`);
          }
        } catch (error) {
          alert('Erreur lors de l\'importation du fichier. Vérifiez le format JSON.');
          console.error('Import error:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  // Réinitialiser les cartes
  const resetCards = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser toutes les cartes ?')) {
      setCards(demoCards);
      setCurrentIndex(0);
      setIsFlipped(false);
      alert('Les cartes ont été réinitialisées.');
    }
  };

  if (!currentCard) {
    return (
      <div className="app">
        <div className="empty-state">
          <BookOpen size={64} />
          <h2>Aucune carte disponible</h2>
          <p>Ajoutez votre première carte pour commencer</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus size={20} />
            Ajouter une carte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Languages size={32} />
            <h1>FLE Flashcards</h1>
            <span className="save-indicator" title="Sauvegarde automatique activée">
              💾 Auto
            </span>
          </div>
          
          {/* Sélecteur de langue */}
          <div className="language-selector">
            <button 
              className={selectedLanguage === 'english' ? 'active' : ''}
              onClick={() => {
                setSelectedLanguage('english');
                if (isFlipped) setIsFlipped(false);
              }}
            >
              <Flag country="usa" />
              English
            </button>
            <button 
              className={selectedLanguage === 'spanishMexico' ? 'active' : ''}
              onClick={() => {
                setSelectedLanguage('spanishMexico');
                if (isFlipped) setIsFlipped(false);
              }}
            >
              <Flag country="spanishMexico" />
              México
            </button>
            <button 
              className={selectedLanguage === 'spanishSpain' ? 'active' : ''}
              onClick={() => {
                setSelectedLanguage('spanishSpain');
                if (isFlipped) setIsFlipped(false);
              }}
            >
              <Flag country="spanishSpain" />
              España
            </button>
          </div>

          {/* Actions */}
          <div className="header-actions">
            <button onClick={shuffleCards} className="btn-icon" title="Mélanger">
              <Shuffle size={20} />
            </button>
            <button onClick={() => setShowStatsModal(true)} className="btn-icon" title="Statistiques">
              <BarChart3 size={20} />
            </button>
            <button onClick={exportCards} className="btn-icon" title="Exporter">
              <Save size={20} />
            </button>
            <label className="btn-icon" title="Importer">
              <input 
                type="file" 
                accept=".json"
                onChange={importCards}
                style={{ display: 'none' }}
              />
              <Plus size={20} />
            </label>
            <button onClick={resetCards} className="btn-icon btn-danger" title="Réinitialiser">
              <Trash2 size={20} />
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus size={20} />
              Ajouter
            </button>
          </div>
        </div>
      </header>

      {/* Filtres */}
      <div className="filters">
        <button 
          className={filterType === 'all' ? 'active' : ''}
          onClick={() => {
            setFilterType('all');
            setCurrentIndex(0);
          }}
        >
          Tout ({cards.length})
        </button>
        <button 
          className={filterType === 'vocabulary' ? 'active' : ''}
          onClick={() => {
            setFilterType('vocabulary');
            setCurrentIndex(0);
          }}
        >
          <BookOpen size={16} />
          Vocabulaire ({cards.filter(c => c.type === 'vocabulary').length})
        </button>
        <button 
          className={filterType === 'expression' ? 'active' : ''}
          onClick={() => {
            setFilterType('expression');
            setCurrentIndex(0);
          }}
        >
          <MessageCircle size={16} />
          Expressions ({cards.filter(c => c.type === 'expression').length})
        </button>
        <button 
          className={filterType === 'conjugation' ? 'active' : ''}
          onClick={() => {
            setFilterType('conjugation');
            setCurrentIndex(0);
          }}
        >
          <Sparkles size={16} />
          Conjugaisons ({cards.filter(c => c.type === 'conjugation').length})
        </button>
      </div>

      {/* Zone principale avec la carte */}
      <div className="main-content">
        <div className="card-container">
          <div
            className={`flashcard ${isFlipped ? 'flipped' : ''}`}
            onClick={() => {
              const newFlipped = !isFlipped;
              setIsFlipped(newFlipped);
              
              // Tracker le flip de carte (révision)
              if (newFlipped && currentCard) {
                updateStats('FLIP_CARD', { cardId: currentCard.id });
              }
            }}
          >
            {/* Face avant - Français */}
            <div className="card-face card-front">
              <div className="card-type">
                {currentCard.type === 'vocabulary' && <BookOpen size={20} />}
                {currentCard.type === 'expression' && <MessageCircle size={20} />}
                {currentCard.type === 'conjugation' && <Sparkles size={20} />}
                <span>{currentCard.type}</span>
              </div>
              
              {currentCard.image && (
                <div className="card-image">
                  <img src={currentCard.image} alt={currentCard.french} />
                </div>
              )}
              
              <div className="card-content">
                <Flag country="france" size={32} />
                <h2>{currentCard.french}</h2>
                {currentCard.notes && (
                  <p className="card-notes">{currentCard.notes}</p>
                )}
              </div>
              
              <button 
                className="btn-sound"
                onClick={(e) => {
                  e.stopPropagation();
                  speak(currentCard.french, 'french');
                }}
              >
                <Volume2 size={20} />
              </button>
              
              <div className="card-actions">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(currentCard);
                  }}
                  className="btn-icon"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCard(currentCard.id);
                  }}
                  className="btn-icon btn-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Face arrière - Traduction */}
            <div className="card-face card-back">
              <div className="card-type">
                {currentCard.type === 'vocabulary' && <BookOpen size={20} />}
                {currentCard.type === 'expression' && <MessageCircle size={20} />}
                {currentCard.type === 'conjugation' && <Sparkles size={20} />}
                <span>{currentCard.type}</span>
              </div>
              
              <div className="card-content">
                <div className="translation-flag">
                  <Flag 
                    country={selectedLanguage === 'english' ? 'usa' : selectedLanguage} 
                    size={32} 
                  />
                </div>
                <h2>{currentCard.translations[selectedLanguage]}</h2>
                
                {/* Afficher toutes les traductions */}
                <div className="all-translations">
                  {Object.entries(currentCard.translations).map(([lang, translation]) => (
                    lang !== selectedLanguage && (
                      <div key={lang} className="translation-item">
                        <Flag country={lang === 'english' ? 'usa' : lang} size={16} />
                        <span>{translation}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
              
              <button 
                className="btn-sound"
                onClick={(e) => {
                  e.stopPropagation();
                  speak(currentCard.translations[selectedLanguage], selectedLanguage);
                }}
              >
                <Volume2 size={20} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="navigation">
            <button onClick={previousCard} className="nav-btn">
              <ChevronLeft size={24} />
            </button>
            
            <div className="progress">
              <span>{currentIndex + 1} / {filteredCards.length}</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${((currentIndex + 1) / filteredCards.length) * 100}%` }}
                />
              </div>
            </div>
            
            <button onClick={nextCard} className="nav-btn">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Instructions clavier */}
        <div className="keyboard-hints">
          <div className="hint">
            <kbd>←</kbd> <kbd>→</kbd> Navigation
          </div>
          <div className="hint">
            <kbd>Espace</kbd> Retourner
          </div>
          <div className="hint">
            <kbd>1-4</kbd> Changer langue
          </div>
        </div>
      </div>

      {/* Modal d'ajout/édition */}
      {showAddModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCard ? 'Modifier la carte' : 'Nouvelle carte'}</h2>
              <button onClick={resetForm} className="btn-icon">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-content">
              {/* Type de carte */}
              <div className="form-group">
                <label>Type de carte</label>
                <div className="radio-group">
                  <label>
                    <input 
                      type="radio" 
                      value="vocabulary"
                      checked={newCard.type === 'vocabulary'}
                      onChange={(e) => setNewCard({...newCard, type: e.target.value})}
                    />
                    <BookOpen size={16} />
                    Vocabulaire
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      value="expression"
                      checked={newCard.type === 'expression'}
                      onChange={(e) => setNewCard({...newCard, type: e.target.value})}
                    />
                    <MessageCircle size={16} />
                    Expression
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      value="conjugation"
                      checked={newCard.type === 'conjugation'}
                      onChange={(e) => setNewCard({...newCard, type: e.target.value})}
                    />
                    <Sparkles size={16} />
                    Conjugaison
                  </label>
                </div>
              </div>

              {/* Français */}
              <div className="form-group">
                <label>
                  <Flag country="france" />
                  Français *
                </label>
                <input 
                  type="text"
                  value={newCard.french}
                  onChange={(e) => setNewCard({...newCard, french: e.target.value})}
                  placeholder="Entrez le texte en français"
                />
              </div>

              {/* Bouton génération IA */}
              <button 
                onClick={generateWithAI} 
                className="btn-ai"
                disabled={isGenerating || !newCard.french}
              >
                <Wand2 size={16} />
                {isGenerating ? 'Génération...' : 'Générer avec IA'}
              </button>

              {/* Traductions */}
              <div className="form-group">
                <label>
                  <Flag country="usa" />
                  English *
                </label>
                <input 
                  type="text"
                  value={newCard.translations.english}
                  onChange={(e) => setNewCard({
                    ...newCard, 
                    translations: {...newCard.translations, english: e.target.value}
                  })}
                  placeholder="English translation"
                />
              </div>

              <div className="form-group">
                <label>
                  <Flag country="spanish" />
                  Español (Général)
                </label>
                <input 
                  type="text"
                  value={newCard.translations.spanish}
                  onChange={(e) => setNewCard({
                    ...newCard, 
                    translations: {...newCard.translations, spanish: e.target.value}
                  })}
                  placeholder="Traducción en español"
                />
              </div>

              <div className="form-group">
                <label>
                  <Flag country="spanishMexico" />
                  Español (México)
                </label>
                <input 
                  type="text"
                  value={newCard.translations.spanishMexico}
                  onChange={(e) => setNewCard({
                    ...newCard, 
                    translations: {...newCard.translations, spanishMexico: e.target.value}
                  })}
                  placeholder="Traducción en español mexicano"
                />
              </div>

              <div className="form-group">
                <label>
                  <Flag country="spanishSpain" />
                  Español (España)
                </label>
                <input 
                  type="text"
                  value={newCard.translations.spanishSpain}
                  onChange={(e) => setNewCard({
                    ...newCard, 
                    translations: {...newCard.translations, spanishSpain: e.target.value}
                  })}
                  placeholder="Traducción en español de España"
                />
              </div>

              {/* Image */}
              <div className="form-group">
                <label>URL de l'image (optionnel)</label>
                <input 
                  type="text"
                  value={newCard.image}
                  onChange={(e) => setNewCard({...newCard, image: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              {/* Notes */}
              <div className="form-group">
                <label>Notes (optionnel)</label>
                <textarea 
                  value={newCard.notes}
                  onChange={(e) => setNewCard({...newCard, notes: e.target.value})}
                  placeholder="Ajoutez des notes ou explications"
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={resetForm} className="btn-secondary">
                Annuler
              </button>
              <button onClick={saveCard} className="btn-primary">
                <Save size={16} />
                {editingCard ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal des Statistiques */}
      {showStatsModal && (
        <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="modal stats-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Statistiques d'Apprentissage</h2>
              <button onClick={() => setShowStatsModal(false)} className="btn-icon">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-content stats-content">
              {/* Métriques principales */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <BookOpen size={24} />
                  </div>
                  <div className="stat-info">
                    <h3>{stats.cardsViewed}</h3>
                    <p>Cartes Vues</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <Target size={24} />
                  </div>
                  <div className="stat-info">
                    <h3>{stats.cardsReviewed}</h3>
                    <p>Cartes Révisées</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <Clock size={24} />
                  </div>
                  <div className="stat-info">
                    <h3>{Math.round(stats.averageResponseTime / 1000)}s</h3>
                    <p>Temps Moyen</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <Award size={24} />
                  </div>
                  <div className="stat-info">
                    <h3>{stats.streakDays}</h3>
                    <p>Jours Consécutifs</p>
                  </div>
                </div>
              </div>

              {/* Temps d'étude total */}
              <div className="study-time-section">
                <h3>⏱️ Temps d'Étude Total</h3>
                <div className="study-time-display">
                  {Math.floor(stats.totalStudyTime / 3600000)}h {Math.floor((stats.totalStudyTime % 3600000) / 60000)}min
                </div>
              </div>

              {/* Progression par type de carte */}
              <div className="progress-section">
                <h3>📈 Progression par Type</h3>
                <div className="progress-bars">
                  {['vocabulary', 'expression', 'conjugation'].map(type => {
                    const typeCards = cards.filter(card => card.type === type);
                    const viewedCount = typeCards.filter(card => 
                      stats.cardStats[card.id]?.views > 0
                    ).length;
                    const percentage = typeCards.length > 0 ? (viewedCount / typeCards.length) * 100 : 0;
                    
                    return (
                      <div key={type} className="progress-item">
                        <div className="progress-label">
                          {type === 'vocabulary' && <BookOpen size={16} />}
                          {type === 'expression' && <MessageCircle size={16} />}
                          {type === 'conjugation' && <Sparkles size={16} />}
                          <span>{type}</span>
                          <span className="progress-count">{viewedCount}/{typeCards.length}</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="progress-percentage">{Math.round(percentage)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Statistiques détaillées */}
              <div className="detailed-stats">
                <h3>🔍 Détails</h3>
                <div className="stats-details">
                  <div className="detail-item">
                    <span>Total de cartes:</span>
                    <span>{cards.length}</span>
                  </div>
                  <div className="detail-item">
                    <span>Taux de progression:</span>
                    <span>{cards.length > 0 ? Math.round((stats.cardsViewed / cards.length) * 100) : 0}%</span>
                  </div>
                  <div className="detail-item">
                    <span>Dernière session:</span>
                    <span>{stats.lastStudyDate || 'Jamais'}</span>
                  </div>
                  <div className="detail-item">
                    <span>Sessions totales:</span>
                    <span>{Object.keys(stats.dailyStats).length}</span>
                  </div>
                </div>
              </div>

              {/* Graphique simple des 7 derniers jours */}
              <div className="chart-section">
                <h3>📊 Activité (7 derniers jours)</h3>
                <div className="simple-chart">
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    const dateStr = date.toISOString().split('T')[0];
                    const dayStats = stats.dailyStats[dateStr];
                    const cardsViewed = dayStats?.cardsViewed || 0;
                    const maxCards = Math.max(...Object.values(stats.dailyStats).map(s => s.cardsViewed || 0), 1);
                    const height = (cardsViewed / maxCards) * 100;
                    
                    return (
                      <div key={dateStr} className="chart-bar">
                        <div 
                          className="bar-fill"
                          style={{ height: `${height}%` }}
                          data-count={`${cardsViewed} cartes`}
                          title={`${cardsViewed} cartes le ${date.toLocaleDateString()}`}
                        />
                        <span className="bar-label">{date.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
