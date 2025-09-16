// Cache intelligent pour les images IA
class ImageCache {
  constructor() {
    this.cache = new Map();
    this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures
    this.MAX_CACHE_SIZE = 50; // Maximum 50 images en cache
    this.loadFromLocalStorage();
  }

  // Génère une clé unique pour le cache basée sur le prompt et le provider
  generateCacheKey(prompt, provider, options = {}) {
    const key = `${provider}-${prompt}-${JSON.stringify(options)}`;
    return btoa(key).replace(/[+/=]/g, ''); // Base64 safe
  }

  // Sauvegarde le cache dans localStorage
  saveToLocalStorage() {
    try {
      const cacheData = Array.from(this.cache.entries()).map(([key, value]) => [
        key, 
        { ...value, timestamp: value.timestamp }
      ]);
      localStorage.setItem('imageCache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Erreur sauvegarde cache:', error);
    }
  }

  // Charge le cache depuis localStorage
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('imageCache');
      if (saved) {
        const cacheData = JSON.parse(saved);
        const now = Date.now();
        
        cacheData.forEach(([key, value]) => {
          // Vérifier que l'entrée n'est pas expirée
          if (now - value.timestamp < this.CACHE_DURATION) {
            this.cache.set(key, value);
          }
        });
      }
    } catch (error) {
      console.warn('Erreur chargement cache:', error);
      this.cache.clear();
    }
  }

  // Récupère une image du cache
  get(prompt, provider, options = {}) {
    const key = this.generateCacheKey(prompt, provider, options);
    const cached = this.cache.get(key);
    
    if (cached) {
      const now = Date.now();
      // Vérifier si l'entrée est encore valide
      if (now - cached.timestamp < this.CACHE_DURATION) {
        console.log(`🎯 Cache HIT pour: ${prompt.substring(0, 30)}...`);
        return cached.imageUrl;
      } else {
        // Supprimer l'entrée expirée
        this.cache.delete(key);
        this.saveToLocalStorage();
      }
    }
    
    console.log(`❌ Cache MISS pour: ${prompt.substring(0, 30)}...`);
    return null;
  }

  // Ajoute une image au cache
  set(prompt, provider, imageUrl, options = {}) {
    const key = this.generateCacheKey(prompt, provider, options);
    
    // Gérer la taille du cache
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }
    
    const cacheEntry = {
      imageUrl,
      timestamp: Date.now(),
      prompt: prompt.substring(0, 100), // Garder un extrait pour debug
      provider
    };
    
    this.cache.set(key, cacheEntry);
    this.saveToLocalStorage();
    
    console.log(`✅ Image cachée: ${prompt.substring(0, 30)}... (${this.cache.size}/${this.MAX_CACHE_SIZE})`);
  }

  // Supprime les entrées les plus anciennes
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ Cache éviction: entrée supprimée`);
    }
  }

  // Nettoie le cache (supprime les entrées expirées)
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.CACHE_DURATION) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.saveToLocalStorage();
      console.log(`🧹 Cache nettoyé: ${cleaned} entrées supprimées`);
    }
    
    return cleaned;
  }

  // Statistiques du cache
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [, value] of this.cache.entries()) {
      if (now - value.timestamp < this.CACHE_DURATION) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }
    
    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      maxSize: this.MAX_CACHE_SIZE,
      usagePercentage: Math.round((validEntries / this.MAX_CACHE_SIZE) * 100)
    };
  }

  // Vide complètement le cache
  clear() {
    this.cache.clear();
    localStorage.removeItem('imageCache');
    console.log('🗑️ Cache vidé complètement');
  }
}

// Instance singleton du cache
export const imageCache = new ImageCache();

// Fonction utilitaire pour nettoyer automatiquement le cache au démarrage
export const initializeImageCache = () => {
  const cleanedCount = imageCache.cleanup();
  const stats = imageCache.getStats();
  
  console.log(`🚀 Cache d'images initialisé:`, { ...stats, cleanedCount });
  
  // Nettoyer automatiquement toutes les heures
  setInterval(() => {
    imageCache.cleanup();
  }, 60 * 60 * 1000); // 1 heure
};