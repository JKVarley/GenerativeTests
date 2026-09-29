let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

canvas.width = 700;
canvas.height = 700;

let notes = [];
let velocity = 60;

let frame = 0;
let drawEvery = 8;


// --------------------------------------------------
// MARKOV STATE
// --------------------------------------------------

let visualState = "calm";

let lastMarkovUpdate = 0;
let markovInterval = 1500;
let markovStateDecayMs = 1200;
let lastMarkovStateChange = performance.now();


function updateMarkov(diatonic) {

    let now = performance.now();

    if (now - lastMarkovUpdate < markovInterval) {
        return;
    }

    lastMarkovUpdate = now;

    let random = Math.random();
    let nextState = visualState;


    // DIATONIC = move toward CALM

    if (diatonic) {

        if (visualState == "calm") {

            if (random < 0.96) {
                nextState = "calm";
            } else {
                nextState = "unstable";
            }

        } else if (visualState == "unstable") {

            if (random < 0.82) {
                nextState = "calm";
            } else {
                nextState = "unstable";
            }

        } else if (visualState == "tense") {

            if (random < 0.64) {
                nextState = "unstable";
            } else {
                nextState = "tense";
            }
        }
    }


    // NON-DIATONIC = move toward TENSE

    else {

        if (visualState == "calm") {

            if (random < 0.82) {
                nextState = "calm";
            } else {
                nextState = "unstable";
            }

        } else if (visualState == "unstable") {

            if (random < 0.72) {
                nextState = "unstable";
            } else {
                nextState = "tense";
            }

        } else if (visualState == "tense") {

            if (random < 0.84) {
                nextState = "tense";
            } else {
                nextState = "unstable";
            }
        }
    }


    if (nextState != visualState) {

        visualState = nextState;

        lastMarkovStateChange = now;

        createLSystemPath();
    }
}


function decayMarkovState() {

    if (visualState == "calm") {
        return;
    }

    let now = performance.now();

    let elapsed =
        now - lastMarkovStateChange;

    if (elapsed < markovStateDecayMs) {
        return;
    }

    if (visualState == "unstable") {

        visualState = "calm";

    } else if (visualState == "tense") {

        visualState =
            Math.random() < 0.8
            ? "unstable"
            : "calm";
    }

    lastMarkovStateChange = now;

    createLSystemPath();
}


// --------------------------------------------------
// MIDI
// --------------------------------------------------

navigator.requestMIDIAccess().then(function(midi) {

    for (let input of midi.inputs.values()) {

        input.onmidimessage = function(message) {

            let command = message.data[0];
            let note = message.data[1];
            let noteVelocity = message.data[2];


            // Note on

            if (command == 144 && noteVelocity > 0) {

                if (!notes.includes(note)) {
                    notes.push(note);
                }

                velocity = noteVelocity;

                updateMovementSpeed();
            }


            // Note off

            if (
                command == 128 ||
                (command == 144 && noteVelocity == 0)
            ) {

                notes =
                    notes.filter(n => n != note);
            }
        };
    }
});


// --------------------------------------------------
// DRAW SHAPE
// --------------------------------------------------

