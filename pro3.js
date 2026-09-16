const cameraButton = document.querySelector('#camera-button');
const video = document.querySelector('#camera-video');
const cameraPlaceholder = document.querySelector('#camera-placeholder');
const handOverlay = document.querySelector('#hand-overlay');
const overlayContext = handOverlay.getContext('2d');
const detectedMove = document.querySelector('#detected-move');
const aiChoice = document.querySelector('#ai-choice');
const aiThinking = document.querySelector('#ai-thinking');
const message = document.querySelector('#arena-message');
const playerScoreElement = document.querySelector('#player-score');
const aiScoreElement = document.querySelector('#ai-score');
const roundElement = document.querySelector('#round');
const liveStatus = document.querySelector('#live-status');
const resetButton = document.querySelector('#reset-button');

const moves = ['rock', 'paper', 'scissors'];
const icons = { rock: '●', paper: '▣', scissors: '✂' };
let stream;
let playerScore = 0;
let aiScore = 0;
let round = 0;
let hands;
let camera;
let lastGestureAt = 0;

function setMessage(text, result = '') {
  message.textContent = text;
  message.className = `arena-message ${result}`;
}

function playRound(playerMove) {
  if (!moves.includes(playerMove)) return;
  const aiMove = moves[Math.floor(Math.random() * moves.length)];
  aiThinking.classList.add('hidden');
  aiChoice.textContent = icons[aiMove];
  aiChoice.classList.remove('hidden');
  aiChoice.classList.add('reveal');
  setTimeout(() => aiChoice.classList.remove('reveal'), 350);
  round += 1;
  roundElement.textContent = String(round).padStart(2, '0');
  if (playerMove === aiMove) setMessage(`Draw. Both played ${playerMove}.`, '');
  else if ((playerMove === 'rock' && aiMove === 'scissors') || (playerMove === 'paper' && aiMove === 'rock') || (playerMove === 'scissors' && aiMove === 'paper')) {
    playerScore += 1;
    setMessage(`You win. ${playerMove} beats ${aiMove}.`, 'win');
  } else {
    aiScore += 1;
    setMessage(`AI wins. ${aiMove} beats ${playerMove}.`, 'lose');
  }
  playerScoreElement.textContent = String(playerScore).padStart(2, '0');
  aiScoreElement.textContent = String(aiScore).padStart(2, '0');
}

function classifyGesture(landmarks) {
  const fingerTips = [8, 12, 16, 20];
  const fingerPips = [6, 10, 14, 18];
  const extended = fingerTips.map((tip, index) => landmarks[tip].y < landmarks[fingerPips[index]].y).filter(Boolean).length;
  if (extended >= 4) return 'paper';
  if (extended === 2 && landmarks[8].y < landmarks[6].y && landmarks[12].y < landmarks[10].y && landmarks[16].y > landmarks[14].y) return 'scissors';
  if (extended <= 1) return 'rock';
  return null;
}

function onHands(results) {
  overlayContext.clearRect(0, 0, handOverlay.width, handOverlay.height);
  if (results.image) {
    handOverlay.width = results.image.width;
    handOverlay.height = results.image.height;
  }
  if (!results.multiHandLandmarks || !results.multiHandLandmarks.length) {
    detectedMove.textContent = 'SHOW YOUR HAND';
    return;
  }
  results.multiHandLandmarks.forEach(landmarks => {
    drawConnectors(overlayContext, landmarks, HAND_CONNECTIONS, { color: '#35e0db', lineWidth: 5 });
    drawLandmarks(overlayContext, landmarks, { color: '#ff5b83', fillColor: '#35e0db', lineWidth: 2, radius: 4 });
  });
  const gesture = classifyGesture(results.multiHandLandmarks[0]);
  if (!gesture) return;
  detectedMove.textContent = `DETECTED: ${gesture.toUpperCase()}`;
  if (Date.now() - lastGestureAt > 2200) {
    lastGestureAt = Date.now();
    playRound(gesture);
  }
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false });
    video.srcObject = stream;
    video.classList.remove('hidden');
    cameraPlaceholder.classList.add('hidden');
    liveStatus.textContent = 'CAMERA LIVE';
    liveStatus.previousElementSibling.classList.add('live');
    cameraButton.textContent = 'Camera active';
    cameraButton.classList.add('active');
    if (window.Hands && window.Camera) {
      hands = new Hands({ locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
      hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: .65, minTrackingConfidence: .6 });
      hands.onResults(onHands);
      camera = new Camera(video, { onFrame: async () => hands.send({ image: video }), width: 640, height: 480 });
      camera.start();
    }
  } catch (error) {
    cameraPlaceholder.innerHTML = '<span>⌁</span>Camera unavailable.<br>Use the move buttons below to play.';
    setMessage('Camera permission is needed for hand play.', '');
  }
}

cameraButton.addEventListener('click', startCamera);
document.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => playRound(button.dataset.move)));
resetButton.addEventListener('click', () => { playerScore = 0; aiScore = 0; round = 0; playerScoreElement.textContent = '00'; aiScoreElement.textContent = '00'; roundElement.textContent = '00'; aiChoice.classList.add('hidden'); setMessage('Choose your move to begin.', ''); });
