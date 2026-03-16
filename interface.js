mgraphics.init();
mgraphics.autofill = 0;
mgraphics.relative_coords = 0;
this.inlets = 1;
this.outlets = 2; // outlet1 = info to interface2.js --- outlet2 = info to interface3.js

/*
notesDetected = {
    id: {
        pc,
        start,
        dur,
        passFail,
        colour,
        startPoint,
        thickness
    }
}
*/
var notesDetected = {}

function paint() {
    // let [width, height] = mgraphics.size;
    var width = mgraphics.size[0];
    var height = mgraphics.size[1];

    drawBackgroundSquare(width, height);

    drawNoteLines(width, height, width/2, notesDetected);
}

// ================== INDIVIDUAL ELEMENTS ================== //

/**
 * notesOb is notesDetected which is an obj with noteIds as keys
 * @param {*} width 
 * @param {*} height 
 * @param {*} radius 
 * @param {*} notesOb 
 */
function drawNoteLines(width, height, radius, notesOb) {
    var centreX = width/2;
    var centreY = height/2;

    var passNotesIds = [] // notes which pass all tests (e.g. min length). These will be drawn last so they apprear ontop

    var noteIds = Object.keys(notesOb);
    for(var i=0; i<noteIds.length; i++) {
        var noteId = noteIds[i];
        var note = notesOb[noteId]; // {note, start, dur, passFail, colour?, startPoint?, thickness?}

        // collect all the passing notes because we want to draw them last
        if(note.passFail === 1) {
            passNotesIds.push(noteId);
            continue;
        }
        drawNoteLine(note, centreX, centreY, width, height, radius);
    }

    for(var i=0; i<passNotesIds.length; i++) {
        var id = passNotesIds[i];
        var note = notesOb[id];
        drawNoteLine(note, centreX, centreY, width, height, radius)
    }
}

function drawNoteLine(noteOb, centreX, centreY, windowWidth, windowHeight, outerCirlceRadius) {
    var colour = getNoteLineColour(noteOb);
    mgraphics.set_source_rgba(colour.r, colour.g, colour.b, colour.a);

    var startPoint = getNoteLineStartPoint(noteOb, windowWidth, windowHeight, outerCirlceRadius);

    var thickness = getNoteLineThickness(noteOb);
    // noteOb.colour = colour;
    noteOb.startPoint = startPoint;
    noteOb.thickness = thickness;

    mgraphics.set_line_width(thickness);
    mgraphics.move_to(startPoint[0], startPoint[1]);
    mgraphics.line_to(centreX, centreY);
    mgraphics.stroke();
}

function getNoteLineColour(noteOb) {
    if(noteOb.passFail === 0) {
        return hslToRgba(0, 0, 56, 60); // grey
    }
    var yellows = [
        hslToRgba(44, 98, 55, 100), // bright yellow
        hslToRgba(34, 100, 50, 100), // orange
        hslToRgba(29, 83, 70, 100), // tan-ish
        hslToRgba(43, 87, 48, 100) // darker yellow
    ];
    if(!noteOb.colour) {
        noteOb.colour = choose(yellows);
    }
    return noteOb.colour;
}

function getNoteLineThickness(noteOb) {
    if(noteOb.thickness) {
        return noteOb.thickness;
    }
    var thickness = scaleToRange([60, 2000], [1, 12], noteOb.dur); 
    noteOb.thickness = thickness;
    return noteOb.thickness
}

function getNoteLineStartPoint(noteOb, windowWidth, windowHeight, outerCirlceRadius) {
    if(noteOb.startPoint && noteOb.startPoint.length) {
        return noteOb.startPoint;
    }
    var pc = noteOb.pc;
    var angleSliceStart = pc * 30 - 15;
    var angleSliceStop = pc * 30 + 15;
    var angle = randomRange(angleSliceStart, angleSliceStop); // choose randomly between a slice of the pie
    var sPoint = pointOnCircleInWindow(windowWidth, windowHeight, outerCirlceRadius, angle); // start point
    // noteOb.angle = [sPoint.x, sPoint.y];
    // return noteOb.angle;
    return [sPoint.x, sPoint.y];
}