function drawShape(
    x,
    y,
    size,
    hue,
    saturation,
    lightness,
    state
) {

    ctx.fillStyle =
        "hsl(" +
        hue +
        ", " +
        saturation +
        "%, " +
        lightness +
        "%)";

    ctx.beginPath();


    let points;

    if (state == "calm") {

        points =
            Math.floor(3 + Math.random() * 2);

    } else if (state == "unstable") {

        points =
            Math.floor(4 + Math.random() * 3);

    } else {

        points =
            Math.floor(6 + Math.random() * 3);
    }


    let rotation =
        Math.random() * Math.PI * 2;

    let width =
        0.75 + Math.random() * 0.6;

    let height =
        0.75 + Math.random() * 0.6;

    let positions = [];


    // Create points

    for (let i = 0; i < points; i++) {

        let angle =
            (Math.PI * 2 / points) * i +
            rotation;

        let radius;


        if (state == "calm") {

            radius =
                size *
                (0.8 + Math.random() * 0.35);

        } else if (state == "unstable") {

            radius =
                size *
                (0.6 + Math.random() * 0.7);

        } else {

            radius =
                size *
                (0.45 + Math.random() * 0.9);
        }


        positions.push({
            x:
                x +
                Math.cos(angle) *
                radius *
                width,

            y:
                y +
                Math.sin(angle) *
                radius *
                height
        });
    }


    // CALM = CURVED

    if (state == "calm") {

        let last =
            positions[positions.length - 1];

        let first =
            positions[0];

        ctx.moveTo(
            (last.x + first.x) / 2,
            (last.y + first.y) / 2
        );


        for (let i = 0; i < positions.length; i++) {

            let current =
                positions[i];

            let next =
                positions[(i + 1) % positions.length];

            let midX =
                (current.x + next.x) / 2;

            let midY =
                (current.y + next.y) / 2;

            ctx.quadraticCurveTo(
                current.x,
                current.y,
                midX,
                midY
            );
        }

        ctx.closePath();
    }


    // UNSTABLE / TENSE = ANGULAR

    else {

        ctx.moveTo(
            positions[0].x,
            positions[0].y
        );


        for (let i = 1; i < positions.length; i++) {

            ctx.lineTo(
                positions[i].x,
                positions[i].y
            );
        }

        ctx.closePath();
    }


    ctx.fill();
}


// --------------------------------------------------
// MOVEMENT
// --------------------------------------------------

let x = 0;
let y = 70;


// Movement speed

let movementSpeed = 0.8;
let baseDriftMultiplier = 1.5;


function updateMovementSpeed() {

    movementSpeed =
        0.5 +
        (velocity / 127) * 1.2;
}


// --------------------------------------------------
// ORIGINAL RANDOM MOVEMENT
// --------------------------------------------------

let vectorX = 1;
let vectorY = 0;

let nextDirectionChange = 0;


function chooseNewDirection() {

    let angle =
        Math.random() * Math.PI * 2;

    vectorX =
        Math.cos(angle);

    vectorY =
        Math.sin(angle);


    // Change direction randomly between
    // 5 and 14 seconds

    nextDirectionChange =
        performance.now() +
        (5000 + Math.random() * 9000);
}


// Start moving left to right

chooseNewDirection();

vectorX = 1;
vectorY = 0;


// --------------------------------------------------
// L-SYSTEM MOVEMENT LAYER
// --------------------------------------------------

let lSystemAngle = 0;

let lSystemPath = [];
let lSystemIndex = 0;


function createLSystemPath() {

    lSystemPath = [];
    lSystemIndex = 0;

    lSystemAngle = 0;


    // ----------------------------------------------
    // L-SYSTEM GRAMMAR
    // ----------------------------------------------

    let commands = "F+F-F";


    if (visualState == "unstable") {

        commands = "F+F-F+F";
    }


    if (visualState == "tense") {

        commands = "F+F-F+F-F";
    }


    // ----------------------------------------------
    // ANGLE
    // ----------------------------------------------

    let angle;

    if (visualState == "calm") {

        angle = 20;

    } else if (visualState == "unstable") {

        angle = 45;

    } else {

        angle = 70;
    }


    // ----------------------------------------------
    // CREATE PATH
    // ----------------------------------------------

    for (let repeat = 0; repeat < 3; repeat++) {

        for (let command of commands) {

            if (command == "F") {

                let radians =
                    lSystemAngle *
                    Math.PI /
                    180;

                lSystemPath.push({
                    x: Math.cos(radians),
                    y: Math.sin(radians)
                });
            }


            if (command == "+") {

                lSystemAngle += angle;
            }


            if (command == "-") {

                lSystemAngle -= angle;
            }
        }
    }
}


// Create initial path

createLSystemPath();


// --------------------------------------------------
// UPDATE MOVEMENT
// --------------------------------------------------

