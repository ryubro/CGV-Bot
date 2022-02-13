/**
작성자  : 김병용
라이센스: MIT License

아래의 코드는 cgv.co.kr의 코드에 의존하며 cgv.co.kr의 코드에 대한 권리는 저에게 없고
권리자에게 사용을 허락받지도 않았습니다.
*/

var contentWindow = $('#ticket_iframe')[0].contentWindow;
var preferredSeats = []; // 선호하는 좌석을 저장하는 어레이

// 선택한 좌석에 대한 CSS
$(contentWindow.document).find('body')[0].appendChild(contentWindow.document.createElement('style'));
var customStyle = contentWindow.document.styleSheets[contentWindow.document.styleSheets.length - 1];
customStyle.insertRule('#seats_list .row .seat a span.no.ry-pref {background-color:blue !important;}', 0);

// 사용자가 좌석을 클릭했을 때 호출될 함수
// ftSeatClickListener 를 덮어씀
function newClickListener(e) {
	// 모든 .seat a 엘레멘트에 id, row, column 데이터를 붙임
	var allSeats = $(contentWindow.document).find('#seats_list .seat a');
	if (typeof allSeats.get(0).ryID == 'undefined') {
		allSeats.each(function(i){
			this.ryID = i;
			this.ryRow = $(this).parents('.row').children('.label').html();
			this.ryCol = $(this).children('.no').html();
		});
	}

	var rowNumber = $(this).children('.no');
	rowNumber.toggleClass('ry-pref');
	if (rowNumber.hasClass('ry-pref')) {
		rowNumber.get(0).origNum = $(rowNumber).html();
		preferredSeats[preferredSeats.length] = this;
	} else {
		for (var i=0; i<preferredSeats.length; ++i) {
			if (typeof preferredSeats[i] != 'undefined' && preferredSeats[i].ryID == this.ryID) {
				rowNumber.html(rowNumber.get(0).origNum);
				delete(preferredSeats[i]);
			}
		}
	}

	var priority = 1;
	for (var i=0; i<preferredSeats.length; ++i) {
		if (typeof preferredSeats[i] != 'undefined') {
			$(preferredSeats[i]).children('.no').html(priority++);
		}
	}

	var targetNum = getTargetNumSeat();
	if (preferredSeats.length >= targetNum) {
		$("#ry-button").show();
	}
}

function getTargetNumSeat() {
	var numberOfSeats = contentWindow.$.cgv.data['고객선택정보']['좌석'];
	return numberOfSeats['학생인원수'] + numberOfSeats['일반인원수'] + numberOfSeats['우대인원수'];
}

