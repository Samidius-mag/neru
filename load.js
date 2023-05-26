const csvUrl = 'price.csv';

// Загрузка CSV файла и преобразование его в массив объектов
async function loadCSV() {
  const response = await fetch(csvUrl);
  const csvData = await response.text();
  const parsedData = Papa.parse(csvData, { header: true }).data;
  return parsedData;
}

// Подготовка данных для обучения модели
const features = ['OPEN', 'HIGH', 'LOW', 'CLOSE'];
const label = 'TREND';

function normalizeData(data) {
  const normalizedData = {};
  features.forEach((feature) => {
    const columnData = data.map((row) => parseFloat(row[feature].replace(/\./g, '').replace(',', '.')));
    const min = Math.min(...columnData);
    const max = Math.max(...columnData);
    normalizedData[feature] = columnData.map((value) => (value - min) / (max - min));
  });
  const labelData = data.map((row) => row[label]);
  return { features: normalizedData, label: labelData };
}

// Создание модели TensorFlowJS
const model = tf.sequential();
model.add(tf.layers.dense({ inputShape: [4], units: 10, activation: 'relu' }));
model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });

// Обучение модели
async function trainModel() {
  const data = await loadCSV();
  const normalizedData = normalizeData(data);
  const xs = tf.tensor2d(Object.values(normalizedData.features).map((feature) => feature.slice(0, -1)));
  const ys = tf.tensor1d(normalizedData.label.slice(1).map((label, index) => label > normalizedData.label[index] ? 1 : 0));
  await model.fit(xs, ys, { epochs: 100 });
}

// Предсказание движения тренда на различных временных интервалах
async function predictTrend() {
  const data = await loadCSV();

  // Предсказание движения тренда на годовом интервале
  const yearData = data.filter((row) => row.DATE.endsWith('0101'));
  const yearNormalizedData = normalizeData(yearData);
  const yearXs = tf.tensor2d(Object.values(yearNormalizedData.features).map((feature) => feature.slice(0, -1)));
  const yearPredictions = model.predict(yearXs).dataSync();

  // Предсказание движения тренда на месячном интервале
  const monthData = data.filter((row) => row.DATE.endsWith('01'));
  const monthNormalizedData = normalizeData(monthData);
  const monthXs = tf.tensor2d(Object.values(monthNormalizedData.features).map((feature) => feature.slice(0, -1)));
  const monthPredictions = model.predict(monthXs).dataSync();

  // Предсказание движения тренда на дневном интервале
  const dayData = data;
  const dayNormalizedData = normalizeData(dayData);
  const dayXs = tf.tensor2d(Object.values(dayNormalizedData.features).map((feature) => feature.slice(0, -1)));
  const dayPredictions = model.predict(dayXs).dataSync();

  // Предсказание движения тренда на 12-часовом интервале
  const halfDayData = data.filter((row) => parseInt(row.TIME) % 1200 === 0);
  const halfDayNormalizedData = normalizeData(halfDayData);
  const halfDayXs = tf.tensor2d(Object.values(halfDayNormalizedData.features).map((feature) => feature.slice(0, -1)));
  const halfDayPredictions = model.predict(halfDayXs).dataSync();

  // Предсказание движения тренда на 4-часовом интервале
  const fourHourData = data.filter((row) => parseInt(row.TIME) % 400 === 0);
  const fourHourNormalizedData = normalizeData(fourHourData);
  const fourHourXs = tf.tensor2d(Object.values(fourHourNormalizedData.features).map((feature) => feature.slice(0, -1)));
  const fourHourPredictions = model.predict(fourHourXs).dataSync();

  // Предсказание движения тренда на часовом интервале
  const hourData = data.filter((row) => parseInt(row.TIME) % 100 === 0);
  const hourNormalizedData = normalizeData(hourData);
  const hourXs = tf.tensor2d(Object.values(hourNormalizedData.features).map((feature) => feature.slice(0, -1)));
  const hourPredictions = model.predict(hourXs).dataSync();

  console.log('Year predictions:', yearPredictions.map((prediction) => prediction > 0.5 ? 'Up' : 'Down'));
  console.log('Month predictions:', monthPredictions.map((prediction) => prediction > 0.5 ? 'Up' : 'Down'));
  console.log('Day predictions:', dayPredictions.map((prediction) => prediction > 0.5 ? 'Up' : 'Down'));
  console.log('Half day predictions:', halfDayPredictions.map((prediction) => prediction > 0.5 ? 'Up' : 'Down'));
  console.log('Four hour predictions:', fourHourPredictions.map((prediction) => prediction > 0.5 ? 'Up' : 'Down'));
  console.log('Hour predictions:', hourPredictions.map((prediction) => prediction > 0.5 ? 'Up' : 'Down'));
}

// Обучение модели и предсказание движения тренда
async function run() {
  await trainModel();
  await predictTrend();
}

run();
