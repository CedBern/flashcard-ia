import { useState, useEffect } from 'react';

// Service de suggestions intelligentes basé sur l'historique et l'IA
export class SmartSuggestionService {
  constructor() {
    this.userHistory = this.loadHistory();
    this.learningPatterns = this.analyzeLearningPatterns();
    this.suggestionCache = new Map();
  }

  // Charger l'historique utilisateur
  loadHistory() {
    try {
      const saved = localStorage.getItem('userLearningHistory');
      return saved ? JSON.parse(saved) : {
        viewedCards: [],
        difficultWords: [],
        preferredTopics: [],
        studyTimes: [],
        successfulCards: [],
        strugglingCards: []
      };
    } catch {
      return {
        viewedCards: [],
        difficultWords: [],
        preferredTopics: [],
        studyTimes: [],
        successfulCards: [],
        strugglingCards: []
      };
    }
  }

  // Sauvegarder l'historique
  saveHistory() {
    try {
      localStorage.setItem('userLearningHistory', JSON.stringify(this.userHistory));
    } catch (error) {
      console.warn('Erreur sauvegarde historique:', error);
    }
  }

  // Analyser les patterns d'apprentissage
  analyzeLearningPatterns() {
    const patterns = {
      preferredType: this.getMostViewedType(),
      difficultAreas: this.getDifficultAreas(),
      bestStudyTime: this.getBestStudyTime(),
      learningSpeed: this.calculateLearningSpeed(),
      weakPoints: this.identifyWeakPoints()
    };

    return patterns;
  }

  // Suggestions de nouvelles cartes basées sur l'historique
  suggestNewCards(currentCards, limit = 5) {
  const suggestions = [];

    // 1. Suggérer des cartes similaires aux cartes réussies
    const successfulTopics = this.extractTopicsFromSuccessfulCards();
    
    // 2. Suggérer des cartes pour combler les lacunes
    const gapAreas = this.identifyGaps(currentCards);
    
    // 3. Suggestions basées sur le niveau
  const levelSuggestions = this.getLevelBasedSuggestions(currentCards);

    // Construire les suggestions
    successfulTopics.forEach(topic => {
      if (suggestions.length < limit) {
        suggestions.push({
          type: 'similar_success',
          topic,
          reason: `Vous maîtrisez bien "${topic}", voici des mots similaires`,
          priority: 0.8,
          examples: this.generateExamplesForTopic(topic)
        });
      }
    });

    gapAreas.forEach(gap => {
      if (suggestions.length < limit) {
        suggestions.push({
          type: 'fill_gap',
          topic: gap.area,
          reason: `Pour améliorer votre niveau en ${gap.area}`,
          priority: 0.9,
          examples: gap.suggestions
        });
      }
    });

    // incorporate level-based suggestions with lower priority
    levelSuggestions.forEach(item => {
      if (suggestions.length < limit) {
        suggestions.push({ ...item, priority: Math.min(0.7, item.priority || 0.7) });
      }
    });

    return suggestions.slice(0, limit);
  }

  // Générer des mnémotechniques personnalisées
  async generateMnemonic(word, translation, userContext = {}) {
    const cacheKey = `mnemonic-${word}-${translation}`;
    
    if (this.suggestionCache.has(cacheKey)) {
      return this.suggestionCache.get(cacheKey);
    }

    try {
      // Analyser les préférences utilisateur
      const userPrefs = this.analyzeUserPreferences();
      
      // Générer plusieurs types de mnémotechniques
      const mnemonics = [];

      // 1. Mnémotechnique phonétique
      const phoneticMnemonic = this.generatePhoneticMnemonic(word, translation);
      if (phoneticMnemonic) {
        mnemonics.push({
          type: 'phonetic',
          text: phoneticMnemonic,
          strength: 0.8
        });
      }

      // 2. Mnémotechnique visuelle
      const visualMnemonic = this.generateVisualMnemonic(word, translation, userContext);
      if (visualMnemonic) {
        mnemonics.push({
          type: 'visual',
          text: visualMnemonic,
          strength: 0.7
        });
      }

      // 3. Mnémotechnique contextuelle
      const contextualMnemonic = this.generateContextualMnemonic(word, translation, userPrefs);
      if (contextualMnemonic) {
        mnemonics.push({
          type: 'contextual',
          text: contextualMnemonic,
          strength: 0.9
        });
      }

      // Choisir la meilleure
      const bestMnemonic = mnemonics.sort((a, b) => b.strength - a.strength)[0];
      
      this.suggestionCache.set(cacheKey, bestMnemonic);
      return bestMnemonic;

    } catch (error) {
      console.warn('Erreur génération mnémotechnique:', error);
      return {
        type: 'simple',
        text: `"${word}" ressemble à "${translation}"`,
        strength: 0.5
      };
    }
  }

