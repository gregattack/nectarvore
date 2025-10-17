//© 2025 Gregory Olley. Licensed under the Music Software Public Licence - See LICENCE file for details.

this.outlets = 4; // out1: playNote info (ie play this note at this timestamp). out2 functions for exporting audio. out3 state saving functions. out4 information on which notes have been detected so far, only accepts array of length 12.
var allNotes = []; // [[note#, start#, dur#], [note#, start#, dur#]] e.g. [[72, 1238, 670]]
var notesByPitchClass = {}; // {"0": {nextNote: 0, notes: [{start: 3748, dur: 500}, ...]}, "1": {nextNote: 0, notes: [{start: 8394, dur: 348}, ...}]}
var notesByNoteNum = {}; //{"62": {nextNote: 0, notes: [{start: 4672, dur: 902}, ...}], "73": {nextNote: 0, notes: [{start: 7483, dur: 203}, ...}]}
var minNoteLength = 60;
var quantiseState = false; // true/false. Quantise the 'dur' (and therefore also 'end') value output when playing back a note. If true these values will be quantised to the minNoteLength value.
var notesDetected = [0,0,0,0,0,0,0,0,0,0,0,0] // An array showing which notes have been detected so far.

//=================== RESET NOTE OBJECTS ===================//

function resetAll() {
    post('reseting all note storage objects.\n')
    resetAllNotes();
    resetNotesByPitchClass();
    resetNotesByNoteNum();
    resetNotesDetected();
}

function resetAllNotes() {
    post('\nResetting allNotes');
    allNotes = [];
}

function resetNotesByPitchClass() {
    post('\nResetting notesByPitchClass');
    notesByPitchClass = {};
}

function resetNotesByNoteNum() {
    post('\nReseting notesByNoteNum');
    notesByNoteNum = {}
}

/**
 * resets the 'nextNote' property of both notesByPitchClass and notesByNoteNum with regard to the desired noteNum.
 * @param {*} noteNum 
 */
function resetNextNoteCounters() {

    var noteNums = Object.keys(notesByNoteNum);
    for(var i=0; i< noteNums.length; i ++) {
        var noteNum = noteNums[i];
        resetNotesByNoteNumNextNoteCounter(noteNum);
    }

    var pitchClasses = Object.keys(notesByPitchClass);
    for(var i=0; i< pitchClasses.length; i ++) {
        var pc = pitchClasses[i];
        resetNotesByPitchClassNextNoteCounter(pc);
    }
}

function resetNotesByNoteNumNextNoteCounter(noteNum) {
    if(!notesByNoteNum[noteNum]) {
        post('No note:', noteNum, 'in notesByNoteNum. Cannot reset nextNote counter.');
        return;
    }

    notesByNoteNum[noteNum]['nextNote'] = 0;
}

function resetNotesByPitchClassNextNoteCounter(noteNum) {
    var pitchClass = noteNum % 12;

    if(!notesByPitchClass[pitchClass]) {
        post('No notes for pitchClass:', pitchClass, 'in notesByPitchClass. Cannot reset nextNote counter.');
        return;
    }

    notesByPitchClass[pitchClass]['nextNote'] = 0;
}

function resetNotesDetected() {
    post('\nResetting notesDetected Array.')
    notesDetected = [0,0,0,0,0,0,0,0,0,0,0,0];
}


//=================== ANALYSIS LOGIC ===================//
/**
 * Takes any and all notes (regardless of min length etc) and stores them in an array.
 * this array can then be sorted later into a more useful object.
 * @param {number} start 
 * @param {number} dur 
 * @param {number} note 
 */
function storeNoteInfo(note, start, dur) {
    var noteArr = [note, start, dur]
    allNotes.push(noteArr);
    post('\nAdded note:', note, 'start:', start, 'dur:', dur, 'to allNotes array. Array length now:', allNotes.length);

    // report which notes have been detected so far (which abide by any rules such as min length)
    var pc = note%12;
    if(notesDetected[pc] === 0 && testSingleNote(noteArr[2])) {
        notesDetected[pc] = 1;
        post('\nValid note detected. Note:', pc);
        post('\n outputing notesDetected array:', notesDetected)
        outlet(3, notesDetected);
    }
}

