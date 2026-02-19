mgraphics.init();
mgraphics.autofill = 0;
mgraphics.relative_coords = 0;
this.inlets = 1; 
var currentlyPlayingNotes = []; // e.g. {"pc":11,"start":16193,"dur":100,"passFail":1,"colour":{"r":0.9490000000000001,"g":0.6917,"b":0.45099999999999996,"a":1},"thickness":1.2268041237113403,"startPoint":[53.049506961456366,7.229613793849893]}   


var notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
var currentlyPlayingNotes = [] 

function paint() {

    var width = mgraphics.size[0];
    var height = mgraphics.size[1];

    drawCurrentlyPlayingNotes(width, height, currentlyPlayingNotes);
}

/**
 * Updates a list of currently playing notes
 * receives data like this: [{"pc":2,"start":2076,"dur":2000,"passFail":1,"colour":{"r":1,"g":0.5666666666666667,"b":0,"a":1},"angle":[169.7122942060787,63.3787364232774],"thickness":12,"startPoint":[169.7122942060787,63.3787364232774]}] 
 */
function setPlayingNotes() {
    var notes = arrayfromargs(arguments); //
    currentlyPlayingNotes = notes;
    mgraphics.redraw();
}


function drawCurrentlyPlayingNotes(width, height, notesArr) {
    var centreX = width/2;
    var centreY = height/2;

    for(var i=0; i<notesArr.length; i++) {
        var note = notesArr[i];
        var startP = note.startPoint;
        var thickness = note.thickness;

        drawPlayingNoteLine(startP, thickness, centreX, centreY)
    }
}

function drawPlayingNoteLine(startPos, thickness, centreX, centreY) {
    var colour = hslToRgba(187, 98, 49, 100) // blue
    mgraphics.set_source_rgba(colour.r, colour.g, colour.b, colour.a);

    mgraphics.set_line_width(thickness);
    mgraphics.move_to(startPos[0], startPos[1]);
    mgraphics.line_to(centreX, centreY);
    mgraphics.stroke();
}

// ===================== UTILITY ===================== //

function init() {
    currentlyPlayingNotes = [];
    mgraphics.redraw();
}

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