  // Suggérer des exercices personnalisés
  suggestExercises(currentCard, userStats) {
    const exercises = [];
    const difficulty = this.calculateCardDifficulty(currentCard, userStats);

    if (difficulty > 0.7) {
      // Carte difficile - exercices de base
      exercises.push({
        type: 'repetition',
        title: 'Répétition espacée',
        description: 'Revoir cette carte dans 1 heure, puis 1 jour, puis 1 semaine',
        priority: 'high'
      });

      exercises.push({
        type: 'breakdown',
        title: 'Décomposition du mot',
        description: 'Analyser les syllabes et la structure du mot',
        priority: 'medium'
      });
    } else if (difficulty < 0.3) {
      // Carte facile - exercices avancés
      exercises.push({
        type: 'context',
        title: 'Utilisation en contexte',
        description: 'Créer des phrases avec ce mot',
        priority: 'medium'
      });

      exercises.push({
        type: 'synonyms',
        title: 'Mots similaires',
        description: 'Explorer les synonymes et mots de la même famille',
        priority: 'low'
      });
    }

    return exercises;
  }

  // Tracker les interactions utilisateur
  trackUserInteraction(action, cardId, metadata = {}) {
    const timestamp = Date.now();
    
    switch (action) {
      case 'card_viewed':
        this.userHistory.viewedCards.push({ cardId, timestamp, ...metadata });
        break;
      case 'card_struggled':
        this.userHistory.strugglingCards.push({ cardId, timestamp, attempts: metadata.attempts });
        break;
      case 'card_mastered':
        this.userHistory.successfulCards.push({ cardId, timestamp, time: metadata.responseTime });
        break;
      case 'topic_preference':
        this.userHistory.preferredTopics.push({ topic: metadata.topic, timestamp });
        break;
      default:
        console.warn('Action inconnue:', action);
        break;
    }

    // Garder seulement les 1000 dernières entrées
    Object.keys(this.userHistory).forEach(key => {
      if (this.userHistory[key].length > 1000) {
        this.userHistory[key] = this.userHistory[key].slice(-1000);
      }
    });

    this.saveHistory();
    this.learningPatterns = this.analyzeLearningPatterns();
  }

  // === Méthodes utilitaires ===

  getMostViewedType() {
    // Analyser le type de cartes le plus consulté
    return 'vocabulary'; // Par défaut
  }

  getDifficultAreas() {
    return this.userHistory.strugglingCards
      .reduce((areas, card) => {
        // Analyser les domaines difficiles
        return areas;
      }, []);
  }

