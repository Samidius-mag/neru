const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Читаем данные из файла price.csv
const fs = require('fs');
const results = [];
fs.createReadStream('price.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    // Преобразуем данные в нужный формат
    const formattedData = results.map((item) => {
      const date = item.DATE;
      const time = item.TIME.padStart(6, '0');
      const open = parseFloat(item.OPEN).toFixed(7);
      const high = parseFloat(item.HIGH).toFixed(7);
      const low = parseFloat(item.LOW).toFixed(7);
      const close = parseFloat(item.CLOSE).toFixed(7);
      const vol = parseInt(item.VOL);
      return `${date}\t${time}\t${open}\t${high}\t${low}\t${close}\t${vol}`;
    });

    // Записываем данные в новый файл price_formatted.txt
    fs.writeFile('price.csv', formattedData.join('\n'), (err) => {
      if (err) throw err;
      console.log('Данные успешно записаны в файл price_formatted.txt');
    });
  });
