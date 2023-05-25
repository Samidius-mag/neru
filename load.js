const axios = require('axios');
const fs = require('fs');

const FILE_NAME = 'price.json';
const SYMBOL = 'BTCUSDT';

// Функция для форматирования даты и времени
function formatDate(date) {
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const hours = ('0' + date.getHours()).slice(-2);
  const minutes = ('0' + date.getMinutes()).slice(-2);
  const seconds = ('0' + date.getSeconds()).slice(-2);
  return `${year}${month}${day},${hours}${minutes}${seconds}`;
}

// Функция для добавления данных в файл
function appendToFile(data) {
  fs.appendFileSync(FILE_NAME, data + '\n');
}

// Функция для получения последней свечи
async function getLastCandle(symbol) {
  const response = await axios.get(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=1`);
  const [time, open, high, low, close, volume] = response.data[0];
  return {
    date: formatDate(new Date(time)),
    open,
    high,
    low,
    close,
    volume
  };
}

// Основной код
(async function() {
  try {
    const lastCandle = await getLastCandle(SYMBOL);
    const fileExists = fs.existsSync(FILE_NAME);
    if (!fileExists) {
      appendToFile('DATE,TIME,OPEN,HIGH,LOW,CLOSE,VOL');
    }
    appendToFile(`${lastCandle.date},${lastCandle.open},${lastCandle.high},${lastCandle.low},${lastCandle.close},${lastCandle.volume}`);
    console.log('Данные успешно добавлены в файл');
  } catch (error) {
    console.error(error);
  }
})();
