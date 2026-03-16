//© 2025 Gregory Olley. Licensed under the Music Software Public Licence - See LICENCE file for details.

this.outlets = 4; // out1: playNote info (ie play this note at this timestamp). out2 functions for exporting audio. out3 state saving functions. out4: ui information
var allNotes = []; // [id, note#, start#, dur#], [id, note#, start#, dur#]] e.g. [[283, 72, 1238, 670]]
var notesByPitchClass = {}; // {"0": {nextNote: 0, notes: [{id: ##, start: 3748, dur: 500}, ...]}, "1": {nextNote: 0, notes: [{id: ##, start: 8394, dur: 348}, ...}]}
var notesByNoteNum = {}; //{"62": {nextNote: 0, notes: [{id: ##, start: 4672, dur: 902}, ...}], "73": {nextNote: 0, notes: [{id: ##, start: 7483, dur: 203}, ...}]}
var minNoteLength = 60;
var minNoteAcc = 50; // Max allowable deviation of note frequency (in cents I thin?)
var quantiseState = false; // true/false. Quantise the 'dur' (and therefore also 'end') value output when playing back a note. If true these values will be quantised to the minNoteLength value.
var _noteID = 1; // This is the ID given to each note. It is incremented for each new note.
var playMode = 0; // 0 = play by pitch class;; 1 = play by note;; 2 = play single note.

//=================== RESET NOTE OBJECTS ===================//

