/* =========================================================
   GAME SETTINGS
========================================================= */

let MAX_ROUNDS = 5;
let round = 1;

let playerScoreValue = 0;


/* =========================================================
   SOUNDS
========================================================= */

/*
    Add your sounds here.

    Each sound needs:
    - name  -> displayed under the sound image
    - audio -> MP3 file
    - image -> image displayed on the left
*/

const sounds = [
    {
        name: "Sound",
        audio: "./sounds/sound.mp3",
        image: "./images/sound.png"
    }

    /*
    Example:

    {
        name: "Cat",
        audio: "./sounds/cat.mp3",
        image: "./images/cat.png"
    },

    {
        name: "Dog",
        audio: "./sounds/dog.mp3",
        image: "./images/dog.png"
    }
    */
];

let currentSound = null;


/* =========================================================
   PLAYER ICON
========================================================= */

let playerIconChoice = null;


/* =========================================================
   AUDIO VARIABLES
========================================================= */

let currentRecorder = null;
let currentStream = null;

let audioContext = null;
let analyser = null;

let animationId = null;

let originalAudioBuffer = null;
let imitationAudioBuffer = null;

let recordingStartTime = 0;

let currentlyRecordingSide = null;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const roundSelection =
    document.getElementById("roundSelection");

const gamePanel =
    document.getElementById("gamePanel");

const round5 =
    document.getElementById("round5");

const round10 =
    document.getElementById("round10");

const turn =
    document.getElementById("turn");

const message =
    document.getElementById("message");

const waveform =
    document.getElementById("waveform");

const pitchDisplay =
    document.getElementById("pitchDisplay");

const countdown =
    document.getElementById("countdown");

const playerControls =
    document.getElementById("playerControls");

const playOriginal =
    document.getElementById("playOriginal");

const recordPlayer =
    document.getElementById("recordPlayer");

const stopPlayer =
    document.getElementById("stopPlayer");

const resultArea =
    document.getElementById("resultArea");

const resultText =
    document.getElementById("resultText");

const pitchScore =
    document.getElementById("pitchScore");

const shapeScore =
    document.getElementById("shapeScore");

const durationScore =
    document.getElementById("durationScore");

const volumeScore =
    document.getElementById("volumeScore");

const nextRound =
    document.getElementById("nextRound");

const winnerArea =
    document.getElementById("winnerArea");

const winnerText =
    document.getElementById("winnerText");

const restart =
    document.getElementById("restart");

const playerScore =
    document.getElementById("playerScore");


/* =========================================================
   ICON SELECTION DOM ELEMENTS
========================================================= */

const iconSelection =
    document.getElementById("iconSelection");

const playerIconSelection =
    document.getElementById("playerIconSelection");

const confirmPlayer =
    document.getElementById("confirmPlayer");

const playerSelectedText =
    document.getElementById("playerSelectedText");

const playerIcon =
    document.getElementById("playerIcon");


/* =========================================================
   SOUND CHARACTER DOM ELEMENTS
========================================================= */

const soundCharacterIcon =
    document.getElementById("soundCharacterIcon");

const soundCharacterName =
    document.getElementById("soundCharacterName");


/* =========================================================
   WAVEFORM RESIZING
========================================================= */

function resizeWaveform()
{
    const rect =
        waveform.getBoundingClientRect();

    const width =
        Math.max(1, Math.floor(rect.width));

    const height =
        Math.max(1, Math.floor(rect.height));

    const dpr =
        window.devicePixelRatio || 1;

    waveform.width =
        width * dpr;

    waveform.height =
        height * dpr;

    const ctx =
        waveform.getContext("2d");

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    return {
        ctx,
        width,
        height
    };
}


/* =========================================================
   WAVEFORM LAYOUT
========================================================= */

