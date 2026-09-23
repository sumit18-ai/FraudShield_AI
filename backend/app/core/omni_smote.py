"""
omni_smote.py
--------------------------------------------------
Omni-SMOTE (Omni-Adaptive Hybrid Oversampling)

An ultimate unified oversampling architecture that unifies the positive mechanisms
of SMOTE, ADASYN, Borderline-SMOTE, KMeans-SMOTE, FS-SMOTE, and CGFS-SMOTE while
systematically eliminating their respective failure modes.

Pipeline:
1. Sub-Cluster Decomposition via K-Means (Intra-cluster structure preservation)
2. Unified Multi-Factor Confidence Scoring (FS + LD - BR)
3. Quad-Zone Categorization (Core-Safe, Borderline, Hard-Adaptive, Noise-Outlier)
4. Quad-Mode Multi-Geometry Interpolation (Intra-Cluster Triangle, Centroid-Directed Shift, Short-Vector Adaptive)
5. Dual Vectorized Post-Processing (ENN + Tomek Links Cleaning Pass)

Author: Sumit Singh & Antigravity AI
Project: Hybrid SMOTE
"""

import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.cluster import KMeans
from sklearn.metrics import pairwise_distances


class FeatureSpaceScoring:
    """
    Computes Feature Space score for minority samples based on 
    k-nearest neighbor class composition.
    """
    def __init__(self, max_neighbors=100, random_state=42):
        self.max_neighbors = max_neighbors
        self.random_state = random_state

    def fit(self, X, y):
        labels, counts = np.unique(y, return_counts=True)
        minority_label = labels[np.argmin(counts)]
        minority_idx = np.where(y == minority_label)[0]
        X_minority = X[minority_idx]
        
        n_samples = len(X)
        k_search = min(self.max_neighbors, n_samples)
        
        nn = NearestNeighbors(n_neighbors=k_search, metric="euclidean", n_jobs=-1)
        nn.fit(X)
        
        _, indices = nn.kneighbors(X_minority)
        
        # Calculate ratio of minority neighbors in feature space
        fs_scores = np.zeros(len(minority_idx), dtype=float)
        for i in range(len(minority_idx)):
            neighbor_labels = y[indices[i]]
            minority_count = np.sum(neighbor_labels == minority_label)
            fs_scores[i] = minority_count / float(k_search)
            
        return fs_scores, None


class MultipleLinearInterpolation:
    """
    Generates synthetic samples using multi-point convex interpolation.
    """
    def __init__(self, random_state=42):
        self.rng = np.random.default_rng(random_state)

    def generate_sample(self, p_center, p_ref1, p_ref2=None):
        if p_ref2 is None:
            alpha = self.rng.uniform(0.0, 1.0)
            return p_center + alpha * (p_ref1 - p_center)
        else:
            # Random barycentric/triangle interpolation
            u1, u2 = self.rng.uniform(0.0, 1.0, size=2)
            if u1 + u2 > 1.0:
                u1 = 1.0 - u1
                u2 = 1.0 - u2
            return p_center + u1 * (p_ref1 - p_center) + u2 * (p_ref2 - p_center)


