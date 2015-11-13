javascript:
var ryW = $('#ticket_iframe')[0].contentWindow;
var ryA = []; // 선택한 좌석을 저장하는 어레이

$(ryW.document).find('body')[0].appendChild(ryW.document.createElement('style'));
var rySS = ryW.document.styleSheets[ryW.document.styleSheets.length - 1];
rySS.insertRule('#seats_list .row .seat a span.no.rysel {background-color:blue !important;}', 0);

function ryL(e) { // 클릭했을 때 리스너
	if (typeof $(ryW.document).find('#seats_list .seat a:first').get(0).ryI == 'undefined') {
		ryM();
	}
	var s = $(this).children('.no');
	s.toggleClass('rysel');
	if (s.hasClass('rysel')) {
		s.get(0).origNum = $(s).html();
		ryA[ryA.length] = this;
	} else {
		for (var i=0; i<ryA.length; ++i) {
			if (typeof ryA[i] != 'undefined' && ryA[i].ryI == this.ryI) {
				s.html(s.get(0).origNum);
				delete(ryA[i]);
			}
		}
	}
	num = 1;
	for (var i=0; i<ryA.length; ++i) {
		if (typeof ryA[i] != 'undefined') {
			$(ryA[i]).children('.no').html(num++);
		}
	}
	var temp = ryW.$.cgv.data.고객선택정보.좌석;
	var targetNum = temp.학생인원수 + temp.일반인원수 + temp.우대인원수;
	if (ryA.length >= targetNum) {
		$("#ryBtn").show();
	}
}

function ryM() { // 모든 .seat a 엘레멘트에 id, row, column 데이터를 붙임
	$(ryW.document).find('#seats_list .seat a').each(function(i){
		this.ryI = i;
		this.ryR = $(this).parents('.row').children('.label').html();
		this.ryC = $(this).children('.no').html();
	});
}


function ryF() { // loadSeatInfoSuccess를 대신할 함수. 즉, 자리를 새로고침 한 후에 호출할 함수
	var gS = []; // 선택한 자리 중 가능한 자리
	var si = ryW.$.cgv.data.SEAT_INFO.SEAT_INFO;
	var aS = []; // Available seats
	for (var i=0; i<si.length; ++i) {
		if (si[i].SEAT_STATE == 'Y') {
			aS.push(si[i].LOC_Y_NM + parseInt(si[i].SEAT_NO)); // A1, A2, B1, F7 ..
		}
	}
	for (i=0; i<ryA.length; ++i) {
		if (typeof ryA[i] != 'undefined') {
			j = aS.indexOf(ryA[i].ryR+ryA[i].ryC);
			if (j != -1) {
				gS.push(ryA[i]);
			}
		}
	}
	//ryW.loadSeatInfoSuccess(); // 월래 호출돼었어야 할 함수를 호출. 함수 호출시 선택한 자리는 지워짐.

	// gS에 담긴 정보를 분석해서 원하는 자리가 났는지 확인. gS는 선호순
	var temp = ryW.$.cgv.data.고객선택정보.좌석;
	var targetNum = temp.학생인원수 + temp.일반인원수 + temp.우대인원수;
	var ryWantedSeats = []; // 조건이 맞는 자리 모음의 모음 
	if (targetNum != 0 && targetNum <= gS.length) {
		var continuedSeats = 0;
		var lastSeat = null;
		gS.sort(ryC); // gS를 자리순으로 바꿈
		var tempArray = [];
		for (var i = 0; i != gS.length; ++i) {
			tempArray.push(gS[i]);
			if (targetNum == 1) { // 필요한 자리가 하나면 ryWantedSeats에 tempArray 추가하고 tempArray 초기화
				ryWantedSeats.push(tempArray.slice());
				tempArray = [];
			} else if (lastSeat == null) { // lastSeat == null: 필요한 자리가 하나가 아니고 for loop의 첫 시도
				lastSeat = gS[i];
				continuedSeats = 1;
			} else if (lastSeat.ryR === gS[i].ryR && parseInt(lastSeat.ryC)+1 === parseInt(gS[i].ryC)) {
				// 필요한 자리가 하나가 아니고 연속된 자리가 남
				lastSeat = gS[i];
				if (++continuedSeats == targetNum) { // 원하는 자리가 남. 원하는 자리가 안나도 continuedSeats는 증가
					ryWantedSeats.push(tempArray.slice()); // ryWantedSeats에 지금 세트를 추가
					tempArray = tempArray.slice(1); // 다음 loop를 위해 temp array의 첫 엘레멘트를 제거하고
					--continuedSeats; // continueddSeats를 하나 감소시
				}
			} else { // 필요한 자리가 하나가 아니고 자리가 연속되지도 않음
				tempArray = [gS[i]];
				lastSeat = gS[i];
				continuedSeats = 1;
			}
			console.log(i);
			console.log(gS[i].ryR + gS[i].ryC);
		} // for loop
		if (ryWantedSeats.length == 0) {
			setTimeout(function(){ryW.loadSeatInfo(ryF);}, 5000);
			return;
		}
		var minPriority = 10000; // 절대 넘을 수 없을 값으로 minPriority 초기화
		var bestIndex = 0;
		console.log("ryWantedSeats.length");
		console.log(ryWantedSeats.length);
		console.log(ryWantedSeats);
		for (var i = 0; i != ryWantedSeats.length; ++i) {
			var thisPriority = 0;
			for (var j = 0; j != ryWantedSeats[i].length; ++j) {
				thisPriority += parseInt($(ryWantedSeats[i][j]).children('.no').html());
			}
			if (minPriority > thisPriority) {
				bestIndex = i;
				minPriority = thisPriority;
			}
		}
		ryWa(ryWantedSeats[bestIndex]); // ryWantedSeatsAvailable
		return;
	} else {
		setTimeout(function(){ryW.loadSeatInfo(ryF);}, 5000);
		return;
	}
} // ryF()

function ryWa(seats) { // ryWantedSeatsAvailable
	for (var i = 0; i < seats.length; ++i) {
		$(seats[i]).parent().addClass('selected');
	}
	var bell = new Audio('http://upload.wikimedia.org/wikipedia/commons/c/ce/Rotating-bicycle-bell.wav');
	bell.play();
	$("#ryBtn").remove();
	$("#ryMsg").remove();
	ryW.ticketStepNext();
}

function ryC(a, b) { // ryCompare
	if (a.ryR === b.ryR) {
		return parseInt(a.ryC) - parseInt(b.ryC);
	} else {
		return (a.ryR > b.ryR)? 1 : -1;
	}
}

var ryT = ryW.ftSeatClickListener;
ryW.ftSeatClickListener = ryL;
ryW.ftResetAllSeats(true);
$(document.body).append('<div id="ryMsg" style="position:fixed;top:10px;left:50%;width:90%;margin-left:-45%;padding:10px 0;background-color:rgba(0,0,0,0.5);color:white;font-size:15px;text-align:center;">선호하는 순으로 좌석을 선택세요</div>');
$(document.body).append('<div id="ryBtn" style="position:fixed;bottom:10px;left:50%;width:200px;height:50px;margin-left:-100px;background-color:#55f;color:white;font-size:20px;text-align:center;line-height:50px;cursor:pointer">선택완료</div>');
$("#ryBtn").one("click",function(e){ryW.loadSeatInfo(ryF);$("#ryBtn").css("background-color","#ccc").css("cursor","initial");$("#ryMsg").html("벨소리가 나면 돌아와서 결재하세요")}).hide();
