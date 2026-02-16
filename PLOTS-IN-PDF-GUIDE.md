# 📄 Ajouter les Visualisations au Rapport PDF

## Objectif

Intégrer les visualisations (plots) générées lors du clustering dans le rapport PDF généré par l'API.

## 🔍 État Actuel

Le système génère actuellement:
1. ✅ Des **plots PNG** sauvegardés dans `results/jobs/{job_id}/*/plots/`
2. ✅ Un **rapport textuel** (probablement via LLM)
3. ❓ La liaison entre les deux reste à implémenter

## 🎯 Solution Recommandée

### Option 1: Utiliser ReportLab (Python)

**Avantages:**
- Bibliothèque Python standard pour PDF
- Insertion facile d'images
- Contrôle total du layout

**Installation:**
```bash
# Ajouter à backend/requirements.txt
reportlab>=4.0.0
Pillow>=10.0.0  # Pour le traitement d'images
```

**Code d'exemple:**

```python
# backend/app/services/pdf_generator.py

from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import os
from typing import List, Dict


def generate_clustering_report_pdf(
    job_id: str,
    report_text: str,
    plots: List[Dict],
    output_path: str
) -> str:
    """
    Génère un rapport PDF avec le texte et les visualisations
    
    Args:
        job_id: ID du job de clustering
        report_text: Texte du rapport (généré par LLM)
        plots: Liste des plots avec métadonnées (de _scan_plots())
        output_path: Chemin où sauvegarder le PDF
    
    Returns:
        Chemin du PDF généré
    """
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()
    
    # Style personnalisé pour le titre
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor='#1a56db',
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    # Style pour les légendes
    caption_style = ParagraphStyle(
        'Caption',
        parent=styles['Normal'],
        fontSize=10,
        textColor='#6b7280',
        alignment=TA_CENTER,
        spaceAfter=20
    )
    
    # Titre du rapport
    title = Paragraph(f"Rapport de Clustering - {job_id[:8]}", title_style)
    story.append(title)
    story.append(Spacer(1, 0.3*inch))
    
    # Texte du rapport (généré par LLM)
    for paragraph in report_text.split('\n\n'):
        if paragraph.strip():
            p = Paragraph(paragraph, styles['Normal'])
            story.append(p)
            story.append(Spacer(1, 0.2*inch))
    
    # Saut de page avant les visualisations
    story.append(PageBreak())
    
    # Titre de la section visualisations
    viz_title = Paragraph("Visualisations", styles['Heading1'])
    story.append(viz_title)
    story.append(Spacer(1, 0.3*inch))
    
    # Organiser les plots par catégorie
    plots_by_category = {}
    for plot in plots:
        category = plot.get('category', 'other')
        if category not in plots_by_category:
            plots_by_category[category] = []
        plots_by_category[category].append(plot)
    
    # Afficher les plots par catégorie
    category_names = {
        'main': 'Visualisations Principales',
        'hierarchical': 'Analyse Hiérarchique',
        'preprocessing': 'Prétraitement',
        'other': 'Autres'
    }
    
    for category, category_plots in plots_by_category.items():
        # Titre de catégorie
        cat_title = Paragraph(category_names.get(category, category), styles['Heading2'])
        story.append(cat_title)
        story.append(Spacer(1, 0.2*inch))
        
        # Chaque plot
        for plot in category_plots:
            # Construire le chemin complet de l'image
            plot_path = f"/app/results/jobs/{job_id}/{plot['path']}"
            
            if os.path.exists(plot_path):
                # Titre du plot
                plot_title = Paragraph(f"<b>{plot['title']}</b>", styles['Heading3'])
                story.append(plot_title)
                story.append(Spacer(1, 0.1*inch))
                
                # Image (redimensionnée pour tenir dans la page)
                img = Image(plot_path, width=6*inch, height=4*inch, kind='proportional')
                story.append(img)
                
                # Légende
                caption = Paragraph(plot['description'], caption_style)
                story.append(caption)
                story.append(Spacer(1, 0.3*inch))
    
    # Générer le PDF
    doc.build(story)
    return output_path


# Exemple d'utilisation dans l'API
def create_report_with_visualizations(job_id: str) -> str:
    """Crée un rapport PDF complet avec texte et visualisations"""
    from backend.app.api.clustering import _scan_plots
    
    results_base = f"/app/results/jobs/{job_id}"
    
    # 1. Récupérer le texte du rapport (depuis LLM ou fichier)
    report_path = f"{results_base}/report.txt"
    if os.path.exists(report_path):
        with open(report_path, 'r') as f:
            report_text = f.read()
    else:
        report_text = "Rapport en cours de génération..."
    
    # 2. Scanner les plots disponibles
    plots = _scan_plots(results_base)
    
    # 3. Générer le PDF
    output_path = f"{results_base}/rapport_complet.pdf"
    generate_clustering_report_pdf(job_id, report_text, plots, output_path)
    
    return output_path
```

