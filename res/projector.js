$(function() {
"use strict";
let theme, layout, subject, deck, nextSlotId, deckArray, descriptions, titles, slotCount, readings, extraMajors, altRankNames, altSuitNames, deckSize, meanings;

const 
roman = ["0","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI"],
justice8 = ["78doors", "botticelli", "durer", "casanova", "wild", "klimt"],
major = ["Дурак","Маг","Верховная Жрица","Императрица","Император","Иерофант","Влюблённые","Колесница","Сила","Отшельник","Колесо Фортуны","Правосудие","Повешенный","Смерть","Умеренность","Дьявол","Башня","Звезда","Луна","Солнце","Суд","Мир"],
suitNames = ["Пентаклей", "Кубков", "Жезлов", "Мечей"],
rankNames = ["Туз","Двойка","Тройка","Четвёрка","Пятёрка","Шестёрка","Семёрка","Восьмёрка","Девятка","Десятка","Паж","Рыцарь","Королева","Король"],
themes = {
	disorder: "lifegoal",
	station: "relship",
	swing: "relship",
	choice: "",
	marry: "relship",
	one: ""
},
altSuits = {
	"alice": ["Устриц","Шляп","Перцемолок","Фламинго"]
},
altRanks = {
	"wild": ["Дочь","Сын","Мать","Отец"]
},
altMajors = {

},
extraMajorNames = {
	"quantum": ["Феникс","Вселенная"]
},
openingTime = 3000,
cardAnimTime = 1000,
menuFadeTime = 500,
imgFadeTime = 300,
imgPath = "img/",

$layoutSel = $("#layout-sel").change(function() {
	layout = this.value;
	theme = themes[layout];
	$table.prop("class", layout);

	if (theme == null) {
		$subjectSel.prop("disabled", false);
		if (!subject)
			$subjectSel.prop("selectedIndex", 0);
	} else
		$subjectSel.prop("disabled", true).val(theme).change();
}).one("change", function() {
	$deckSel.prop("disabled", false);
}),

$subjectSel = $("#subject-sel").change(function() { subject = this.value }),

$deckSel = $("#deck-sel").change(function() { 
	deck = this.value;

	$.extend(roman, 
		justice8.indexOf(deck) >= 0 ?
		{8: "XI", 11: "VIII"} :
		{8: "VIII", 11: "XI"}
	);
	
	extraMajors = extraMajorNames[deck] || [];
	altRankNames = altRanks[deck];
	altSuitNames = altSuits[deck];
}),

$startButton = $("#start"),
$showButton = $("#desc-show"),
$hideButton = $("#desc-hide"),
$table = $("#table"),
$deckElem = $("#deck-elem"),
$slots = $(".slot"),
$cardImgs = $slots.children("img"),
$animCard = $("<img>").prop("class", "anim-card"),

$descMenu = $("#desc-menu").hide().click(function(e) { e.stopPropagation() }),
$descTitle = $("#desc-title"),
$descContainer = $("#desc-container"),

$layoutInfo = $("#layout-info"),
$layoutDesc = $("#layout-desc"),

$posContainer = $("#pos-container"),
$posList = $("#pos-list"),

$textElems = $("#pos-name, #card-name, #card-classic-name, #general-reading, #layout-reading"),
$cardInfo = $("#card-info"),
$readingContainers = $(".card-reading"),

$descriptionImgElems = $("#img-zoomed, #card-img"),
$imgModal = $("#card-modal"),
$decor = $("#decor");

function randomInt(min, max) {
	return Math.floor( Math.random() * (max - min + 1) ) + min;
}

function updateDescription(id) {
	const data = descriptions[id];

	$descTitle.text(slotCount > 1 ? "Позиция " + (id + 1) : "");
	
	data.forEach(function(text, i) {
		$textElems[i].textContent = text;
	});

	if (data[3] || data[4])
		$readingContainers.show();

	$cardInfo.show();
	$layoutInfo.hide();
	showDescription();
}

function resetDescription() {
	if (nextSlotId > 0)
		$descTitle.text("Нажмите на карту, чтобы увидеть её значение");
	$cardInfo.add($readingContainers).hide();
	$layoutInfo.show();
}

function showDescription() {
	$descMenu.fadeIn(menuFadeTime);
	$showButton.fadeOut(menuFadeTime);
	$descContainer.scrollTop(0);
}

function hideDescription() {
	$descMenu.fadeOut(menuFadeTime);
	$showButton.fadeIn(menuFadeTime);
	deselect();
}

function resetTable() {
	nextSlotId = 0;
	deckArray = [];
	deckSize = 77 + extraMajors.length;
	descriptions = [];

	$deckElem
		.hide()
		.add($animCard)
		.prop("src", imgPath + deck + "/back.jpg");
	
	$(".anim-card")
		.stop(true)
		.fadeOut(imgFadeTime, function() { this.remove() });
	
	$cardImgs
		.finish()
		.fadeOut(imgFadeTime)
		.filter(":hidden")
		.prop("src", "");
	
	$slots.css("z-index", "");
	$descTitle.text("Жмите на колоду, чтобы заполнить расклад");
}

function drawCard() {
	if (nextSlotId == slotCount)
		return resetTable();
	
	let id = randomInt(0, deckSize),
		name = "",
		altName = "";

	while (deckArray[id])
		id = deckArray[id];
	deckArray[id] = deckSize--;
	
	if (id > 21) {
		const suit = Math.floor((id - 22) / 14),
			  rank = id - 22 - 14 * suit;

		if (suit < 4) {
			if (rank > 9 && altRankNames) {
				name += altRankNames[rank - 10] + " ";
				altName += rankNames[rank] + " ";
			} else
				name += rankNames[rank] + " ";
			
			if (altSuitNames) {
				name += altSuitNames[suit];
				altName += suitNames[suit];
			} else
			 	name += suitNames[suit];
		} else
			name = extraMajors[rank];
	} else if (altMajors[deck]) {
		altName = major[id];
		name = roman[id] + " " + altMajors[deck][id];
	} else
		name = roman[id] + " " + major[id];

	descriptions[nextSlotId] = [
		titles[nextSlotId],
		name,
		altName ? " / " + altName : "",
		meanings[id],
		readings ? readings[id] : ""
	];

	const
		$slotImg = $cardImgs.eq(nextSlotId),
		$slotElem = $slotImg.parent(),
		slotPosition = $slotElem.position(),
		deckPosition = $deckElem.position(),
		$animCardInstance = $animCard.clone().appendTo($table);

	$animCardInstance.css({
		left: deckPosition.left,
		top: deckPosition.top
	}).animate({
		left: slotPosition.left,
		top: slotPosition.top
	}, cardAnimTime, function() {
		$slotImg.prop("src", imgPath + deck + "/" + id + ".jpg")
			.one("load", function() {
				$animCardInstance.fadeOut(imgFadeTime, function() { 
					this.remove();
				});
			});
		$slotElem.css("z-index", 1);
	});

	if (++nextSlotId == slotCount)
		$deckElem.hide().prop("src", imgPath + "restart.svg");
}

function deselect() {
	$("#selected").prop("id", "");
}

$decor.add($deckElem).add($cardImgs)
	.on("load", function() { $(this).fadeIn(imgFadeTime) });

if ($decor.prop("complete"))
	$decor.show();

$showButton.click(showDescription);
$hideButton.click(hideDescription);

$("#card-img").click(function() {
	$imgModal.fadeIn(menuFadeTime);
});

$imgModal.click(function() {
	$imgModal.fadeOut(menuFadeTime);
});

$("select").on("change.start", function() {
	$startButton.prop("disabled", !(deck && (subject || theme === "")));
});

$cardImgs.click(function(e) {
	const index = $cardImgs.index(this);

	deselect();
	this.id = "selected";
	$descriptionImgElems.prop("src", this.src);
	updateDescription(index);

	e.stopPropagation();
});

// fix scrolling bug on ios (thanks apple)
$(".scrollable").on("touchstart", function(e) {
	this.allowUp = (this.scrollTop > 0);
	this.allowDown = (this.scrollTop < this.scrollHeight - this.clientHeight);
	this.prevTop = null;
	this.prevBot = null;
	this.lastY = e.targetTouches[0].pageY;
}).on("touchmove", function(e) {
	const up = (e.targetTouches[0].pageY > this.lastY);

	this.lastY = e.targetTouches[0].pageY;

	if ((up && this.allowUp) || (!up && this.allowDown))
		e.stopPropagation();
	else
		e.preventDefault();
});

$.getJSON("res/text.json", function(data) {
	$layoutSel.on("change.data", function() {
		titles = data.titles[layout];
		$layoutDesc.text(data.descriptions[layout]);

		if ((slotCount = titles.length) > 1) {
			$posContainer.show();
			$posList.text(data.postext[layout]);
		} else $posContainer.hide();
	});

	$subjectSel.on("change.data", function() {
		readings = data.readings[subject];
	});

	$deckSel.on("change.data", function() {
		meanings = data.meanings[deck] || data.meanings.normal;
	});

	$startButton.click(function() {
		this.remove();
		$("#header, #menu-column-2").slideUp(openingTime);

		$table.fadeIn(openingTime, function() {
			showDescription();
			$deckElem.click(drawCard);
		});

		$("select")
			.off(".start")
			.trigger("change.data")
			.change(resetTable);
		
		$("#app").prop("class", "");
		resetTable();

		$(document).click(function() {
			deselect();
			resetDescription();
		});
	});
});
});