/**
 * function to be called when max has finished analysing an audio file.
 */
function analysisFinished() {
    organiseAllNotes();
    saveState();
}

/**
 * Organises the allNotes array (containing all notes detected regardless of length) into more useful groupings such as pitchClass.
 * This is also where notes are filtered for minLength etc.
 */
function organiseAllNotes() {
    post('\norganiseAllNotes')
    var validNotes = filterInvalidNotes(allNotes);
    organiseNotesByNoteNum(validNotes);
    organiseNotesByPitchClass(validNotes);
}

/**
 * filter the global allNotes list and return a new list containing only notes passing all tests (min length etc)
 * @param {*} noteList 
 * @returns 
 */
function filterInvalidNotes(noteList) {
    //filter notes for minNoteLength
    return noteList.filter(function(noteArr) {
        return testSingleNote(noteArr[2]);
        // return noteOverMinLength(noteArr[2]);
        //noteArr[2] >= minNoteLength;
    })
}

// test whether a single note passes all the necessary tests (only minNoteLength for now but this may change in the future)
function testSingleNote(dur) {
    return noteOverMinLength(dur);
}

// Test whether the particular note is over the minimum length of a note.
function noteOverMinLength (dur) {
    return dur >= minNoteLength;
}

function organiseNotesByNoteNum(noteList) {
    resetNotesByNoteNum();
    noteList.forEach(function(singleNoteArr){
        var noteNum = singleNoteArr[0];
        notesByNoteNum[noteNum] = notesByNoteNum[noteNum] || {nextNote: 0, notes: []};
        var noteObj = {
            start: singleNoteArr[1],
            dur: singleNoteArr[2]
        }
        notesByNoteNum[noteNum]['notes'].push(noteObj);
    });

    var allNoteNums = Object.keys(notesByNoteNum);
    for(var i=0; i<allNoteNums.length; i++) {
        var noteNum = allNoteNums[i];
        var notes = notesByNoteNum[noteNum]['notes'].length;
        post('organiseNotesByNoteNum:', noteNum, 'has', notes, 'notes\n');
    }
}

function organiseNotesByPitchClass(noteList) {
    resetNotesByPitchClass();
    noteList.forEach(function(singleNoteArr) {
        var pc = singleNoteArr[0] % 12;

        notesByPitchClass[pc] = notesByPitchClass[pc] || {nextNote: 0, notes: []};
        var noteObj = {
            start: singleNoteArr[1],
            dur: singleNoteArr[2]
        }
        notesByPitchClass[pc]['notes'].push(noteObj)
    })

    var allNoteNums = Object.keys(notesByPitchClass);
    for(var i=0; i<allNoteNums.length; i++) {
        var noteNum = allNoteNums[i];
        var notes = notesByPitchClass[noteNum]['notes'].length;
        post('organiseNotesByPitchClass:', noteNum, 'has', notes, 'notes\n');
    }
}

// Outputs which notes have been detected and pass the requirements such as minNoteLength.
function reportDetectedNotes() {
    resetNotesDetected();
    var keys = Object.keys(notesByPitchClass);
    post('\nnreportDetectedNotes: keys are:', keys)
    if(!keys.length) {
        post('\nreportDetectedNotes: No notes detected');
    } else {
        for(var i=0; i<keys.length; i++) {
            var pc = keys[i];
            post('\nreportDetectedNotes: pc is:', pc)
            if(notesByPitchClass[pc]['notes'].length);
            notesDetected[Number(pc)] = 1;
        }
        post('\nreportDetectedNotes: notesDetected is', notesDetected)
    }
    outlet(3, notesDetected);
}

// =================== PLAYBACK LOGIC ===================//

