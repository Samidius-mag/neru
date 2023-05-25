const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Получаем данные о последней часовой свече инструмента BTC\USDT с сайта api.binance.com
(async () => {
  const response = await import('node-fetch');
  const fetch = response.default;
  const data = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=1')
    .then(response => response.json());

  // Разбираем полученные данные и извлекаем необходимые значения
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const openPrice = parseFloat(data[0][1]);
  const highPrice = parseFloat(data[0][2]);
  const lowPrice = parseFloat(data[0][3]);
  const closePrice = parseFloat(data[0][4]);
  const volume = parseFloat(data[0][5]);

  // Преобразуем дату и время в нужный формат (без разделителей)
  const formattedDate = `${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`;
  const formattedTime = `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}${seconds.toString().padStart(2, '0')}`;

  // Добавляем полученные значения в конец файла price.csv
  const csvWriter = createCsvWriter({
    path: 'price.csv',
    header: [
      {id: 'DATE', title: 'DATE'},
      {id: 'TIME', title: 'TIME'},
      {id: 'OPEN', title: 'OPEN'},
      {id: 'HIGH', title: 'HIGH'},
      {id: 'LOW', title: 'LOW'},
      {id: 'CLOSE', title: 'CLOSE'},
      {id: 'VOL', title: 'VOL'}
    ],
    append: true
  });

  const record = [
    {
      DATE: formattedDate,
      TIME: formattedTime,
      OPEN: openPrice,
      HIGH: highPrice,
      LOW: lowPrice,
      CLOSE: closePrice,
      VOL: volume
    }
  ];

  csvWriter.writeRecords(record)
    .then(() => {
      console.log('Данные успешно добавлены в файл price.csv');
    })
    .catch(error => {
      console.error('Ошибка при записи в файл:', error);
    });
})();
