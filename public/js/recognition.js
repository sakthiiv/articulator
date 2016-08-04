if (!('webkitSpeechRecognition' in window)) {
	//upgrade();
	return;
} 

var final_transcript = '';
var recognizing = false;
var ignore_onend;
var start_timestamp;

var recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;

recognition.onstart = function() { 
	recognizing = true; 
};

recognition.onerror = function(event) {
	if (event.error == 'no-speech') {
		ignore_onend = true;
	}
	if (event.error == 'audio-capture') {
		ignore_onend = true;
	}
	if (event.error == 'not-allowed') {
		if (event.timeStamp - start_timestamp < 100) {
		//showInfo('info_blocked');
		} else {
		//showInfo('info_denied');
		}		
		ignore_onend = true;
	}		
};

recognition.onend = function() {
	recognizing = false;
    if (ignore_onend) {
      return;
    }
    if (!final_transcript) {
      //showInfo('info_start');
      return;
    }
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
      var range = document.createRange();
      range.selectNode(document.getElementById('final_span'));
      window.getSelection().addRange(range);
    }
    if (create_email) {
      create_email = false;
      createEmail();
    }        
};
