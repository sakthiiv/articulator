if (!('webkitSpeechRecognition' in window)) {
	//upgrade();
} else {
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
	      return;
	    }
	    if (window.getSelection) {
	      window.getSelection().removeAllRanges();
	      var range = document.createRange();
	      range.selectNode(document.getElementById('final_span'));
	      window.getSelection().addRange(range);
	    }
	};

  recognition.onresult = function(event) {
    var interim_transcript = '';
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final_transcript += event.results[i][0].transcript;
      } else {
        interim_transcript += event.results[i][0].transcript;
      }
    }
    final_transcript = capitalize(final_transcript);
    final_span.innerHTML = linebreak(final_transcript);
    interim_span.innerHTML = linebreak(interim_transcript);
    if (final_transcript || interim_transcript) {
      //showButtons('inline-block');
    }
  };

	var first_char = /\S/;
	function capitalize(s) {
	  return s.replace(first_char, function(m) { return m.toUpperCase(); });
	}

	var two_line = /\n\n/g;
	var one_line = /\n/g;
	function linebreak(s) {
	  return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
	}

}

$(document).ready(function() {

	var $inputMessage = $('.inputMessage');
	var $chatPage = $('.chat.page');
	var $messages = $('.messages');
	var context = {};
	var session = '';

	$('#btn_start').on('click', function(e) {
	  if (recognizing) {
	    recognition.stop();
	    return;
	  }
	  final_transcript = '';
	  recognition.lang = 'en-US';
	  recognition.start();
	  ignore_onend = false;
	  final_span.innerHTML = '';
	  interim_span.innerHTML = '';
	  //start_img.src = 'mic-slash.gif';
	  //showInfo('info_allow');
	  //showButtons('none');
	  start_timestamp = event.timeStamp;
	});

	$('#btn_send').on('click', function(e) {
		var userInput = $('#txtInput').val();
		if (!userInput.length) 
			return;
		addChatMessage(userInput);

		$.ajax({
			url: 'http://dev88.plaxo.com:3000/converse',
			method: 'POST',
			data: { message: userInput, context: JSON.stringify(context), session: session }
		}).done(function(data) {
			context = data.context;
			session = data.session;
			var chatMsg = getIntent(context, data.text); 
			addChatMessage(chatMsg, {isBot: true});
		});
	});

	$('#btn_clear').on('click', function(e) {
	  final_span.innerHTML = '';
	  interim_span.innerHTML = '';
	});

	//addChatMessage();

	function addChatMessage (data, options) {
		if (!options) {
		  options = {};
		}
		var $messageBodyDiv = $('<div class="' + (options.isBot ? 'messageBot left' : 'messageUser right')+ '">')
		  .html(data);
		var $messageDiv = $('<li class="message"/>')
		  .append($messageBodyDiv);
		addMessageElement($messageDiv, options);
	}

	function addMessageElement (el, options) {
		var $el = $(el);
		// Setup default options
		if (!options) {
		  options = {};
		}
		if (typeof options.fade === 'undefined') {
		  options.fade = true;
		}
		if (typeof options.prepend === 'undefined') {
		  options.prepend = false;
		}
		// Apply options
		if (options.fade) {
		  $el.hide().fadeIn(3000);
		}
		options.prepend ? $messages.prepend($el) : $messages.append($el);
		$messages[0].scrollTop = $messages[0].scrollHeight;
	}

	function getIntent (context, msg) {
		var intentArr = context.intent, intent, finalMsg = '';
		if (intentArr && intentArr.length) {
			intent = intentArr[0].value;
		}
		if (intent && context.hasOwnProperty(intent)) {
			finalMsg = context[intent];
			return msg + '<br />' + finalMsg;
		}
		return msg;
	}


});
