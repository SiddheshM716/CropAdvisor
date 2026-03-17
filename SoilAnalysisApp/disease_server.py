import os
import numpy as np
import cv2
import base64
import tensorflow as tf
from flask import Flask, jsonify, request

# ── Load the model once at startup ──────────────────────────────────────────
MODEL_PATH = 'plant_disease_model_with_unknown_class.h5'
IMG_SIZE   = 224

model = tf.keras.models.load_model(MODEL_PATH, compile=False)

# Class labels – sorted exactly as during training (PlantVillage convention)
# 15 disease classes + 1 unknown class (appended last during training)
CATEGORIES = [
    'Pepper__bell___Bacterial_spot',
    'Pepper__bell___healthy',
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy',
    'Tomato_Bacterial_spot',
    'Tomato_Early_blight',
    'Tomato_Late_blight',
    'Tomato_Leaf_Mold',
    'Tomato_Septoria_leaf_spot',
    'Tomato_Spider_mites_Two_spotted_spider_mite',
    'Tomato__Target_Spot',
    'Tomato__Tomato_YellowLeaf__Curl_Virus',
    'Tomato__Tomato_mosaic_virus',
    'Tomato_healthy',
    'Unknown',
]

TREATMENTS = {
    'Pepper__bell___Bacterial_spot':
        'Apply copper-based bactericides and practice crop rotation. '
        'Remove and destroy infected plants. Avoid overhead watering.',
    'Pepper__bell___healthy':
        'Your pepper plant is healthy! Continue regular maintenance and monitoring.',
    'Potato___Early_blight':
        'Apply fungicides containing chlorothalonil or mancozeb. '
        'Practice crop rotation and remove infected leaves. '
        'Ensure proper spacing for air circulation.',
    'Potato___Late_blight':
        'Apply fungicides with chlorothalonil or mancozeb. '
        'Remove and destroy infected plants. Avoid overhead watering.',
    'Potato___healthy':
        'Your potato plant is healthy! Continue regular maintenance and monitoring.',
    'Tomato_Bacterial_spot':
        'Apply copper-based bactericides. '
        'Remove infected leaves and avoid overhead watering. Practice crop rotation.',
    'Tomato_Early_blight':
        'Apply fungicides containing chlorothalonil or mancozeb. '
        'Remove infected leaves and maintain proper plant spacing.',
    'Tomato_Late_blight':
        'Apply fungicides with chlorothalonil or mancozeb. '
        'Remove and destroy infected plants. Avoid overhead watering.',
    'Tomato_Leaf_Mold':
        'Apply fungicides containing chlorothalonil or mancozeb. '
        'Improve air circulation and reduce humidity. Remove infected leaves.',
    'Tomato_Septoria_leaf_spot':
        'Apply fungicides containing chlorothalonil or mancozeb. '
        'Remove infected leaves and avoid overhead watering.',
    'Tomato_Spider_mites_Two_spotted_spider_mite':
        'Apply miticides or insecticidal soaps. '
        'Increase humidity and use predatory mites. Remove heavily infested leaves.',
    'Tomato__Target_Spot':
        'Apply fungicides containing chlorothalonil or mancozeb. '
        'Remove infected leaves and maintain proper plant spacing.',
    'Tomato__Tomato_YellowLeaf__Curl_Virus':
        'Remove and destroy infected plants. '
        'Control whitefly populations using insecticides or sticky traps. '
        'Use virus-resistant varieties.',
    'Tomato__Tomato_mosaic_virus':
        'Remove and destroy infected plants. '
        'Control aphid populations. Use virus-resistant varieties and practice good sanitation.',
    'Tomato_healthy':
        'Your tomato plant is healthy! Continue regular maintenance and monitoring.',
    'Unknown':
        'Unable to identify the disease. Please try with a clearer, well-lit image of the affected leaf.',
}

def calculate_severity(img_rgb, label):
    """Estimate disease severity from colour analysis."""
    if 'healthy' in label.lower() or label.lower() == 'unknown':
        return 0.0, 'N/A'

    hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV)
    masks = [
        cv2.inRange(hsv, (20, 50, 50),  (30, 255, 255)),   # yellow
        cv2.inRange(hsv, (10, 50, 50),  (20, 255, 255)),   # brown
        cv2.inRange(hsv, (0,  0,  0),   (180, 255, 30)),   # black / dark
    ]
    affected = sum(int(np.sum(m > 0)) for m in masks)
    total    = img_rgb.shape[0] * img_rgb.shape[1]
    pct      = round(affected / total * 100, 2)

    if   pct < 5:  level = 'Very Low'
    elif pct < 15: level = 'Low'
    elif pct < 30: level = 'Moderate'
    elif pct < 50: level = 'High'
    else:          level = 'Very High'
    return pct, level

# ── Flask app ────────────────────────────────────────────────────────────────
app = Flask(__name__)

@app.route('/')
def home():
    return 'Plant Disease Detection Service is running.'

@app.route('/predict_disease', methods=['POST'])
def predict_disease():
    try:
        encoded = request.form.get('inputImage')
        if not encoded:
            return jsonify({'error': 'No image provided'}), 400

        # Decode base64 → OpenCV image
        nparr     = np.frombuffer(base64.b64decode(encoded), np.uint8)
        img_bgr   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        img_rgb   = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        # Preprocess exactly as during training
        img_resized = cv2.resize(img_rgb, (IMG_SIZE, IMG_SIZE))
        img_array   = np.expand_dims(img_resized, axis=0) / 255.0

        # Predict
        preds      = model.predict(img_array, verbose=0)
        idx        = int(np.argmax(preds[0]))
        confidence = round(float(preds[0][idx]) * 100, 2)
        label      = CATEGORIES[idx] if idx < len(CATEGORIES) else 'Unknown'

        severity_pct, severity_level = calculate_severity(img_rgb, label)
        treatment = TREATMENTS.get(label, 'No specific treatment available.')

        return jsonify({
            'label':          label,
            'confidence':     confidence,
            'severity':       severity_pct,
            'severity_level': severity_level,
            'treatment':      treatment,
        })

    except Exception as e:
        print(f'Error: {e}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True, use_reloader=False)