function drawWaveformLayout(ctx, width, height)
{
    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    /* Background */

    ctx.fillStyle = "#111827";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    /* Left panel = ORIGINAL SOUND */

    const halfWidth =
        width / 2;

    ctx.fillStyle =
        "rgba(77,171,247,0.05)";

    ctx.fillRect(
        0,
        0,
        halfWidth,
        height
    );


    /* Right panel = PLAYER IMITATION */

    ctx.fillStyle =
        "rgba(81,207,102,0.05)";

    ctx.fillRect(
        halfWidth,
        0,
        halfWidth,
        height
    );


    /* Divider */

    ctx.strokeStyle =
        "rgba(255,255,255,0.25)";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        halfWidth,
        0
    );

    ctx.lineTo(
        halfWidth,
        height
    );

    ctx.stroke();


    /* Center lines */

    ctx.strokeStyle =
        "rgba(255,255,255,0.10)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(
        0,
        height / 2
    );

    ctx.lineTo(
        halfWidth,
        height / 2
    );

    ctx.moveTo(
        halfWidth,
        height / 2
    );

    ctx.lineTo(
        width,
        height / 2
    );

    ctx.stroke();


    /* Labels */

    ctx.font =
        "bold 14px Arial";

    ctx.textBaseline =
        "top";


    ctx.fillStyle =
        "#4dabf7";

    ctx.textAlign =
        "left";

    ctx.fillText(
        "ORIGINAL",
        12,
        10
    );


    ctx.fillStyle =
        "#51cf66";

    ctx.textAlign =
        "right";

    ctx.fillText(
        "IMITATION",
        width - 12,
        10
    );


    /* Panel borders */

    ctx.strokeStyle =
        "rgba(255,255,255,0.12)";

    ctx.lineWidth = 1;

    ctx.strokeRect(
        0.5,
        0.5,
        halfWidth - 1,
        height - 1
    );

    ctx.strokeRect(
        halfWidth + 0.5,
        0.5,
        halfWidth - 1,
        height - 1
    );
}


/* =========================================================
   DRAW RECORDED WAVEFORM
========================================================= */

function drawRecordedWaveform(
    buffer,
    side,
    ctx,
    width,
    height
)
{
    if (!buffer)
    {
        return;
    }


    const channelData =
        buffer.getChannelData(0);

    if (
        !channelData ||
        channelData.length === 0
    )
    {
        return;
    }


    const halfWidth =
        width / 2;


    const startX =
        side === "original"
            ? 0
            : halfWidth;


    const endX =
        side === "original"
            ? halfWidth
            : width;


    const drawWidth =
        endX - startX;


    const centerY =
        height / 2;


    const amplitude =
        height * 0.38;


    ctx.save();


    /* Restrict drawing to correct half */

    ctx.beginPath();

    ctx.rect(
        startX,
        0,
        drawWidth,
        height
    );

    ctx.clip();


    ctx.strokeStyle =
        side === "original"
            ? "#4dabf7"
            : "#51cf66";

    ctx.lineWidth = 2;

    ctx.beginPath();


    const samplesPerPixel =
        channelData.length / drawWidth;


    for (
        let x = 0;
        x < drawWidth;
        x++
    )
    {
        const start =
            Math.floor(
                x * samplesPerPixel
            );

        const end =
            Math.min(
                channelData.length,
                Math.floor(
                    (x + 1) *
                    samplesPerPixel
                )
            );


        let min = 1;
        let max = -1;


        for (
            let i = start;
            i < end;
            i++
        )
        {
            const value =
                channelData[i];

            if (value < min)
            {
                min = value;
            }

            if (value > max)
            {
                max = value;
            }
        }


        const y1 =
            centerY +
            min * amplitude;

        const y2 =
            centerY +
            max * amplitude;


        const canvasX =
            startX + x;


        if (x === 0)
        {
            ctx.moveTo(
                canvasX,
                y1
            );
        }
        else
        {
            ctx.lineTo(
                canvasX,
                y1
            );
        }


        ctx.lineTo(
            canvasX,
            y2
        );
    }


    ctx.stroke();

    ctx.restore();
}


/* =========================================================
   DRAW BOTH WAVEFORMS
========================================================= */

