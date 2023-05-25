const https = require('https');
const fs = require('fs');

// Функция для выполнения запроса к API Binance
function getPriceData(callback) {
  https.get('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=1', (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      callback(JSON.parse(data));
    });
  }).on('error', (err) => {
    console.log('Error: ' + err.message);
  });
}

// Функция для добавления данных в файл price.json
function appendPriceData(data) {
  fs.readFile('price.json', 'utf8', (err, fileData) => {
    if (err) {
      console.log('Error: ' + err.message);
      return;
    }
    const prices = JSON.parse(fileData);
    const lastPrice = data[0];
    const date = new Date(lastPrice[0]);
    const dateString = date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate());
    const timeString = pad(date.getHours()) + pad(date.getMinutes()) + pad(date.getSeconds());
    const open = lastPrice[1];
    const high = lastPrice[2];
    const low = lastPrice[3];
    const close = lastPrice[4];
    const volume = lastPrice[5];
    const newPrice = {
      DATE: dateString,
      TIME: timeString,
      OPEN: open,
      HIGH: high,
      LOW: low,
      CLOSE: close,
      VOL: volume
    };
    prices.push(newPrice);
    fs.writeFile('price.json', JSON.stringify(prices), (err) => {
      if (err) {
        console.log('Error: ' + err.message);
        return;
      }
      console.log('Data appended to price.json');
    });
  });
}

// Функция для добавления ведущего нуля к числу, если оно меньше 10
function pad(num) {
  return num < 10 ? '0' + num : num;
}

// Вызываем функцию для получения данных о последней свече
getPriceData(appendPriceData);