// 자리를 새로고침 한 후에 호출할 함수
// loadSeatInfoSuccess 를 덮어씀
function seatInfoHandler() {
	var prefAvalSeats = []; // 선호하는 자리 중 가능한 모든 자리
	var seatInfo = contentWindow.$.cgv.data.SEAT_INFO.SEAT_INFO;
	var avalSeats = []; // 가능한 모든 자리

	// 가능한 모든 자리를 avalSeats 에 저장
	for (var i=0; i<seatInfo.length; ++i) {
		if (seatInfo[i].SEAT_STATE == 'Y') {
			avalSeats.push(seatInfo[i].LOC_Y_NM + parseInt(seatInfo[i].SEAT_NO)); // 형식: A1, A2, B1, F7 ..
		}
	}

	// avalSeats 에 선호하는 자리가 있는지 확인하고 prefAvalSeats에 저장
	for (i=0; i<preferredSeats.length; ++i) {
		if (typeof preferredSeats[i] != 'undefined') {
			j = avalSeats.indexOf(preferredSeats[i].ryRow+preferredSeats[i].ryCol);
			if (j != -1) {
				prefAvalSeats.push(preferredSeats[i]);
			}
		}
	}

	// prefAvalSeats에 담긴 정보를 분석해서 선호자리 Set을 구함. prefAvalSeats는 선호순
	var targetNum = getTargetNumSeat();
	var passedSet = []; // 자리가 붙어있는지 여부까지 포함한 최종 선호자리 Set
	if (targetNum != 0 && targetNum <= prefAvalSeats.length) {
		var continuedSeats = 0;
		var lastSeat = null;
		prefAvalSeats.sort(ryCmp); // prefAvalSeats를 자리순으로 바꿈
		var candidateSet = [];
		for (var i = 0; i != prefAvalSeats.length; ++i) {
			candidateSet.push(prefAvalSeats[i]);
			if (targetNum == 1) { // 필요한 자리가 하나면 passedSet에 candidateSet 추가하고 candidateSet 초기화
				passedSet.push(candidateSet.slice());
				candidateSet = [];
			} else if (lastSeat == null) { // lastSeat == null: 필요한 자리가 하나가 아니고 for loop의 첫 시도
				lastSeat = prefAvalSeats[i];
				continuedSeats = 1;
			} else if (lastSeat.ryRow === prefAvalSeats[i].ryRow && parseInt(lastSeat.ryCol)+1 === parseInt(prefAvalSeats[i].ryCol)) {
				// 필요한 자리가 하나가 아니고 연속된 자리가 남
				lastSeat = prefAvalSeats[i];
				if (++continuedSeats == targetNum) { // 원하는 자리 세트가 남. 원하는 자리가 안나도 continuedSeats는 증가
					passedSet.push(candidateSet.slice()); // passedSet에 지금 세트를 추가
					candidateSet = candidateSet.slice(1); // 다음 loop를 위해 temp array의 첫 엘레멘트를 제거하고
					--continuedSeats; // continueddSeats를 하나 감소
				}
			} else { // 필요한 자리가 하나가 아니고 자리가 연속되지도 않음
				candidateSet = [prefAvalSeats[i]];
				lastSeat = prefAvalSeats[i];
				continuedSeats = 1;
			}
		} // for loop

		if (passedSet.length == 0) {
			setTimeout(function(){contentWindow.loadSeatInfo(seatInfoHandler);}, 5000);
			return;
		}

		// passedSet 중 선호도가 가장 높은 Set 구하기
		var minPriority = 10000; // 절대 넘을 수 없을 값으로 minPriority 초기화
		var bestIndex = 0;
		for (var i = 0; i != passedSet.length; ++i) {
			var thisPriority = 0;
			for (var j = 0; j != passedSet[i].length; ++j) {
				thisPriority += parseInt($(passedSet[i][j]).children('.no').html());
			}
			if (minPriority > thisPriority) {
				bestIndex = i;
				minPriority = thisPriority;
			}
		}
		passedSetHandler(passedSet[bestIndex]);
		return;

	// 필요한 자리만큼 가능한 선호자리가 나지 않음
	} else {
		setTimeout(function(){contentWindow.loadSeatInfo(seatInfoHandler);}, 5000);
		return;
	}
} // seatInfoHandler()

var bell = null;

function passedSetHandler(seats) {
	for (var i = 0; i < seats.length; ++i) {
		$(seats[i]).parent().addClass('selected');
	}
	bell.play();
	$("#ry-button").remove();
	$("#ry-message").remove();
	contentWindow.ticketStepNext();
}

function ryCmp(a, b) {
	if (a.ryRow === b.ryRow) {
		return parseInt(a.ryCol) - parseInt(b.ryCol);
	} else {
		return (a.ryRow > b.ryRow)? 1 : -1;
	}
}

var originalClickListener = contentWindow.ftSeatClickListener;
contentWindow.ftSeatClickListener = newClickListener;
contentWindow.ftResetAllSeats(true);
$(document.body).append('<div id="ry-message" style="position:fixed;top:10px;left:50%;width:90%;margin-left:-45%;padding:10px 0;background-color:rgba(0,0,0,0.5);color:white;font-size:15px;text-align:center;z-index:9999">선호하는 순으로 좌석을 선택세요</div>');
$(document.body).append('<div id="ry-button" style="position:fixed;bottom:10px;left:50%;width:200px;height:50px;margin-left:-100px;background-color:#55f;color:white;font-size:20px;text-align:center;line-height:50px;cursor:pointer;z-index:9999">선택완료</div>');
$("#ry-button").one("click", function(e){
	contentWindow.loadSeatInfo(seatInfoHandler);
	bell = new Audio('https://upload.wikimedia.org/wikipedia/commons/c/ce/Rotating-bicycle-bell.wav');
	$("#ry-button").css("background-color","#ccc").css("cursor","initial");
	$("#ry-message").html("벨소리가 나면 돌아와서 결재하세요")
}).hide();
