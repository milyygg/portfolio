// Local, predefined examples. No requests, personal data or AI service calls.
(() => {
  const button = (action, label) => {
    const element = document.createElement('button');
    element.type = 'button';
    element.dataset.demoAction = action;
    element.textContent = label;
    return element;
  };
  for (const demo of document.querySelectorAll('[data-demo]')) {
    const initialMessage = demo.querySelector('[data-demo-message]')?.textContent;
    const initialControls = demo.querySelector('[data-demo-controls]')?.cloneNode(true);
    let taskStep = 0;
    demo.addEventListener('click', event => {
      const target = event.target.closest('button[data-demo-action]');
      if (!target || !demo.contains(target)) return;
      const message = demo.querySelector('[data-demo-message]');
      const controls = demo.querySelector('[data-demo-controls]');
      const action = target.dataset.demoAction;
      const replies = {
        consultation: 'Вы выбрали консультацию. Следующий шаг в таком боте - согласовать время и контакт для связи.',
        website: 'Вы выбрали разработку сайта. Следующий шаг - короткая анкета о вашей задаче.',
        hours: 'В этом примере команда отвечает по будням с 10:00 до 18:00.',
        delivery: 'В этом примере доступны доставка и самовывоз. Условия и доступные варианты помощник берёт из материалов магазина.',
        human: 'Помощник может уточнить вопрос и передать диалог сотруднику вместе с контекстом.'
      };
      if (action === 'task') {
        taskStep = (taskStep + 1) % 3;
        demo.querySelector('[data-task-status]').textContent = ['Новая', 'В работе', 'Завершена'][taskStep];
        target.textContent = ['Взять в работу', 'Завершить задачу', 'Вернуть в новые'][taskStep];
        demo.dataset.taskStep = taskStep;
      } else if (action === 'service') {
        message.textContent = 'Выберите направление.';
        controls.replaceChildren(button('consultation', 'Консультация'), button('website', 'Разработка сайта'), button('reset', 'Начать заново'));
      } else if (action === 'reset') {
        message.textContent = initialMessage;
        controls.replaceChildren(...[...initialControls.children].map(child => child.cloneNode(true)));
      } else if (replies[action]) {
        message.textContent = replies[action];
        controls.replaceChildren(button('reset', 'Начать заново'));
      }
      // Focus a visible control after replacing the clicked one.
      if (!target.isConnected) controls.querySelector('button')?.focus({preventScroll:true});
    });
  }
})();
