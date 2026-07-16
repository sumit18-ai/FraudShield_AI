import shap

explainer = None

def init_explainer(model):
    global explainer
    try:
        xgb_model = model.named_estimators_['xgb']
        explainer = shap.TreeExplainer(xgb_model)
        print("Explainer loaded successfully.")
    except Exception as e:
        print(f"Error loading explainer: {e}")

def get_explanations(scaled_data, feature_names):
    if explainer is None:
        return []
    
    shap_values = explainer.shap_values(scaled_data)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]
        
    impacts = dict(zip(feature_names, shap_values[0]))
    sorted_impacts = sorted(impacts.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
    total_abs_impact = sum(abs(v) for v in impacts.values())
    
    explanations = []
    for feature, impact in sorted_impacts:
        pct = (abs(impact) / total_abs_impact) * 100 if total_abs_impact > 0 else 0
        direction = "increased" if impact > 0 else "decreased"
        explanations.append({
            "feature": feature,
            "impact": direction,
            "percentage": f"{pct:.1f}%",
            "reason": f"{feature} {direction} the risk by {pct:.1f}%"
        })
    return explanations