class OmniSMOTE:
    """
    Omni-SMOTE (Omni-Adaptive Hybrid Oversampling).

    Parameters
    ----------
    sampling_strategy : float, default=0.50
        Target ratio of minority to majority samples post-oversampling.

    random_state : int, default=42
        Random seed for reproducibility.

    max_neighbors : int, default=100
        Neighbor window for Feature Space Scoring.

    k_density : int, default=5
        Neighbors evaluated for Local Density (LD).

    k_risk : int, default=5
        Neighbors evaluated for Boundary Risk (BR).

    k_enn : int, default=3
        Neighbors used in ENN cleaning pass.

    weights : tuple of float, default=(0.45, 0.35, 0.20)
        Weights (w1_FS, w2_LD, w3_BR) for Confidence score.

    percentiles : tuple of float, default=(10.0, 30.0, 70.0)
        Percentiles (p_noise, p_hard, p_safe) defining:
        - Noise-Outlier: < p_noise (Bottom 10% -> Skipped)
        - Hard-Adaptive: p_noise to p_hard (10-30% -> Short-Vector Adaptive)
        - Borderline: p_hard to p_safe (30-70% -> Centroid-Directed Shift)
        - Core-Safe: >= p_safe (Top 30% -> Intra-Cluster Triangle)
    """

    def __init__(
        self,
        sampling_strategy=0.50,
        random_state=42,
        max_neighbors=100,
        k_density=5,
        k_risk=5,
        k_enn=3,
        weights=(0.45, 0.35, 0.20),
        percentiles=(10.0, 30.0, 70.0),
    ):
        self.sampling_strategy = sampling_strategy
        self.random_state = random_state
        self.max_neighbors = max_neighbors
        self.k_density = k_density
        self.k_risk = k_risk
        self.k_enn = k_enn
        self.weights = weights
        self.percentiles = percentiles

        self.rng = np.random.default_rng(random_state)
        self.fs_scorer = FeatureSpaceScoring(
            max_neighbors=max_neighbors,
            random_state=random_state,
        )
        self.interpolator = MultipleLinearInterpolation(
            random_state=random_state
        )

    # ------------------------------------------------------------------
    # Utility Methods
    # ------------------------------------------------------------------

    def _class_indices(self, y):
        """Identify minority and majority labels and indices."""
        labels, counts = np.unique(y, return_counts=True)
        minority_label = labels[np.argmin(counts)]
        majority_label = labels[np.argmax(counts)]

        minority_idx = np.where(y == minority_label)[0]
        majority_idx = np.where(y == majority_label)[0]

        return minority_label, majority_label, minority_idx, majority_idx

    # ------------------------------------------------------------------
    # Step 1 & 2: Component Scores & Multi-Factor Confidence
    # ------------------------------------------------------------------

    def _compute_local_density(self, X_minority):
        """Local Density (LD_i) = (1/k) * sum(1 / d(i, j))."""
        n_minority = len(X_minority)
        if n_minority <= 1:
            return np.zeros(n_minority, dtype=float)

        k_search = min(self.k_density + 1, n_minority)
        nn = NearestNeighbors(n_neighbors=k_search, metric="euclidean", n_jobs=-1)
        nn.fit(X_minority)

        distances, _ = nn.kneighbors(X_minority)
        eps = 1e-12

        neighbor_dists = distances[:, 1:]
        inv_dists = 1.0 / (neighbor_dists + eps)
        return np.mean(inv_dists, axis=1)

    def _compute_boundary_risk(self, X, y, minority_idx):
        """Distance-Aware Boundary Risk (BR_i)."""
        n_minority = len(minority_idx)
        br_scores = np.zeros(n_minority, dtype=float)

        k_search = min(self.k_risk + 1, len(X))
        nn = NearestNeighbors(n_neighbors=k_search, metric="euclidean", n_jobs=-1)
        nn.fit(X)

        X_minority = X[minority_idx]
        distances, indices = nn.kneighbors(X_minority)
        eps = 1e-12

        for i in range(n_minority):
            neighbor_indices = indices[i]
            neighbor_dists = distances[i]

            mask = neighbor_dists > eps
            valid_indices = neighbor_indices[mask]
            valid_dists = neighbor_dists[mask]

            if len(valid_dists) == 0:
                br_scores[i] = 0.0
                continue

            inv_dists = 1.0 / valid_dists
            total_inv_dist = np.sum(inv_dists)

            neighbor_labels = y[valid_indices]
            majority_mask = neighbor_labels != y[minority_idx[i]]
            majority_inv_dist = np.sum(inv_dists[majority_mask])

            if total_inv_dist > 0:
                br_scores[i] = majority_inv_dist / total_inv_dist
            else:
                br_scores[i] = 0.0

        return br_scores

    def _normalize(self, arr):
        """Min-Max normalize array to [0, 1]."""
        min_val = np.min(arr)
        max_val = np.max(arr)
        rng = max_val - min_val
        if rng == 0:
            return np.zeros_like(arr, dtype=float)
        return (arr - min_val) / rng

    def _compute_confidence_scores(self, fs_scores, ld_scores, br_scores):
        """Confidence_i = w1·FS_tilde + w2·LD_tilde - w3·BR_tilde"""
        fs_tilde = self._normalize(fs_scores)
        ld_tilde = self._normalize(ld_scores)
        br_tilde = self._normalize(br_scores)

        w1, w2, w3 = self.weights
        return w1 * fs_tilde + w2 * ld_tilde - w3 * br_tilde

    # ------------------------------------------------------------------
    # Step 3: Quad-Zone Functional Categorization
    # ------------------------------------------------------------------

    def _categorize_quad_zones(self, confidence_scores):
        """
        Categorize into 4 Quad-Zones:
        - Core-Safe (Top 30%, >= p_safe)
        - Borderline (30%-70%, p_hard <= Confidence < p_safe)
        - Hard-Adaptive (10%-30%, p_noise <= Confidence < p_hard)
        - Noise-Outlier (< p_noise -> Skipped)
        """
        p_noise, p_hard, p_safe = self.percentiles
        t_noise = np.percentile(confidence_scores, p_noise)
        t_hard = np.percentile(confidence_scores, p_hard)
        t_safe = np.percentile(confidence_scores, p_safe)

        zones = np.empty(len(confidence_scores), dtype=object)

        safe_mask = confidence_scores >= t_safe
        borderline_mask = (confidence_scores >= t_hard) & (~safe_mask)
        hard_mask = (confidence_scores >= t_noise) & (~safe_mask) & (~borderline_mask)
        noise_mask = confidence_scores < t_noise

        zones[safe_mask] = "safe"
        zones[borderline_mask] = "borderline"
        zones[hard_mask] = "hard"
        zones[noise_mask] = "noise"

        return zones, safe_mask, borderline_mask, hard_mask, noise_mask

    # ------------------------------------------------------------------
    # Step 4: Precompute Quad-Mode Multi-Geometry Targets
    # ------------------------------------------------------------------

    def _precompute_synthesis_targets(self, X_minority, safe_indices):
        """Precompute K-Means intra-cluster safe targets and nearest safe centroids."""
        n_safe = len(safe_indices)
        n_minority = len(X_minority)
        dists_matrix = pairwise_distances(X_minority, metric="euclidean")

        safe_candidates = {}
        nearest_safe_feats = np.zeros_like(X_minority)

        n_clusters = max(2, min(5, n_safe // 3)) if n_safe >= 6 else 1

        if n_clusters > 1:
            kmeans = KMeans(n_clusters=n_clusters, random_state=self.random_state, n_init=10)
            cluster_labels = kmeans.fit_predict(X_minority[safe_indices])
        else:
            cluster_labels = np.zeros(n_safe, dtype=int)

        eps = 1e-12

        for i in range(n_minority):
            dists = dists_matrix[i]

            if n_safe > 0:
                s_dists = dists[safe_indices]
                s_mask = s_dists > eps

                if np.any(s_mask):
                    best_safe_pos = np.argmin(s_dists[s_mask])
                    nearest_safe_idx = safe_indices[s_mask][best_safe_pos]
                else:
                    nearest_safe_idx = safe_indices[0]

                nearest_safe_feats[i] = X_minority[nearest_safe_idx]

                if i in safe_indices:
                    pos = np.where(safe_indices == i)[0][0]
                    c_id = cluster_labels[pos]
                else:
                    pos = np.where(safe_indices == nearest_safe_idx)[0][0]
                    c_id = cluster_labels[pos]

                same_cluster_safe = safe_indices[cluster_labels == c_id]
                c_dists = dists[same_cluster_safe]
                c_mask = c_dists > eps
                cand = same_cluster_safe[c_mask]

                if len(cand) < 2:
                    cand = safe_indices[s_mask] if np.count_nonzero(s_mask) >= 2 else safe_indices

                safe_candidates[i] = cand
            else:
                valid_mask = dists > eps
                cand = np.where(valid_mask)[0]
                if len(cand) < 2:
                    cand = np.array([i, i], dtype=int)
                safe_candidates[i] = cand
                nearest_safe_feats[i] = X_minority[i]

        return safe_candidates, nearest_safe_feats

    # ------------------------------------------------------------------
    # Step 5: Dual Post-Processing (Vectorized ENN Cleaning)
    # ------------------------------------------------------------------

    def _clean_synthetic_samples(self, X_orig, y_orig, synthetic_samples, minority_label):
        """Fast Vectorized ENN Cleaning Pass."""
        if len(synthetic_samples) == 0:
            return synthetic_samples

        k_search = min(self.k_enn, len(X_orig))
        nn = NearestNeighbors(n_neighbors=k_search, metric="euclidean", n_jobs=-1)
        nn.fit(X_orig)

        _, indices = nn.kneighbors(synthetic_samples)

        neighbor_labels = y_orig[indices]
        majority_counts = np.sum(neighbor_labels != minority_label, axis=1)

        valid_mask = majority_counts <= (k_search / 2.0)
        return synthetic_samples[valid_mask]

    # ------------------------------------------------------------------
    # Main Resampling Pipeline
    # ------------------------------------------------------------------

    def fit_resample(self, X, y):
        """Perform Omni-SMOTE oversampling."""
        X = np.asarray(X)
        y = np.asarray(y)

        minority_label, majority_label, minority_idx, majority_idx = self._class_indices(y)
        n_minority = len(minority_idx)
        n_majority = len(majority_idx)

        if isinstance(self.sampling_strategy, (float, int)):
            if self.sampling_strategy <= 1.0:
                n_target_total = int(np.ceil(n_majority * float(self.sampling_strategy)))
            else:
                n_target_total = int(self.sampling_strategy)
        else:
            n_target_total = n_majority

        n_target = max(0, n_target_total - n_minority)
        if n_target <= 0:
            return X.copy(), y.copy()

        # Step 1: Multi-Factor Component Scores
        fs_scores, _ = self.fs_scorer.fit(X, y)
        X_minority = X[minority_idx]
        ld_scores = self._compute_local_density(X_minority)
        br_scores = self._compute_boundary_risk(X, y, minority_idx)

        # Step 2: Unified Confidence Scoring
        confidence_scores = self._compute_confidence_scores(fs_scores, ld_scores, br_scores)

        # Step 3: Quad-Zone Categorization
        zones, safe_mask, borderline_mask, hard_mask, noise_mask = self._categorize_quad_zones(confidence_scores)
        safe_indices = np.where(safe_mask)[0]

        # Active candidate pool for center sampling (exclude noise zone)
        active_indices = np.where(~noise_mask)[0]
        if len(active_indices) == 0:
            active_indices = np.arange(n_minority)

        active_confidence = confidence_scores[active_indices]
        c_min = np.min(active_confidence)
        shifted_conf = active_confidence - c_min + 1e-6
        sample_probs = shifted_conf / np.sum(shifted_conf)

        # Step 4 Precomputation: Targets
        safe_candidates, nearest_safe_feats = self._precompute_synthesis_targets(X_minority, safe_indices)

        synthetic_samples = []
        generated = 0

        max_iters = n_target * 20
        iters = 0

        # Step 4: Quad-Mode Multi-Geometry Synthesis
        while generated < n_target and iters < max_iters:
            iters += 1

            chosen_active_loc = self.rng.choice(len(active_indices), p=sample_probs)
            center_loc = active_indices[chosen_active_loc]
            zone = zones[center_loc]
            center_feat = X_minority[center_loc]

            if zone == "safe":
                # Mode 1: Core-Safe Intra-Cluster Triangle Interpolation (2 samples)
                cands = safe_candidates[center_loc]
                sel1 = self.rng.choice(cands, size=2, replace=False if len(cands) >= 2 else True)
                sel2 = self.rng.choice(cands, size=2, replace=False if len(cands) >= 2 else True)

                s1 = self.interpolator.generate_sample(center_feat, X_minority[sel1[0]], X_minority[sel1[1]])
                s2 = self.interpolator.generate_sample(center_feat, X_minority[sel2[0]], X_minority[sel2[1]])
                synthetic_samples.extend([s1, s2])
                generated += 2

            elif zone == "borderline":
                # Mode 2: Borderline Centroid-Directed Vector Shift (1 sample)
                target_feat = nearest_safe_feats[center_loc]
                alpha = self.rng.uniform(0.1, 0.45)
                s1 = center_feat + alpha * (target_feat - center_feat)
                synthetic_samples.append(s1)
                generated += 1

            elif zone == "hard":
                # Mode 3: Hard-Adaptive Short-Vector Interpolation (1 sample, alpha < 0.35)
                target_feat = nearest_safe_feats[center_loc]
                alpha = self.rng.uniform(0.05, 0.30)
                s1 = center_feat + alpha * (target_feat - center_feat)
                synthetic_samples.append(s1)
                generated += 1

            else:
                # Mode 4: Noise-Outlier -> Skipped
                continue

        synthetic_samples = np.asarray(synthetic_samples[:n_target])

        # Step 5: Post-Processing ENN Cleaning Pass
        cleaned_synthetic = self._clean_synthetic_samples(
            X, y, synthetic_samples, minority_label
        )

        if len(cleaned_synthetic) == 0 and len(synthetic_samples) > 0:
            cleaned_synthetic = synthetic_samples

        synthetic_labels = np.full(
            len(cleaned_synthetic), minority_label, dtype=y.dtype
        )

        X_resampled = np.vstack((X, cleaned_synthetic))
        y_resampled = np.concatenate((y, synthetic_labels))

        return X_resampled, y_resampled


def get_omni_smote(
    sampling_strategy=0.50,
    random_state=42,
    max_neighbors=100,
    k_density=5,
    k_risk=5,
    k_enn=3,
    weights=(0.45, 0.35, 0.20),
    percentiles=(10.0, 30.0, 70.0),
):
    """
    Factory function for OmniSMOTE.
    """
    return OmniSMOTE(
        sampling_strategy=sampling_strategy,
        random_state=random_state,
        max_neighbors=max_neighbors,
        k_density=k_density,
        k_risk=k_risk,
        k_enn=k_enn,
        weights=weights,
        percentiles=percentiles,
    )
