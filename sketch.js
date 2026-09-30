let socket = io();

let slider = document.querySelector('#rotationSlider');
let square = document.querySelector('#square');
let soundToggle = document.querySelector('#soundToggle');
let bubbleLayer = document.querySelector('#bubbleLayer');

const BUBBLE_COUNT = 9; // one per 10% mark: 10,20,...90
let bubbles = [];

for (let i = 0; i < BUBBLE_COUNT; i++) {
  let bubble = document.createElement('div');
  bubble.className = 'bubble';

  let size = 20 + Math.random() * 40;
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;

  let top = 5 + Math.random() * 85;
  let left = 5 + Math.random() * 85;
  bubble.style.top = `${top}vh`;
  bubble.style.left = `${left}vw`;

  let threshold = (i + 1) * 10;
  bubble.dataset.threshold = threshold;
  let bubbleHue = (i / BUBBLE_COUNT) * 360;
  bubble.style.setProperty('--bubble-glow', `hsl(${bubbleHue}, 90%, 65%)`);
  bubble.dataset.hue = bubbleHue;

  bubbleLayer.appendChild(bubble);
  bubbles.push(bubble);
}

function updateBubbles(percent) {
  bubbles.forEach((bubble) => {
    let threshold = Number(bubble.dataset.threshold);
    if (percent >= threshold) {
      bubble.classList.add('active');
      bubble.style.background = `hsl(${bubble.dataset.hue}, 85%, 65%)`;
    } else {
      bubble.classList.remove('active');
      bubble.style.background = 'rgba(255, 255, 255, 0.35)';
    }
  });
}

let audioCtx = null;
let oscillator = null;
let gainNode = null;
let soundOn = false;

soundToggle.addEventListener('click', () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      oscillator = audioCtx.createOscillator();
      gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 200;
      gainNode.gain.value = 0.0001;
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      console.log('Audio context created, state:', audioCtx.state);
    }

    audioCtx.resume().then(() => {
      console.log('Audio context resumed, state:', audioCtx.state);
    });

    soundOn = !soundOn;
    gainNode.gain.value = soundOn ? 0.25 : 0.0001;
    soundToggle.textContent = soundOn ? '🔇 Mute Sound' : '🔊 Enable Sound';
    console.log('Sound is now:', soundOn ? 'ON' : 'OFF', '| gain:', gainNode.gain.value);
  } catch (err) {
    console.error('Audio error:', err);
    soundToggle.textContent = 'Sound not supported';
  }
});

function updateVisuals(value) {
  let hue = (value / 360) * 360;
  square.style.backgroundColor = `hsl(${hue}, 80%, 60%)`;
  square.style.boxShadow = `0 0 30px hsl(${hue}, 80%, 60%)`;
  square.style.transform = `rotate(${value}deg)`;
  document.body.style.background =
    `linear-gradient(135deg, hsl(${hue}, 70%, 85%), hsl(${(hue + 60) % 360}, 70%, 75%))`;

  let freq = 200 + (value / 360) * 600;
  if (oscillator) {
    oscillator.frequency.value = freq;
  }

  let percent = (value / 360) * 100;
  updateBubbles(percent);
}

slider.addEventListener("input", function (e) {
  socket.emit("rotation", this.value);
  updateVisuals(this.value);
});

socket.on('rotationResponse', (data) => {
  slider.value = data;
  updateVisuals(data);
  console.log("someone changed the rotation to " + data);
});