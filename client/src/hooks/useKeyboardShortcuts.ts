import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function useKeyboardShortcuts() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl/Cmd + Enter - Quick action (not used here, but reserved)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        // This is handled by individual components
        return;
      }

      // N - New post
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setLocation('/write');
        return;
      }

      // ? - Show shortcuts modal
      if (e.key === '?') {
        e.preventDefault();
        showShortcutsModal();
        return;
      }

      // Escape - Close modals (handled by components)
      if (e.key === 'Escape') {
        // Handled by individual modal components
        return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [setLocation]);
}

function showShortcutsModal() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 border-2 border-black rounded-lg p-6 max-w-md w-full mx-4">
      <h2 class="text-2xl font-bold mb-4">Keyboard Shortcuts</h2>
      <div class="space-y-3">
        <div class="flex justify-between">
          <span class="font-semibold">N</span>
          <span class="text-gray-600 dark:text-gray-400">New post</span>
        </div>
        <div class="flex justify-between">
          <span class="font-semibold">?</span>
          <span class="text-gray-600 dark:text-gray-400">Show shortcuts</span>
        </div>
        <div class="flex justify-between">
          <span class="font-semibold">Esc</span>
          <span class="text-gray-600 dark:text-gray-400">Close modals</span>
        </div>
        <div class="flex justify-between">
          <span class="font-semibold">Ctrl/Cmd + Enter</span>
          <span class="text-gray-600 dark:text-gray-400">Submit form</span>
        </div>
      </div>
      <button id="close-shortcuts" class="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded border-2 border-black">
        Close
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const closeModal = () => {
    document.body.removeChild(modal);
  };
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  const closeBtn = modal.querySelector('#close-shortcuts');
  closeBtn?.addEventListener('click', closeModal);
  
  document.addEventListener('keydown', function escapeHandler(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escapeHandler);
    }
  });
}
