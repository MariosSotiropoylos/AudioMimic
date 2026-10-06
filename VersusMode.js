/* GAME SETTINGS */
let MAX_ROUNDS = 5;
let round = 1;
let scores = {player1: 0, player2: 0};
let creatorPlayer = 1;
let imitatorPlayer = 2;

/* PLAYER ICONS */
let player1IconChoice = null;
let player2IconChoice = null;

/* AUDIO VARIABLES */
let currentRecorder = null;
let currentStream = null;
let audioContext = null;
let analyser = null;
let animationId = null;
let originalAudioBuffer = null;
let imitationAudioBuffer = null;
let recordingStartTime = 0;
let recordingIsCreator = false;
let currentlyRecordingSide = null;

/* DOM ELEMENTS */
const roundSelection = document.getElementById("roundSelection");
const gamePanel = document.getElementById("gamePanel");
const round5 = document.getElementById("round5");
const round10 = document.getElementById("round10");
const turn = document.getElementById("turn");
const message = document.getElementById("message");
const waveform = document.getElementById("waveform");
const pitchDisplay = document.getElementById("pitchDisplay");
const countdown = document.getElementById("countdown");
const player1Controls = document.getElementById("player1Controls");
const player2Controls = document.getElementById("player2Controls");
const recordP1 = document.getElementById("recordP1");
const stopP1 = document.getElementById("stopP1");
const playOriginal = document.getElementById("playOriginal");
const readyP2 = document.getElementById("readyP2");
const stopP2 = document.getElementById("stopP2");
const resultArea = document.getElementById("resultArea");
const resultText = document.getElementById("resultText");
const pitchScore = document.getElementById("pitchScore");
const shapeScore = document.getElementById("shapeScore");
const durationScore = document.getElementById("durationScore");
const volumeScore = document.getElementById("volumeScore");
const nextRound = document.getElementById("nextRound");
const winnerArea = document.getElementById("winnerArea");
const winnerText = document.getElementById("winnerText");
const restart = document.getElementById("restart");
const player1Score = document.getElementById("player1Score");
const player2Score = document.getElementById("player2Score");


/* ICON SELECTION DOM ELEMENTS */
const iconSelection = document.getElementById("iconSelection");
const player1IconSelection = document.getElementById("player1IconSelection");
const player2IconSelection = document.getElementById("player2IconSelection");
const confirmPlayer1 = document.getElementById("confirmPlayer1");
const confirmPlayer2 = document.getElementById("confirmPlayer2");
const player1SelectedText = document.getElementById("player1SelectedText");
const player2SelectedText = document.getElementById("player2SelectedText");
const player1Icon = document.getElementById("player1Icon");
const player2Icon = document.getElementById("player2Icon");


/* FUNCTION TO RESIZE THE WAVEFORM */
function resizeWaveform() 
{
  const rect = waveform.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const dpr = window.devicePixelRatio || 1;
  
  waveform.width = width * dpr;
  waveform.height = height * dpr;

  const ctx = waveform.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return {ctx, width, height};
}


/* FUNCTION TO DRAW THE 2-PANEL LAYOUT */
function drawWaveformLayout(ctx, width, height) 
{
    ctx.clearRect(0, 0, width, height);

    /* Background */
    ctx.fillStyle = "#111827"; ctx.fillRect(0, 0, width, height);

    /* Left / right panels */
    const halfWidth = width / 2;
    ctx.fillStyle = "rgba(77, 171, 247, 0.05)";
    ctx.fillRect(0, 0, halfWidth, height);
    ctx.fillStyle = "rgba(81, 207, 102, 0.05)";
    ctx.fillRect(halfWidth, 0, halfWidth, height);

    /* Divider Line */
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(halfWidth, 0);
    ctx.lineTo(halfWidth, height);
    ctx.stroke();

    /* Center lines */
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(halfWidth, height / 2);
    ctx.moveTo(halfWidth, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    /* Labels */
    ctx.font = "bold 14px Arial";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#4dabf7";
    ctx.textAlign = "left";
    ctx.fillText("ORIGINAL", 12, 10);
    ctx.fillStyle = "#51cf66";
    ctx.textAlign = "right";
    ctx.fillText("IMITATION", width - 12, 10);

    /* Panel borders */
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, halfWidth - 1, height - 1);
    ctx.strokeRect(halfWidth + 0.5, 0.5, halfWidth - 1, height - 1);
}