function drawBothWaveforms()
{
    if (!waveform)
    {
        return;
    }


    const {
        ctx,
        width,
        height
    } = resizeWaveform();


    drawWaveformLayout(
        ctx,
        width,
        height
    );


    if (originalAudioBuffer)
    {
        drawRecordedWaveform(
            originalAudioBuffer,
            "original",
            ctx,
            width,
            height
        );
    }


    if (imitationAudioBuffer)
    {
        drawRecordedWaveform(
            imitationAudioBuffer,
            "imitation",
            ctx,
            width,
            height
        );
    }


    drawWaveformOverlay(
        ctx,
        width,
        height
    );
}


/* =========================================================
   WAVEFORM OVERLAY
========================================================= */

function drawWaveformOverlay(
    ctx,
    width,
    height
)
{
    const halfWidth =
        width / 2;


    ctx.strokeStyle =
        "rgba(255,255,255,0.25)";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        halfWidth,
        0
    );

    ctx.lineTo(
        halfWidth,
        height
    );

    ctx.stroke();


    ctx.font =
        "bold 14px Arial";

    ctx.textBaseline =
        "top";


    ctx.fillStyle =
        "#4dabf7";

    ctx.textAlign =
        "left";

    ctx.fillText(
        "ORIGINAL",
        12,
        10
    );


    ctx.fillStyle =
        "#51cf66";

    ctx.textAlign =
        "right";

    ctx.fillText(
        "IMITATION",
        width - 12,
        10
    );
}


/* =========================================================
   LIVE MICROPHONE WAVEFORM
========================================================= */

function drawLiveWaveform(side)
{
    if (!analyser)
    {
        return;
    }


    currentlyRecordingSide =
        side;


    const {
        ctx,
        width,
        height
    } = resizeWaveform();


    const dataArray =
        new Uint8Array(
            analyser.fftSize
        );


    function draw()
    {
        if (
            !analyser ||
            !currentRecorder
        )
        {
            return;
        }


        analyser.getByteTimeDomainData(
            dataArray
        );


        drawWaveformLayout(
            ctx,
            width,
            height
        );


        /* Keep original waveform */

        if (originalAudioBuffer)
        {
            drawRecordedWaveform(
                originalAudioBuffer,
                "original",
                ctx,
                width,
                height
            );
        }


        /* Keep previous imitation waveform */

        if (imitationAudioBuffer)
        {
            drawRecordedWaveform(
                imitationAudioBuffer,
                "imitation",
                ctx,
                width,
                height
            );
        }


        /* Live waveform */

        const halfWidth =
            width / 2;


        const startX =
            side === "original"
                ? 0
                : halfWidth;


        const drawWidth =
            halfWidth;


        const centerY =
            height / 2;


        const amplitude =
            height * 0.38;


        ctx.save();

        ctx.beginPath();

        ctx.rect(
            startX,
            0,
            drawWidth,
            height
        );

        ctx.clip();


        ctx.strokeStyle =
            "#51cf66";

        ctx.lineWidth = 2;

        ctx.beginPath();


        for (
            let i = 0;
            i < dataArray.length;
            i++
        )
        {
            const x =
                startX +
                (
                    i /
                    (dataArray.length - 1)
                ) *
                drawWidth;


            const value =
                (dataArray[i] - 128) /
                128;


            const y =
                centerY +
                value * amplitude;


            if (i === 0)
            {
                ctx.moveTo(
                    x,
                    y
                );
            }
            else
            {
                ctx.lineTo(
                    x,
                    y
                );
            }
        }


        ctx.stroke();

        ctx.restore();


        drawWaveformOverlay(
            ctx,
            width,
            height
        );


        animationId =
            requestAnimationFrame(draw);
    }


    draw();
}


/* =========================================================
   START MICROPHONE
========================================================= */