function resetAll() {
    post('reseting all note storage objects.\n')
    resetAllNotes();
    resetNotesByPitchClass();
    resetNotesByNoteNum();
    resetNextNoteCounters();
    _noteID = 1
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
 * @param {number} acc pitch accuracy. 0 is perfectly accurate (close to fundamental freq). + or - is further away
 */
function storeNoteInfo(note, start, dur, acc) {
    var noteArr = [_noteID, note, start, dur, acc];
    _noteID++;
    allNotes.push(noteArr);
    post('\nAdded note: ID:', noteArr[0], '- note:', noteArr[1], '- start:', noteArr[2], '- dur:', noteArr[3], '- acc:', noteArr[4], 'to allNotes array. Array length now:', allNotes.length);

    // If note passes tests, add it to noteByPitchClass and notesByNoteNum objects
    if(testSingleNote(noteArr)) {
        organiseSingleNoteByNoteNum(noteArr);
        organiseSingleNoteByPC(noteArr);
        noteArr.push(1); // tests passed marker
    } else {
        noteArr.push(0) // tests failed marker
    }

    // export the note data (including whether it passed tests)
    outlet(3, 'storeNoteInfo', noteArr); //[id, note, start, dur, pass/fail]
}

/**
 * function to be called when max has finished analysing an audio file.
 */
function analysisFinished() {
    saveState();
}

/**
 * Organises the allNotes array (containing all notes detected regardless of length) into more useful groupings such as pitchClass.
 * This is also where notes are filtered for minLength etc.
 */
function organiseAllNotes() {
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
    var validNotes = noteList.filter(function(noteArr) {
        var res = testSingleNote(noteArr);
        // post('\nfilterInvalidNotes res is ' + res);
        // send note date to jsui interface
        outlet(3, 'storeNoteInfo', [noteArr[0], noteArr[1], noteArr[2], noteArr[3], Number(res)]); 
        return res;
    });
    return validNotes;
}

// test whether a single note passes all the necessary tests (only minNoteLength for now but this may change in the future)
// noteArr = [ID, start, dur, end]
function testSingleNote(noteArr) {
    var dur = noteArr[3];
    var acc = Math.abs(noteArr[4]);
    if(!noteOverMinLength(dur) || !noteMeetsMinAccuracy(acc)) {
        return false;
    }
    return true;
}

// Test whether the particular note is over the minimum length of a note.
function noteOverMinLength (dur) {
    return dur >= minNoteLength;
}

// Test whether a note meets accuracy requirements (deviation from fundamental freq)
function noteMeetsMinAccuracy(acc) {
    return acc <= minNoteAcc;
}

function organiseNotesByNoteNum(noteList) {
    resetNotesByNoteNum();
    noteList.forEach(organiseSingleNoteByNoteNum);

    var allNoteNums = Object.keys(notesByNoteNum);
    for(var i=0; i<allNoteNums.length; i++) {
        var noteNum = allNoteNums[i];
        var notes = notesByNoteNum[noteNum]['notes'].length;
        post('organiseNotesByNoteNum:', noteNum, 'has', notes, 'notes\n');
    }
}

function organiseSingleNoteByNoteNum(singleNoteArr) {
    var noteNum = singleNoteArr[1];
    notesByNoteNum[noteNum] = notesByNoteNum[noteNum] || {nextNote: 0, notes: []};
    var noteObj = {
        id: singleNoteArr[0],
        start: singleNoteArr[2],
        dur: singleNoteArr[3]
    }
    notesByNoteNum[noteNum]['notes'].push(noteObj);
}

function organiseNotesByPitchClass(noteList) {
    resetNotesByPitchClass();
    noteList.forEach(organiseSingleNoteByPC);

    var allNoteNums = Object.keys(notesByPitchClass);
    for(var i=0; i<allNoteNums.length; i++) {
        var noteNum = allNoteNums[i];
        var notes = notesByPitchClass[noteNum]['notes'].length;
        post('organiseNotesByPitchClass:', noteNum, 'has', notes, 'notes\n');
    }
}

function organiseSingleNoteByPC(singleNoteArr) {
    var pc = singleNoteArr[1] % 12;

    notesByPitchClass[pc] = notesByPitchClass[pc] || {nextNote: 0, notes: []};
    var noteObj = {
        id: singleNoteArr[0],
        start: singleNoteArr[2],
        dur: singleNoteArr[3]
    }
    notesByPitchClass[pc]['notes'].push(noteObj)
}

// =================== PLAYBACK LOGIC ===================//

function playNote(noteNum, firstPlay) {
    if(firstPlay !== 1) {
        firstPlay = 0;
    }

    if(playMode === 0) {
        post('\nPlaying note by pitch class ' + noteNum , firstPlay)
        playNoteByPitchClass(noteNum, firstPlay)
    } else if(playMode === 1) {
        post('\nPlaying note by note num ' + noteNum + firstPlay)
        playNoteByNoteNum(noteNum, firstPlay)
    } else {
        post('\nPlaying note by single note ' + noteNum + firstPlay)
        playBySingleNote(noteNum, firstPlay)
    }
}

function playNoteByPitchClass(noteNum, firstPlay) {
    var pitchClass = noteNum % 12;
    if(!notesByPitchClass[pitchClass]) {
        post('NO NOTES WITH PITCH CLASS:', pitchClass, 'AVAILABLE TO PLAY');
        return;
    }
    var pitchClassObj = notesByPitchClass[pitchClass];
    var currNextNote = pitchClassObj.nextNote % pitchClassObj.notes.length;

    var thisNoteObj = pitchClassObj.notes[currNextNote];
    var start = thisNoteObj['start'];
    var dur = thisNoteObj['dur'];
    var id = thisNoteObj['id'];
    if(quantiseState == true) {
        // var oldDur = dur;
        dur = nearestMultiple(dur, minNoteLength)
        // post('\nQuantise is set to true so changing dur from', oldDur, 'to', dur)
    }
    var end = start + dur;
    var returnArr = [id, noteNum, start, dur, end, firstPlay];

    pitchClassObj.nextNote ++

    outlet(0, returnArr); // sends message to audio looper

    // noteIDStartPlaying(id); // sends message to ui (outlet 4) with a list of ids of notes that are currently playing
}


function playNoteByNoteNum(noteNum, firstPlay) {
    if(!notesByNoteNum[noteNum]) {
        post('NO NOTES WITH NOTE NUM:', noteNum, 'AVAILABLE TO PLAY');
        return;
    }
    var noteNumObj = notesByNoteNum[noteNum];
    var currNextNote = noteNumObj.nextNote % noteNumObj.notes.length;

    var thisNoteObj = noteNumObj.notes[currNextNote]
    var start = thisNoteObj['start'];
    var dur = thisNoteObj['dur'];
    var id = thisNoteObj['id'];
    if(quantiseState == true) {
        dur = nearestMultiple(dur, minNoteLength)
    }
    var end = start + dur;
    var returnArr = [id, noteNum, start, dur, end, firstPlay];

    noteNumObj.nextNote ++

    outlet(0, returnArr);

    // noteIDStartPlaying(id); // sends message to ui (outlet 4) with a list of ids of notes that are currently playing
}

function playBySingleNote(noteNum, firstPlay) {
    if(!notesByNoteNum[noteNum]) {
        post('NO NOTES WITH NOTE NUM:', noteNum, 'AVAILABLE TO PLAY');
        return;
    }
    var noteNumObj = notesByNoteNum[noteNum];
    var note = noteNumObj.notes[0];
    var start = note.start;
    var dur = note.dur;
    if(quantiseState == true) {
        dur = nearestMultiple(dur, minNoteLength)
    }
    var end = start + dur;
    var id = note.id;
    var returnArr = [id, noteNum, start, dur, end, firstPlay];

    outlet(0, returnArr);
}

function playingNotes() {
    var playingNotes = arrayfromargs(arguments);
    var noteIds = [];
    for(var i=0; i<playingNotes.length; i++) {
        var noteNum = playingNotes[i];
        if(playMode === 0) {
            var pc = noteNum%12;
            var pcOb = notesByPitchClass[pc];
            if(!pcOb) {
                continue;
            }
            var notes = pcOb['notes'];
            var nnCounter = pcOb['nextNote'];
            var currentNoteIdx = Math.max(nnCounter-1, 0) % notes.length;
            // post('\ncurrentNoteIdx is:' + currentNoteIdx + '\npcOb["notes"][currentNoteIdx] is ' + JSON.stringify(notesByPitchClass[pc]['notes'][currentNoteIdx]));
            noteIds.push(pcOb['notes'][currentNoteIdx]['id']);
        } else {
            var nnOb = notesByNoteNum[noteNum];
            if(!nnOb) {
                continue;
            }
            var notes = nnOb['notes'];
            var nnCounter = nnOb['nextNote'];
            var currentNoteIdx = Math.max(nnCounter-1, 0) % notes.length;
            // post('\ncurrentNoteIdx is:' + currentNoteIdx + '\nnOb["notes"][currentNoteIdx] is ' + JSON.stringify(notesByPitchClass[pc]['notes'][currentNoteIdx]));
            noteIds.push(nnOb['notes'][currentNoteIdx]['id']);
        }
    }
    outlet(3, 'currentlyPlayingNoteIDS', noteIds);
}



//=================== EXPORT AUDIO LOGIC ===================//

function exportNotes() {
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
    post('minNoteLength is now:', minNoteLength);
    // filter all notes with new min note length
    organiseAllNotes();
    saveState();
}

function setMinNoteAcc(acc) {
    minNoteAcc = acc;
    post('minNoteAcc is now:', minNoteAcc);
    organiseAllNotes();
    saveState();
}

function randomiseOrder() {
    post('\nShuffling note order');
    allNotes = shuffle(allNotes);
    organiseAllNotes();
    saveState();
}

function setQuantise(quantState) {
    var newState = Boolean(quantState);
    post('\nSetting quantise state to', newState);
    quantiseState = newState;
    saveState();
}

function changePlayMode(pMode) {
    playMode = pMode;
    post('\nplayMode changed to ' + playMode);
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
    post('\nsaving state')

    var state = {
        allNotes: allNotes,
        // notesByPitchClass: notesByPitchClass,
        // notesByNoteNum: notesByNoteNum,
        minNoteLength: minNoteLength,
        quantiseState: quantiseState,
        minNoteAcc: minNoteAcc
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
        minNoteAcc = state.minNoteAcc;
        quantiseState = state.quantiseState;
        organiseAllNotes();
    } catch(err) {
        post('\nCould not parse state. Error:', err)
    }
}

//=================== UI RELATED FUNCTIONS ===================//
// function setUINoteStart(id) {
//     post('\nnectarvore.js: sending note play message to ui with id:', id);
//     outlet(3, 'setUINoteStart', id);
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