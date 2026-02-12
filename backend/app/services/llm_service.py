import httpx
import pandas as pd
from typing import Optional

class LLMReportGenerator:
    def __init__(self, ollama_url: str = "http://ollama:11434"):
        self.ollama_url = ollama_url
        self.model = "llama3.1:8b"
    
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
        
        # Top codes if available
        top_codes_text = ""
        if top_codes_df is not None:
            top_codes = top_codes_df[top_codes_df['cluster_id'] == cluster_id].head(10)
            if not top_codes.empty:
                top_codes_text = "\\n".join([
                    f"- {row['feature']}: {row['score']:.2f}"
                    for _, row in top_codes.iterrows()
                ])
        
        prompt = f"""Tu es un expert en santé publique analysant des clusters de patients issus de données FHIR.

**Cluster #{cluster_id}**
- Nombre de patients : {n_patients}

**Top features distinctives :**
{top_codes_text if top_codes_text else "Non disponibles"}

**Tâche :**
Rédige un rapport clinique structuré (2-3 paragraphes maximum) expliquant :
1. Le profil clinique général de ce cluster
2. Les domaines médicaux principaux
3. Les implications pour la prise en charge

Format Markdown. Reste concis et factuel.
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
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "num_predict": 500
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
        
        cluster_summary = "\\n".join([
            f"- Cluster {row['cluster_id']}: {row['n_patients']} patients"
            for _, row in summary_df.iterrows()
        ])
        
        prompt = f"""Tu es un expert en santé publique. Analyse cette segmentation de patients.

**Méthode : {method.upper()}**
**Nombre total de patients : {total_patients}**
**Nombre de clusters : {n_clusters}**

**Distribution :**
{cluster_summary}

**Tâche :**
Rédige un rapport exécutif (3-4 paragraphes) incluant :
1. Vue d'ensemble de la segmentation
2. Clusters remarquables
3. Recommandations stratégiques

Format Markdown.
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
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "num_predict": 800
                        }
                    }
                )
                result = response.json()
                return result.get("response", "Erreur de génération")
        except Exception as e:
            return f"Erreur : {str(e)}"