function drawBackgroundSquare(width, height) {
    // Background square
    mgraphics.set_source_rgba(0, 0, 0, 1); // Grey color
    mgraphics.rectangle(0, 0, width, height);
    mgraphics.fill()
}

// ================ DATA INPUT FUNCTIONS ================ //
function init() {
    _noteID = 0;
    notesDetected = {};
    mgraphics.redraw();
}

// takes [id, note, start, dur, pass/fail]
function storeNoteInfo(noteId, noteNum, noteStart, noteDur, notePassFail) {
    // post('\nstoreNoteInfo notePassFail: ' + notePassFail);
    var pc = noteNum%12;
    if(notePassFail === 1) {
        post('\nnote passed tests. passing to interface2')
        outlet(1, 'pitchClassDetected', pc);
    }

    // add new note data to notesDetected obj
    if(!notesDetected[noteId]) {
        notesDetected[noteId] = {
            pc: pc,
            start: noteStart,
            dur: noteDur,
            passFail: notePassFail
        } 
    } else {
        notesDetected[noteId]['passFail'] = notePassFail;
    }
    mgraphics.redraw();    
}

/**
 * receives an array of note ids, looks up information on each regarding note line placement, colour etc. and reports this to interface2.js
 * @param {*} ids array of ints
 */
function currentlyPlayingNoteIDS() {
    var ids = arrayfromargs(arguments)
    // if(ids.length) {
    //     post('\ncurrentlyPlayingNoteIDS received ids: ' + ids)
    // }

    var playingNotes = [];
    for(var i=0; i<ids.length; i++) {
        var id = ids[i];
        var noteLineInfo = notesDetected[id];
        if(!noteLineInfo) {
            post('\nERROR: currentlyPlayingNoteIDS no note line info can be found for note with id: ' + id);
            // return;
        }
        playingNotes.push(noteLineInfo);
    }

    // post('\ncurrentlyPlayingNoteIDS sending out the following arr:', JSON.stringify(playingNotes));

    outlet(0, 'setPlayingNotes', playingNotes)
}


// ================ UTILITY FUNCTIONS ================ //
function hslToRgba(h, s, l, opacity) {
    // Normalize inputs
    // h: 0-360 degrees
    // s: 0-100 percent
    // l: 0-100 percent
    // opacity: 0-100 percent
    
    s = s / 100;
    l = l / 100;
    var a = opacity / 100; // Convert opacity to 0-1 range
    
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs((h / 60) % 2 - 1));
    var m = l - c / 2;
    
    var r, g, b;
    
    if (h >= 0 && h < 60) {
        r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
        r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
        r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
        r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
        r = x; g = 0; b = c;
    } else {
        r = c; g = 0; b = x;
    }
    
    // Return values in 0-1 range for mgraphics
    return {
        r: r + m,
        g: g + m,
        b: b + m,
        a: a
    };
}

function pointOnCircleInWindow(windowWidth, windowHeight, radius, angle) {
    var centerX = windowWidth / 2;
    var centerY = windowHeight / 2;
    var radians = (angle - 90) * Math.PI / 180;
    
    return {
        x: centerX + radius * Math.cos(radians),
        y: centerY + radius * Math.sin(radians)
    };
}

function degreeToRadian(degree) {
    return degree * (Math.PI / 180)
}

function randomRange(rStart, rEnd) {
    var diff = rEnd - rStart;
    var rand = Math.random() * diff;
    return rStart + rand;
}

function choose(arr) {
    var idx = Math.floor(Math.random() * arr.length);
    return arr[idx];
}

function scaleToRange(inputR, outputR, num) {
    var inputRatio = (num - inputR[0]) / (inputR[1] - inputR[0]);
    var res = (outputR[1] - outputR[0]) * inputRatio + outputR[0];
    return Math.max(Math.min(res, outputR[1]), outputR[0]);
}