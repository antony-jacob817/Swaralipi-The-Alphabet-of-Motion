import tensorflow as tf

def create_model():
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(30, 126)),
        tf.keras.layers.Masking(mask_value=0.0),

        tf.keras.layers.Bidirectional(
            tf.keras.layers.LSTM(64, return_sequences=True)
        ),
        tf.keras.layers.Bidirectional(
            tf.keras.layers.LSTM(64)
        ),

        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dropout(0.4),
        tf.keras.layers.Dense(66, activation='softmax')
    ])
    return model


model = create_model()

# load weights from your original file
model.load_weights("models/final.keras")

print("✅ Model loaded successfully")

# 🔥 ADD THESE LINES HERE
model.save("models/final_fixed.h5")
model.save_weights("models/final.weights.h5")

print("✅ Model re-saved safely")