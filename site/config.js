// Единственное, что нужно поменять после деплоя n8n.
window.LEAD_CONFIG = {
  // Production URL вебхука из ноды «Заявка с сайта» (кнопка Webhook URLs → Production)
  webhookUrl: 'https://n8n.example.com/webhook/lead',
  // Ссылка на таблицу с доступом «Читатель» — показывается в демо-плашке. Пусто — плашка без ссылки.
  sheetUrl: '',
  // Куда звонить, если отправка не удалась
  fallbackPhone: '+7 900 000-00-00',
};
