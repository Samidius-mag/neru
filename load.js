const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Получаем данные о последней часовой свече инструмента BTC\USDT с сайта api.binance.com
(async () => {
  const response = await import('node-fetch');
  const fetch = response.default;
  const data = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=1')
    .then(response => response.json());

  // Разбираем полученные данные и извлекаем необходимые значения
  const timestamp = parseInt(data[0][0]) / 1000;
  const date = new Date(timestamp).toISOString().slice(0, 10);
  const time = new Date(timestamp).toISOString().slice(11, 19);
  const openPrice = parseFloat(data[0][1]);
  const highPrice = parseFloat(data[0][2]);
  const lowPrice = parseFloat(data[0][3]);
  const closePrice = parseFloat(data[0][4]);
  const volume = parseFloat(data[0][5]);

  // Преобразуем дату и время в нужный формат
  const formattedDate = date.split('-').join('');
  const formattedTime = time.split(':').join('');

  // Добавляем полученные значения в конец файла price.csv
  const csvWriter = createCsvWriter({
    path: 'price.csv',
    header: [
      {id: 'date', title: 'DATE'},
      {id: 'time', title: 'TIME'},
      {id: 'open', title: 'OPEN'},
      {id: 'high', title: 'HIGH'},
      {id: 'low', title: 'LOW'},
      {id: 'close', title: 'CLOSE'},
      {id: 'vol', title: 'VOL'}
    ],
    append: true
  });

  const record = {
    date: formattedDate,
    time: formattedTime,
    open: openPrice,
    high: highPrice,
    low: lowPrice,
    close: closePrice,
    vol: volume
  };

  csvWriter.writeRecords([record])
    .then(() => {
      console.log('Данные успешно добавлены в файл price.csv');
    })
    .catch(error => {
      console.error('Ошибка при записи в файл:', error);
    });
})();
