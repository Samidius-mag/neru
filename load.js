const tf = require('@tensorflow/tfjs');
const fs = require('fs');

// Загрузка данных из файла
const data = fs.readFileSync('price.txt', 'utf8');

// Преобразование данных в массив чисел
const prices = data.split('\n').map(price => parseFloat(price));

// Создание массива часовых свечей
const candles = [];
for (let i = 0; i < prices.length - 4; i++) {
  candles.push(prices.slice(i, i + 5));
}

// Преобразование массива часовых свечей в тензор
const xs = tf.tensor2d(candles.slice(0, -1));
const ys = tf.tensor2d(candles.slice(1));
// Создание модели нейронной сети
const model = tf.sequential();
model.add(tf.layers.dense({ units: 10, inputShape: [5] }));
model.add(tf.layers.dense({ units: 5 }));
model.add(tf.layers.dense({ units: 5 }));

// Компиляция модели
model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

// Обучение модели
model.fit(xs, ys, { epochs: 100 }).then(() => {
  // Использование модели для предсказания движения тренда
  const predictions = model.predict(xs);

  // Вывод результатов
  console.log('Predictions:');
  console.log(predictions.arraySync());
});

