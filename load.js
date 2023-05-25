const request = require('request');
const fs = require('fs');

const url = 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=1';

request(url, { json: true }, (err, res, body) => {
  if (err) { return console.log(err); }

  const [time, open, high, low, close, vol] = body[0];
  const date = new Date(time);

  const price = {
    DATE: date.getFullYear() + ('0' + (date.getMonth() + 1)).slice(-2) + ('0' + date.getDate()).slice(-2),
    TIME: ('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2),
    OPEN: open,
    HIGH: high,
    LOW: low,
    CLOSE: close,
    VOL: vol
  };

  fs.readFile('price.json', 'utf8', (err, data) => {
    if (err) {
      fs.writeFile('price.json', JSON.stringify([price]), 'utf8', (err) => {
        if (err) { return console.log(err); }
        console.log('Data added to the beginning of the file.');
      });
    } else {
      const prices = JSON.parse(data);
      prices.push(price);
      fs.writeFile('price.json', JSON.stringify(prices), 'utf8', (err) => {
        if (err) { return console.log(err); }
        console.log('Data added to the end of the file.');
      });
    }
  });
});
