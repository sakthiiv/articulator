$(document).ready(function() {

	var $inputMessage = $('.inputMessage');
	var $chatPage = $('.chat.page');
	var $messages = $('.messages');
	var context = {};
	var session = '';
	var converseUrl = 'https://articulator.herokuapp.com/converse';
	var messages = {
		speak: 'You can speak now!',
		blocked: 'Microphone Blocked. Kindly unblock to continue!',
		denied: 'Microphone access denied.',
		default: 'Press mic to start your conversation.'
	};

	if (!('webkitSpeechRecognition' in window)) {
		//upgrade();
	} else {
		var final_transcript = '';
		var recognizing = false;
		var ignore_onend;
		var start_timestamp;

		var recognition = new webkitSpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = false;

		recognition.onstart = function() { 
			modifyGuide(messages.speak);
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
				(event.timeStamp - start_timestamp < 100) ? modifyGuide(messages.blocked, true) : modifyGuide(messages.denied, true);
				ignore_onend = true;
			}		
		};

		recognition.onend = function() {
			modifyGuide(messages.default, true);
			recognizing = false;
		    if (ignore_onend || !final_transcript) {
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
			final_transcript = '';
			//if (event.resultIndex > 0) return;

			for (var i = event.resultIndex; i < event.results.length; ++i) {
			  if (event.results[i].isFinal) {
			  	console.log(event);
			  	console.log(event.results[i][0].transcript);
			    final_transcript += event.results[i][0].transcript;
			  } else {
			    interim_transcript += event.results[i][0].transcript;
			  }
			}
			final_transcript = capitalize(final_transcript);
			final_span.innerHTML = linebreak(final_transcript);
			interim_span.innerHTML = linebreak(interim_transcript);
			chatProcess();
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
	  img_start.src = 'images/mic-slash.png';
	  start_timestamp = event.timeStamp;
	});

	$('#btn_send').on('click', function(e) {

	});

	$('#btn_clear').on('click', function(e) {
      final_transcript = '';
	  final_span.innerHTML = '';
	  interim_span.innerHTML = '';
	});

	function chatProcess () {
		var userInput = $('#final_span').text();
		if (!userInput.length) 
			return;
		addChatMessage(userInput);

		$.ajax({
			url: converseUrl,
			method: 'POST',
			data: { message: userInput, context: JSON.stringify(context), session: session }
		}).done(function(data) {
			context = data.context;
			session = data.session;
			var chatMsg = getIntent(context, data.text); 
			addChatMessage(chatMsg, {isBot: true});
		});		
	}
	
	function addChatMessage (data, options) {
		if (!options) {
		  options = {};
		}
		var $messageBodyDiv = $('<div class="' + (options.isBot ? 'messageBot left' : 'messageUser right')+ '">')
		  .html(data);
		var $messageDiv = $('<li class="message"/>')
		  .append($messageBodyDiv);
		addMessageElement($messageDiv, options);
		$("div.chat-area").animate({ scrollTop: $('div.chat-area').prop("scrollHeight")}, 1000);
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

	function modifyGuide (msg, isWarn) {
		$('div.guide').html(msg).css({ color: (isWarn ? 'red' : 'green') });
		img_start.src = isWarn ? 'images/mic-slash.png' : 'images/mic.png';
	}

	$(function () {
	    var $element = $('div.guide');
	    function fadeInOut () {
	        $element.fadeIn(1000, function () {
	        	setTimeout(function() {
		            $element.fadeOut(1500, function () {
		                $element.fadeIn(1500, function () {
		                    setTimeout(fadeInOut, 1000);
		                });
		            });
	        	}, 2000)
	        });
	    }

	    fadeInOut();
	});	

	modifyGuide(messages.default, true);


});

