var allNotes = []; // [{note: 72, start: 1238, dur: 670}]
var notesByPitchClass = {}; // {"0": {nextNote: 0, notes: [{start: 3748, dur: 500}, ...]}, "1": {nextNote: 0, notes: [{start: 8394, dur: 348}, ...}]}
var notesByNoteNum = {}; //{"62": {nextNote: 0, notes: [{start: 4672, dur: 902}, ...}], "73": {nextNote: 0, notes: [{start: 7483, dur: 203}, ...}]}
var minNoteLength = 60;

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
function resetNextNoteCounter(noteNum) {
    resetNotesByNoteNumNextNoteCounter(noteNum);
    resetNotesByPitchClassNextNoteCounter(noteNum);
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
    // post('\nplayNoteByPitchClass C');
    var pitchClassObj = notesByPitchClass[pitchClass];
    // post('\npitchClassObj is:', pitchClassObj);
    var currNextNote = pitchClassObj.nextNote % pitchClassObj.notes.length;
    // post('\ncurrNextNote is:', currNextNote)
    // post('\nplayNoteByPitchClass D');
    // post('\npitchClassObj.notes[currNextNote] is:', pitchClassObj.notes[currNextNote])
    var start = pitchClassObj.notes[currNextNote]['start'];
    var dur = pitchClassObj.notes[currNextNote]['dur'];
    var end = start + dur;
    // post('\nplayNoteByPitchClass E');
    var returnArr = [noteNum, start, dur, end];
    // post('\nplayNoteByPitchClass F');

    pitchClassObj.nextNote ++
    // post('\nplayNoteByPitchClass G');

    outlet(0, returnArr);
}


function playNoteByNoteNum(noteNum) {
    if(!notesByNoteNum[noteNum]) {
        post('NO NOTES WITH NOTE NUM:', noteNum, 'AVAILABLE TO PLAY');
        return;
    }
    // post('\nplayNoteByPitchClass C');
    var noteNumObj = notesByNoteNum[noteNum];
    // post('\nnoteNumObj is:', noteNumObj);
    var currNextNote = noteNumObj.nextNote % noteNumObj.notes.length;
    // post('\ncurrNextNote is:', currNextNote)
    // post('\nplayNoteByPitchClass D');
    // post('\nnoteNumObj.notes[currNextNote] is:', noteNumObj.notes[currNextNote])
    var start = noteNumObj.notes[currNextNote]['start'];
    var dur = noteNumObj.notes[currNextNote]['dur'];
    var end = start + dur;
    // post('\nplayNoteByPitchClass E');
    var returnArr = [noteNum, start, dur, end];
    // post('\nplayNoteByPitchClass F');

    noteNumObj.nextNote ++
    // post('\nplayNoteByPitchClass G');

    outlet(0, returnArr);
}


//=================== MISC USER INTERACTION ===================//

function setMinNoteLength(noteLength) {
    minNoteLength = noteLength;
    post('\nminNoteLength is now:', minNoteLength);
    organiseAllNotes();
}