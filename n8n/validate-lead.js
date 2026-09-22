// Код ноды «Проверка заявки» (n8n → Code, JavaScript, Run Once for All Items).
// Лежит отдельным файлом, чтобы его было удобно читать и ревьюить. В workflow.json вставлен тот же текст.

const cfg = $('Настройки').first().json;
const req = $('Заявка с сайта').first().json;
const body = req.body ?? {};
const headers = req.headers ?? {};

// Принимаем только строки и числа: массив или объект в поле «имя» — это мусор, а не имя.
const clean = (v, max) =>
  typeof v === 'string' || typeof v === 'number' ? String(v).replace(/\s+/g, ' ').trim().slice(0, max) : '';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const name = clean(body.name, 80);
const email = clean(body.email, 120).toLowerCase();
const service = clean(body.service, 80) || 'Не указана';
const comment = clean(body.comment, 1000);
const source = clean(body.source || headers.referer || 'сайт', 200);

// Телефон: оставляем цифры, «8 999…» и «999…» приводим к «+7 999…»
let digits = clean(body.phone, 40).replace(/\D/g, '');
if (digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1);
if (digits.length === 10) digits = '7' + digits;
const phone = digits.length >= 11 && digits.length <= 15 ? '+' + digits : '';

const errors = {};
if (name.length < 2) errors.name = 'Укажите имя';
if (!phone) errors.phone = 'Проверьте номер телефона';
if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Проверьте email';
if (![true, 'true', 'on'].includes(body.consent)) errors.consent = 'Нужно согласие на обработку данных';

// Антиспам 1: скрытое поле website. Человек его не видит, бот заполняет.
const isBot = clean(body.website, 100) !== '';

// Антиспам 2: не больше 5 заявок с одного IP за 10 минут. Счётчик живёт в static data workflow.
// Это защита «от дурака», а не от DDoS: параллельные запуски могут перезаписать счётчик друг друга.
const store = $getWorkflowStaticData('global');
const now = Date.now();
// Последний адрес в X-Forwarded-For дописал наш прокси (Caddy); первые клиент может подделать.
const ip = clean(String(headers['x-forwarded-for'] ?? '').split(',').pop(), 64) || 'unknown';
store.hits = (store.hits ?? []).filter((h) => now - h.t < 10 * 60 * 1000);
const tooMany = store.hits.filter((h) => h.ip === ip).length >= 5;
store.hits.push({ ip, t: now });

const valid = Object.keys(errors).length === 0 && !isBot && !tooMany;

// Автоответ на один адрес — не чаще раза в час, чтобы форму не использовали для рассылки спама.
store.mailed = Object.fromEntries(Object.entries(store.mailed ?? {}).filter(([, t]) => now - t < 3600 * 1000));
const sendEmail = valid && email !== '' && !store.mailed[email];
if (sendEmail) store.mailed[email] = now;

const created = DateTime.now().setZone(cfg.timezone || 'Europe/Moscow');
const id = 'L' + created.toFormat('yyMMdd') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

// В демо-режиме таблица публичная, поэтому телефон и почту в ней маскируем. В Telegram — полные данные.
const maskPhone = (p) => p.replace(/^(\+\d)(\d{3})\d{3}\d{2}(\d{2})$/, '$1 $2 ***-**-$3');
const maskEmail = (e) => e.replace(/^(.{2})[^@]*(@.*)$/, '$1***$2');

const lines = [
  `🆕 <b>Заявка ${id}</b>`,
  `👤 ${esc(name)}`,
  `📞 ${phone}`,
  `✉️ ${email ? esc(email) : '—'}`,
  `🛠 ${esc(service)}`,
  comment ? `💬 ${esc(comment)}` : null,
  `🔗 ${esc(source)}`,
].filter(Boolean);

const emailHtml = `
<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1d1d1f;max-width:520px">
  <p>Здравствуйте, ${esc(name)}!</p>
  <p>Мы получили вашу заявку <b>${id}</b> на «${esc(service)}».
     Менеджер перезвонит на номер ${phone} в течение 15 минут в рабочее время (пн–сб, 9:00–20:00).</p>
  <p>Если удобнее переписка — просто ответьте на это письмо.</p>
  <p style="color:#6e6e73">${esc(cfg.businessName)}</p>
</div>`;

return [{
  json: {
    valid,
    isBot,
    tooMany,
    errors,
    sendEmail,
    lead: { id, name, phone, email, service, comment, source, created: created.toFormat('dd.MM.yyyy HH:mm') },
    row: {
      'ID': id,
      'Дата': created.toFormat('dd.MM.yyyy HH:mm'),
      'Имя': name,
      'Телефон': cfg.demoMode ? maskPhone(phone) : phone,
      'Email': cfg.demoMode ? maskEmail(email) : email,
      'Услуга': service,
      'Комментарий': comment,
      'Источник': source,
      'Статус': 'Новая',
    },
    telegramText: lines.join('\n'),
    emailSubject: `Заявка ${id} получена — ${cfg.businessName}`,
    emailHtml,
  },
}];
