export function createTimer({ seconds = 25 * 60, onChange = () => {}, onComplete = () => {} } = {}) {
  let remainingSeconds = seconds;
  let running = false;
  let completed = false;
  let intervalId = null;

  const snapshot = () => ({ remainingSeconds, running, completed });
  const emit = () => onChange(snapshot());

  function tick() {
    if (!running || remainingSeconds <= 0) return snapshot();
    remainingSeconds -= 1;
    if (remainingSeconds === 0) {
      running = false;
      completed = true;
      if (intervalId !== null) clearInterval(intervalId);
      intervalId = null;
      onComplete(snapshot());
    }
    emit();
    return snapshot();
  }

  return {
    start() {
      if (running || remainingSeconds <= 0) return snapshot();
      running = true;
      completed = false;
      intervalId = setInterval(tick, 1000);
      emit();
      return snapshot();
    },
    pause() {
      running = false;
      if (intervalId !== null) clearInterval(intervalId);
      intervalId = null;
      emit();
      return snapshot();
    },
    reset(nextSeconds = seconds) {
      running = false;
      completed = false;
      remainingSeconds = nextSeconds;
      if (intervalId !== null) clearInterval(intervalId);
      intervalId = null;
      emit();
      return snapshot();
    },
    tick,
    snapshot
  };
}
