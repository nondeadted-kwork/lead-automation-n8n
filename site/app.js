(() => {
  const cfg = window.LEAD_CONFIG || {};
  const form = document.getElementById('form');
  const success = document.getElementById('success');
  const button = form.querySelector('button[type="submit"]');
  const phoneInput = form.elements.phone;

  if (cfg.sheetUrl) {
    const link = document.getElementById('sheet-link');
    link.href = cfg.sheetUrl;
    link.hidden = false;
  }

  // Маска телефона: +7 (900) 000-00-00. Вставка «89001234567» тоже превращается в маску.
  phoneInput.addEventListener('input', () => {
    let d = phoneInput.value.replace(/\D/g, '');
    if (!d) { phoneInput.value = ''; return; }
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
    phoneInput.value = '+7' + (p[0] ? ` (${p[0]}` : '') + (p[1] ? `) ${p[1]}` : '') +
      (p[2] ? `-${p[2]}` : '') + (p[3] ? `-${p[3]}` : '');
  });

  const showErrors = (errors) => {
    form.querySelectorAll('.error').forEach((el) => { el.textContent = errors[el.dataset.for] || ''; });
    form.querySelectorAll('input, select, textarea').forEach((el) => {
      el.classList.toggle('invalid', Boolean(errors[el.name]));
    });
    const first = form.querySelector('.invalid');
    if (first) first.focus();
  };

  // Та же проверка, что и в n8n: сервер всё равно перепроверит, это только для быстрого отклика.
  const validate = (data) => {
    const errors = {};
    if (data.name.trim().length < 2) errors.name = 'Укажите имя';
    if (data.phone.replace(/\D/g, '').length !== 11) errors.phone = 'Проверьте номер телефона';
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) errors.email = 'Проверьте email';
    if (!data.consent) errors.consent = 'Нужно согласие на обработку данных';
    return errors;
  };

  const setLoading = (on) => {
    button.disabled = on;
    button.classList.toggle('loading', on);
  };

  const source = () => {
    const q = new URLSearchParams(location.search);
    const utm = ['utm_source', 'utm_medium', 'utm_campaign'].map((k) => q.get(k)).filter(Boolean).join(' / ');
    return utm || (document.referrer ? new URL(document.referrer).hostname : 'прямой заход');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: form.elements.name.value,
      phone: form.elements.phone.value,
      email: form.elements.email.value.trim(),
      service: form.elements.service.value,
      comment: form.elements.comment.value,
      website: form.elements.website.value,
      consent: form.elements.consent.checked,
      source: source(),
    };

    const errors = validate(data);
    showErrors(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(cfg.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        document.getElementById('lead-id').textContent = json.id || '';
        document.getElementById('success-email').hidden = !data.email;
        form.hidden = true;
        success.hidden = false;
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      showErrors(json.errors || { form: `Сервер ответил ошибкой ${res.status}. Позвоните нам: ${cfg.fallbackPhone}` });
    } catch (err) {
      showErrors({
        form: err.name === 'AbortError'
          ? `Сервер долго не отвечает. Попробуйте ещё раз или позвоните: ${cfg.fallbackPhone}`
          : `Не получилось отправить. Проверьте интернет или позвоните: ${cfg.fallbackPhone}`,
      });
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  });

  document.getElementById('again').addEventListener('click', () => {
    form.reset();
    showErrors({});
    success.hidden = true;
    form.hidden = false;
  });
})();