/* FUNCTION TO DRAW A RECORDED AUDIOBUFFER IN 1 HALF */
function drawRecordedWaveform(buffer, side, ctx, width, height) 
{
    if (!buffer) {return;}

    const channelData = buffer.getChannelData(0);
    if (!channelData || channelData.length === 0) {return;}

    const halfWidth = width / 2;

    const startX = side === "original"
        ? 0
        : halfWidth;

    const endX = side === "original"
        ? halfWidth
        : width;

    const drawWidth = endX - startX;
    const centerY = height / 2;
    const amplitude = height * 0.38;

    ctx.save();

   /* Restrict drawing to the correct half */
    ctx.beginPath();
    ctx.rect(startX, 0, drawWidth, height);
    ctx.clip();

    ctx.strokeStyle =
        side === "original"
            ? "#4dabf7"
            : "#51cf66";

    ctx.lineWidth = 2;

    ctx.beginPath();

    const samplesPerPixel =
        channelData.length / drawWidth;

    for (let x = 0; x < drawWidth; x++) 
	{
        const start = Math.floor(x * samplesPerPixel);
        const end = Math.min(channelData.length, Math.floor((x + 1) * samplesPerPixel));

        let min = 1;
        let max = -1;

        for (let i = start; i < end; i++) 
		{
            const value = channelData[i];
            if (value < min) min = value;
            if (value > max) max = value;
        }

        const y1 = centerY + min * amplitude;
        const y2 = centerY + max * amplitude;
		
        const canvasX = startX + x;

        if (x === 0) 
		{
         ctx.moveTo(canvasX, y1);
        } 
		else 
		{
         ctx.lineTo(canvasX, y1);
        }

        ctx.lineTo(canvasX, y2);
    }

    ctx.stroke();

    ctx.restore();
}


/* FUNCTION TO DRAW BOTH SAVED WAVEFORMS */
function drawBothWaveforms() 
{
    if (!waveform) {return;}

    const {ctx, width, height} = resizeWaveform();

    drawWaveformLayout(ctx, width, height);

    if (originalAudioBuffer) 
	{ 
	  drawRecordedWaveform(originalAudioBuffer, "original", ctx, width, height);
    }

    if (imitationAudioBuffer) 
	{
      drawRecordedWaveform(imitationAudioBuffer, "imitation", ctx, width, height);
    }

   /* Redraw divider line and labels over waveform */
    drawWaveformOverlay(ctx,width, height);
}


/* FUNCTION TO DRAW THE OVERLAY DIVIDER LINE AND THE LABELS */
function drawWaveformOverlay(ctx, width, height) 
{
    const halfWidth = width / 2;

   /* Divider Line */
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(halfWidth, 0);
    ctx.lineTo(halfWidth, height);
    ctx.stroke();

   /* Labels */
    ctx.font = "bold 14px Arial";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#4dabf7";
    ctx.textAlign = "left";
    ctx.fillText("ORIGINAL", 12, 10);
    ctx.fillStyle = "#51cf66";
    ctx.textAlign = "right";
    ctx.fillText("IMITATION", width - 12, 10);
}


