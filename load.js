const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');

// Загрузка данных из файла price.csv
const data = fs.readFileSync('price.csv', 'utf8')
  .split('\n')
  .map(line => line.split(';').map(Number));

// Преобразование данных в тензор
const tensorData = tf.tensor2d(data.slice(1), [data.length - 1, data[0].length - 1]);
function windowedDataset(tensorData, windowSize, shiftSize) {
  return tf.data.generator(function* () {
    for (let i = 0; i < tensorData.shape[0] - windowSize; i += shiftSize) {
      yield {
        xs: tensorData.slice([i, 0], [windowSize, tensorData.shape[1] - 1]),
        ys: tensorData.slice([i + windowSize, 3], [1, 1])
      };
    }
  });
}

// Создание датасетов для обучения и валидации модели
const windowSize = 24; // Длина последовательности
const shiftSize = 1; // Шаг смещения последовательности
const trainDataset = windowedDataset(tensorData.slice([0, 0], [-1, tensorData.shape[1]]), windowSize, shiftSize)
  .shuffle(1000)
  .batch(32);
const valDataset = windowedDataset(tensorData.slice([0, 0], [-1, tensorData.shape[1]]), windowSize, shiftSize)
  .batch(32)
  .take(100);
// Создание модели нейронной сети
const model = tf.sequential();
model.add(tf.layers.lstm({
  units: 32,
  inputShape: [windowSize, tensorData.shape[1] - 1],
  returnSequences: false
}));
model.add(tf.layers.dense({
  units: 16,
  activation: 'relu'
}));
model.add(tf.layers.dense({
  units: 1,
  activation: 'sigmoid'
}));
model.compile({
  optimizer: tf.train.adam(),
  loss: 'binaryCrossentropy',
  metrics: ['accuracy']
});
// Обучение модели
const epochs = 50;
await model.fitDataset(trainDataset, {
  epochs: epochs,
  validationData: valDataset,
  callbacks: tf.node.tensorBoard('./logs')
});
// Предсказание движения тренда на годовом интервале
const testData = tensorData.slice([tensorData.shape[0] - windowSize, 0], [windowSize, tensorData.shape[1] - 1]);
const prediction = model.predict(testData.reshape([1, windowSize, tensorData.shape[1] - 1]));
const trend = prediction.dataSync()[0] > 0.5 ? 'up' : 'down';
console.log(`Trend on yearly interval: ${trend}`);

