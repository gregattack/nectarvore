this.outlets = 2;

var notes = {};
var nextNote = 0;
var noteStart;
var noteDur;
var indNotes = {}

	
function resetNoteCounter(){
	nextNote = 0;
	}
	
function resetNotesObj(){
		for(var i = 0; i < 12; i++){
			notes[i] = {'start':[], 'dur':[]}
			indNotes[i] = null;
		}
	}
	
resetNotesObj();


function list()
{
	var a = arrayfromargs(arguments);
	var note = a[2];
	notes[note]['start'].push(a[0]);
	notes[note]['dur'].push(a[1]);
	post('note:'+note + '\nStart:', notes[note]['start'] + '\nDuration:', notes[note]['dur']+'\n');
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

function playSeq(nt, minLen){
	if(nextNote >= notes[nt]['start'].length) {
		nextNote = 0;
		}
		playNote(nt, nextNote, minLen);
		nextNote += 1;
	}
	
function playRand(nt, minLen){
	nextNote = Math.floor(Math.random() * notes[nt]['start'].length);
	post(nextNote);
	playNote(nt, nextNote, minLen);
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