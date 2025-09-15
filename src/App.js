import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Wand2
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
  const [cards, setCards] = useState(demoCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

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
          setIsFlipped(!isFlipped);
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
  }, [isFlipped, showAddModal]);

  // Navigation entre les cartes
  const nextCard = () => {
    const filteredCards = getFilteredCards();
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
    setIsFlipped(false);
  };

  const previousCard = () => {
    const filteredCards = getFilteredCards();
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
    setIsFlipped(false);
  };

  // Mélanger les cartes
  const shuffleCards = () => {
    const filteredCards = getFilteredCards();
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5);
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

  // Génération automatique avec IA (simulation)
  const generateWithAI = async () => {
    if (!newCard.french) {
      alert('Veuillez entrer le texte en français d\'abord');
      return;
    }

    setIsGenerating(true);
    
    // Simulation de génération IA
    setTimeout(() => {
      const aiTranslations = {
        english: `[AI] ${newCard.french} in English`,
        spanish: `[AI] ${newCard.french} en español`,
        spanishMexico: `[AI] ${newCard.french} en español mexicano`,
        spanishSpain: `[AI] ${newCard.french} en español de España`
      };
      
      setNewCard({
        ...newCard,
        translations: aiTranslations,
        image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400',
        notes: 'Généré automatiquement par IA'
      });
      
      setIsGenerating(false);
    }, 1500);
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
          </div>
          
          {/* Sélecteur de langue */}
          <div className="language-selector">
            <button 
              className={selectedLanguage === 'english' ? 'active' : ''}
              onClick={() => setSelectedLanguage('english')}
            >
              <Flag country="usa" />
              English
            </button>
            <button 
              className={selectedLanguage === 'spanish' ? 'active' : ''}
              onClick={() => setSelectedLanguage('spanish')}
            >
              <Flag country="spanish" />
              Español
            </button>
            <button 
              className={selectedLanguage === 'spanishMexico' ? 'active' : ''}
              onClick={() => setSelectedLanguage('spanishMexico')}
            >
              <Flag country="spanishMexico" />
              México
            </button>
            <button 
              className={selectedLanguage === 'spanishSpain' ? 'active' : ''}
              onClick={() => setSelectedLanguage('spanishSpain')}
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
          onClick={() => setFilterType('all')}
        >
          Tout ({cards.length})
        </button>
        <button 
          className={filterType === 'vocabulary' ? 'active' : ''}
          onClick={() => setFilterType('vocabulary')}
        >
          <BookOpen size={16} />
          Vocabulaire ({cards.filter(c => c.type === 'vocabulary').length})
        </button>
        <button 
          className={filterType === 'expression' ? 'active' : ''}
          onClick={() => setFilterType('expression')}
        >
          <MessageCircle size={16} />
          Expressions ({cards.filter(c => c.type === 'expression').length})
        </button>
        <button 
          className={filterType === 'conjugation' ? 'active' : ''}
          onClick={() => setFilterType('conjugation')}
        >
          <Sparkles size={16} />
          Conjugaisons ({cards.filter(c => c.type === 'conjugation').length})
        </button>
      </div>

      {/* Zone principale avec la carte */}
      <div className="main-content">
        <div className="card-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard.id}
              className={`flashcard ${isFlipped ? 'flipped' : ''}`}
              initial={{ rotateY: 0 }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6 }}
              onClick={() => setIsFlipped(!isFlipped)}
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
            </motion.div>
          </AnimatePresence>

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
    </div>
  );
}

export default App;
