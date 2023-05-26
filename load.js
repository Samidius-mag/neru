const csv = require('csv-parser');
const fs = require('fs');
const tf = require('@tensorflow/tfjs');

const prepareData = (data, windowSize) => {
  const input = [];
  const output = [];

  for (let i = windowSize; i < data.length; i++) {
    const window = data.slice(i - windowSize, i);

    input.push([
      window.map((d) => d.open),
      window.map((d) => d.high),
      window.map((d) => d.low),
      window.map((d) => d.close),
      window.map((d) => d.volume),
    ]);

    output.push([
      data[i + 1].open > data[i].open ? 1 : 0,
      data[i + 1].open < data[i].open ? 1 : 0,
    ]);
  }

  return { input, output };
};

const predict = (model, data) => {
  const input = [
    data.slice(-windowSize).map((d) => d.open),
    data.slice(-windowSize).map((d) => d.high),
    data.slice(-windowSize).map((d) => d.low),
    data.slice(-windowSize).map((d) => d.close),
    data.slice(-windowSize).map((d) => d.volume),
  ];

  const xs = tf.tensor([input]);
  const ys = model.predict(xs);

  const trend = ys.dataSync()[0] > ys.dataSync()[1] ? 'up' : 'down';

  return trend;
};

const windowSize = 24 * 60; // 1 day

const data = [];

fs.createReadStream('price.csv')
  .pipe(csv())
  .on('data', (row) => {
    data.push({
      date: row.date,
      time: row.time,
      open: parseFloat(row.open.replace('.', '').replace(',', '.')),
      high: parseFloat(row.high.replace('.', '').replace(',', '.')),
      low: parseFloat(row.low.replace('.', '').replace(',', '.')),
      close: parseFloat(row.close.replace('.', '').replace(',', '.')),
      volume: parseInt(row.volume),
    });
  })
  .on('end', () => {
    console.log('CSV file successfully processed');

    const { input, output } = prepareData(data, windowSize);

    const xs = tf.tensor(input);
    const ys = tf.tensor(output);

    const model = tf.sequential();

    model.add(
      tf.layers.lstm({
        units: 256,
        inputShape: [windowSize, 5],
        returnSequences: true,
      })
    );
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.lstm({ units: 128, returnSequences: true }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.lstm({ units: 64 }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 2, activation: 'softmax' }));

    model.compile({
      optimizer: tf.train.adam(),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    });

    model.fit(xs, ys, {
      epochs: 100,
      batchSize: 32,
      validationSplit: 0.1,
      shuffle: true,
      callbacks: tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: 5 }),
    });

    const trend = predict(model, data);
    console.log(`Trend: ${trend}`);
  });

