mgraphics.init();
mgraphics.autofill = 0;
mgraphics.relative_coords = 0;

var notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
var pitchClassesDetected = [0,0,0,0,0,0,0,0,0,0,0];

// var noteArr = [note, start, dur, colour(if drawn), angle(if drawn), thickness(if drawn)]
var notesDetected = [

] 

function paint() {
    // let [width, height] = mgraphics.size;
    var width = mgraphics.size[0];
    var height = mgraphics.size[1];

    drawBackgroundSquare(width, height);

    drawNoteLines(width, height, width/2, notesDetected);

    drawOuterCircle(width, height);

    // draw note name text
    drawNoteNames(width, height)

    // inner circle(s)
    drawInnerCircle(width, height);
}

// ================== INDIVIDUAL ELEMENTS ================== //

function drawNoteLines(width, height, radius, notesArr) {
    var centreX = width/2;
    var centreY = height/2;
    var colours = [
        hslToRgba(44, 98, 55, 100), // bright yellow
        hslToRgba(34, 100, 50, 100), // orange
        hslToRgba(29, 83, 70, 100), // tan-ish
        hslToRgba(43, 87, 48, 100) // darker yellow
    ]
    for(var i=0; i<notesArr.length; i++) {
        var note = notesArr[i];

        if(!note[3]) {
            note.push(choose(colours));
        } 
        var colour = note[3];
        // var colour = choose(colours);
        mgraphics.set_source_rgba(colour.r, colour.g, colour.b, colour.a);

        if(!note[4]) {
            var pc = note[0];
            var angleSliceStart = pc * 30 - 15;
            var angleSliceStop = pc * 30 + 15;
            post('\nangleSlice\nStart:', angleSliceStart, '--- Stop:', angleSliceStop)
            var angle = randomRange(angleSliceStart, angleSliceStop); // choose randomly between a slice of the pie
            post('\nangle:', angle)
            var sPoint = pointOnCircleInWindow(width, height, radius, angle); // start point
            note.push([sPoint.x, sPoint.y]); 
        }
        var startPoint = note[4];

        if(!note[5]) {
            var thickness = scaleToRange([60, 2000], [1, 12], note[2]); 
            note.push(thickness);
        }
        var lineSize = note[5];
        mgraphics.set_line_width(lineSize);
        mgraphics.move_to(startPoint[0], startPoint[1]);
        mgraphics.line_to(centreX, centreY);
        mgraphics.stroke();
    }
}

function drawBackgroundSquare(width, height) {
    // Background square
    mgraphics.set_source_rgba(0, 0, 0, 1); // Grey color
    mgraphics.rectangle(0, 0, width, height);
    mgraphics.fill()
}

function drawOuterCircle(width, height) {
    // Grey circle border
    mgraphics.set_source_rgba(0.27, 0.27, 0.27, 1); // Grey color
    
    var circXPos = width/2;
    var circYPos = height/2;
    mgraphics.set_line_width(3);

    mgraphics.arc(circXPos, circYPos, (width/2) * 0.85, 0, 2*Math.PI);
    mgraphics.stroke();

    // Black circle border
    mgraphics.set_source_rgba(0, 0, 0, 1); // Grey color
    mgraphics.set_line_width((width/2)*0.3);

    mgraphics.arc(circXPos, circYPos, width/2, 0, 2*Math.PI);
    mgraphics.stroke();
}

function drawInnerCircle(width, height) {
    // inner circle(s)
    var innerCWidth = width * 0.25;
    var InnerCHeight = height * 0.25;

    mgraphics.set_line_width(2);
    //Grey outer circle
    mgraphics.set_source_rgba(0.27, 0.27, 0.27, 1); // Purple color
    var greyCWidth = innerCWidth;
    var greyCHeight = InnerCHeight;
    var greyCX = width/2 - greyCWidth/2;
    var greyCY = height/2 - greyCHeight/2;
    mgraphics.ellipse(greyCX, greyCY, greyCWidth, greyCHeight)
    mgraphics.fill();

    // Black outer circle
    mgraphics.set_source_rgba(0, 0, 0, 1); // Purple color
    var blackCWidth = innerCWidth - 2;
    var blackCHeight = InnerCHeight - 2;
    var blackCX = width/2 - blackCWidth/2;
    var blackCY = height/2 - blackCHeight/2;
    mgraphics.ellipse(blackCX, blackCY, blackCWidth, blackCHeight)
    mgraphics.fill();

    // Inner mauve circle 1
    var mauve = hslToRgba(282, 30, 18, 100);
    mgraphics.set_source_rgba(mauve.r, mauve.g, mauve.b, mauve.a); // Purple color
    mauveW = innerCWidth * 0.75;
    mauveH = InnerCHeight * 0.75;
    mauveX = width/2 - mauveW/2;
    mauveY = height/2 - mauveH/2;
    mgraphics.ellipse(mauveX, mauveY, mauveW, mauveH)
    mgraphics.fill();

    // Inner purple circle
    var purple = hslToRgba(265, 68, 30, 100);
    mgraphics.set_source_rgba(purple.r, purple.g, purple.b, purple.a); // Purple color
    purpleW = innerCWidth * 0.55;
    purpleH = InnerCHeight * 0.55;
    purpleX = width/2 - purpleW/2;
    purpleY = height/2 - purpleH/2;
    mgraphics.ellipse(purpleX, purpleY, purpleW, purpleH)
    mgraphics.fill();

    // Innermost violet circle
    var violet = hslToRgba(260, 89, 34, 100);
    mgraphics.set_source_rgba(violet.r, violet.g, violet.b, violet.a); // violet color
    violetW = innerCWidth * 0.3;
    violetH = InnerCHeight * 0.3;
    violetX = width/2 - violetW/2;
    violetY = height/2 - violetH/2;
    mgraphics.ellipse(violetX, violetY, violetW, violetH)
    mgraphics.fill();
}

function drawNoteNames(width, height) {
    var fontSize = width * 0.045;
    for(var i=0; i<notes.length; i++) {

        var colour = hslToRgba(187, 98, 49, 100)

        if(pitchClassesDetected[i] == 1) { // yellow for notes that are detected
            colour = hslToRgba(44, 98, 55, 100)
        }
        mgraphics.set_source_rgba(colour.r, colour.g, colour.b, colour.a);

        mgraphics.set_font_size(fontSize);

        var angle = 30 * i;
        var point = pointOnCircleInWindow(width, height, width*0.46, angle);
        var xOffset = fontSize/2.5;
        var yOffset = fontSize/3;
        if(notes[i] === 'G#') {
            xOffset = fontSize/1.5;
            mgraphics.move_to(point.x - xOffset, point.y + yOffset);
        } else {
            mgraphics.move_to(point.x - xOffset, point.y + yOffset);
        }
        mgraphics.show_text(notes[i][0]);

        if(notes[i][1]) {
            mgraphics.move_to(point.x - xOffset + fontSize*0.75, point.y + yOffset - fontSize/2);
            mgraphics.set_font_size(fontSize/1.75);
            mgraphics.show_text(notes[i][1]);
        }
    }
}

// ================ DATA INPUT FUNCTIONS ================ //
function init() {
    notesDetected = [];
    pitchClassesDetected = [0,0,0,0,0,0,0,0,0,0,0];
    mgraphics.redraw();
}

function storeNoteInfo(note, start, dur) {
    post('storing note:', note, start, dur)
    var pc = note%12;
    notesDetected.push([pc, start, dur]);
    pitchClassesDetected[pc] = 1;
    mgraphics.redraw();
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