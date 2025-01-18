# Accessibilité des Communes Françaises aux Offres de Soins 🌍

[Voir l'application en ligne ici !](https://pierrehernt.github.io/my-map-app/)

## 🔓 Description

Pour réaliser ce projet, je suis parti d'un TD de [UniLaSalle](https://storymaps.arcgis.com/stories/aa8a70ec49ef46b5a28834064a3f9e19) initialement réalisé sur ArcGIS. J'ai modifié ce TD en réalisant le prétraitement des données avec Python et en développant l'application en React. Cette application interactive permet d'analyser l'accessibilité des communes françaises aux offres de soins, en particulier aux médecins généralistes, à partir de données de 2022. Les données sont disponibles ici :  
[Accéder aux données](https://drive.google.com/drive/folders/16L3jNkOOov5VGT9QaWjhPbS9Qu2jYG72?usp=drive_link).  
Le prétraitement des données a été réalisé avec le fichier Python intitulé **`traitement_data`**.

L'application s'appuie sur deux scores principaux pour évaluer la situation des communes :

1. **Score APL (Accessibilité Potentielle Localisée)** : calculé par la DREES, ce score évalue l'accessibilité aux soins en fonction de la densité de médecins généralistes et de la population.
2. **Score Désert Médical (DM)** : basé sur des critères tels que :
   - Le nombre de médecins généralistes disponibles.
   - La distance par rapport aux pharmacies.
   - La distance par rapport aux hôpitaux.

---

## 🚀 Déploiement

L'application est hébergée sur **GitHub Pages**.

---

## 🚀 Déploiement

L'application est hébergée grâce à **GitHub Pages**.

---

## 🔂 Installation locale

### Étapes pour exécuter le projet en local :

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/PierreHernt/my-map-app.git
   cd my-map-app
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Lancez l'application :
   ```bash
   npm start
   ```

4. Ouvrez votre navigateur et accédez à :
   ```
   http://localhost:3000
   ```


---

## 📊 Sources des données

Les données utilisées dans l'application proviennent des sources suivantes :

- **Score APL (Accessibilité Potentielle Localisée)** : [Données DREES](https://data.drees.solidarites-sante.gouv.fr/explore/dataset/530_l-accessibilite-potentielle-localisee-apl/information/).
- **Autres données** : [Données INSEE](https://www.insee.fr/fr/accueil)

---

## 📞 Contact

- **Auteur** : Pierre Hernot  
- **Lien vers le projet** : [https://github.com/PierreHernt/my-map-app](https://github.com/PierreHernt/my-map-app)

---

