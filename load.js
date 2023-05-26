const csv = require('csvtojson');
const tf = require('@tensorflow/tfjs');

const filePath = 'p2.txt';

csv()
  .fromFile(filePath)
  .then((jsonObj) => {
    const data = jsonObj.map((item) => [
      item.date,
      item.time,
      item.open,
      item.high,
      item.low,
      item.close,
      item.volume,
    ]);

    const xs = [];
    const ys = [];

    for (let i = 0; i < data.length - 12; i++) {
      const input = data.slice(i, i + 12);
      const output = data[i + 12][5] > data[i + 11][5] ? 1 : 0;

      xs.push(input);
      ys.push(output);
    }

    const xsTensor = tf.tensor3d(xs);
    const ysTensor = tf.tensor1d(ys);

    const model = tf.sequential();

    model.add(tf.layers.lstm({units: 64, inputShape: [12, 7], kernelInitializer: 'glorotNormal'}));
    model.add(tf.layers.dense({units: 1, activation: 'sigmoid', kernelInitializer: 'glorotNormal'}));

    model.compile({optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy']});

    const batchSize = 32;
    const epochs = 3;

    model.fit(xsTensor, ysTensor, {
      batchSize,
      epochs,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
        },
      },
    });

    const testData = data.slice(data.length - 12);
    const testXsTensor = tf.tensor3d([testData]);

    const predictions = model.predict(testXsTensor);

    console.log('Predictions:');
    if (predictions instanceof tf.Tensor) {
      console.log(`Yearly trend: ${predictions.get(0, 0).toFixed(4)}`);
      console.log(`Monthly trend: ${predictions.get(0, 1).toFixed(4)}`);
      console.log(`Daily trend: ${predictions.get(0, 2).toFixed(4)}`);
      console.log(`12-hour trend: ${predictions.get(0, 3).toFixed(4)}`);
      console.log(`4-hour trend: ${predictions.get(0, 4).toFixed(4)}`);
      console.log(`Hourly trend: ${predictions.get(0, 5).toFixed(4)}`);
    } else {
      console.log('Predictions are not a tensor');
    }
  });

