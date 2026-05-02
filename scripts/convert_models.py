"""
Goat Master - Model Conversion Script
-------------------------------------
Use this script to convert your fine-tuned Keras/TensorFlow models
into TF.js format for deployment in the /public/models directory.

Requirements:
    pip install tensorflowjs coremltools onnx onnx2tf
"""

import os
import tensorflowjs as tfjs
import tensorflow as tf

def convert_h5_to_tfjs(h5_path, output_dir):
    """Converts a standard Keras .h5 model to TF.js format."""
    print(f"--- Converting {h5_path} to TF.js ---")
    model = tf.keras.models.load_model(h5_path)
    tfjs.converters.save_keras_model(model, output_dir)
    print(f"✓ Saved to {output_dir}")

def convert_onnx_to_tfjs(onnx_path, output_dir):
    """
    Converts an ONNX model (e.g. from PyTorch ArcFace) to TF.js.
    First converts ONNX -> SavedModel, then SavedModel -> TF.js.
    """
    import onnx
    from onnx_tf.backend import prepare

    print(f"--- Converting {onnx_path} to TF.js ---")
    onnx_model = onnx.load(onnx_path)
    tf_rep = prepare(onnx_model)
    
    saved_model_path = "temp_saved_model"
    tf_rep.export_graph(saved_model_path)
    
    tfjs.converters.convert_tf_saved_model(saved_model_path, output_dir)
    print(f"✓ Saved to {output_dir}")

if __name__ == "__main__":
    # Example usage:
    # convert_h5_to_tfjs("models/breed_classifier.h5", "public/models/breed")
    # convert_onnx_to_tfjs("models/reid_arcface.onnx", "public/models/reid")
    print("Please uncomment the examples in convert_models.py to run conversions.")