### Ajouter l'endpoint à l'API

```python
# backend/app/api/clustering.py

@router.get("/report/{job_id}/pdf")
async def get_pdf_report(job_id: str):
    """Génère et retourne le rapport PDF avec visualisations"""
    from app.services.pdf_generator import create_report_with_visualizations
    
    try:
        pdf_path = create_report_with_visualizations(job_id)
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"rapport_clustering_{job_id[:8]}.pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

### Option 2: HTML → PDF (avec WeasyPrint)

**Avantages:**
- Plus facile à styliser (CSS)
- Meilleur support du texte riche
- Résultat plus moderne

**Installation:**
```bash
# backend/requirements.txt
weasyprint>=60.0
```

**Code d'exemple:**

```python
# backend/app/services/html_pdf_generator.py

from weasyprint import HTML, CSS
import os
from typing import List, Dict


def generate_html_report(job_id: str, report_text: str, plots: List[Dict]) -> str:
    """Génère un template HTML avec le rapport et les plots"""
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Rapport de Clustering - {job_id[:8]}</title>
        <style>
            @page {{
                size: A4;
                margin: 2cm;
            }}
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            h1 {{
                color: #1a56db;
                text-align: center;
                margin-bottom: 2cm;
            }}
            h2 {{
                color: #1a56db;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 0.5cm;
                margin-top: 1.5cm;
            }}
            h3 {{
                color: #374151;
                margin-top: 1cm;
            }}
            .plot-container {{
                page-break-inside: avoid;
                margin: 1cm 0;
                text-align: center;
            }}
            .plot-image {{
                max-width: 100%;
                height: auto;
                margin: 0.5cm 0;
            }}
            .plot-caption {{
                font-size: 0.9em;
                color: #6b7280;
                font-style: italic;
                margin-top: 0.3cm;
            }}
            .category {{
                margin-top: 2cm;
            }}
            .report-text {{
                text-align: justify;
                margin-bottom: 2cm;
            }}
        </style>
    </head>
    <body>
        <h1>Rapport de Clustering</h1>
        <p style="text-align: center; color: #6b7280;">Job ID: {job_id}</p>
        
        <div class="report-text">
            {report_text.replace(chr(10), '<br>')}
        </div>
        
        <div style="page-break-before: always;"></div>
        
        <h2>Visualisations</h2>
    """
    
    # Organiser par catégorie
    categories = {
        'main': 'Visualisations Principales',
        'hierarchical': 'Analyse Hiérarchique',
        'preprocessing': 'Prétraitement',
    }
    
    for cat_key, cat_title in categories.items():
        cat_plots = [p for p in plots if p['category'] == cat_key]
        if cat_plots:
            html += f'<div class="category"><h2>{cat_title}</h2>'
            
            for plot in cat_plots:
                plot_path = f"/app/results/jobs/{job_id}/{plot['path']}"
                if os.path.exists(plot_path):
                    # Convertir le chemin en chemin relatif ou data URI
                    html += f"""
                    <div class="plot-container">
                        <h3>{plot['title']}</h3>
                        <img src="file://{plot_path}" class="plot-image" />
                        <p class="plot-caption">{plot['description']}</p>
                    </div>
                    """
            
            html += '</div>'
    
    html += """
    </body>
    </html>
    """
    
    return html


def html_to_pdf(job_id: str, report_text: str, plots: List[Dict], output_path: str) -> str:
    """Convertit HTML en PDF"""
    html_content = generate_html_report(job_id, report_text, plots)
    HTML(string=html_content).write_pdf(output_path)
    return output_path
```

---

### Option 3: Markdown → PDF (avec mdpdf ou pandoc)

**Le plus simple pour le texte**, mais moins de contrôle sur le layout.

```python
import markdown
from weasyprint import HTML

def markdown_to_pdf(markdown_text: str, plots: List[Dict], output_path: str):
    # Convertir markdown en HTML
    html = markdown.markdown(markdown_text)
    
    # Ajouter les images
    for plot in plots:
        html += f"""
        <h3>{plot['title']}</h3>
        <img src="file://{plot_path}" style="max-width: 100%;" />
        <p><em>{plot['description']}</em></p>
        """
    
    HTML(string=html).write_pdf(output_path)
```

---

## 🔧 Intégration dans le Workflow

### 1. Modifier `workflows/run_final.py`

```python
def run_final(...):
    # ... code existant ...
    
    # À la fin, après avoir généré tous les plots
    from backend.app.services.pdf_generator import create_report_with_visualizations
    
    # Générer le rapport PDF avec visualisations
    pdf_path = create_report_with_visualizations(job_id)
    print(f"[FINAL] PDF report generated: {pdf_path}")
    
    return results
```

### 2. Ou via l'API lors de la génération du rapport

```python
# backend/app/api/clustering.py

@router.post("/report/{job_id}/generate")
async def generate_report_with_plots(job_id: str):
    """Génère un rapport texte + PDF avec plots"""
    
    # 1. Générer le texte du rapport (via LLM)
    from app.services.report_generator import generate_text_report
    report_text = await generate_text_report(job_id)
    
    # 2. Scanner les plots
    results_base = f"/app/results/jobs/{job_id}"
    plots = _scan_plots(results_base)
    
    # 3. Générer le PDF
    from app.services.pdf_generator import generate_clustering_report_pdf
    pdf_path = f"{results_base}/rapport_complet.pdf"
    generate_clustering_report_pdf(job_id, report_text, plots, pdf_path)
    
    return {
        "report_text": report_text,
        "pdf_url": f"/api/clustering/report/{job_id}/pdf",
        "plots_count": len(plots)
    }
```

---

## 📊 Tests

```bash
# 1. Lancer un clustering
curl -X POST http://localhost:8000/api/clustering/run \
  -H "Content-Type: application/json" \
  -d '{"feature_mode": "domain_rollup"}'

# 2. Attendre qu'il se termine

# 3. Générer le rapport PDF
curl -X POST http://localhost:8000/api/clustering/report/{job_id}/generate

# 4. Télécharger le PDF
curl http://localhost:8000/api/clustering/report/{job_id}/pdf \
  -o rapport.pdf

# 5. Ouvrir
open rapport.pdf
```

---

## 📝 Checklist d'implémentation

- [ ] Choisir une bibliothèque (ReportLab ou WeasyPrint)
- [ ] Ajouter au `requirements.txt`
- [ ] Créer `backend/app/services/pdf_generator.py`
- [ ] Implémenter `generate_clustering_report_pdf()`
- [ ] Ajouter endpoint `/report/{job_id}/pdf`
- [ ] Tester avec un vrai clustering
- [ ] Ajuster le style/layout
- [ ] Intégrer dans le frontend (bouton "Télécharger PDF")

---

## 💡 Recommandation

**Pour ce projet, je recommande WeasyPrint** car:
- ✅ Facile à styliser avec CSS
- ✅ Bon support des images
- ✅ Résultat professionnel
- ✅ Open source et bien maintenu

Le layout HTML/CSS est plus flexible et plus facile à maintenir que ReportLab.

---

**Fichiers à créer:**
1. `backend/app/services/pdf_generator.py` (ou `html_pdf_generator.py`)
2. Template HTML optionnel dans `backend/app/templates/report_template.html`
3. Ajouter l'endpoint dans `backend/app/api/clustering.py`