function playNoteByPitchClass(noteNum) {
    var pitchClass = noteNum % 12;
    if(!notesByPitchClass[pitchClass]) {
        post('NO NOTES WITH PITCH CLASS:', pitchClass, 'AVAILABLE TO PLAY');
        return;
    }
    var pitchClassObj = notesByPitchClass[pitchClass];
    var currNextNote = pitchClassObj.nextNote % pitchClassObj.notes.length;
    var start = pitchClassObj.notes[currNextNote]['start'];
    var dur = pitchClassObj.notes[currNextNote]['dur'];
    if(quantiseState == true) {
        var oldDur = dur;
        dur = nearestMultiple(dur, minNoteLength)
        post('\nQuantise is set to true so changing dur from', oldDur, 'to', dur)
    }
    var end = start + dur;
    var returnArr = [noteNum, start, dur, end];

    pitchClassObj.nextNote ++

    outlet(0, returnArr);
}


function playNoteByNoteNum(noteNum) {
    if(!notesByNoteNum[noteNum]) {
        post('NO NOTES WITH NOTE NUM:', noteNum, 'AVAILABLE TO PLAY');
        return;
    }
    var noteNumObj = notesByNoteNum[noteNum];
    var currNextNote = noteNumObj.nextNote % noteNumObj.notes.length;
    var start = noteNumObj.notes[currNextNote]['start'];
    var dur = noteNumObj.notes[currNextNote]['dur'];
    if(quantiseState == true) {
        dur = nearestMultiple(dur, minNoteLength)
    }
    var end = start + dur;
    var returnArr = [noteNum, start, dur, end];

    noteNumObj.nextNote ++

    outlet(0, returnArr);
}

function playBySingleNote(noteNum) {
    if(!notesByNoteNum[noteNum]) {
        post('NO NOTES WITH NOTE NUM:', noteNum, 'AVAILABLE TO PLAY');
        return;
    }
    var noteNumObj = notesByNoteNum[noteNum];
    var start = noteNumObj.notes[0]['start'];
    var dur = noteNumObj.notes[0]['dur'];
    if(quantiseState == true) {
        dur = nearestMultiple(dur, minNoteLength)
    }
    var end = start + dur;
    var returnArr = [noteNum, start, dur, end];

    outlet(0, returnArr);
}


//=================== EXPORT AUDIO LOGIC ===================//

function exportNotes() {
    post('export notes function')
    resetNextNoteCounters();

    exportNextNote();
}

function exportNextNote() {
    var noteNums = Object.keys(notesByNoteNum);

    for(var i=0; i<noteNums.length; i++) {
        var noteNum = noteNums[i];
        var noteNumObj = notesByNoteNum[noteNum];
        var nextNoteIdx = noteNumObj.nextNote;
        if(nextNoteIdx >= noteNumObj.notes.length) {
            continue;
        }

        var noteLetter = noteNumToNoteLetter(noteNum);
        var noteName = noteLetter + "-" + noteNum + "-" + (nextNoteIdx + 1);
        var note = noteNumObj.notes[nextNoteIdx];
        if(quantiseState === true) {
            post('exporting note with the following details:', note.start, nearestMultiple(note.dur, minNoteLength), noteName)
            outlet(1, [note.start, nearestMultiple(note.dur, minNoteLength), noteName]);
            noteNumObj.nextNote ++;
            return;
        }

        post('exporting note with the following details:', note.start, note.dur, noteName)
        outlet(1, [note.start, note.dur, noteName]);
        noteNumObj.nextNote ++;
        return;
    }
}


//=================== MISC USER INTERACTION ===================//

function setMinNoteLength(noteLength) {
    minNoteLength = noteLength;
    post('\nminNoteLength is now:', minNoteLength);
    organiseAllNotes();
    reportDetectedNotes();
    saveState();
}

