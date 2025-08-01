var allNotes = []; // [{note: 72, start: 1238, dur: 670}]
var notesByPitchClass = {}; // {"0": [{start: 3748, dur: 500}, ...], "1": [{start: 8394, dur: 348}, ...]}
var notesByNoteNumber = {}; //{"62": [{start: 4672, dur: 902}, ...], "73": [{start: 7483, dur: 203}, ...]}

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

function analysisFinished() {
    post("NOT FINISHED YET. NEED TO ORGANISE NOTES INTO OBJECTS")
}