import pandas as pd
import geopandas as gpd
from shapely.wkt import loads  # pour convertir un WKT (Well-Known Text) en géométrie
from shapely.geometry import Point

# ---------------------------------------------------------
# 1. Chargement et préparation des données tabulaires
# ---------------------------------------------------------
# Lecture du fichier CSV principal
data = pd.read_csv('data/data_dep.csv', sep=';', encoding='utf-8-sig')

# Renommage des colonnes pour plus de clarté
data.columns = [
    'Code', 
    'Libelle', 
    'EHPAD_2023', 
    'Population_2022', 
    'Urgences_2023', 
    'Médecin_généraliste_2023', 
    'Chirurgien_dentiste_2023', 
    'Masseur_kinésithérapeute_2023', 
    'Infirmier_2023', 
    'Pharmacie_2023'
]

# Conversion des champs Population et Nombre de médecins en numérique
cols_to_convert = ['Population_2022', 'Médecin_généraliste_2023']
for col in cols_to_convert:
    data[col] = pd.to_numeric(data[col], errors='coerce').fillna(0)

# Calcul du nombre de médecins par 2000 habitants
data['Medecins_par_2000_hab'] = (
    data['Médecin_généraliste_2023'] / data['Population_2022']
) * 2000

# Définition d'une commune "à risque" si < 1 médecin pour 2000 habitants
data['à_risque'] = data['Medecins_par_2000_hab'] < 1

# ---------------------------------------------------------
# 2. Fusion avec les données géographiques des communes
# ---------------------------------------------------------
# Lecture du GeoJSON des communes
geo_data = gpd.read_file("data/commune_2022.json")

# Fusion sur le code géographique
map_data = geo_data.merge(
    data,
    left_on="codgeo",
    right_on="Code",
    how="left"
)

# Remplacement des NaN par 0 pour éviter les problèmes de calcul
map_data = map_data.fillna(0)

# S'assurer que la colonne à_risque est bien booléenne
map_data['à_risque'] = map_data['à_risque'].astype(bool)

# Enregistrer cette première version au format GeoJSON
map_data.to_file("communes_scored.geojson", driver="GeoJSON")
print("Fichier 'communes_scored.geojson' créé (données de base + communes).")

# ---------------------------------------------------------
# 3. Fonction générique pour transformer un CSV de points
#    (hôpitaux, pharmacies, etc.) en GeoDataFrame
# ---------------------------------------------------------
def csv_to_geodf(input_csv, output_geojson, crs="EPSG:3857", geom_col='the_geom'):
    """
    Transforme un fichier CSV contenant une colonne WKT (geom_col)
    en GeoDataFrame et enregistre le résultat sous forme de GeoJSON.
    """
    df = pd.read_csv(input_csv, sep=',')
    if geom_col in df.columns:
        # Conserver uniquement la colonne des géométries
        df = df[[geom_col]].copy()
        df['geometry'] = df[geom_col].apply(lambda x: loads(x))
        gdf = gpd.GeoDataFrame(df, geometry='geometry', crs=crs)
        gdf.to_file(output_geojson, driver='GeoJSON')
        print(f"Fichier '{output_geojson}' créé à partir de '{input_csv}'.")
    else:
        print(f"Aucune colonne '{geom_col}' dans {input_csv}. Aucune conversion effectuée.")

# ---------------------------------------------------------
# 4. Conversion des CSV de points en GeoJSON si nécessaire
# ---------------------------------------------------------
csv_to_geodf('data/pharmacies_point.csv', 'data/pharmacies.geojson')
csv_to_geodf('data/hospitals_point.csv', 'data/hospitals.geojson')

