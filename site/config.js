// Единственное, что нужно поменять после деплоя n8n.
window.LEAD_CONFIG = {
  // Production URL вебхука из ноды «Заявка с сайта» (кнопка Webhook URLs → Production)
  webhookUrl: 'https://4-165-99-217.sslip.io/webhook/lead',
  // Ссылка на таблицу с доступом «Читатель», показывается в демо-плашке. Пусто: плашка без ссылки.
  sheetUrl: 'https://docs.google.com/spreadsheets/d/1bT-UKz4PPYD5rfl6dEeHaZmWrBt4tVGJiNqKQlLW1kk/edit?usp=sharing',
  // Куда звонить, если отправка не удалась
  fallbackPhone: '+7 900 000-00-00',
};