function updateMovement() {


    // ----------------------------------------------
    // ORIGINAL MOVEMENT
    // ----------------------------------------------

    if (performance.now() >= nextDirectionChange) {

        chooseNewDirection();
    }


    x +=
        vectorX *
        movementSpeed *
        baseDriftMultiplier;

    y +=
        vectorY *
        movementSpeed *
        baseDriftMultiplier;


    // ----------------------------------------------
    // L-SYSTEM MOVEMENT
    // ----------------------------------------------

    if (lSystemPath.length > 0) {

        let step =
            lSystemPath[lSystemIndex];


        // The original movement remains dominant.
        // The L-system adds a smaller movement layer.

        x +=
            step.x *
            movementSpeed *
            0.35;

        y +=
            step.y *
            movementSpeed *
            0.35;


        lSystemIndex++;


        if (
            lSystemIndex >=
            lSystemPath.length
        ) {

            lSystemIndex = 0;
        }
    }


    // ----------------------------------------------
    // WRAP AROUND CANVAS
    // ----------------------------------------------

    if (x > canvas.width) {
        x = 0;
    }

    if (x < 0) {
        x = canvas.width;
    }

    if (y > canvas.height) {
        y = 0;
    }

    if (y < 0) {
        y = canvas.height;
    }
}


// --------------------------------------------------
// DRAW
// --------------------------------------------------

