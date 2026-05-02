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
    Uses onnx2tf for high-fidelity conversion to SavedModel first.
    """
    import onnx2tf
    import shutil

    print(f"--- Converting {onnx_path} to TF.js ---")
    
    saved_model_path = "temp_saved_model"
    if os.path.exists(saved_model_path):
        shutil.rmtree(saved_model_path)

    # Convert ONNX -> SavedModel
    # not_use_onnxsim=True avoids build issues with onnxsim on some systems
    onnx2tf.convert(
        input_onnx_file_path=onnx_path,
        output_folder_path=saved_model_path,
        not_use_onnxsim=True
    )
    
    # Convert SavedModel -> TF.js
    tfjs.converters.convert_tf_saved_model(saved_model_path, output_dir)
    
    # Cleanup
    if os.path.exists(saved_model_path):
        shutil.rmtree(saved_model_path)
        
    print(f"✓ Saved to {output_dir}")

if __name__ == "__main__":
    # Example usage:
    # convert_h5_to_tfjs("models/breed_classifier.h5", "public/models/breed")
    # convert_onnx_to_tfjs("models/reid_arcface.onnx", "public/models/reid")
    print("Please uncomment the examples in convert_models.py to run conversions.")
