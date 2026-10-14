'use strict';

const isChinese = document.documentElement.lang === 'zh-CN';
const suggestions = isChinese ? {
  health: {
    title: '先建立回血循环。',
    text: '尝试在卷笔刀旁使用血清，并优先考虑回血升级。'
  },
  movement: {
    title: '先练习保持移动速度。',
    text: '练习衔接空中冲刺与滑铲，留意踢击带来的后退。'
  },
  clips: {
    title: '先规划收集路线。',
    text: '尝试从纸夹上方接近，下落收集后立即滑铲离开。'
  }
} : {
  health: {
    title: 'Build a recovery loop.',
    text: 'Try serum near a pencil sharpener, and prioritize healing upgrades.'
  },
  movement: {
    title: 'Make movement your first practice.',
    text: 'Practice chaining air dashes and slides. Avoid kicks that knock you backward.'
  },
  clips: {
    title: 'Plan your collection pass.',
    text: 'Try approaching clips from above, dropping to collect, then sliding away.'
  }
};

const focusButtons = [...document.querySelectorAll('[data-focus]')];
const answerTitle = document.getElementById('answer-title');
const answerText = document.getElementById('answer-text');

for (const button of focusButtons) {
  button.addEventListener('click', () => {
    const suggestion = suggestions[button.dataset.focus];
    for (const option of focusButtons) {
      option.setAttribute('aria-pressed', String(option === button));
    }
    answerTitle.textContent = suggestion.title;
    answerText.textContent = suggestion.text;
  });
}

const preparationChecks = [...document.querySelectorAll('.checklist input')];
const checkCount = document.getElementById('check-count');

function updateCheckCount() {
  const completed = preparationChecks.filter(check => check.checked).length;
  checkCount.textContent = isChinese
    ? `${completed} / ${preparationChecks.length} 项准备已完成`
    : `${completed} / ${preparationChecks.length} preparation checks`;
}

for (const check of preparationChecks) {
  check.checked = false;
  check.addEventListener('change', updateCheckCount);
}

document.getElementById('reset-checks').addEventListener('click', () => {
  for (const check of preparationChecks) check.checked = false;
  updateCheckCount();
});

updateCheckCount();
