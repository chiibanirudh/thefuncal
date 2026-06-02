// These messages appear one after another on the fake loading screen.
const loadingMessages = [
  "Calculating the meaning of life...",
  "Asking Google for answers...",
  "Convincing math to behave...",
  "Downloading extra IQ...",
  "Arguing with numbers...",
  "Almost ready..."
];

// Excuses used by the random excuse generator.
const excuses = [
  "My calculator ate my homework.",
  "The numbers are on strike.",
  "The answer escaped.",
  "The decimal point joined a witness protection program.",
  "Math saw my confidence and chose violence.",
  "The plus sign needed a personal day."
];

const loader = document.querySelector("#loader");
const loadingMessage = document.querySelector("#loadingMessage");
const welcomeScreen = document.querySelector("#welcomeScreen");
const nameForm = document.querySelector("#nameForm");
const nameInput = document.querySelector("#nameInput");
const nameReaction = document.querySelector("#nameReaction");
const appShell = document.querySelector("#appShell");
const screen = document.querySelector("#screen");
const expression = document.querySelector("#expression");
const jokeMessage = document.querySelector("#jokeMessage");
const keypad = document.querySelector(".keypad");
const excuseText = document.querySelector("#excuseText");
const excuseButton = document.querySelector("#excuseButton");
const soundToggle = document.querySelector("#soundToggle");

let currentValue = "0";
let storedValue = null;
let selectedOperator = null;
let shouldResetScreen = false;
let soundsEnabled = true;

// Browser security starts audio only after a user interaction, so we create it lazily.
let audioContext = null;

