import httpx
import pandas as pd
from typing import Optional

class LLMReportGenerator:
    def __init__(self, ollama_url: str = "http://ollama:11434"):
        self.ollama_url = ollama_url
        self.model = "qwen2.5:3b-instruct"
    
    async def generate_cluster_report(
        self,
        cluster_id: int,
        summary_df: pd.DataFrame,
        top_codes_df: Optional[pd.DataFrame] = None
    ) -> str:
        """Génère un rapport textuel pour un cluster"""
        
        # Get cluster info
        cluster_info = summary_df[summary_df['cluster_id'] == cluster_id]
        if cluster_info.empty:
            return f"Cluster {cluster_id} not found"
        
        cluster_row = cluster_info.iloc[0]
        n_patients = cluster_row.get('n_patients', 0)
        total_patients = summary_df['n_patients'].sum()
        percentage = (n_patients / total_patients * 100) if total_patients > 0 else 0
        n_clusters = len(summary_df)
        
        # Calculate avg patients per cluster for comparison
        avg_patients = total_patients / n_clusters if n_clusters > 0 else 0
        size_comparison = "plus grand" if n_patients > avg_patients else "plus petit"
        
        # Top codes with distinctiveness scores
        top_codes_text = ""
        codes_explanation = ""
        if top_codes_df is not None:
            top_codes = top_codes_df[top_codes_df['cluster_id'] == cluster_id].head(10)
            if not top_codes.empty:
                top_codes_text = "\\n".join([
                    f"- {row['feature']} (score distinctif: {row['score']:.3f})"
                    for _, row in top_codes.iterrows()
                ])
                codes_explanation = f"Ces codes ont des scores de distinctivité élevés, ce qui signifie qu'ils apparaissent significativement plus souvent dans ce cluster que dans les autres."
        
        # Other clusters for comparison
        other_clusters_text = "\\n".join([
            f"- Cluster {row['cluster_id']}: {row['n_patients']} patients ({row['n_patients']/total_patients*100:.1f}%)"
            for _, row in summary_df.iterrows()
            if row['cluster_id'] != cluster_id
        ])
        
        prompt = f"""Tu es un expert en santé publique et en clustering de données médicales. Tu analyses une segmentation de patients basée sur leurs données FHIR (conditions, procédures, observations).

**CONTEXTE DE CLUSTERING**
Population totale : {total_patients} patients répartis en {n_clusters} clusters

**CLUSTER ANALYSÉ : #{cluster_id}**
- Taille : {n_patients} patients ({percentage:.1f}% de la population)
- Ce cluster est {size_comparison} que la moyenne ({avg_patients:.0f} patients/cluster)

**AUTRES CLUSTERS (pour comparaison) :**
{other_clusters_text}

**CARACTÉRISTIQUES DISTINCTIVES DU CLUSTER #{cluster_id} :**
{top_codes_text if top_codes_text else "Non disponibles"}

{codes_explanation}

**INSTRUCTIONS :**
Rédige un rapport clinique structuré (3-4 paragraphes) qui explique **POURQUOI ces patients sont regroupés ensemble** :

1. **Cohérence clinique** : Quel est le profil médical commun qui unit ces {n_patients} patients ? Pourquoi l'algorithme les a-t-il regroupés ?

2. **Distinctivité** : Qu'est-ce qui distingue CE cluster des autres ? Quelles sont les conditions/procédures spécifiques qui le caractérisent par rapport aux {n_clusters-1} autres clusters ?

3. **Interprétation clinique** : Nomme ce cluster (ex: "Patients cardiaques complexes", "Profil métabolique", etc.) et explique les liens entre les conditions présentes.

4. **Implications pratiques** : Quelles stratégies de prise en charge ou parcours de soins seraient adaptés pour cette population spécifique ?

**IMPORTANT :**
- Explique le "pourquoi" du clustering, pas juste une liste de conditions
- Utilise les scores de distinctivité pour identifier les patterns uniques
- Compare avec les autres clusters pour montrer la spécificité
- Format Markdown avec des sections claires
"""
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.3,
                            "top_p": 0.9,
                            "num_predict": 800  # Increased for more detailed reports
                        }
                    }
                )
                result = response.json()
                return result.get("response", "Erreur de génération")
        except Exception as e:
            return f"Erreur lors de la génération du rapport : {str(e)}"
    
    async def generate_global_report(
        self,
        summary_df: pd.DataFrame,
        method: str = "kmeans"
    ) -> str:
        """Génère un rapport global"""
        
        n_clusters = len(summary_df)
        total_patients = summary_df['n_patients'].sum()
        
        # Detailed cluster summary with percentages
        cluster_summary = "\\n".join([
            f"- **Cluster {row['cluster_id']}**: {row['n_patients']} patients ({row['n_patients']/total_patients*100:.1f}%) - {'Grande cohorte' if row['n_patients'] > total_patients/n_clusters else 'Sous-groupe spécifique'}"
            for _, row in summary_df.iterrows()
        ])
        
        # Find largest and smallest clusters
        largest_cluster = summary_df.loc[summary_df['n_patients'].idxmax()]
        smallest_cluster = summary_df.loc[summary_df['n_patients'].idxmin()]
        
        method_explanation = {
            "kmeans": "K-Means partitionne les patients en groupes homogènes en minimisant la variance intra-cluster",
            "k_mean": "K-Means partitionne les patients en groupes homogènes en minimisant la variance intra-cluster",
            "hdbscan": "HDBSCAN identifie des clusters de densité variable et peut détecter des outliers"
        }
        
        prompt = f"""Tu es un expert en santé publique et en analyse de données médicales. Tu analyses une segmentation de patients basée sur leurs dossiers FHIR (conditions, procédures, observations cliniques).

**MÉTHODE DE CLUSTERING : {method.upper()}**
{method_explanation.get(method.lower(), "Algorithme de clustering non supervisé")}

**POPULATION TOTALE : {total_patients} patients**
**NOMBRE DE CLUSTERS IDENTIFIÉS : {n_clusters}**

**DISTRIBUTION DE LA POPULATION :**
{cluster_summary}

**OBSERVATIONS CLÉS :**
- Cluster le plus large : #{largest_cluster['cluster_id']} ({largest_cluster['n_patients']} patients, {largest_cluster['n_patients']/total_patients*100:.1f}%)
- Cluster le plus spécifique : #{smallest_cluster['cluster_id']} ({smallest_cluster['n_patients']} patients, {smallest_cluster['n_patients']/total_patients*100:.1f}%)
- Patients par cluster (moyenne) : {total_patients/n_clusters:.0f}

**INSTRUCTIONS :**
Rédige un rapport stratégique (4-5 paragraphes) qui explique :

1. **Vue d'ensemble de la segmentation** : Que nous apprend cette répartition en {n_clusters} clusters ? Y a-t-il des clusters dominants ou des sous-groupes très spécifiques ?

2. **Interprétation de la méthode** : Pourquoi {method.upper()} a identifié {n_clusters} groupes distincts ? Qu'est-ce que cela révèle sur l'hétérogénéité de la population ?

3. **Clusters remarquables** : Quels clusters méritent une attention particulière (très larges, très spécifiques) ? Que peuvent-ils représenter cliniquement ?

4. **Valeur clinique du clustering** : Comment cette segmentation peut-elle améliorer la prise en charge ? Quels parcours de soins différenciés peut-on envisager ?

5. **Recommandations stratégiques** : Comment exploiter cette segmentation pour optimiser les ressources, personnaliser les soins, ou identifier des populations à risque ?

**IMPORTANT :**
- Explique la logique de segmentation, pas juste les chiffres
- Mets en évidence les patterns et contrastes entre clusters
- Propose des applications concrètes en santé publique
- Format Markdown professionnel
"""
        
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.3,
                            "top_p": 0.9,
                            "num_predict": 1200  # Increased for comprehensive global report
                        }
                    }
                )
                result = response.json()
                return result.get("response", "Erreur de génération")
        except Exception as e:
            return f"Erreur : {str(e)}"
