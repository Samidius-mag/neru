async function run() {
  const fs = require('fs');
const csv = require('csv-parser');
const tf = require('@tensorflow/tfjs-node');

const data = [];
fs.createReadStream('price.csv')
  .pipe(csv({ separator: ';' }))
  .on('data', (row) => {
    data.push([Number(row['Open']), Number(row['High']), Number(row['Low']), Number(row['Close']), Number(row['Volume']), Number(row['Adj Close'])]);
  })
  .on('end', () => {
    const tensorData = tf.tensor2d(data, [data.length, data[0].length]);
    console.log(tensorData.shape);
  });

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
}

run();

