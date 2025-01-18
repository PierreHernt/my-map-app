import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Bloc texte avec fond coloré, marges, ombres, etc. */}
    <div
      style={{
        maxWidth: '800px',
        margin: '40px auto',
        backgroundColor: '#F9FDFB', // Légèrement teinté, pas complètement blanc
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(42, 157, 143, 0.2)', // Ombre légère avec un soupçon de vert
        fontFamily: 'Arial, sans-serif',
        lineHeight: 1.7,
        color: '#264653', // Couleur de texte (teinte gris-bleu)
      }}
    >
      <h1
        style={{
          textAlign: 'center',
          color: '#2A9D8F', // Titre dans une teinte vert-bleu
          marginBottom: '20px',
        }}
      >
        Carte des communes en situation de désert médical par région
      </h1>

      <p style={{ marginBottom: '15px' }}>
        <strong>Deux méthodes de calcul sont ici utilisées pour analyser l'accessibilité des différentes communes aux offres de soins :</strong><br />
        On retrouve le score APL (Accessibilité Potentielle Localisée) calculé par la DREES (Direction de la Recherche) ainsi qu'un autre score que j'ai trouvé dans ce TD proposé par l'École des métiers de l'environnement : 
        <a href="https://storymaps.arcgis.com/stories/aa8a70ec49ef46b5a28834064a3f9e19" target="_blank" rel="noopener noreferrer">
          Accéder au site de UniLaSalle
        </a>.
      </p>

      <p style={{ marginBottom: '15px' }}>
        <strong style={{ color: '#2A9D8F' }}>1. Score APL calculé par la DREES</strong><br />
        Le <strong>score APL (Accessibilité Potentielle Localisée)</strong> est une mesure fine de l'accessibilité aux soins, prenant en compte la densité de professionnels de santé, la population et l'éloignement. Cette valeur, comprise entre 0 et un maximum variable, offre une indication complémentaire sur la disponibilité des soins pour chaque commune. Ici, le score APL est calculé uniquement pour les médecins généralistes.
      </p>

      <p style={{ marginBottom: '15px' }}>
        <strong style={{ color: '#2A9D8F' }}>2. Score DM (Désert Médical)</strong><br />
        Le <strong>score DM (Désert Médical)</strong> permet de déterminer à quel moment une commune est considérée comme un désert médical. Les communes sont évaluées sur trois critères principaux. Un score de 0 indique que la commune dispose d’une bonne accessibilité aux soins, tandis qu’un score de 3 signifie que la commune cumule tous les facteurs de difficulté et se trouve donc en situation de désert médical. Les différents facteurs évalués sont les suivants :
      </p>

      <p style={{ marginBottom: '15px' }}>
        <strong style={{ color: '#E76F51' }}>2.1. Le nombre de médecins généralistes</strong><br />
        Chaque médecin généraliste peut consulter environ 5 000 patients par an. Comme un patient a besoin d’environ 2,5 consultations par an, cela équivaut à 1 médecin pour 2 000 habitants. Si une commune ne respecte pas ce ratio (c’est-à-dire moins d’un médecin pour 2 000 habitants), elle reçoit un point (+1) à son score.
      </p>

      <p style={{ marginBottom: '15px' }}>
        <strong style={{ color: '#E76F51' }}>2.2. L’éloignement par rapport à une pharmacie</strong><br />
        Nous considérons qu’une commune est correctement desservie si elle se trouve à moins de 5 km d’une pharmacie, ce qui correspond à environ 10 minutes de trajet à 30 km/h. Si la commune est située à plus de 5 km d’une pharmacie, elle obtient +1 à son score.
      </p>

      <p style={{ marginBottom: '15px' }}>
        <strong style={{ color: '#E76F51' }}>2.3. L’éloignement par rapport à un hôpital</strong><br />
        De la même façon, nous prenons en compte une zone de 15 km autour des hôpitaux, qui représente environ 30 minutes de trajet à 30 km/h. Si la commune se situe au-delà de 15 km d’un hôpital, elle reçoit également +1 à son score.
      </p>
    </div>

    {/* Bloc qui contient la carte */}
    <div
      style={{
        width: '800px',
        height: '600px',
        margin: '40px auto',
        border: '1px solid #E9C46A', // Liseré doré
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        position: 'relative',
      }}
    >
      <App />
    </div>
  </React.StrictMode>
);

reportWebVitals();