function getAudioContext() {
  if (!window.AudioContext && !window.webkitAudioContext) {
    return null;
  }

  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

// Tiny synthesized sound effects keep the project asset-free and beginner-friendly.
function playSound(type) {
  if (!soundsEnabled) {
    return;
  }

  const context = getAudioContext();

  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  const soundMap = {
    tap: { frequency: 520, duration: 0.06, wave: "triangle" },
    success: { frequency: 820, duration: 0.14, wave: "sine" },
    error: { frequency: 150, duration: 0.26, wave: "sawtooth" },
    excuse: { frequency: 360, duration: 0.12, wave: "square" }
  };

  const sound = soundMap[type] || soundMap.tap;

  oscillator.type = sound.wave;
  oscillator.frequency.setValueAtTime(sound.frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(sound.frequency * 1.45, now + sound.duration);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + sound.duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + sound.duration);
}

function showTemporaryMessage(message) {
  jokeMessage.textContent = message;
  jokeMessage.classList.remove("bounce");

  // Restart the animation every time a new funny message appears.
  window.requestAnimationFrame(() => {
    jokeMessage.classList.add("bounce");
  });
}

function showNameReaction(message) {
  nameReaction.textContent = message;
  nameReaction.classList.remove("bounce");

  // Restart the welcome message animation when the visitor submits a name.
  window.requestAnimationFrame(() => {
    nameReaction.classList.add("bounce");
  });
}

function startCalculator() {
  welcomeScreen.classList.add("hidden");
  appShell.classList.remove("locked");
  appShell.classList.add("ready");
}

function handleNameSubmit(event) {
  event.preventDefault();

  const visitorName = nameInput.value.trim();
  const normalizedName = visitorName.toLowerCase();

  if (!visitorName) {
    showNameReaction("First write your name. The calculator is nosy.");
    playSound("error");
    return;
  }

  if (normalizedName === "vaidehi") {
    showNameReaction("ohh you love anirudh right ?");
    playSound("success");

    window.setTimeout(startCalculator, 1300);
    return;
  }

  showNameReaction(`Welcome, ${visitorName}. The numbers are nervous.`);
  playSound("success");
  window.setTimeout(startCalculator, 850);
}

function updateDisplay() {
  screen.textContent = currentValue;

  if (selectedOperator && storedValue !== null) {
    expression.textContent = `${storedValue} ${operatorLabel(selectedOperator)}`;
  } else {
    expression.textContent = "Ready to overthink numbers";
  }

  checkFunnyNumber();
}

function operatorLabel(operator) {
  const labels = {
    "+": "+",
    "-": "-",
    "*": "x",
    "/": "\u00f7"
  };

  return labels[operator];
}

function checkFunnyNumber() {
  const cleanValue = Number(currentValue);

  if (cleanValue === 69) {
    showTemporaryMessage("Nice \ud83d\ude0f");
  } else if (cleanValue === 420) {
    showTemporaryMessage("Snoop Dogg Approved \ud83c\udf3f");
  }
}

function appendNumber(number) {
  if (currentValue === "0" || shouldResetScreen) {
    currentValue = number;
    shouldResetScreen = false;
  } else {
    currentValue += number;
  }

  playSound("tap");
  updateDisplay();
}

function appendDecimal() {
  if (shouldResetScreen) {
    currentValue = "0";
    shouldResetScreen = false;
  }

  if (!currentValue.includes(".")) {
    currentValue += ".";
  }

  playSound("tap");
  updateDisplay();
}

function chooseOperator(operator) {
  if (selectedOperator && !shouldResetScreen) {
    calculate();
  }

  storedValue = Number(currentValue);
  selectedOperator = operator;
  shouldResetScreen = true;
  playSound("tap");
  updateDisplay();
}

function calculate() {
  if (!selectedOperator || storedValue === null) {
    return;
  }

  const nextValue = Number(currentValue);
  let result = 0;

  if (selectedOperator === "/" && nextValue === 0) {
    currentValue = "0";
    storedValue = null;
    selectedOperator = null;
    shouldResetScreen = true;
    showTemporaryMessage("Congratulations! You broke mathematics.");
    playSound("error");
    updateDisplay();
    return;
  }

  if (selectedOperator === "+") result = storedValue + nextValue;
  if (selectedOperator === "-") result = storedValue - nextValue;
  if (selectedOperator === "*") result = storedValue * nextValue;
  if (selectedOperator === "/") result = storedValue / nextValue;

  currentValue = formatResult(result);
  storedValue = null;
  selectedOperator = null;
  shouldResetScreen = true;
  showTemporaryMessage("Answer delivered with questionable confidence.");
  playSound("success");
  updateDisplay();
}

function formatResult(result) {
  // Long floating-point numbers are rounded so the display stays readable.
  return Number.isInteger(result) ? String(result) : String(Number(result.toFixed(8)));
}

function clearCalculator() {
  currentValue = "0";
  storedValue = null;
  selectedOperator = null;
  shouldResetScreen = false;
  showTemporaryMessage("Fresh start. Math remembers nothing.");
  playSound("tap");
  updateDisplay();
}

function deleteLastDigit() {
  if (shouldResetScreen || currentValue.length === 1) {
    currentValue = "0";
    shouldResetScreen = false;
  } else {
    currentValue = currentValue.slice(0, -1);
  }

  playSound("tap");
  updateDisplay();
}

function generateExcuse() {
  const randomIndex = Math.floor(Math.random() * excuses.length);
  excuseText.textContent = excuses[randomIndex];
  excuseText.classList.remove("swap");

  window.requestAnimationFrame(() => {
    excuseText.classList.add("swap");
  });

  playSound("excuse");
}

function handleKeypadClick(event) {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  if (button.dataset.number) appendNumber(button.dataset.number);
  if (button.dataset.operator) chooseOperator(button.dataset.operator);
  if (button.dataset.action === "decimal") appendDecimal();
  if (button.dataset.action === "calculate") calculate();
  if (button.dataset.action === "clear") clearCalculator();
  if (button.dataset.action === "delete") deleteLastDigit();
}

// Keyboard support makes the calculator feel complete on desktop.
function handleKeyboardInput(event) {
  const isTypingName = document.activeElement === nameInput;
  const calculatorIsLocked = appShell.classList.contains("locked");

  if (isTypingName || calculatorIsLocked) {
    return;
  }

  if (/^[0-9]$/.test(event.key)) appendNumber(event.key);
  if (["+", "-", "*", "/"].includes(event.key)) chooseOperator(event.key);
  if (event.key === ".") appendDecimal();
  if (event.key === "Enter" || event.key === "=") calculate();
  if (event.key === "Backspace") deleteLastDigit();
  if (event.key === "Escape") clearCalculator();
}

function runLoadingScreen() {
  let messageIndex = 0;
  loadingMessage.textContent = loadingMessages[messageIndex];

  const messageTimer = window.setInterval(() => {
    messageIndex += 1;

    if (messageIndex < loadingMessages.length) {
      loadingMessage.textContent = loadingMessages[messageIndex];
    } else {
      window.clearInterval(messageTimer);
      loader.classList.add("hidden");
      nameInput.focus();
    }
  }, 820);
}

nameForm.addEventListener("submit", handleNameSubmit);
keypad.addEventListener("click", handleKeypadClick);
document.addEventListener("keydown", handleKeyboardInput);
excuseButton.addEventListener("click", generateExcuse);
soundToggle.addEventListener("click", () => {
  soundsEnabled = !soundsEnabled;
  soundToggle.classList.toggle("active", soundsEnabled);
  soundToggle.textContent = soundsEnabled ? "SFX" : "OFF";
});

runLoadingScreen();
updateDisplay();