# ---------------------------------------------------------
# 5. Fonction générique de jointure spatiale (points -> communes)
# ---------------------------------------------------------
def spatial_join_points_communes(points_geojson, communes_geojson, output_geojson):
    """
    Effectue une jointure spatiale entre des points (points_geojson)
    et des communes (communes_geojson). Conserve ensuite seulement 
    'codgeo', 'dep', 'reg' et la 'geometry' des points.
    Enregistre le résultat dans output_geojson.
    """
    # Lecture des GeoDataFrame
    points_gdf = gpd.read_file(points_geojson)
    communes_gdf = gpd.read_file(communes_geojson)
    
    # Harmoniser les projections si nécessaire
    if points_gdf.crs != communes_gdf.crs:
        communes_gdf = communes_gdf.to_crs(points_gdf.crs)
    
    # Jointure spatiale
    joined = gpd.sjoin(points_gdf, communes_gdf, how="left", predicate="intersects")
    
    # Filtrer les colonnes : ne conserver que codgeo, dep, reg et geometry
    joined = joined[['codgeo', 'dep', 'reg', 'geometry']]
    
    # Sauvegarder le résultat
    joined.to_file(output_geojson, driver="GeoJSON")
    print(f"Jointure spatiale enregistrée dans '{output_geojson}'.")

# ---------------------------------------------------------
# 6. Jointure spatiale Pharmacies -> Communes
# ---------------------------------------------------------
spatial_join_points_communes("data/pharmacies.geojson", 
                             "data/dep_data.geojson", 
                             "pharmacies_communes.geojson")

# 7. Jointure spatiale Hôpitaux -> Communes
spatial_join_points_communes("data/hospitals.geojson", 
                             "data/dep_data.geojson", 
                             "hospitals_communes.geojson")

# ---------------------------------------------------------
# 8. Fonction générique pour calculer la zone d’influence
#    d’un ensemble de points et marquer les communes
#    hors de portée
# ---------------------------------------------------------
def mark_communes_out_of_range(communes_file, points_file, 
                               buffer_distance_m, 
                               communes_output, 
                               out_of_range_column):
    """
    - Lit les communes et les points (GeoJSON).
    - Reprojette en EPSG:3857 pour un calcul en mètres.
    - Crée un buffer (buffer_distance_m) autour des points.
    - Marque les communes qui n’intersectent pas ce buffer
      (hors de portée).
    - Reprojette en EPSG:4326 pour usage Folium.
    - Sauvegarde dans communes_output.
    - out_of_range_column : nom de la colonne booléenne indiquant la portée.
    """
    # Lecture
    communes_gdf = gpd.read_file(communes_file)
    points_gdf = gpd.read_file(points_file)
    
    # Reprojection en EPSG:3857
    communes_gdf = communes_gdf.to_crs(epsg=3857)
    points_gdf = points_gdf.to_crs(epsg=3857)
    
    # Nettoyage des géométries invalides
    communes_gdf = communes_gdf[communes_gdf.is_valid]
    points_gdf = points_gdf[points_gdf.is_valid]
    
    # Construction de la zone d’influence (buffer)
    points_gdf['buffer'] = points_gdf.geometry.buffer(buffer_distance_m)
    points_union = points_gdf['buffer'].unary_union
    
    # Marquer les communes hors de portée
    communes_gdf[out_of_range_column] = ~communes_gdf.geometry.intersects(points_union)
    
    # Reprojection en WGS84
    communes_gdf = communes_gdf.to_crs(epsg=4326)
    
    # Enregistrement
    communes_gdf.to_file(communes_output, driver="GeoJSON")
    print(f"Zones d’influence mises à jour et sauvegardées dans '{communes_output}'.")

# ---------------------------------------------------------
# 9. Calcul de la zone d’influence Pharmacies (5 km)
#    -> Ajout de la colonne 'hors_de_portee_pharma'
# ---------------------------------------------------------
mark_communes_out_of_range(
    communes_file="communes_scored.geojson",
    points_file="pharmacies_communes.geojson",
    buffer_distance_m=5000,  # 5 km
    communes_output="communes_scored.geojson",
    out_of_range_column='hors_de_portee_pharma'
)

