"""
Matrix construction for patient × medical code representation.
Handles sparse data efficiently using scipy.sparse matrices.
Supports dynamic weights and demographic data inclusion.
"""

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix, lil_matrix, hstack
from sklearn.preprocessing import MinMaxScaler
from typing import List, Tuple, Dict, Optional, Set, Union
from .data_structures import PatientRecord, MedicalCode, CodeSystem

class PatientCodeMatrix:
    """
    Builds and manages patient × medical code matrices.
    Uses sparse matrices for efficient storage and computation.
    """
    
    def __init__(self, 
                 patients: List[PatientRecord], 
                 include_systems: Optional[List[CodeSystem]] = None,
                 include_demographics: bool = True,
                 age_weight: float = 2.0,
                 gender_weight: float = 1.0):
        """
        Initialize matrix builder.
        
        Args:
            patients: List of patient records
            include_systems: List of code systems to include (default: all)
            include_demographics: Whether to add age and gender features
            age_weight: Weight multiplier for the age feature
            gender_weight: Weight multiplier for the gender feature
        """
        self.patients = patients
        self.include_systems = include_systems or [CodeSystem.SNOMED, CodeSystem.LOINC, CodeSystem.RXNORM]
        self.include_demographics = include_demographics
        self.age_weight = age_weight
        self.gender_weight = gender_weight
        
        # Mappings
        self.patient_id_to_idx: Dict[str, int] = {}
        self.idx_to_patient_id: Dict[int, str] = {}
        
        self.code_to_idx: Dict[str, int] = {}
        # Stores either MedicalCode objects or string feature names (like "DEMO_AGE")
        self.idx_to_code: Dict[int, Union[MedicalCode, str]] = {}
        
        # The matrix
        self.matrix: Optional[csr_matrix] = None
        
    def build_matrix(self) -> csr_matrix:
        """
        Build the patient × code sparse matrix, including demographic features if requested.
        
        Returns:
            Sparse matrix (CSR format) of shape (n_patients, n_features)
        """
        # Build patient index mapping
        for idx, patient in enumerate(self.patients):
            self.patient_id_to_idx[patient.patient_id] = idx
            self.idx_to_patient_id[idx] = patient.patient_id
        
        # Collect all unique codes across patients
        all_codes: Set[MedicalCode] = set()
        for patient in self.patients:
            for code in patient.codes:
                if code.system in self.include_systems:
                    all_codes.add(code)
        
        # Build code index mapping
        sorted_codes = sorted(all_codes, key=lambda c: str(c))
        for idx, code in enumerate(sorted_codes):
            code_key = str(code)
            self.code_to_idx[code_key] = idx
            self.idx_to_code[idx] = code
        
        n_patients = len(self.patients)
        n_codes = len(self.code_to_idx)
        
        # Build sparse matrix using LIL format for efficient construction
        # We use float32 to support code weights (1.5, 0.8...)
        matrix_lil = lil_matrix((n_patients, n_codes), dtype=np.float32)
        
        # Fill matrix with code counts/weights
        for patient_idx, patient in enumerate(self.patients):
            # Sum up weights for identical codes (if same code appears multiple times)
            code_weights: Dict[str, float] = {}
            for code in patient.codes:
                if code.system in self.include_systems:
                    code_key = str(code)
                    # We add the individual code weight
                    code_weights[code_key] = code_weights.get(code_key, 0.0) + code.weight
            
            for code_key, weight_sum in code_weights.items():
                code_idx = self.code_to_idx[code_key]
                matrix_lil[patient_idx, code_idx] = weight_sum
        
        code_matrix_csr = matrix_lil.tocsr()
        
        # Include demographics if requested
        if self.include_demographics:
            ages = []
            genders = []
            for p in self.patients:
                # Default age if unknown: 50. Default gender: 0 (Unknown/Other)
                ages.append(p.age if p.age is not None else 50.0)
                
                # Encode gender (0: other/unknown, 1: male, 2: female)
                g_val = 0
                if p.gender:
                    g_str = p.gender.lower()
                    if g_str == "male":
                        g_val = 1
                    elif g_str == "female":
                        g_val = 2
                genders.append(g_val)
                
            ages_arr = np.array(ages).reshape(-1, 1)
            genders_arr = np.array(genders).reshape(-1, 1)
            
            # Normalize Age to [0, 1] to avoid dominating TF-IDF scores
            scaler = MinMaxScaler()
            ages_norm = scaler.fit_transform(ages_arr)
            
            # Apply dynamic weights
            ages_final = ages_norm * self.age_weight
            genders_final = genders_arr * self.gender_weight
            
            # Create a dense matrix for demographics then convert to sparse
            demo_matrix = csr_matrix(np.hstack([ages_final, genders_final]))
            
            # Horizontally stack code matrix and demo matrix
            self.matrix = hstack([code_matrix_csr, demo_matrix]).tocsr()
            
            # Update feature names mapping
            idx_age = n_codes
            idx_gender = n_codes + 1
            
            self.code_to_idx["DEMO_AGE"] = idx_age
            self.idx_to_code[idx_age] = "DEMO_AGE"
            
            self.code_to_idx["DEMO_GENDER"] = idx_gender
            self.idx_to_code[idx_gender] = "DEMO_GENDER"
            
        else:
            self.matrix = code_matrix_csr
            
        return self.matrix
    
    def get_matrix(self) -> csr_matrix:
        """Get the built matrix."""
        if self.matrix is None:
            raise ValueError("Matrix not built yet. Call build_matrix() first.")
        return self.matrix
    
    def get_patient_vector(self, patient_id: str) -> np.ndarray:
        """Get the code vector for a specific patient."""
        if self.matrix is None:
            raise ValueError("Matrix not built yet. Call build_matrix() first.")
        patient_idx = self.patient_id_to_idx.get(patient_id)
        if patient_idx is None:
            raise ValueError(f"Patient {patient_id} not found")
        return self.matrix[patient_idx].toarray().ravel()
    
    def get_code_name(self, code_idx: int) -> str:
        """Get the code name for a given index."""
        obj = self.idx_to_code.get(code_idx)
        if obj is None:
            raise ValueError(f"Code index {code_idx} not found")
        return str(obj)

    def get_feature_names(self) -> List[str]:
        """
        Returns the list of feature names (codes + demographics) ordered by column index.
        Required for generating interpretation Biplots.
        """
        names = []
        max_idx = max(self.idx_to_code.keys()) if self.idx_to_code else -1
        
        for i in range(max_idx + 1):
            obj = self.idx_to_code.get(i, f"Unknown_{i}")
            names.append(str(obj))
        return names
    
    def get_patient_id(self, patient_idx: int) -> str:
        """Get patient ID for a given index."""
        return self.idx_to_patient_id.get(patient_idx, f"Unknown_{patient_idx}")
    
    def to_dataframe(self) -> pd.DataFrame:
        """Convert matrix to dense DataFrame (use with caution for large matrices)."""
        if self.matrix is None:
            raise ValueError("Matrix not built yet. Call build_matrix() first.")
        
        df = pd.DataFrame(
            self.matrix.toarray(),
            index=[self.idx_to_patient_id[i] for i in range(len(self.patients))],
            columns=[str(self.idx_to_code[i]) for i in range(len(self.idx_to_code))]
        )
        return df
    
    def get_matrix_stats(self) -> Dict[str, any]:
        """Get statistics about the matrix."""
        if self.matrix is None:
            raise ValueError("Matrix not built yet. Call build_matrix() first.")
        
        n_patients, n_features = self.matrix.shape
        n_nonzero = self.matrix.nnz
        sparsity = 1 - (n_nonzero / (n_patients * n_features)) if n_patients * n_features > 0 else 0
        
        return {
            'n_patients': n_patients,
            'n_features': n_features,
            'n_nonzero_entries': n_nonzero,
            'sparsity': sparsity,
            'avg_features_per_patient': n_nonzero / n_patients if n_patients > 0 else 0,
        }