function draw() {

    frame++;


    // --------------------------------------------------
    // FIND CHORD
    // --------------------------------------------------

    let chord = "none";

    let notesPlayed =
        notes.map(n => n % 12);


    if (
        notesPlayed.includes(0) &&
        notesPlayed.includes(4) &&
        notesPlayed.includes(7)
    ) {

        chord = "C major";
    }


    if (
        notesPlayed.includes(2) &&
        notesPlayed.includes(5) &&
        notesPlayed.includes(9)
    ) {

        chord = "D minor";
    }


    if (
        notesPlayed.includes(4) &&
        notesPlayed.includes(7) &&
        notesPlayed.includes(11)
    ) {

        chord = "E minor";
    }


    if (
        notesPlayed.includes(5) &&
        notesPlayed.includes(9) &&
        notesPlayed.includes(0)
    ) {

        chord = "F major";
    }


    if (
        notesPlayed.includes(7) &&
        notesPlayed.includes(11) &&
        notesPlayed.includes(2)
    ) {

        chord = "G major";
    }


    if (
        notesPlayed.includes(9) &&
        notesPlayed.includes(0) &&
        notesPlayed.includes(4)
    ) {

        chord = "A minor";
    }


    if (
        notesPlayed.includes(11) &&
        notesPlayed.includes(2) &&
        notesPlayed.includes(5)
    ) {

        chord = "B diminished";
    }


    // --------------------------------------------------
    // SIMPLE DIATONIC TRIAD?
    // --------------------------------------------------

    let diatonic = false;

    if (
        notes.length == 3 &&
        chord != "none"
    ) {

        diatonic = true;
    }


    // --------------------------------------------------
    // UPDATE MARKOV STATE
    // --------------------------------------------------

    if (notes.length > 0) {

        updateMarkov(diatonic);
    }

    updateMovementSpeed();


    if (
        notes.length === 0 &&
        visualState != "calm"
    ) {

        visualState = "calm";

        lastMarkovStateChange =
            performance.now();

        createLSystemPath();
    }


    decayMarkovState();


    // --------------------------------------------------
    // MOVEMENT
    // --------------------------------------------------

    updateMovement();


    // --------------------------------------------------
    // KEY CHECK: C MAJOR
    // --------------------------------------------------

    let inKeyOfC = false;

    if (notes.length > 0) {

        let pitchClasses =
            notes.map(note => note % 12);

        let cMajorSet =
            new Set([0, 2, 4, 5, 7, 9, 11]);

        inKeyOfC =
            pitchClasses.every(
                note => cMajorSet.has(note)
            );
    }


    // --------------------------------------------------
    // BASE COLOUR FROM HARMONY
    // --------------------------------------------------

    let hue = 0;
    let saturation = 50;
    let lightness = 55;


    // Diatonic chord colour families

    if (chord == "C major") {

        hue = 45;
        saturation = 45;
        lightness = 60;
    }


    if (chord == "D minor") {

        hue = 215;
        saturation = 35;
        lightness = 58;
    }


    if (chord == "E minor") {

        hue = 270;
        saturation = 40;
        lightness = 62;
    }


    if (chord == "F major") {

        hue = 75;
        saturation = 40;
        lightness = 62;
    }


    if (chord == "G major") {

        hue = 15;
        saturation = 45;
        lightness = 58;
    }


    if (chord == "A minor") {

        hue = 190;
        saturation = 40;
        lightness = 55;
    }


    if (chord == "B diminished") {

        hue = 340;
        saturation = 45;
        lightness = 55;
    }


    // --------------------------------------------------
    // NON-DIATONIC COLOUR
    // --------------------------------------------------

    if (
        chord == "none" &&
        notes.length > 0
    ) {

        let total = 0;

        for (let note of notes) {

            total += note % 12;
        }

        hue =
            (total * 30) % 360;

        saturation = 65;
        lightness = 50;
    }


    // --------------------------------------------------
    // MARKOV STATE MODIFIES COLOUR
    // --------------------------------------------------

    if (inKeyOfC) {

        hue += 10;

        saturation += 8;

        lightness += 5;
    }


    if (visualState == "calm") {

        saturation *= 0.9;

    } else if (visualState == "unstable") {

        saturation += 15;

        lightness -= 3;

    } else {

        saturation += 35;

        lightness -= 8;
    }


    // --------------------------------------------------
    // BLACK KEYS MODIFY COLOUR
    // --------------------------------------------------

    for (let note of notes) {

        let pitch =
            note % 12;

        if (pitch == 1) hue += 8;

        if (pitch == 3) hue += 12;

        if (pitch == 6) hue -= 10;

        if (pitch == 8) hue += 15;

        if (pitch == 10) hue -= 12;
    }


    // --------------------------------------------------
    // SMALL RANDOM COLOUR VARIATION
    // --------------------------------------------------

    if (notes.length > 0) {

        if (inKeyOfC) {

            hue +=
                Math.random() * 12 - 6;

            saturation +=
                Math.random() * 8 - 4;

            lightness +=
                Math.random() * 8 - 4;

        } else {

            hue +=
                Math.random() * 30 - 15;

            saturation +=
                Math.random() * 10 - 5;

            lightness +=
                Math.random() * 10 - 5;
        }
    }


    // Keep values in range

    hue =
        hue % 360;

    if (hue < 0) {
        hue += 360;
    }


    saturation =
        Math.max(
            10,
            Math.min(100, saturation)
        );


    lightness =
        Math.max(
            20,
            Math.min(80, lightness)
        );


    // --------------------------------------------------
    // SIZE
    // --------------------------------------------------

    let size =
        (
            5 +
            ((127 - velocity) / 127) * 40
        ) * 3;

    size =
        Math.max(size, 40);


    // Markov state controls size variation

    if (inKeyOfC) {

        size *= 1.2;


        if (visualState == "calm") {

            size *=
                1.15 +
                Math.random() * 0.25;

        } else if (visualState == "unstable") {

            size *=
                1.0 +
                Math.random() * 0.3;

        } else {

            size *=
                0.9 +
                Math.random() * 0.4;
        }

    } else {

        if (visualState == "calm") {

            size *=
                0.95 +
                Math.random() * 0.25;

        } else if (visualState == "unstable") {

            size *=
                0.8 +
                Math.random() * 0.45;

        } else {

            size *=
                0.7 +
                Math.random() * 0.5;
        }
    }


    // --------------------------------------------------
    // DRAW
    // --------------------------------------------------

    if (notes.length > 0 && frame % drawEvery == 0) {

        let stateForShape =
            visualState;


        if (
            inKeyOfC &&
            visualState == "calm"
        ) {

            stateForShape = "calm";

        } else if (
            inKeyOfC &&
            visualState != "calm"
        ) {

            stateForShape = "unstable";

        } else if (
            !inKeyOfC &&
            visualState == "calm"
        ) {

            stateForShape = "unstable";
        }


        drawShape(
            x,
            y,
            size,
            hue,
            saturation,
            lightness,
            stateForShape
        );
    }


    requestAnimationFrame(draw);
}


draw();