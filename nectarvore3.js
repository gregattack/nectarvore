this.outlets = 2;
var allNotes = []; // [{note: 72, start: 1238, dur: 670}]
var notesByPitchClass = {}; // {"0": {nextNote: 0, notes: [{start: 3748, dur: 500}, ...]}, "1": {nextNote: 0, notes: [{start: 8394, dur: 348}, ...}]}
var notesByNoteNum = {}; //{"62": {nextNote: 0, notes: [{start: 4672, dur: 902}, ...}], "73": {nextNote: 0, notes: [{start: 7483, dur: 203}, ...}]}
var minNoteLength = 60;
var quantiseState = false; // true/false. Quantise the 'dur' (and therefore also 'end') value output when playing back a note. If true these values will be quantised to the minNoteLength value.

//=================== RESET NOTE OBJECTS ===================//

function resetAll() {
    post('reseting all note storage objects.\n')
    resetAllNotes();
    resetNotesByPitchClass();
    resetNotesByNoteNum();
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


//=================== ANALYSIS LOGIC ===================//
/**
 * Takes any and all notes (regardless of min length etc) and stores them in an array.
 * this array can then be sorted later into a more useful object.
 * @param {number} start 
 * @param {number} dur 
 * @param {number} note 
 */
function storeNoteInfo(note, start, dur) {
    var noteObj = {
        start: start,
        dur: dur,
        note: note
    }
    allNotes.push(noteObj);
    post('\nAdded note:', note, 'start:', start, 'dur:', dur, 'to allNotes array. Array length now:', allNotes.length);
}

/**
 * function to be called when max has finished analysing an audio file.
 */
function analysisFinished() {
    organiseAllNotes();
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
    return noteList.filter(function(noteObj) {
        return noteObj.dur >= minNoteLength;
    })
}

function organiseNotesByNoteNum(noteList) {
    resetNotesByNoteNum();
    noteList.forEach(function(noteObj){
        var noteNum = noteObj.note;
        notesByNoteNum[noteNum] = notesByNoteNum[noteNum] || {nextNote: 0, notes: []};
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
    noteList.forEach(function(noteObj) {
        var pc = noteObj.note % 12;

        notesByPitchClass[pc] = notesByPitchClass[pc] || {nextNote: 0, notes: []};
        notesByPitchClass[pc]['notes'].push(noteObj)
    })

    var allNoteNums = Object.keys(notesByPitchClass);
    for(var i=0; i<allNoteNums.length; i++) {
        var noteNum = allNoteNums[i];
        var notes = notesByPitchClass[noteNum]['notes'].length;
        post('organiseNotesByPitchClass:', noteNum, 'has', notes, 'notes\n');
    }
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
}

function randomiseOrder() {
    post('\nShuffling notesByNoteNum note order');
    var noteNumKeys = Object.keys(notesByNoteNum)

    post('\nPRE: first noteNum start is:', notesByNoteNum[noteNumKeys[0]]['notes'][0]['start'])

    for(var i=0; i<noteNumKeys.length; i++) {
        var key = noteNumKeys[i];

        if(notesByNoteNum[key]['notes']) {
            notesByNoteNum[key]['notes'] = shuffle(notesByNoteNum[key]['notes']);
        }
    }

    post('\POST: first noteNum start is:', notesByNoteNum[noteNumKeys[0]]['notes'][0]['start'])

    post('\nShuffling notesByPitchClass note order');
    var pitchClassKeys = Object.keys(notesByPitchClass)

    for(var i=0; i<pitchClassKeys.length; i++) {
        var key = pitchClassKeys[i];
        if(notesByPitchClass[key]['notes']) {
            notesByPitchClass[key]['notes'] = shuffle(notesByPitchClass[key]['notes']);
        }
    }
}

function setQuantise(quantState) {
    var newState = Boolean(quantState);
    post('\nSetting quantise state to', newState);
    quantiseState = newState;
}

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