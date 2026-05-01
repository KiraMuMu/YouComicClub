/**
 * 悠行动漫社 - 主题切换
 * 支持深色/浅色模式，偏好保存到 localStorage
 * 优先级：localStorage > 系统偏好 > 默认深色
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'youcomic-theme';

  /** 获取初始主题 */
  function getInitialTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    // 跟随系统
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark'; // 默认深色（新海诚风格）
  }

  /** 应用主题 */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  /** 切换主题 */
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  // 页面加载时立即应用主题（放在 <head> 中可防止闪烁）
  applyTheme(getInitialTheme());

  // DOM 就绪后绑定按钮事件
  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', toggleTheme);
    }
  });

  // 监听系统主题变化
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
      // 只在用户没有手动设置过时跟随系统
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? 'light' : 'dark');
      }
    });
  }
})();