# ---------------------------------------------------------
# 10. Calcul de la zone d’influence Hôpitaux (15 km)
#     -> Ajout de la colonne 'hors_de_portee__hosto'
# ---------------------------------------------------------
mark_communes_out_of_range(
    communes_file="communes_scored.geojson",
    points_file="hospitals_communes.geojson",
    buffer_distance_m=15000,  # 15 km
    communes_output="communes_scored.geojson",
    out_of_range_column='hors_de_portee_hosto'
)

# ---------------------------------------------------------
# 11. Calcul du score global
# ---------------------------------------------------------
def calculate_score(row):
    """
    Calcule un score sur 3 conditions booléennes :
      - 'à_risque'
      - 'hors_de_portee_pharma'
      - 'hors_de_portee_hosto'
    Score :
      3 si les 3 conditions sont vraies,
      2 si 2 conditions sont vraies,
      1 si 1 condition est vraie,
      0 sinon.
    """
    conditions = [row['à_risque'], row['hors_de_portee_pharma'], row['hors_de_portee_hosto']]
    nb_true = sum(conditions)
    return nb_true  # direct : 3 => 3, 2 => 2, 1 => 1, 0 => 0

# Recharger le GeoJSON final pour appliquer le score
communes_final = gpd.read_file("communes_scored.geojson")

# Convertir en bool si besoin
for col in ['à_risque','hors_de_portee_pharma','hors_de_portee_hosto']:
    if col in communes_final.columns:
        communes_final[col] = communes_final[col].astype(bool)

# Appliquer la fonction de score
communes_final['score'] = communes_final.apply(calculate_score, axis=1)

# Vérifier la distribution du score
print("Distribution des scores :")
print(communes_final['score'].value_counts())

# Sauvegarde finale
communes_final.to_file("communes_scored.geojson", driver="GeoJSON")
print("Fichier final 'communes_scored.geojson' mis à jour avec la colonne 'score'.")

# Modification des coordonnées des territoires d'outre-mer
# Charger les fichiers de base et des DOM
mayotte_file_path = './communes-mayotte.geojson'
guyane_file_path = './communes-guyane.geojson'
guadeloupe_file_path = './communes-guadeloupe.geojson'
reunion_file_path = './communes-la-reunion.geojson'
martinique_file_path = './communes-martinique.geojson'

# Charger le fichier de base
base_data = communes_final

# Charger les fichiers des DOM
mayotte_data = gpd.read_file(mayotte_file_path)
guyane_data = gpd.read_file(guyane_file_path)
guadeloupe_data = gpd.read_file(guadeloupe_file_path)
reunion_data = gpd.read_file(reunion_file_path)
martinique_data = gpd.read_file(martinique_file_path)

# Fusionner toutes les données des DOM
dom_data = gpd.GeoDataFrame(pd.concat([mayotte_data, guyane_data, guadeloupe_data, reunion_data, martinique_data], ignore_index=True))


dom_data = dom_data.rename(columns={"code": "codgeo"})

# Vérifier que les clés sont bien au même format (si nécessaire, convertir en string)
base_data["codgeo"] = base_data["codgeo"].astype(str)
dom_data["codgeo"] = dom_data["codgeo"].astype(str)

# Faire une jointure sur la colonne `codgeo` pour récupérer les géométries DOM
updated_data = base_data.merge(dom_data[["codgeo", "geometry"]], on="codgeo", how="left", suffixes=("", "_dom"))

# Remplacer les géométries de base par celles des DOM, si disponibles
updated_data["geometry"] = updated_data["geometry_dom"].combine_first(updated_data["geometry"])

# Supprimer la colonne intermédiaire `geometry_dom`
updated_data = updated_data.drop(columns=["geometry_dom"])

updated_data.to_file("fichier_joined.geojson", driver="GeoJSON")


