let tfLoaded = false, mobilenet = null, tf = null;

export async function loadModels() {
  if (tfLoaded) return;
  tf = await import('@tensorflow/tfjs');
  const mn = await import('@tensorflow-models/mobilenet');
  await tf.ready();
  mobilenet = await mn.load({ version: 2, alpha: 1.0 });
  tfLoaded = true;
}

export async function extractEmbedding(imgEl) {
  if (!mobilenet) await loadModels();
  return tf.tidy(() => {
    const tensor = tf.browser.fromPixels(imgEl).resizeNearestNeighbor([224, 224]).toFloat().expandDims();
    const activation = mobilenet.infer(tensor, true);
    return Array.from(activation.dataSync());
  });
}

export async function guessBreed(imgEl, canvas) {
  if (!mobilenet) await loadModels();
  const predictions = await mobilenet.classify(imgEl, 5);
  const { identifyBreed, analyseImageColours } = await import('@/lib/breeds');
  const colourAnalysis = analyseImageColours(canvas || imgEl);
  const result = identifyBreed({ predictions, colourAnalysis, userRegion: 'GH' });
  return result.best.name;
}