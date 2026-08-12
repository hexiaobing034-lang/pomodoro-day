const KEY = "pomodoro-day:v1";
const emptyState = () => ({ tasks: [], sessions: [] });

export function createStorage(adapter) {
  return {
    loadState() {
      try {
        const value = JSON.parse(adapter.getItem(KEY));
        return value && Array.isArray(value.tasks) && Array.isArray(value.sessions)
          ? value
          : emptyState();
      } catch {
        return emptyState();
      }
    },
    saveState(state) {
      adapter.setItem(KEY, JSON.stringify(state));
    },
    clearState() {
      adapter.removeItem(KEY);
    }
  };
}
