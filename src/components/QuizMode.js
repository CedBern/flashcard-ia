import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, Trophy, Zap, Target, RotateCcw, ChevronRight } from 'lucide-react';
import './QuizMode.css';

const QuizMode = ({ 
  cards = [], 
  onComplete, 
  onClose,
  userStats = {},
  onUpdateStats
}) => {
  // === États du quiz ===
  const [quizState, setQuizState] = useState('setup'); // setup, running, results
  const [quizSettings, setQuizSettings] = useState({
    mode: 'classic', // classic, timed, survival, progressive
    questionCount: 10,
    timeLimit: 30, // secondes par question
    difficulty: 'mixed', // easy, medium, hard, mixed
    // questionType options: translation, multiple-choice, fill-blanks, adaptive, open-only
    questionType: 'translation',
    includeTags: [],
    shuffleQuestions: true,
    adaptiveSettings: {
      minAttemptsForMCQ: 3,          // < 3 → QCM
      mcqSuccessThreshold: 0.5,      // < 50% → QCM
      mcqEaseThreshold: 2.2,         // ease < 2.2 → QCM
      mcqMinIntervalDays: 1,         // < 1 jour → QCM

      fbSuccessThreshold: 0.75,      // < 75% → Trous
      fbEaseThreshold: 2.3,          // ease < 2.3 → Trous
      fbMinIntervalDays: 5           // < 5 jours → Trous
    }
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [responseTimes, setResponseTimes] = useState([]);

  // === Persist Settings ===
  useEffect(() => {
    try {
      const raw = localStorage.getItem('flashcards.quizSettings');
      if (raw) {
        const saved = JSON.parse(raw);
        setQuizSettings(prev => ({
          ...prev,
          ...saved,
          adaptiveSettings: { ...prev.adaptiveSettings, ...(saved.adaptiveSettings || {}) }
        }));
      }
    } catch (_) {
      // ignore corrupted storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('flashcards.quizSettings', JSON.stringify(quizSettings));
    } catch (_) {
      // storage may be unavailable
    }
  }, [quizSettings]);

  // === Génération des questions ===
  const generateQuestions = useCallback(() => {
    if (!cards.length) return [];

    let availableCards = [...cards];
    
    // Filtrer par difficulté si spécifiée
    if (quizSettings.difficulty !== 'mixed') {
      availableCards = availableCards.filter(card => 
        card.difficulty === quizSettings.difficulty || 
        (!card.difficulty && quizSettings.difficulty === 'medium')
      );
    }

    // Filtrer par tags si spécifiés
    if (quizSettings.includeTags.length > 0) {
      availableCards = availableCards.filter(card =>
        card.tags && card.tags.some(tag => 
          quizSettings.includeTags.includes(tag)
        )
      );
    }

    // Limiter et mélanger
    availableCards = availableCards.slice(0, quizSettings.questionCount);
    if (quizSettings.shuffleQuestions) {
      availableCards.sort(() => Math.random() - 0.5);
    }

    return availableCards.map((card, index) => 
      generateSingleQuestion(card, index, quizSettings.questionType)
    ).filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, quizSettings]);

  // Détermine dynamiquement le type de question selon les performances de l'utilisateur
  const getAdaptiveQuestionType = (card) => {
  const statsMap = userStats || {};
  const stats = statsMap[card.id] || statsMap[String(card.id)] || {};

    const attempts = stats.attempts ?? stats.total ?? stats.seen ?? 0;
    const correct = stats.correct ?? stats.success ?? stats.correctCount ?? 0;
    const successRate = attempts > 0 ? correct / attempts : 0;
    const ease = stats.ease ?? stats.easiness ?? 2.5; // SM-2 default
    const intervalDays = stats.intervalDays ?? stats.interval ?? 0;

    const a = quizSettings.adaptiveSettings;

    if (attempts < a.minAttemptsForMCQ || successRate < a.mcqSuccessThreshold || ease < a.mcqEaseThreshold || intervalDays < a.mcqMinIntervalDays) {
      return 'multiple-choice';
    }
    if (successRate < a.fbSuccessThreshold || ease < a.fbEaseThreshold || intervalDays < a.fbMinIntervalDays) {
      return 'fill-blanks';
    }
    return 'translation';
  };

  const generateSingleQuestion = (card, index, type) => {
    const availableLanguages = Object.keys(card.translations || {});
    
    if (availableLanguages.length === 0) {
      return null;
    }

    const targetLang = availableLanguages[Math.floor(Math.random() * availableLanguages.length)];
    const correctAnswer = card.translations[targetLang];

    const baseQuestion = {
      id: `${card.id}-${index}`,
      cardId: card.id,
      question: card.french,
      correctAnswer,
      targetLanguage: targetLang,
      difficulty: card.difficulty || 'medium',
      tags: card.tags || [],
      hint: generateHint(card, targetLang)
    };

    // Supporte les modes 'adaptive' (selon stats) et 'open-only' (100% ouvert)
    const effectiveType = type === 'adaptive'
      ? getAdaptiveQuestionType(card)
      : (type === 'open-only' ? 'translation' : type);

    switch (effectiveType) {
      case 'multiple-choice':
        return {
          ...baseQuestion,
          type: 'multiple-choice',
          options: generateMultipleChoiceOptions(correctAnswer, availableLanguages, targetLang)
        };
      
      case 'fill-blanks':
        return {
          ...baseQuestion,
          type: 'fill-blanks',
          sentence: generateFillBlanksQuestion(correctAnswer, targetLang)
        };
      
      default:
        return {
          ...baseQuestion,
          type: 'translation'
        };
    }
  };

  const generateMultipleChoiceOptions = (correctAnswer, availableLanguages, targetLang) => {
    const otherCards = cards.filter(card => 
      card.translations[targetLang] && 
      card.translations[targetLang] !== correctAnswer
    );
    
    const options = [correctAnswer];
    while (options.length < 4 && otherCards.length > 0) {
      const randomCard = otherCards.splice(Math.floor(Math.random() * otherCards.length), 1)[0];
      options.push(randomCard.translations[targetLang]);
    }
    
    return options.sort(() => Math.random() - 0.5);
  };

  const generateFillBlanksQuestion = (correctAnswer, targetLang) => {
    const words = correctAnswer.split(' ');
    if (words.length < 2) return correctAnswer;
    
    const blankIndex = Math.floor(Math.random() * words.length);
    const sentence = words.map((word, index) => 
      index === blankIndex ? '____' : word
    ).join(' ');
    
    return sentence;
  };

  const generateHint = (card, targetLang) => {
    const hints = [];
    
    // Hint basé sur la longueur
    hints.push(`${card.translations[targetLang].length} lettres`);
    
    // Hint basé sur la première lettre
    hints.push(`Commence par "${card.translations[targetLang][0].toUpperCase()}"`);
    
    // Hint basé sur les tags
    if (card.tags && card.tags.length > 0) {
      hints.push(`Thème: ${card.tags[0]}`);
    }

    return hints[Math.floor(Math.random() * hints.length)];
  };

  // === Logique du quiz ===
  const startQuiz = useCallback(() => {
    const generatedQuestions = generateQuestions();
    if (!generatedQuestions.length) {
      alert('Aucune question disponible avec ces paramètres');
      return;
    }

    setQuestions(generatedQuestions);
    setQuizState('running');
    setStartTime(Date.now());
    setQuestionStartTime(Date.now());
    setTimeLeft(quizSettings.timeLimit);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setAnswers([]);
    setHintsUsed(0);
    setResponseTimes([]);
  }, [generateQuestions, quizSettings]);

  const submitAnswer = useCallback(() => {
    if (currentQuestionIndex >= questions.length) return;

    const currentQuestion = questions[currentQuestionIndex];
    const responseTime = Date.now() - questionStartTime;
    const isCorrect = checkAnswer(currentAnswer, currentQuestion);
    
    const answerData = {
      questionId: currentQuestion.id,
      userAnswer: currentAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      responseTime,
      hintUsed: showHint,
      timeLeft
    };

    setAnswers(prev => [...prev, answerData]);
    setResponseTimes(prev => [...prev, responseTime]);

    if (isCorrect) {
      setScore(prev => prev + calculateQuestionScore(answerData));
      setStreak(prev => {
        const newStreak = prev + 1;
        setMaxStreak(max => Math.max(max, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }

    // Tracker les statistiques
    if (onUpdateStats) {
      onUpdateStats('QUIZ_ANSWER', {
        cardId: currentQuestion.cardId,
        isCorrect,
        responseTime,
        quizMode: quizSettings.mode
      });
    }

    // Passer à la question suivante ou terminer
    if (currentQuestionIndex + 1 >= questions.length) {
      finishQuiz();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer('');
      setShowHint(false);
      setQuestionStartTime(Date.now());
      setTimeLeft(quizSettings.timeLimit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAnswer, currentQuestionIndex, questions, questionStartTime, showHint, timeLeft, quizSettings.mode, onUpdateStats]);

  const checkAnswer = (userAnswer, question) => {
    const normalizedUser = userAnswer.toLowerCase().trim();
    const normalizedCorrect = question.correctAnswer.toLowerCase().trim();
    
    // Vérification exacte
    if (normalizedUser === normalizedCorrect) return true;
    
    // Vérification avec tolérance pour les accents et variations
    const similarity = calculateSimilarity(normalizedUser, normalizedCorrect);
    return similarity > 0.8; // 80% de similarité
  };

  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };

  const levenshteinDistance = (str1, str2) => {
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
  };

  const calculateQuestionScore = (answerData) => {
    let baseScore = 100;
    
    // Malus pour les hints
    if (answerData.hintUsed) baseScore -= 20;
    
    // Bonus pour la vitesse
    const speedBonus = Math.max(0, (quizSettings.timeLimit - (quizSettings.timeLimit - answerData.timeLeft)) * 2);
    
    // Bonus pour la séquence
    const streakBonus = Math.min(streak * 10, 50);
    
    return Math.round(baseScore + speedBonus + streakBonus);
  };

  const finishQuiz = useCallback(() => {
    const totalTime = Date.now() - startTime;
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const accuracy = answers.filter(a => a.isCorrect).length / answers.length;
    
    const finalResults = {
      score,
      accuracy: Math.round(accuracy * 100),
      totalTime,
      avgResponseTime: Math.round(avgResponseTime),
      maxStreak,
      hintsUsed,
      questionsCount: questions.length,
      mode: quizSettings.mode
    };

    setQuizState('results');
    
    if (onComplete) {
      onComplete(finalResults);
    }
  }, [startTime, responseTimes, answers, score, maxStreak, hintsUsed, questions.length, quizSettings.mode, onComplete]);

  // === useEffects ===
  useEffect(() => {
    if (quizState !== 'running' || quizSettings.mode === 'untimed') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          submitAnswer();
          return quizSettings.timeLimit;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState, quizSettings.mode, quizSettings.timeLimit, submitAnswer]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (quizState !== 'running') return;
      
      if (e.key === 'Enter') {
        submitAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [quizState, submitAnswer]);

  // === Tags disponibles ===
  const availableTags = useMemo(() => {
    const tags = new Set();
    cards.forEach(card => {
      if (card.tags) {
        card.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [cards]);

  // === Rendu conditionnel ===
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (quizState === 'setup') {
    return (
      <div className="quiz-modal-overlay" onClick={onClose}>
        <div className="quiz-modal" onClick={e => e.stopPropagation()}>
          <div className="quiz-header">
            <h2>🎯 Mode Quiz Avancé</h2>
            <button className="btn-close" onClick={onClose}>×</button>
          </div>

          <div className="quiz-setup">
            {/* Mode de quiz */}
            <div className="form-group">
              <label>Mode de Quiz</label>
              <div className="quiz-mode-grid">
                <button
                  className={`mode-option ${quizSettings.mode === 'classic' ? 'active' : ''}`}
                  onClick={() => setQuizSettings(prev => ({ ...prev, mode: 'classic' }))}
                >
                  <Target size={24} />
                  <span>Classique</span>
                  <small>Questions standard</small>
                </button>
                <button
                  className={`mode-option ${quizSettings.mode === 'timed' ? 'active' : ''}`}
                  onClick={() => setQuizSettings(prev => ({ ...prev, mode: 'timed' }))}
                >
                  <Clock size={24} />
                  <span>Chronométré</span>
                  <small>Temps limité</small>
                </button>
                <button
                  className={`mode-option ${quizSettings.mode === 'survival' ? 'active' : ''}`}
                  onClick={() => setQuizSettings(prev => ({ ...prev, mode: 'survival' }))}
                >
                  <Zap size={24} />
                  <span>Survie</span>
                  <small>Une erreur = fin</small>
                </button>
                <button
                  className={`mode-option ${quizSettings.mode === 'progressive' ? 'active' : ''}`}
                  onClick={() => setQuizSettings(prev => ({ ...prev, mode: 'progressive' }))}
                >
                  <Trophy size={24} />
                  <span>Progressif</span>
                  <small>Difficulté croissante</small>
                </button>
              </div>
            </div>

            {/* Nombre de questions */}
            <div className="form-group">
              <label>Nombre de Questions</label>
              <input
                type="range"
                min="5"
                max="50"
                value={quizSettings.questionCount}
                onChange={e => setQuizSettings(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
              />
              <span>{quizSettings.questionCount} questions</span>
            </div>

            {/* Temps par question */}
            {quizSettings.mode !== 'untimed' && (
              <div className="form-group">
                <label>Temps par Question</label>
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={quizSettings.timeLimit}
                  onChange={e => setQuizSettings(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                />
                <span>{quizSettings.timeLimit} secondes</span>
              </div>
            )}

            {/* Type de question */}
            <div className="form-group">
              <label>Type de Question</label>
              <select
                value={quizSettings.questionType}
                onChange={e => setQuizSettings(prev => ({ ...prev, questionType: e.target.value }))}
              >
                <option value="adaptive">Automatique (adaptatif)</option>
                <option value="translation">Traduction</option>
                <option value="multiple-choice">QCM</option>
                <option value="fill-blanks">Texte à trous</option>
                <option value="open-only">100% ouvert</option>
              </select>
            </div>

            {quizSettings.questionType === 'adaptive' && (
              <div className="form-group">
                <label>Réglages Adaptatifs</label>
                <div className="adaptive-grid">
                  <div>
                    <small>QCM si…</small>
                    <div className="adaptive-row">
                      <span>Essais &lt;</span>
                      <input type="number" min="0" value={quizSettings.adaptiveSettings.minAttemptsForMCQ}
                        onChange={e => setQuizSettings(prev => ({
                          ...prev,
                          adaptiveSettings: { ...prev.adaptiveSettings, minAttemptsForMCQ: parseInt(e.target.value || '0', 10) }
                        }))} />
                    </div>
                    <div className="adaptive-row">
                      <span>Précision &lt;</span>
                      <input type="number" min="0" max="1" step="0.05" value={quizSettings.adaptiveSettings.mcqSuccessThreshold}
                        onChange={e => setQuizSettings(prev => ({
                          ...prev,
                          adaptiveSettings: { ...prev.adaptiveSettings, mcqSuccessThreshold: parseFloat(e.target.value || '0') }
                        }))} />
                    </div>
                    <div className="adaptive-row">
                      <span>Ease &lt;</span>
                      <input type="number" min="1.3" max="3.0" step="0.1" value={quizSettings.adaptiveSettings.mcqEaseThreshold}
                        onChange={e => setQuizSettings(prev => ({
                          ...prev,
                          adaptiveSettings: { ...prev.adaptiveSettings, mcqEaseThreshold: parseFloat(e.target.value || '0') }
                        }))} />
                    </div>
                    <div className="adaptive-row">
                      <span>Intervalle &lt; (j)</span>
                      <input type="number" min="0" value={quizSettings.adaptiveSettings.mcqMinIntervalDays}
                        onChange={e => setQuizSettings(prev => ({
                          ...prev,
                          adaptiveSettings: { ...prev.adaptiveSettings, mcqMinIntervalDays: parseInt(e.target.value || '0', 10) }
                        }))} />
                    </div>
                  </div>

                  <div>
                    <small>Trous si…</small>
                    <div className="adaptive-row">
                      <span>Précision &lt;</span>
                      <input type="number" min="0" max="1" step="0.05" value={quizSettings.adaptiveSettings.fbSuccessThreshold}
                        onChange={e => setQuizSettings(prev => ({
                          ...prev,
                          adaptiveSettings: { ...prev.adaptiveSettings, fbSuccessThreshold: parseFloat(e.target.value || '0') }
                        }))} />
                    </div>
                    <div className="adaptive-row">
                      <span>Ease &lt;</span>
                      <input type="number" min="1.3" max="3.0" step="0.1" value={quizSettings.adaptiveSettings.fbEaseThreshold}
                        onChange={e => setQuizSettings(prev => ({
                          ...prev,
                          adaptiveSettings: { ...prev.adaptiveSettings, fbEaseThreshold: parseFloat(e.target.value || '0') }
                        }))} />
                    </div>
                    <div className="adaptive-row">
                      <span>Intervalle &lt; (j)</span>
                      <input type="number" min="0" value={quizSettings.adaptiveSettings.fbMinIntervalDays}
                        onChange={e => setQuizSettings(prev => ({
                          ...prev,
                          adaptiveSettings: { ...prev.adaptiveSettings, fbMinIntervalDays: parseInt(e.target.value || '0', 10) }
                        }))} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Difficulté */}
            <div className="form-group">
              <label>Difficulté</label>
              <select
                value={quizSettings.difficulty}
                onChange={e => setQuizSettings(prev => ({ ...prev, difficulty: e.target.value }))}
              >
                <option value="mixed">Mixte</option>
                <option value="easy">Facile</option>
                <option value="medium">Moyen</option>
                <option value="hard">Difficile</option>
              </select>
            </div>

            {/* Tags */}
            {availableTags.length > 0 && (
              <div className="form-group">
                <label>Filtrer par Thèmes</label>
                <div className="tags-selector">
                  {availableTags.map(tag => (
                    <label key={tag} className="tag-option">
                      <input
                        type="checkbox"
                        checked={quizSettings.includeTags.includes(tag)}
                        onChange={e => {
                          if (e.target.checked) {
                            setQuizSettings(prev => ({
                              ...prev,
                              includeTags: [...prev.includeTags, tag]
                            }));
                          } else {
                            setQuizSettings(prev => ({
                              ...prev,
                              includeTags: prev.includeTags.filter(t => t !== tag)
                            }));
                          }
                        }}
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Options */}
            <div className="form-group">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={quizSettings.shuffleQuestions}
                  onChange={e => setQuizSettings(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                />
                Mélanger les questions
              </label>
            </div>

            <div className="setup-actions">
              <button
                className="btn-reset"
                onClick={() => {
                  const defaults = {
                    mode: 'classic',
                    questionCount: 10,
                    timeLimit: 30,
                    difficulty: 'mixed',
                    questionType: 'translation',
                    includeTags: [],
                    shuffleQuestions: true,
                    adaptiveSettings: {
                      minAttemptsForMCQ: 3,
                      mcqSuccessThreshold: 0.5,
                      mcqEaseThreshold: 2.2,
                      mcqMinIntervalDays: 1,
                      fbSuccessThreshold: 0.75,
                      fbEaseThreshold: 2.3,
                      fbMinIntervalDays: 5
                    }
                  };
                  setQuizSettings(defaults);
                  try { localStorage.removeItem('flashcards.quizSettings'); } catch (_) {}
                }}
              >
                Réinitialiser
              </button>

              <button className="btn-start-quiz" onClick={startQuiz}>
              <ChevronRight size={20} />
              Commencer le Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (quizState === 'running' && currentQuestion) {
    return (
      <div className="quiz-modal-overlay">
        <div className="quiz-modal quiz-running">
          <div className="quiz-header">
            <div className="quiz-progress-info">
              <span className="question-counter">
                Question {currentQuestionIndex + 1} / {questions.length}
              </span>
              <div className="quiz-stats">
                <span className="score">Score: {score}</span>
                <span className="streak">Série: {streak}</span>
              </div>
            </div>
            {quizSettings.mode !== 'untimed' && (
              <div className="quiz-timer">
                <Clock size={16} />
                <span className={timeLeft <= 5 ? 'urgent' : ''}>{timeLeft}s</span>
              </div>
            )}
          </div>

          <div className="quiz-progress-bar">
            <div 
              className="quiz-progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="quiz-question-area">
            <div className="question-content">
              <h3>Traduisez en {currentQuestion.targetLanguage} :</h3>
              <div className="question-text">{currentQuestion.question}</div>
              
              {currentQuestion.type === 'multiple-choice' ? (
                <div className="multiple-choice-options">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      className={`choice-option ${currentAnswer === option ? 'selected' : ''}`}
                      onClick={() => setCurrentAnswer(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={currentAnswer}
                  onChange={e => setCurrentAnswer(e.target.value)}
                  placeholder="Votre réponse..."
                  className="quiz-answer-input"
                  autoFocus
                />
              )}

              {showHint && (
                <div className="quiz-hint">
                  💡 {currentQuestion.hint}
                </div>
              )}
            </div>

            <div className="quiz-actions">
              <button
                className="btn-hint"
                onClick={() => {
                  setShowHint(true);
                  setHintsUsed(prev => prev + 1);
                }}
                disabled={showHint}
              >
                💡 Indice
              </button>
              <button
                className="btn-submit"
                onClick={submitAnswer}
                disabled={!currentAnswer.trim()}
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (quizState === 'results') {
    const accuracy = answers.filter(a => a.isCorrect).length / answers.length;
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    const avgResponseTime = responseTimes.length > 0 ? 
      Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000) : 0;

    return (
      <div className="quiz-modal-overlay">
        <div className="quiz-modal quiz-results">
          <div className="quiz-header">
            <h2>🏆 Résultats du Quiz</h2>
            <button className="btn-close" onClick={onClose}>×</button>
          </div>

          <div className="results-summary">
            <div className="result-stat main-score">
              <div className="stat-value">{score}</div>
              <div className="stat-label">Score Total</div>
            </div>
            
            <div className="results-grid">
              <div className="result-stat">
                <div className="stat-value">{Math.round(accuracy * 100)}%</div>
                <div className="stat-label">Précision</div>
              </div>
              
              <div className="result-stat">
                <div className="stat-value">{answers.filter(a => a.isCorrect).length}/{questions.length}</div>
                <div className="stat-label">Bonnes Réponses</div>
              </div>
              
              <div className="result-stat">
                <div className="stat-value">{maxStreak}</div>
                <div className="stat-label">Meilleure Série</div>
              </div>
              
              <div className="result-stat">
                <div className="stat-value">{totalTime}s</div>
                <div className="stat-label">Temps Total</div>
              </div>
              
              <div className="result-stat">
                <div className="stat-value">{avgResponseTime}s</div>
                <div className="stat-label">Temps Moyen</div>
              </div>
              
              <div className="result-stat">
                <div className="stat-value">{hintsUsed}</div>
                <div className="stat-label">Indices Utilisés</div>
              </div>
            </div>
          </div>

          <div className="results-details">
            <h3>Détail des Réponses</h3>
            <div className="answers-review">
              {answers.map((answer, index) => (
                <div key={index} className={`answer-review ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="answer-question">{questions[index]?.question}</div>
                  <div className="answer-comparison">
                    <span className="user-answer">Votre réponse: {answer.userAnswer}</span>
                    <span className="correct-answer">Correct: {answer.correctAnswer}</span>
                  </div>
                  <div className="answer-stats">
                    <span className="response-time">{Math.round(answer.responseTime / 1000)}s</span>
                    {answer.hintUsed && <span className="hint-used">💡</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="results-actions">
            <button className="btn-retry" onClick={() => setQuizState('setup')}>
              <RotateCcw size={20} />
              Recommencer
            </button>
            <button className="btn-close-quiz" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default QuizMode;