async function startMicrophone()
{
    if (currentStream)
    {
        return;
    }


    try
    {
        currentStream =
            await navigator.mediaDevices.getUserMedia(
            {
                audio:
                {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });


        if (!audioContext)
        {
            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();
        }


        if (
            audioContext.state ===
            "suspended"
        )
        {
            await audioContext.resume();
        }


        const source =
            audioContext.createMediaStreamSource(
                currentStream
            );


        analyser =
            audioContext.createAnalyser();


        analyser.fftSize =
            2048;


        analyser.smoothingTimeConstant =
            0;


        source.connect(
            analyser
        );
    }

    catch (error)
    {
        console.error(
            "Microphone error:",
            error
        );


        alert(
            "Could not access the microphone. " +
            "Please allow microphone access."
        );


        throw error;
    }
}


/* =========================================================
   STOP MICROPHONE
========================================================= */

function stopMicrophone()
{
    if (animationId)
    {
        cancelAnimationFrame(
            animationId
        );

        animationId = null;
    }


    if (currentStream)
    {
        currentStream
            .getTracks()
            .forEach(
                track =>
                track.stop()
            );


        currentStream = null;
    }


    analyser = null;
}


/* =========================================================
   DECODE AUDIO BLOB
========================================================= */

async function decodeAudioBlob(blob)
{
    if (!audioContext)
    {
        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
    }


    const arrayBuffer =
        await blob.arrayBuffer();


    return await audioContext.decodeAudioData(
        arrayBuffer
    );
}


/* =========================================================
   LOAD MP3 SOUND
========================================================= */

async function loadSound(sound)
{
    if (!audioContext)
    {
        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
    }


    if (
        audioContext.state ===
        "suspended"
    )
    {
        await audioContext.resume();
    }


    try
    {
        const response =
            await fetch(sound.audio);


        if (!response.ok)
        {
            throw new Error(
                `Could not load ${sound.audio}`
            );
        }


        const arrayBuffer =
            await response.arrayBuffer();


        const buffer =
            await audioContext.decodeAudioData(
                arrayBuffer
            );


        return buffer;
    }

    catch (error)
    {
        console.error(
            "Sound loading error:",
            error
        );


        message.textContent =
            "Could not load the selected sound.";


        throw error;
    }
}


/* =========================================================
   PLAY AUDIO BUFFER
========================================================= */

function playAudioBuffer(buffer)
{
    if (
        !buffer ||
        !audioContext
    )
    {
        return;
    }


    if (
        audioContext.state ===
        "suspended"
    )
    {
        audioContext.resume();
    }


    const source =
        audioContext.createBufferSource();


    source.buffer =
        buffer;


    source.connect(
        audioContext.destination
    );


    source.start(0);
}


/* =========================================================
   PLAY ORIGINAL SOUND
========================================================= */

playOriginal.addEventListener(
    "click",
    () =>
    {
        playAudioBuffer(
            originalAudioBuffer
        );
    }
);


/* =========================================================
   BEGIN PLAYER RECORDING
========================================================= */

async function beginPlayerRecording()
{
    try
    {
        await startMicrophone();

        startRecording();
    }

    catch (error)
    {
        console.error(error);
    }
}


/* =========================================================
   START RECORDING
========================================================= */

function startRecording()
{
    if (!currentStream)
    {
        return;
    }


    const recordingSide =
        "imitation";


    currentlyRecordingSide =
        recordingSide;


    const chunks = [];


    currentRecorder =
        new MediaRecorder(
            currentStream
        );


    recordingStartTime =
        performance.now();


    /* Button states */

    recordPlayer.classList.add(
        "hidden"
    );

    stopPlayer.classList.remove(
        "hidden"
    );


    /* Messages */

    turn.textContent =
        `Round ${round} — Your Turn`;


    message.textContent =
        "Recording your imitation...";


    pitchDisplay.textContent =
        "Recording...";


    countdown.textContent =
        "";


    /* Recorder events */

    currentRecorder.ondataavailable =
        event =>
        {
            if (
                event.data.size > 0
            )
            {
                chunks.push(
                    event.data
                );
            }
        };


    currentRecorder.onstop =
        async () =>
        {
            const duration =
                (
                    performance.now() -
                    recordingStartTime
                ) / 1000;


            const blob =
                new Blob(
                    chunks,
                    {
                        type:
                            currentRecorder.mimeType ||
                            "audio/webm"
                    }
                );


            try
            {
                const buffer =
                    await decodeAudioBlob(
                        blob
                    );


                imitationAudioBuffer =
                    buffer;


                drawBothWaveforms();


                stopMicrophone();


                currentRecorder = null;


                finishRound();
            }

            catch (error)
            {
                console.error(
                    "Audio decoding error:",
                    error
                );


                stopMicrophone();


                currentRecorder = null;


                message.textContent =
                    "Could not process the recording.";
            }
        };


    /* Start */

    currentRecorder.start();


    drawLiveWaveform(
        recordingSide
    );
}


/* =========================================================
   RECORD BUTTON
========================================================= */

recordPlayer.addEventListener(
    "click",
    async () =>
    {
        await beginPlayerRecording();
    }
);


/* =========================================================
   STOP BUTTON
========================================================= */

stopPlayer.addEventListener(
    "click",
    () =>
    {
        if (
            currentRecorder &&
            currentRecorder.state !==
            "inactive"
        )
        {
            currentRecorder.stop();
        }
    }
);


/* =========================================================
   PITCH DETECTION
========================================================= */

function detectPitch(buffer)
{
    if (!buffer)
    {
        return 0;
    }


    const data =
        buffer.getChannelData(0);


    const sampleRate =
        buffer.sampleRate;


    const SIZE =
        Math.min(
            data.length,
            4096
        );


    let bestOffset = -1;

    let bestCorrelation = 0;

    let rms = 0;


    for (
        let i = 0;
        i < SIZE;
        i++
    )
    {
        rms +=
            data[i] *
            data[i];
    }


    rms =
        Math.sqrt(
            rms / SIZE
        );


    if (rms < 0.01)
    {
        return 0;
    }


    for (
        let offset = 20;
        offset < SIZE / 2;
        offset++
    )
    {
        let correlation = 0;


        for (
            let i = 0;
            i < SIZE - offset;
            i++
        )
        {
            correlation +=
                data[i] *
                data[i + offset];
        }


        correlation /=
            SIZE - offset;


        if (
            correlation >
            bestCorrelation
        )
        {
            bestCorrelation =
                correlation;

            bestOffset =
                offset;
        }
    }


    if (bestOffset === -1)
    {
        return 0;
    }


    return (
        sampleRate /
        bestOffset
    );
}


/* =========================================================
   VOLUME / RMS
========================================================= */

function calculateRMS(buffer)
{
    if (!buffer)
    {
        return 0;
    }


    const data =
        buffer.getChannelData(0);


    let sum = 0;


    for (
        let i = 0;
        i < data.length;
        i++
    )
    {
        sum +=
            data[i] *
            data[i];
    }


    return Math.sqrt(
        sum / data.length
    );
}


/* =========================================================
   CLAMP
========================================================= */

function clamp(
    value,
    min,
    max
)
{
    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}


/* =========================================================
   PITCH SCORE
========================================================= */

function calculatePitchScore(
    original,
    imitation
)
{
    if (
        !original ||
        !imitation
    )
    {
        return 0;
    }


    const cents =
        1200 *
        Math.log2(
            imitation /
            original
        );


    const absoluteCents =
        Math.abs(cents);


    return clamp(
        100 -
        (
            absoluteCents /
            600
        ) *
        100,

        0,
        100
    );
}


/* =========================================================
   DURATION SCORE
========================================================= */

function calculateDurationScore(
    original,
    imitation
)
{
    if (
        !original ||
        !imitation
    )
    {
        return 0;
    }


    const difference =
        Math.abs(
            original.duration -
            imitation.duration
        );


    const percentage =
        difference /
        original.duration;


    return clamp(
        100 -
        percentage * 100,

        0,
        100
    );
}


/* =========================================================
   VOLUME SCORE
========================================================= */

function calculateVolumeScore(
    original,
    imitation
)
{
    const originalRMS =
        calculateRMS(
            original
        );


    const imitationRMS =
        calculateRMS(
            imitation
        );


    if (
        originalRMS === 0 ||
        imitationRMS === 0
    )
    {
        return 0;
    }


    const ratio =
        imitationRMS /
        originalRMS;


    const difference =
        Math.abs(
            1 - ratio
        );


    return clamp(
        100 -
        difference * 100,

        0,
        100
    );
}


/* =========================================================
   WAVEFORM SHAPE SCORE
========================================================= */

function calculateShapeScore(
    original,
    imitation
)
{
    if (
        !original ||
        !imitation
    )
    {
        return 0;
    }


    const originalData =
        original.getChannelData(0);


    const imitationData =
        imitation.getChannelData(0);


    const samples = 1000;


    let difference = 0;


    for (
        let i = 0;
        i < samples;
        i++
    )
    {
        const originalIndex =
            Math.floor(
                i *
                originalData.length /
                samples
            );


        const imitationIndex =
            Math.floor(
                i *
                imitationData.length /
                samples
            );


        difference +=
            Math.abs(
                originalData[
                    originalIndex
                ] -
                imitationData[
                    imitationIndex
                ]
            );
    }


    difference /=
        samples;


    return clamp(
        100 -
        difference * 100,

        0,
        100
    );
}


/* =========================================================
   FINISH ROUND
========================================================= */

function finishRound()
{
    drawBothWaveforms();


    if (
        !originalAudioBuffer ||
        !imitationAudioBuffer
    )
    {
        return;
    }


    const originalPitch =
        detectPitch(
            originalAudioBuffer
        );


    const imitationPitch =
        detectPitch(
            imitationAudioBuffer
        );


    const pScore =
        calculatePitchScore(
            originalPitch,
            imitationPitch
        );


    const sScore =
        calculateShapeScore(
            originalAudioBuffer,
            imitationAudioBuffer
        );


    const dScore =
        calculateDurationScore(
            originalAudioBuffer,
            imitationAudioBuffer
        );


    const vScore =
        calculateVolumeScore(
            originalAudioBuffer,
            imitationAudioBuffer
        );


    const overall =
        Math.round(
            (
                pScore +
                sScore +
                dScore +
                vScore
            ) / 4
        );


    /* Player receives the points */

    playerScoreValue +=
        overall;


    /* Update scoreboard */

    playerScore.textContent =
        playerScoreValue;


    /* Show individual scores */

    pitchScore.textContent =
        `${Math.round(pScore)}%`;


    shapeScore.textContent =
        `${Math.round(sScore)}%`;


    durationScore.textContent =
        `${Math.round(dScore)}%`;


    volumeScore.textContent =
        `${Math.round(vScore)}%`;


    /* Result */

    resultText.textContent =
        `You scored ${overall} points this round!`;


    pitchDisplay.textContent =
        originalPitch > 0 &&
        imitationPitch > 0

            ? `Original: ${originalPitch.toFixed(1)} Hz | ` +
              `Imitation: ${imitationPitch.toFixed(1)} Hz`

            : "Pitch could not be detected.";


    resultArea.classList.remove(
        "hidden"
    );


    playerControls.classList.add(
        "hidden"
    );


    stopPlayer.classList.add(
        "hidden"
    );


    turn.textContent =
        `Round ${round} Complete`;


    message.textContent =
        "Here are the results of your imitation.";
}


/* =========================================================
   SELECT RANDOM SOUND
========================================================= */

function selectSound()
{
    if (sounds.length === 0)
    {
        console.error(
            "No sounds have been added."
        );

        return null;
    }


    /*
        Select a random sound.

        If there is more than one sound,
        try to avoid selecting the same
        sound twice in a row.
    */

    let selected;

    if (sounds.length === 1)
    {
        selected =
            sounds[0];
    }
    else
    {
        do
        {
            selected =
                sounds[
                    Math.floor(
                        Math.random() *
                        sounds.length
                    )
                ];
        }
        while (
            selected === currentSound
        );
    }


    return selected;
}


/* =========================================================
   SET SOUND CHARACTER
========================================================= */

function setSoundCharacter(sound)
{
    if (!sound)
    {
        return;
    }


    currentSound =
        sound;


    soundCharacterName.textContent =
        sound.name;


    soundCharacterIcon.src =
        sound.image;


    soundCharacterIcon.alt =
        sound.name;


    soundCharacterIcon.style.display =
        "block";
}


/* =========================================================
   PREPARE SOUND FOR ROUND
========================================================= */

async function prepareSound()
{
    const sound =
        selectSound();


    if (!sound)
    {
        return;
    }


    setSoundCharacter(
        sound
    );


    message.textContent =
        "Loading sound...";


    try
    {
        originalAudioBuffer =
            await loadSound(
                sound
            );


        drawBothWaveforms();


        message.textContent =
            "Listen to the sound, then try to mimic it!";


        playOriginal.classList.remove(
            "hidden"
        );


        recordPlayer.classList.remove(
            "hidden"
        );


        stopPlayer.classList.add(
            "hidden"
        );


        turn.textContent =
            `Round ${round}`;


        pitchDisplay.textContent =
            "Pitch: —";
    }

    catch (error)
    {
        console.error(error);


        message.textContent =
            "There was a problem loading this sound.";
    }
}


/* =========================================================
   NEXT ROUND
========================================================= */

nextRound.addEventListener(
    "click",
    () =>
    {
        if (
            round >= MAX_ROUNDS
        )
        {
            showWinner();

            return;
        }


        round++;


        /* Reset audio */

        originalAudioBuffer =
            null;

        imitationAudioBuffer =
            null;

        currentRecorder =
            null;

        currentlyRecordingSide =
            null;


        /* Reset UI */

        resultArea.classList.add(
            "hidden"
        );

        winnerArea.classList.add(
            "hidden"
        );


        pitchDisplay.textContent =
            "Pitch: —";


        countdown.textContent =
            "";


        recordPlayer.textContent =
            "🎤 Start Recording";


        recordPlayer.classList.remove(
            "hidden"
        );


        stopPlayer.classList.add(
            "hidden"
        );


        playOriginal.classList.add(
            "hidden"
        );


        /* Start next round */

        startRound();
    }
);


/* =========================================================
   START ROUND
========================================================= */

async function startRound()
{
    drawBothWaveforms();


    playerControls.classList.remove(
        "hidden"
    );


    resultArea.classList.add(
        "hidden"
    );


    playOriginal.classList.add(
        "hidden"
    );


    recordPlayer.classList.add(
        "hidden"
    );


    stopPlayer.classList.add(
        "hidden"
    );


    turn.textContent =
        `Round ${round}`;


    message.textContent =
        "Preparing the sound...";


    await prepareSound();
}


/* =========================================================
   PLAYER ICON SELECTION
========================================================= */

function setupIconSelection()
{
    playerIconChoice =
        null;


    confirmPlayer.disabled =
        true;


    playerSelectedText.textContent =
        "Select an icon";


    resetIconButtons();
}


/* =========================================================
   RESET ICON BUTTONS
========================================================= */

function resetIconButtons()
{
    const buttons =
        iconSelection.querySelectorAll(
            ".icon-option"
        );


    buttons.forEach(
        button =>
        {
            button.classList.remove(
                "selected-player",
                "unavailable"
            );


            button.disabled =
                false;
        }
    );
}


/* =========================================================
   PLAYER SELECTS ICON
========================================================= */

function selectPlayerIcon(button)
{
    const icon =
        button.getAttribute(
            "data-icon"
        );


    playerIconChoice =
        icon;


    const buttons =
        playerIconSelection.querySelectorAll(
            ".icon-option"
        );


    buttons.forEach(
        option =>
        {
            option.classList.remove(
                "selected-player"
            );
        }
    );


    button.classList.add(
        "selected-player"
    );


    playerSelectedText.textContent =
        `Icon ${icon} selected`;


    confirmPlayer.disabled =
        false;
}


/* =========================================================
   CONFIRM PLAYER ICON
========================================================= */

confirmPlayer.addEventListener(
    "click",
    () =>
    {
        if (!playerIconChoice)
        {
            return;
        }


        playerIcon.src =
            `./images/icon${playerIconChoice}.png`;


        playerIcon.alt =
            `Player icon ${playerIconChoice}`;


        playerIcon.style.display =
            "block";


        /* Hide icon selection */

        iconSelection.classList.add(
            "hidden"
        );


        /* Show round selection */

        roundSelection.classList.remove(
            "hidden"
        );
    }
);


/* =========================================================
   ICON BUTTON EVENTS
========================================================= */

const playerIconButtons =
    playerIconSelection.querySelectorAll(
        ".icon-option"
    );


playerIconButtons.forEach(
    button =>
    {
        button.addEventListener(
            "click",
            () =>
            {
                selectPlayerIcon(
                    button
                );
            }
        );
    }
);


/* =========================================================
   START GAME
========================================================= */

function startGame(
    numberOfRounds
)
{
    MAX_ROUNDS =
        numberOfRounds;


    round = 1;


    playerScoreValue =
        0;


    playerScore.textContent =
        "0";


    originalAudioBuffer =
        null;


    imitationAudioBuffer =
        null;


    currentSound =
        null;


    /* Hide selections */

    roundSelection.classList.add(
        "hidden"
    );


    iconSelection.classList.add(
        "hidden"
    );


    /* Show game */

    gamePanel.classList.remove(
        "hidden"
    );


    /* Start first round */

    startRound();
}


/* =========================================================
   ROUND BUTTONS
========================================================= */

round5.addEventListener(
    "click",
    () =>
    {
        startGame(5);
    }
);


round10.addEventListener(
    "click",
    () =>
    {
        startGame(10);
    }
);


/* =========================================================
   FINAL RESULT
========================================================= */

function showWinner()
{
    playerControls.classList.add(
        "hidden"
    );


    resultArea.classList.add(
        "hidden"
    );


    playOriginal.classList.add(
        "hidden"
    );


    winnerArea.classList.remove(
        "hidden"
    );


    winnerText.textContent =
        `🏆 Game Complete! You scored ${playerScoreValue} points!`;


    turn.textContent =
        "Game Over";


    message.textContent =
        "Thanks for playing Sound Mimic!";
}


/* =========================================================
   RESTART
========================================================= */

restart.addEventListener(
    "click",
    () =>
    {
        stopMicrophone();


        currentRecorder =
            null;


        originalAudioBuffer =
            null;


        imitationAudioBuffer =
            null;


        currentSound =
            null;


        round =
            1;


        playerScoreValue =
            0;


        playerScore.textContent =
            "0";


        playerIconChoice =
            null;


        /* Hide everything */

        winnerArea.classList.add(
            "hidden"
        );


        gamePanel.classList.add(
            "hidden"
        );


        roundSelection.classList.add(
            "hidden"
        );


        resultArea.classList.add(
            "hidden"
        );


        /* Reset player icon */

        playerIcon.src =
            "";


        playerIcon.style.display =
            "none";


        /* Reset sound */

        soundCharacterIcon.src =
            "";


        soundCharacterIcon.style.display =
            "none";


        soundCharacterName.textContent =
            "Sound";


        /* Reset icon selection */

        setupIconSelection();


        /* Show icon selection */

        iconSelection.classList.remove(
            "hidden"
        );


        drawBothWaveforms();
    }
);


/* =========================================================
   WINDOW RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () =>
    {
        if (
            gamePanel &&
            !gamePanel.classList.contains(
                "hidden"
            )
        )
        {
            if (!currentRecorder)
            {
                drawBothWaveforms();
            }
        }
    }
);


/* =========================================================
   INITIAL STATE
========================================================= */

setupIconSelection();


iconSelection.classList.remove(
    "hidden"
);


roundSelection.classList.add(
    "hidden"
);


playerControls.classList.add(
    "hidden"
);


gamePanel.classList.add(
    "hidden"
);


resultArea.classList.add(
    "hidden"
);


winnerArea.classList.add(
    "hidden"
);


playOriginal.classList.add(
    "hidden"
);


soundCharacterIcon.style.display =
    "none";


drawBothWaveforms();