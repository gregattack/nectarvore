this.outlets = 2;

/**
 * Store detected note information in a structure like this:
 * {
 *     "62": { // note degree
 * 		   nextNote: 0
 *         notes: [{start: 1.293, dur: 0.4}]
 *     }
 * }
 */
var notesObj = {}
/**
 * {
 *     "0": {
 *         "notes": [{start: 4.235, dur: 3.243}],
 *         "nextNote": 3
 *     }
 * }
 */
var notesByPitchClass = {}
// var notes = {}; //{"0": {start:[0.1283, 1.3848], dur:[0.4485, 1.583]}, "1"}
var nextNote = 0;
var noteStart;
var noteDur;
var indNotes = {}

	
function resetNoteCounter(){
	nextNote = 0;
	}
	
function resetNotesObj(){
	// notes = {}
	for(var i = 0; i < 128; i++){
			notesObj[i] = {'nextNote':0, 'notes':[]}
		}
	}
	
resetNotesObj();

function resetNotesByNoteClassObj() {
	for(var i=0; i<12; i++) {
		notesByPitchClass[i] = {
			nextNote: 0,
			notes: []
		};
	}
}

resetNotesByNoteClassObj();

function storeNoteInfo(startTime, dur, noteNum) {
	post('noteDetected Function args are:', startTime, dur, noteNum);
	// store note by exact pitch (0-127)
	var noteInfoObj = {start: startTime, dur: dur}
	notesObj[noteNum]['notes'].push(noteInfoObj);

	// store note by pitch class (0-11)
	var pitchClass = noteNum % 12;
	notesByPitchClass[pitchClass]['notes'].push(noteInfoObj);
}

// function list()
// {
// 	var a = arrayfromargs(arguments);
// 	var note = a[2];
// 	notes[note]['start'].push(a[0]);
// 	notes[note]['dur'].push(a[1]);
// 	post('note:'+note + '\nStart:', notes[note]['start'] + '\nDuration:', notes[note]['dur']+'\n');
// }

function playAudioSegment(start, dur) {
	post('playing note from', start, 'to', start+dur);
	outlet(0,[noteStart, noteDur, noteStart + noteDur]);
}

//nt = note you want
//ind = index. which index of the start/dur arrays do you want?
function playNote(nt, ind, minLength){
	ind = ind == undefined ? 0 : ind;
	noteStart = notes[nt]['start'][ind];
	noteDur = notes[nt]['dur'][ind];
	post('\njustbefore', noteStart, noteDur, minLength);
	if(noteStart !== undefined && noteDur !== undefined && noteDur >= minLength){
		post('\ndoing the thing:', noteStart, noteDur);
		outlet(0,[noteStart, noteDur, noteStart + noteDur]);
	} else {
		post('\ndoing nothing', [0, 0, 0]);
		outlet(0,[0, 0, 0]);
	}
}


function playSeq(pitchClass, minLen){
	if(!notesByPitchClass[pitchClass] || !notesByPitchClass[pitchClass]['notes'].length) {
		post('No notes with a pitch class of',pitchClass, 'have been detected in this sample.');
	}


	
	// if(nextNote >= notes[nt]['start'].length) {
	// 	nextNote = 0;
	// 	}
	// 	playNote(nt, nextNote, minLen);
	// 	nextNote += 1;
	}
	
function playRand(nt, minLen){
	nextNote = Math.floor(Math.random() * notes[nt]['start'].length);
	post(nextNote);
	playNote(nt, nextNote, minLen); //
}

//returns the number of detected samples for any particular note
function queryNumSamples(nt){
	post('note length:', notes[nt]['start'].length);
	outlet(1, ['size', notes[nt]['start'].length]);
}

//sets the indNotes object to point to the desired sample for playback
function setIndNote(note, sample){
	if(notes[note]['start'].length >= sample) {
		indNotes[note] = sample;
	} else {
		post('indNote sample out of range');
	}
}

function playInd(nt) {
	noteStart = notes[nt]['start'][indNotes[nt]];
	noteDur = notes[nt]['dur'][indNotes[nt]];
	outlet(0,[noteStart, noteDur, noteStart + noteDur]);
}

// =============== Helper Functions ================ //

function shuffleArray(array) {
  const result = array.slice(); // copy to avoid mutating original
  for (var i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]; // swap
  }
  return result;
}

function range(min, max) {
	var arr = [];
	if(max === undefined) {
		for(var i=0; i<min; i++) {
			arr.push(i);
		}
		return arr;
	}
	if(max-min === 1) {
		return [min]
	}
	for(var i=0; i<(max-min); i++) {
		arr.push(min+i);
	}
	return arr;
}