  getBestStudyTime() {
    const hourCounts = {};
    this.userHistory.studyTimes.forEach(time => {
      const hour = new Date(time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const bestHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    return bestHour ? parseInt(bestHour) : 10; // 10h par défaut
  }

  calculateLearningSpeed() {
    const recentCards = this.userHistory.successfulCards.slice(-20);
    if (recentCards.length < 5) return 'beginner';
    
    const avgTime = recentCards.reduce((sum, card) => sum + (card.time || 5000), 0) / recentCards.length;
    
    if (avgTime < 2000) return 'fast';
    if (avgTime < 5000) return 'medium';
    return 'slow';
  }

  identifyWeakPoints() {
    // Analyser les patterns d'erreurs
    return this.userHistory.strugglingCards
      .map(card => card.cardId)
      .reduce((weak, cardId) => {
        weak[cardId] = (weak[cardId] || 0) + 1;
        return weak;
      }, {});
  }

  extractTopicsFromSuccessfulCards() {
    // Extraire les topics des cartes réussies
    return ['cuisine', 'voyage', 'famille']; // Exemple
  }

  identifyGaps(currentCards) {
    // Identifier les lacunes dans l'apprentissage
    const gaps = [];
    
    // Exemple de logique de détection de lacunes
    const topics = ['greetings', 'food', 'travel', 'family', 'work'];
    const coveredTopics = new Set();
    
    // Analyser les cartes existantes
    currentCards.forEach(card => {
      // Détecter le topic de la carte (nécessiterait une logique plus complexe)
    });
    
    topics.forEach(topic => {
      if (!coveredTopics.has(topic)) {
        gaps.push({
          area: topic,
          suggestions: this.generateExamplesForTopic(topic)
        });
      }
    });
    
    return gaps;
  }

  getLevelBasedSuggestions(currentCards) {
    // Suggestions basées sur le niveau actuel
    const userLevel = this.calculateUserLevel(currentCards);
    
    const levelSuggestions = {
      'A1': ['bonjour', 'merci', 'au revoir', 'oui', 'non'],
      'A2': ['peut-être', 'beaucoup', 'peu', 'souvent', 'jamais'],
      'B1': ['cependant', 'néanmoins', 'par conséquent', 'en revanche'],
      'B2': ['manifestement', 'indubitablement', 'vraisemblablement']
    };
    
    return levelSuggestions[userLevel] || levelSuggestions['A1'];
  }

  generateExamplesForTopic(topic) {
    const examples = {
      'cuisine': ['cuisiner', 'délicieux', 'recette', 'ingrédient'],
      'voyage': ['valise', 'billet', 'réservation', 'aventure'],
      'famille': ['parent', 'enfant', 'frère', 'sœur'],
      'greetings': ['bonjour', 'bonsoir', 'salut', 'au revoir'],
      'food': ['pain', 'fromage', 'fruit', 'légume'],
      'travel': ['train', 'avion', 'hôtel', 'vacances'],
      'work': ['bureau', 'collègue', 'réunion', 'projet']
    };
    
    return examples[topic] || ['exemple1', 'exemple2', 'exemple3'];
  }

  generatePhoneticMnemonic(word, translation) {
    // Générer une mnémotechnique basée sur la phonétique
    const phonetic = this.findPhoneticSimilarity(word, translation);
    if (phonetic.similarity > 0.6) {
      return `"${word}" se prononce comme "${phonetic.similar}" en français`;
    }
    return null;
  }

  generateVisualMnemonic(word, translation, context) {
    // Générer une mnémotechnique visuelle
    return `Imaginez ${translation} quand vous pensez à "${word}"`;
  }

  generateContextualMnemonic(word, translation, userPrefs) {
    // Générer une mnémotechnique contextuelle
    const contexts = userPrefs.favoriteContexts || ['famille', 'travail', 'voyage'];
    const context = contexts[0];
    return `Utilisez "${word}" (${translation}) dans un contexte de ${context}`;
  }

  findPhoneticSimilarity(word1, word2) {
    // Algorithme simple de similarité phonétique
    const similarity = this.calculateSimilarity(word1.toLowerCase(), word2.toLowerCase());
    return {
      similarity,
      similar: word2
    };
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  analyzeUserPreferences() {
    return {
      favoriteTopics: this.userHistory.preferredTopics.slice(-10),
      favoriteContexts: ['famille', 'travail'],
      learningStyle: 'visual' // Déterminer selon les interactions
    };
  }

  calculateCardDifficulty(card, userStats) {
    const cardStats = userStats.cardStats[card.id];
    if (!cardStats) return 0.5; // Moyenne
    
    const successRate = cardStats.reviews > 0 ? (cardStats.reviews - (cardStats.errors || 0)) / cardStats.reviews : 0.5;
    return 1 - successRate; // Plus de succès = moins difficile
  }

  calculateUserLevel(cards) {
    // Calculer le niveau utilisateur basé sur les cartes maîtrisées
    const masterredCount = this.userHistory.successfulCards.length;
    
    if (masterredCount < 50) return 'A1';
    if (masterredCount < 150) return 'A2';
    if (masterredCount < 300) return 'B1';
    return 'B2';
  }
}

// Instance singleton
export const smartSuggestionService = new SmartSuggestionService();

// Hook React pour les suggestions
export const useSmartSuggestions = (currentCards = [], userStats = {}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (currentCards.length > 0) {
      setIsLoading(true);
      const newSuggestions = smartSuggestionService.suggestNewCards(currentCards, 5);
      setSuggestions(newSuggestions);
      setIsLoading(false);
    }
  }, [currentCards]);

  const trackInteraction = (action, cardId, metadata) => {
    smartSuggestionService.trackUserInteraction(action, cardId, metadata);
  };

  const generateMnemonic = async (word, translation, context) => {
    return await smartSuggestionService.generateMnemonic(word, translation, context);
  };

  return {
    suggestions,
    isLoading,
    trackInteraction,
    generateMnemonic
  };
};

export default SmartSuggestionService;