function randomiseOrder() {
    post('\nShuffling notesByNoteNum note order');
    var noteNumKeys = Object.keys(notesByNoteNum)

    for(var i=0; i<noteNumKeys.length; i++) {
        var key = noteNumKeys[i];

        if(notesByNoteNum[key]['notes']) {
            notesByNoteNum[key]['notes'] = shuffle(notesByNoteNum[key]['notes']);
        }
    }

    post('\nShuffling notesByPitchClass note order');
    var pitchClassKeys = Object.keys(notesByPitchClass)

    for(var i=0; i<pitchClassKeys.length; i++) {
        var key = pitchClassKeys[i];
        if(notesByPitchClass[key]['notes']) {
            notesByPitchClass[key]['notes'] = shuffle(notesByPitchClass[key]['notes']);
        }
    }
    saveState();
}

function setQuantise(quantState) {
    var newState = Boolean(quantState);
    post('\nSetting quantise state to', newState);
    quantiseState = newState;
    saveState();
}

//=================== STATE SAVING AND RETRIEVAL ===================//

/**
 * var allNotes = []; // [[72 (note), 1238(start), 670(dur)]]
var notesByPitchClass = {}; // {"0": {nextNote: 0, notes: [{start: 3748, dur: 500}, ...]}, "1": {nextNote: 0, notes: [{start: 8394, dur: 348}, ...}]}
var notesByNoteNum = {}; //{"62": {nextNote: 0, notes: [{start: 4672, dur: 902}, ...}], "73": {nextNote: 0, notes: [{start: 7483, dur: 203}, ...}]}
var minNoteLength = 60;
var quantiseState = false
 */
function saveState() {
    post('saving state')

    var state = {
        allNotes: allNotes,
        // notesByPitchClass: notesByPitchClass,
        // notesByNoteNum: notesByNoteNum,
        minNoteLength: minNoteLength,
        quantiseState: quantiseState
    }

    outlet(2, JSON.stringify(state))
}

function recallState(stateStr) {
    post('\nRecalling State.');
    if(!stateStr) {
        post('\nNo previous state found. Starting afresh.');
        return;
    }

    try {
        var state = JSON.parse(stateStr);
        allNotes = state.allNotes;
        // notesByPitchClass = state.notesByPitchClass;
        // notesByNoteNum = state.notesByNoteNum;
        minNoteLength = state.minNoteLength;
        quantiseState = state.quantiseState;
        organiseAllNotes();
    } catch(err) {
        post('\nCould not parse state. Error:', err)
    }
}

// function compressAllNotes(allNotesArr) {
//     // turns allNotesArray from [{note: ##, start:##, dur##}] into [[##(note), ##(start), ##(dur)]]
//     var compressed = allNotesArr.map(function(ob) {
//         // return Object.values(ob); // This would be nice but no Object.values in max js
//         return Object.keys(ob).map(function(key){return ob[key]});
//     })

//     post('compressedAllNotes is note:', JSON.stringify(compressed));
//     return compressed;
// }

// function uncompressAllNotes(compressedAllNotes) {
//     var uncompressed = compressedAllNotes.map(function(item) {
//         return {
//             note: item[0],
//             start: item[1],
//             dur: item[2]
//         }
//     });

//     post('uncompressedAllNotes is now:', JSON.stringify(uncompressed));
//     return uncompressed;
// }

//=================== UTILITY FUNCTIONS ===================//

function shuffle(array) {
    var m = array.length,
        t,
        i;

    // While there remain elements to shuffle…
    while (m) {
        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);

        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }

    return array;
}

function nearestQuantisedEnd(start, dur) {
    var nm = nearestMultiple(dur, minNoteLength);
    return nm + start
}

function nearestMultiple (val, mult) {
    var diff = val % mult;

    if(val < mult) {
        return mult;
    }

    var res = diff > (mult/2) ? val + (mult - diff) : val - diff;
    return res;
}

function noteNumToNoteLetter (noteNum) {
    var pitchClassToLetter = {
        "0": "C",
        "1": "C#",
        "2": "D",
        "3": "D#",
        "4": "E",
        "5": "F",
        "6": "F#",
        "7": "G",
        "8": "G#",
        "9": "A",
        "10": "A#",
        "11": "B"
    }

    var pitchClass = noteNum % 12;
    return pitchClassToLetter[pitchClass];
}