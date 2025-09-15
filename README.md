# FLE Flashcards - Application de Cartes de Vocabulaire Multilingues

Une application React moderne pour l'apprentissage du Français Langue Étrangère (FLE) avec des cartes de vocabulaire interactives et multilingues.

## 🌟 Fonctionnalités

### 📚 Types de Cartes
- **Vocabulaire** : Mots et leurs traductions avec images
- **Expressions** : Expressions idiomatiques et leurs équivalents
- **Conjugaisons** : Verbes conjugués et leurs formes

### 🌍 Langues Supportées
- 🇫🇷 Français (langue source)
- 🇬🇧 Anglais
- 🇪🇸 Espagnol (général)
- 🇲🇽 Espagnol (Mexique)
- 🇪🇸 Espagnol (Espagne)

### ✨ Caractéristiques Principales
- **Animations 3D** : Rotation fluide des cartes avec effet 3D
- **Images Représentatives** : Support d'images pour chaque carte
- **Navigation Clavier** : 
  - `←` / `→` : Navigation entre les cartes
  - `Espace` : Retourner la carte
  - `1-4` : Changer de langue cible
- **Synthèse Vocale** : Prononciation des mots dans toutes les langues
- **Génération IA** : Génération automatique des traductions (simulation)
- **Gestion des Cartes** : Ajouter, modifier, supprimer des cartes
- **Filtrage** : Filtrer par type de carte
- **Mélange** : Mélanger aléatoirement les cartes
- **Responsive** : Interface adaptée aux mobiles et tablettes

## 🚀 Installation

### Prérequis
- Node.js (version 14 ou supérieure)
- npm ou yarn

### Étapes d'installation

1. Cloner le repository :
```bash
git clone https://github.com/[votre-username]/fle-flashcards.git
cd fle-flashcards
```

2. Installer les dépendances :
```bash
npm install
```

3. Lancer l'application en mode développement :
```bash
npm start
```

L'application sera accessible à l'adresse : `http://localhost:3000`

## 🏗️ Build pour Production

Pour créer une version optimisée pour la production :

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `build/`.

## 📱 Utilisation

### Navigation
- Utilisez les flèches ou les boutons pour naviguer entre les cartes
- Cliquez sur la carte ou appuyez sur Espace pour voir la traduction
- Sélectionnez la langue cible avec les boutons de drapeaux

### Ajout de Cartes
1. Cliquez sur le bouton "Ajouter"
2. Remplissez les informations :
   - Type de carte
   - Texte en français
   - Traductions (au minimum en anglais)
   - Image (optionnel)
   - Notes (optionnel)
3. Utilisez "Générer avec IA" pour une génération automatique
4. Sauvegardez la carte

### Raccourcis Clavier
- `←` : Carte précédente
- `→` : Carte suivante
- `Espace` : Retourner la carte
- `1` : Anglais
- `2` : Espagnol général
- `3` : Espagnol mexicain
- `4` : Espagnol d'Espagne

## 🛠️ Technologies Utilisées

- **React 18** : Framework JavaScript pour l'interface
- **Framer Motion** : Animations fluides et effets 3D
- **Lucide React** : Icônes modernes et personnalisables
- **CSS3** : Styles avancés avec animations et dégradés
- **Web Speech API** : Synthèse vocale native

## 📝 Structure du Projet

```
fle-flashcards/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── App.js          # Composant principal
│   ├── App.css         # Styles de l'application
│   ├── index.js        # Point d'entrée
│   └── index.css       # Styles globaux
├── package.json
└── README.md
```

## 🎨 Personnalisation

### Modifier les Couleurs
Les couleurs peuvent être modifiées dans le fichier `App.css` :

```css
:root {
  --primary-color: #6366f1;
  --secondary-color: #ec4899;
  --success-color: #10b981;
  /* ... */
}
```

### Ajouter des Langues
Pour ajouter une nouvelle langue, modifiez le composant `App.js` :
1. Ajoutez la langue dans l'objet `translations`
2. Créez un bouton de sélection de langue
3. Ajoutez le drapeau correspondant

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmeliorationX`)
3. Commit vos changements (`git commit -m 'Ajout de X'`)
4. Push vers la branche (`git push origin feature/AmeliorationX`)
5. Ouvrir une Pull Request

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- Icônes par [Lucide](https://lucide.dev/)
- Images de démonstration par [Unsplash](https://unsplash.com/)
- Animations par [Framer Motion](https://www.framer.com/motion/)

## 📧 Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur GitHub.

---

Développé avec ❤️ pour l'enseignement du FLE
