const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const bot = new Telegraf('8495287734:AAH8ZCbjy_XaoLHS0gsasSDHomiNOdGr_0c');
const DATA_FILE = 'data.json';

// Загружаем данные
let data = {};
if (fs.existsSync(DATA_FILE)) {
  data = JSON.parse(fs.readFileSync(DATA_FILE));
} else {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

// Сохранение данных
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Получение всех машин
function getCarsList() {
  const keys = Object.keys(data);
  if (keys.length === 0) return 'Пока нет добавленных автомобилей.';
  return keys.map((car, i) =>  `${i + 1}. ${car} `).join('\n');
}

// Начало
bot.start((ctx) => {
  ctx.reply(
    'Привет! Я бот для учёта расходов по автомобилям. Что делаем?',
    Markup.keyboard([
      ['➕ Добавить автомобиль', '💰 Добавить расход'],
      ['📄 Отчёт', '🚗 Список автомобилей']
    ]).resize()
  );
});

// Добавление автомобиля
bot.hears('➕ Добавить автомобиль', (ctx) => {
  ctx.reply('Введи название автомобиля и последние 6 символов VIN, например: Tiguan • 123456');
  bot.on('text', (ctx2) => {
    const carName = ctx2.message.text.trim();
    if (!data[carName]) {
      data[carName] = {
        buy: { Максим: 0, Андрей: 0 },
        expenses: [],
        salePrice: 0
      };
      saveData();
      ctx2.reply(`Автомобиль "${carName}" добавлен!`);
    } else {
      ctx2.reply('Такой автомобиль уже есть.');
    }
    bot.removeListener('text');
  });
});

// Добавление расхода
bot.hears('💰 Добавить расход', (ctx) => {
  if (Object.keys(data).length === 0) {
    ctx.reply('Сначала добавь автомобиль.');
    return;
  }

  ctx.reply('Выбери автомобиль:', Markup.keyboard([...Object.keys(data), ['⬅️ Назад']]).resize());

  bot.on('text', (ctx2) => {
    const car = ctx2.message.text.trim();
    if (!data[car]) return;

    ctx2.reply(
      'Кто вносит расход?',
      Markup.keyboard([['Максим'], ['Андрей'], ['⬅️ Отмена']]).resize()
    );

    bot.on('text', (ctx3) => {
      const person = ctx3.message.text.trim();
      if (person === 'Максим' || person === 'Андрей') {
        ctx3.reply('Введи название статьи расхода (например: ремонт, мойка и т.д.)');

        bot.on('text', (ctx4) => {
          const expenseName = ctx4.message.text.trim();
          ctx4.reply(Теперь введи сумму для "${expenseName}");

          bot.on('text', (ctx5) => {
            const cost = parseFloat(ctx5.message.text);
            if (isNaN(cost)) {
              ctx5.reply('Нужно ввести число!');
              return;
            }

            data[car].expenses.push({
              person,
              expenseName,
              cost
            });
            saveData();
            ctx5.reply(Расход "${expenseName}" на сумму ${cost}₽ добавлен от ${person}.);
            bot.removeListener('text');
          });
        });
      }
    });
  });
});

// Отчёт
bot.hears('📄 Отчёт', (ctx) => {
  if (Object.keys(data).length === 0) {
    ctx.reply('Пока нет данных.');
    return;
  }

  let text = '';
  for (const [car, info] of Object.entries(data)) {
    const totalByMax = info.expenses.filter(e => e.person === 'Максим').reduce((sum, e) => sum + e.cost, 0);
    const totalByAnd = info.expenses.filter(e => e.person === 'Андрей').reduce((sum, e) => sum + e.cost, 0);
    const total = totalByMax + totalByAnd;

    text += 🚗 ${car}\n;
    text += Максим: ${totalByMax}₽\nАндрей: ${totalByAnd}₽\nВсего: ${total}₽\n\n;
  }

  ctx.reply(text);
});

bot.hears('🚗 Список автомобилей', (ctx) => {
  ctx.reply(getCarsList());
});

bot.launch();
console.log('Бот запущен...');