/* FUNCTION TO DRAW A LIVE WAVEFORM FROM THE MIC */
function drawLiveWaveform(side) 
{
    if (!analyser) {return;}

    currentlyRecordingSide = side;

    const {ctx, width, height} = resizeWaveform();

    const dataArray = new Uint8Array(analyser.fftSize);

    function draw() 
	{
        if (!analyser || !currentRecorder) {return;}

        analyser.getByteTimeDomainData(dataArray);

      /* ! Always FIRST redraw complete layout ! */
        drawWaveformLayout(ctx, width, height);

      /* ! Draw previously recorded waveforms first so the live one DOESNT erase the first ! */
        if (originalAudioBuffer) 
		{
         drawRecordedWaveform(originalAudioBuffer, "original", ctx, width, height);
        }

        if (imitationAudioBuffer) 
		{
		 drawRecordedWaveform(imitationAudioBuffer, "imitation", ctx, width, height);
        }

       /* Current live waveform */
        const halfWidth = width / 2;

        const startX =
            side === "original"
                ? 0
                : halfWidth;

        const drawWidth = halfWidth;
        const centerY = height / 2;
        const amplitude = height * 0.38;

        ctx.save();
        ctx.beginPath();
        ctx.rect(startX, 0, drawWidth, height);
        ctx.clip();

        ctx.strokeStyle =
            side === "original"
                ? "#4dabf7"
                : "#51cf66";

        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < dataArray.length; i++) 
		{
            const x = startX + (i / (dataArray.length - 1)) * drawWidth;

            const value = (dataArray[i] - 128) / 128;

            const y = centerY + value * amplitude;

            if (i === 0) 
			{ 
			 ctx.moveTo(x, y);
            } 
			else 
			{
             ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        ctx.restore();

        drawWaveformOverlay(ctx, width, height);

        animationId = requestAnimationFrame(draw);
    }

    draw();
}


/* FUNCTION TO START THE MICROPHONE */
async function startMicrophone() 
{
    if (currentStream) {return;}

    try 
	{
      currentStream = await navigator.mediaDevices.getUserMedia({
                audio: {echoCancellation: false, noiseSuppression: false, autoGainControl: false}
                                                                });

        if (!audioContext) 
		{
         audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioContext.state === "suspended") 
		{
         await audioContext.resume();
        }

        const source = audioContext.createMediaStreamSource(currentStream);

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0;

        source.connect(analyser);

    } 
	
	catch (error) 
	{
        console.error("Microphone error:", error);

        alert("Could not access the microphone. " + "Please allow microphone access.");

        throw error;
    }
}


/* FUNCTION TO STOP THE MICROPHONE */
function stopMicrophone() 
{
    if (animationId) 
	{
     cancelAnimationFrame(animationId);
     animationId = null;
    }

    if (currentStream) 
	{
     currentStream
            .getTracks()
            .forEach(track => track.stop());
			
     currentStream = null;
    }

    analyser = null;
}


/* FUNCTION TO DECODE THE RECORDED AUDIO */
async function decodeAudioBlob(blob) 
{
    if (!audioContext) 
	{
     audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const arrayBuffer = await blob.arrayBuffer();

    return await audioContext.decodeAudioData(arrayBuffer);
}


/* FUNCTION TO BEGIN RECORDING PROCESS */
async function beginPlayerRecording(player) 
{
    try 
	{
     await startMicrophone();
     startRecording(player);
    } 
	catch (error) {console.error(error);}
}


/* FUNCTION TO SRART RECORDING */
function startRecording(player) 
{
    if (!currentStream) {return;}

    recordingIsCreator =
        player === creatorPlayer;

    const recordingSide =
        recordingIsCreator
            ? "original"
            : "imitation";

    currentlyRecordingSide = recordingSide;

    const chunks = [];

    currentRecorder = new MediaRecorder(currentStream);

    recordingStartTime = performance.now();

  /* Button states */
    if (player === 1) 
	{
        recordP1.classList.add("hidden");
        stopP1.classList.remove("hidden");
    }

    if (player === 2) 
	{
        readyP2.classList.add("hidden");
        stopP2.classList.remove("hidden");
    }

  /* Message */
    turn.textContent = `Round ${round} — Player ${player}`;

    message.textContent = `Player ${player} is recording...`;

    pitchDisplay.textContent = "Recording...";

    countdown.textContent = "";

  /* Recorder events */
    currentRecorder.ondataavailable = event => 
	{
        if (event.data.size > 0) {chunks.push(event.data);}
    };

    currentRecorder.onstop = async () => 
	{
        const duration = (performance.now() - recordingStartTime) / 1000;

        const blob = new Blob(chunks,{type: currentRecorder.mimeType || "audio/webm"});

        try 
		{
         const buffer = await decodeAudioBlob(blob);

         /* CREATOR's Recording */
            if (recordingIsCreator) 
			{
			 originalAudioBuffer = buffer;
             drawBothWaveforms();
             stopMicrophone();
             currentRecorder = null;
             showImitatorControls();
            }

         /* IMITATOR's Recording */
            else 
			{
             imitationAudioBuffer = buffer;
             drawBothWaveforms();
             stopMicrophone();
             currentRecorder = null;
             finishRound();
            }
        } 
		catch (error) 
		{
         console.error("Audio decoding error:", error);
         stopMicrophone();
         currentRecorder = null;
         message.textContent = "Could not process the recording.";
        }
    };

  /* Start */
    currentRecorder.start();
    drawLiveWaveform(recordingSide);
}


/* RECORD BUTTONS EVENT */
recordP1.addEventListener("click", async () => {await beginPlayerRecording(1);});

readyP2.addEventListener("click", async () => {await beginPlayerRecording(2);});


/* STOP BUTTONS EVENT */
stopP1.addEventListener("click", () => {
                                        if (currentRecorder && currentRecorder.state !== "inactive") 
									    {
                                         currentRecorder.stop();
                                        }
                                       });

stopP2.addEventListener("click", () => {
                                        if (currentRecorder && currentRecorder.state !== "inactive") 
										{
                                         currentRecorder.stop();
                                        }
                                       });


/* FUNCTION TO HEAR THE ORIGINAL RECORDING*/
function playAudioBuffer(buffer) 
{
    if (!buffer || !audioContext) {return;}

    if (audioContext.state === "suspended") {audioContext.resume();}

    const source = audioContext.createBufferSource();

    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}


/* HEAR ORIGINAL BUTTON EVENT */
playOriginal.addEventListener("click", () => {playAudioBuffer(originalAudioBuffer);});


/* FUNCTION TO CREATE THE HEAR ORIGINAL BUTTON */
let playOriginalP1 = null;

function createPlayer1PlayButton() 
{
    if (playOriginalP1) {return;}

    playOriginalP1 = document.createElement("button");
    playOriginalP1.id = "playOriginalP1";
    playOriginalP1.className = "play";
    playOriginalP1.textContent = "🔊 Play Original";
    playOriginalP1.classList.add("hidden");
    playOriginalP1.addEventListener("click",() => {playAudioBuffer(originalAudioBuffer);});

    player1Controls.insertBefore(playOriginalP1, recordP1);
}


/* FUNCTION TO SHOW IMITATOR'S CONTROLS */
function showImitatorControls() 
{
    player1Controls.classList.add("hidden");
    player2Controls.classList.add("hidden");
    playOriginal.classList.add("hidden");

    if (playOriginalP1) 
	{
     playOriginalP1.classList.add( "hidden");
    }

  /* When Player 1 is the imitator */
    if (imitatorPlayer === 1) 
	{
        player1Controls.classList.remove("hidden");

        createPlayer1PlayButton();

        playOriginalP1.classList.remove("hidden");
        recordP1.classList.remove("hidden");

        stopP1.classList.add("hidden");

        recordP1.textContent ="🎤 I'm Ready";

        turn.textContent = `Round ${round} — Player 1`;

        message.textContent = "Player 1: listen to the original, then copy it.";
		
        return;
    }

  /* When Player 1 is the imitator */
    player2Controls.classList.remove("hidden");

    playOriginal.classList.remove("hidden");

    readyP2.textContent = "🎤 I'm Ready";
    readyP2.classList.remove("hidden");

    stopP2.classList.add("hidden");

    turn.textContent = `Round ${round} — Player 2`;

    message.textContent = "Player 2: listen to the original, then copy it.";
}


/* FUNCTION FOR PITCH DETECTION */
function detectPitch(buffer) 
{
    if (!buffer) {return 0;}

    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const SIZE = Math.min(data.length, 4096);

    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) 
	{
	 rms += data[i] * data[i];
    }

    rms = Math.sqrt(rms / SIZE);

    if (rms < 0.01) {return 0;}

    for (let offset = 20; offset < SIZE / 2; offset++) 
	{
        let correlation = 0;

        for (let i = 0; i < SIZE - offset; i++) 
		{
            correlation += data[i] * data[i + offset];
        }

        correlation /=SIZE - offset;

        if (correlation > bestCorrelation) 
		{
            bestCorrelation = correlation;
            bestOffset = offset;
        }
    }

    if (bestOffset === -1) {return 0;}

    return sampleRate / bestOffset;
}


/* FUNCTION FOR VOLUME CALCULATION (RMS: Average audio signal level) */
function calculateRMS(buffer) 
{
    if (!buffer) {return 0;}

    const data = buffer.getChannelData(0);

    let sum = 0;

    for (let i = 0; i < data.length; i++) 
	{
        sum += data[i] * data[i];
    }

    return Math.sqrt(sum / data.length);
}


/* CLAMPING FUNCTION (TO KEEP SCORE BETWEEN 0 AND 100) */
function clamp(value, min, max) 
{
    return Math.max(min, Math.min(max,value));
}


/* PITCH SCORE CALCULATION*/
function calculatePitchScore(original, imitation) 
{
    if (!original || !imitation) {return 0;}

    const cents = 1200 * Math.log2(imitation / original);

    const absoluteCents = Math.abs(cents);

    return clamp(100 - (absoluteCents / 600) * 100, 0, 100);
}


/* DURATION SCORE CALCULATION*/
function calculateDurationScore(original, imitation) 
{
    if (!original || !imitation) {return 0;}

    const difference =Math.abs(original.duration - imitation.duration);

    const percentage = difference / original.duration;

    return clamp(100 - percentage * 100, 0, 100);
}


/* VOLUME SCORE CALCULATION*/
function calculateVolumeScore(original,imitation) 
{
    const originalRMS = calculateRMS(original);

    const imitationRMS = calculateRMS(imitation);

    if (originalRMS === 0 || imitationRMS === 0) {return 0;}

    const ratio = imitationRMS /originalRMS;

    const difference = Math.abs(1 - ratio);

    return clamp(100 - difference * 100, 0, 100);
}


/* WAVEFORM SHAPE SCORE CALCULATION*/
function calculateShapeScore(original,imitation) 
{
    if (!original ||!imitation) {return 0;}

    const originalData = original.getChannelData(0);

    const imitationData = imitation.getChannelData(0);

    const samples = 1000;

    let difference = 0;

    for (let i = 0; i < samples; i++) 
	{
        const originalIndex = Math.floor(i * originalData.length / samples);

        const imitationIndex = Math.floor(i * imitationData.length /samples);

        difference += Math.abs(originalData[originalIndex] - imitationData[imitationIndex]);
    }

    difference /= samples;

    return clamp(100 - difference * 100, 0,100
    );
}


/* FUNCTION TO FINISH A ROUND */
function finishRound() 
{
    drawBothWaveforms();

    if (!originalAudioBuffer || !imitationAudioBuffer) {return;}

    const originalPitch = detectPitch(originalAudioBuffer);
    const imitationPitch = detectPitch(imitationAudioBuffer);
	
    const pScore = calculatePitchScore(originalPitch, imitationPitch);
    const sScore = calculateShapeScore(originalAudioBuffer, imitationAudioBuffer);
    const dScore = calculateDurationScore(originalAudioBuffer, imitationAudioBuffer);
    const vScore = calculateVolumeScore(originalAudioBuffer, imitationAudioBuffer);

    const overall = Math.round(( pScore + sScore + dScore + vScore) / 4);

  /* In each round ONLY the imitator must receive points */
    scores[`player${imitatorPlayer}`] += overall;

   /* Update scoreboard */
    player1Score.textContent = scores.player1;
    player2Score.textContent = scores.player2;

   /* Show the results */
    pitchScore.textContent = `${Math.round(pScore)}%`;
    shapeScore.textContent = `${Math.round(sScore)}%`;
    durationScore.textContent = `${Math.round(dScore)}%`;
    volumeScore.textContent = `${Math.round(vScore)}%`;

    resultText.textContent = `Player ${imitatorPlayer} scored ${overall} points this round!`;

    pitchDisplay.textContent =
        originalPitch > 0 &&
        imitationPitch > 0
            ? `Original: ${originalPitch.toFixed(1)} Hz | ` +
              `Imitation: ${imitationPitch.toFixed(1)} Hz`
            : "Pitch could not be detected.";

    resultArea.classList.remove("hidden");

    player1Controls.classList.add("hidden");
    player2Controls.classList.add("hidden");

    if (playOriginalP1) 
	{
        playOriginalP1.classList.add("hidden");
    }
    playOriginal.classList.add("hidden");
    stopP1.classList.add("hidden");
    stopP2.classList.add("hidden");

    turn.textContent = `Round ${round} Complete`;
    message.textContent = "Here are the results of the imitation.";
}


/* NEXT ROUND EVENT */
nextRound.addEventListener("click",() => 
{
  if (round >= MAX_ROUNDS) 
  {
   showWinner();
   return;
  }
  
  round++;

  /* Switch the players'  roles */
  if (round % 2 === 1) 
  {
   creatorPlayer = 1;
   imitatorPlayer = 2;
  } 
  else 
  {
   creatorPlayer = 2;
   imitatorPlayer = 1;
  }

  /* Reset audio */
  originalAudioBuffer = null;
  imitationAudioBuffer = null;
  currentRecorder = null;
  recordingIsCreator = false;
  currentlyRecordingSide = null;

  /* Reset UI */
  resultArea.classList.add("hidden");
  winnerArea.classList.add("hidden");
  pitchDisplay.textContent = "";
  countdown.textContent = "";

  /* Reset the button labels */
  if (creatorPlayer === 1) {recordP1.textContent = "🎤 Start Recording";} 
  else {recordP1.textContent = "🎤 I'm Ready";}

  if (creatorPlayer === 2) {readyP2.textContent = "🎤 Start Recording";} 
  else {readyP2.textContent = "🎤 I'm Ready";}

  recordP1.classList.remove("hidden");
  stopP1.classList.add("hidden");
  
  readyP2.classList.remove("hidden");
  stopP2.classList.add("hidden");

  /* Start he next round */
  startRound();
}
);


/* FUNCTION TO START A ROUND */
function startRound() 
{
    drawBothWaveforms();

    if (creatorPlayer === 1) 
	{
	 player1Controls.classList.remove("hidden");
     player2Controls.classList.add("hidden");

     recordP1.textContent = "🎤 Start Recording";
     turn.textContent = `Round ${round} — Player 1`;

     message.textContent = "Player 1: make a sound for Player 2 to copy.";
    } 
	else 
	{
     player1Controls.classList.add("hidden");
     player2Controls.classList.remove("hidden");

     readyP2.textContent = "🎤 Start Recording";

     turn.textContent = `Round ${round} — Player 2`;
	 message.textContent = "Player 2: make a sound for Player 1 to copy.";
    }

    playOriginal.classList.add("hidden");

    if (playOriginalP1) {playOriginalP1.classList.add("hidden");}

    resultArea.classList.add("hidden");
}


/* PLAYER ICON SELECTION */
 /* ICON SETUP */
function setupIconSelection() 
{
    player1IconChoice = null;
    player2IconChoice = null;

    confirmPlayer1.disabled = true;
    confirmPlayer2.disabled = true;

    player1SelectedText.textContent = "Select an icon";
    player2SelectedText.textContent = "Select an icon";

    player1IconSelection.classList.remove("hidden");
    player2IconSelection.classList.add("hidden");

    resetIconButtons();
}

 /* ICON RESETING */
function resetIconButtons() 
{
    const buttons = iconSelection.querySelectorAll(".icon-option");

    buttons.forEach(button => 
    {
        button.classList.remove("selected-player1", "selected-player2", "unavailable");
        button.disabled = false;
    });
}

 /* PLAYER 1 SELECTS AN ICON */
function selectPlayer1Icon(button) 
{
    const icon = button.getAttribute("data-icon");
	
    player1IconChoice = icon;

    const buttons = player1IconSelection.querySelectorAll(".icon-option");

    buttons.forEach(option => {option.classList.remove("selected-player1");});
    button.classList.add("selected-player1");

    player1SelectedText.textContent = `Icon ${icon} selected`;
    confirmPlayer1.disabled = false;
}

 /* PLAYER 2 SELECTS AN ICON */
function selectPlayer2Icon(button) 
{
    const icon = button.getAttribute("data-icon");

   /* ! Player 2 cannot choose Player 1's icon ! */
    if (icon === player1IconChoice) {return;}

    player2IconChoice = icon;

    const buttons = player2IconSelection.querySelectorAll(".icon-option");

    buttons.forEach(option => {option.classList.remove("selected-player2");});

    button.classList.add("selected-player2");
    player2SelectedText.textContent = `Icon ${icon} selected`;
    confirmPlayer2.disabled = false;
}

 /* PLAYER 1 ICON CONFIRMATION */
confirmPlayer1.addEventListener("click", () => 
{
    if (!player1IconChoice) {return;}

   /* Set Player 1's icon */
    player1Icon.src = `./images/icon${player1IconChoice}.png`;
    player1Icon.alt = `Player 1 icon ${player1IconChoice}`;	
	player1Icon.style.display = "block";

   /* Switch to Player 2 */
    player1IconSelection.classList.add("hidden");
    player2IconSelection.classList.remove("hidden");


   /* Disable Player 1's selected icon for Player 2 */
    const player2Buttons = player2IconSelection.querySelectorAll(".icon-option");

    player2Buttons.forEach(button => 
    {
        const icon = button.getAttribute("data-icon");
        if (icon === player1IconChoice) 
        {
          button.disabled = true;
          button.classList.add("unavailable");
        }
    });
});

 /* PLAYER 2 ICON CONFIRMATION */
confirmPlayer2.addEventListener("click", () => 
{
    if (!player2IconChoice) {return;}

   /* Set Player 2's icon */
    player2Icon.src = `./images/icon${player2IconChoice}.png`;
    player2Icon.alt = `Player 2 icon ${player2IconChoice}`;
    player2Icon.style.display = "block";
	
   /* Hide icon selection */
    iconSelection.classList.add("hidden");

   /* Show round selection */
    roundSelection.classList.remove("hidden");
});

 /* ICON BUTTON EVENTS */
const player1IconButtons = player1IconSelection.querySelectorAll(".icon-option");

player1IconButtons.forEach(button => 
{
    button.addEventListener("click", () => 
    {
      selectPlayer1Icon(button);
    });
});

const player2IconButtons = player2IconSelection.querySelectorAll(".icon-option");

player2IconButtons.forEach(button => 
{
    button.addEventListener("click", () => 
    {
      selectPlayer2Icon(button);
    });
});


/* FUNCTION TO START THE GAME */
function startGame(numberOfRounds) 
{
    MAX_ROUNDS = numberOfRounds;
    round = 1;
	
    scores.player1 = 0;
    scores.player2 = 0;
    player1Score.textContent = "0";
    player2Score.textContent = "0";

    creatorPlayer = 1;
    imitatorPlayer = 2;

    originalAudioBuffer = null;
    imitationAudioBuffer = null;

   /* Hide round selection */
    roundSelection.classList.add("hidden");
	
  /* icon selection remains hidden */
    iconSelection.classList.add("hidden");

   /* Show the game */
    gamePanel.classList.remove("hidden");

   /* Start the game */
    startRound();
}


/* NUMBER OF ROUNDS SELECTION */
round5.addEventListener("click",() => {startGame(5);});

round10.addEventListener("click",() => {startGame(10);});



/* FUNCTION FOR THE ENDING */
function showWinner() 
{
    player1Controls.classList.add("hidden");
    player2Controls.classList.add("hidden");
    resultArea.classList.add("hidden");
    if (playOriginalP1) {playOriginalP1.classList.add("hidden");}
    playOriginal.classList.add("hidden");

    winnerArea.classList.remove("hidden");

    if (scores.player1 > scores.player2) 
	{
        winnerText.textContent = `🏆 Player 1 wins with ${scores.player1} points!`;
    } 
	else if 
	(scores.player2 > scores.player1) 
	{
        winnerText.textContent = `🏆 Player 2 wins with ${scores.player2} points!`;
    } 
	else 
	{
        winnerText.textContent = `🤝 It's a tie! Both players scored ${scores.player1} points.`;
    }

    turn.textContent = "Game Over";
    message.textContent = "Thanks for playing Sound Mimic!";
}


/* RESTARTING THE GAME */
restart.addEventListener("click",() => 
{
  stopMicrophone();

  currentRecorder = null;
  originalAudioBuffer = null;
  imitationAudioBuffer = null;

  round = 1;

  scores.player1 = 0;
  scores.player2 = 0;
  player1Score.textContent = "0";
  player2Score.textContent = "0";

  creatorPlayer = 1;
  imitatorPlayer = 2;
  
  player1IconChoice = null;
  player2IconChoice = null;
  
 /* Hide everything */
  winnerArea.classList.add("hidden");
  gamePanel.classList.add("hidden");
  iconSelection.classList.add("hidden");
  resultArea.classList.add("hidden");

 /* Show round selection */
  roundSelection.classList.remove("hidden");

 /* Reset icon images */
  player1Icon.src = "";
  player2Icon.src = "";
  player1Icon.style.display = "none";
  player2Icon.style.display = "none";

  drawBothWaveforms();
});


/* WINDOW RESIZE */
window.addEventListener("resize",() => 
{
 if (gamePanel && !gamePanel.classList.contains( "hidden")) 
 {
  /* Redraw the saved waveforms after the canvas' size changes */
  if (!currentRecorder) {drawBothWaveforms();}
 }
});


/* GAME'S INITIAL STATE */
iconSelection.classList.remove("hidden");

player1Controls.classList.add("hidden");
player2Controls.classList.add("hidden");

gamePanel.classList.add("hidden");
resultArea.classList.add("hidden");
winnerArea.classList.add("hidden");

playOriginal.classList.add("hidden");

drawBothWaveforms();