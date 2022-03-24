(function() {
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

$app = $("#app").click(function(){}), // prevent double-tap to zoom on ios

$layoutSel = $("#layout-sel"),
$subjectSel = $("#subject-sel"),
$deckSel = $("#deck-sel"),

$startButton = $("#start"),
$showButton = $("#desc-show"),
$hideButton = $("#desc-hide"),

$table = $("#table"),
$deckElem = $("#deck-elem"),
$slots = $(".slot"),
$cardImgs = $(".slot img"),
$animCard = $("<img>").prop("class", "anim-card"),

$descMenu = $("#desc-menu"),
$descTitle = $("#desc-title"),
$descContainer = $("#desc-container"),

$layoutInfo = $("#layout-info"),
$layoutDesc = $("#layout-desc"),

$posContainer = $("#pos-container"),
$posList = $("#pos-list"),

$textElems = $("#pos-name, #card-name, #card-classic-name, #general-reading, #layout-reading"),
$cardInfo = $("#card-info"),
$readingContainers = $(".card-reading"),

$descImg = $("#card-img"),
$cardModal = $("#card-modal"),
$cardModalImg = $("#img-zoomed"),
$descImgElems = $descImg.add($cardModalImg),
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
	$cardInfo.hide();
	$readingContainers.hide();
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
		.off("load");
	
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
		$animCardInstance = $animCard.clone().appendTo($table),
		displayCard = function() {
			$slotImg.fadeIn(imgFadeTime);
			$animCardInstance.fadeOut(imgFadeTime, function() { 
				this.remove();
			});
		};

	$slotImg.prop("src", imgPath + deck + "/" + id + ".jpg");

	$animCardInstance
		.css($deckElem.offset())
		.animate($slotElem.offset(), cardAnimTime, function() {
			if ($slotImg.prop("complete"))
				displayCard();
			else
				$slotImg.one("load", displayCard);
			
			$slotElem.css("z-index", 1);
	});

	if (++nextSlotId == slotCount)
		$deckElem.hide().prop("src", imgPath + "restart.svg");
}

function deselect() {
	$("#selected").prop("id", "");
}

$layoutSel.change(function() {
	layout = this.value;
	theme = themes[layout];
	$table.prop("class", layout);

	if (theme == null) {
		$subjectSel.prop("disabled", false);
		if (!subject)
			$subjectSel.prop("selectedIndex", 0);
	} else
		$subjectSel.prop("disabled", true).val(theme).change();
});

$subjectSel.change(function() { subject = this.value });

$deckSel.change(function() { 
	deck = this.value;

	$.extend(roman, 
		justice8.indexOf(deck) >= 0 ?
		{8: "XI", 11: "VIII"} :
		{8: "VIII", 11: "XI"}
	);
	
	extraMajors = extraMajorNames[deck] || [];
	altRankNames = altRanks[deck];
	altSuitNames = altSuits[deck];
})

// fix scrolling bug on ios (thanks apple)
$(".scrollable").on("touchstart", function(e) {
	this.atTop = (this.scrollTop <= 0);
	this.atBottom = (this.scrollTop >= this.scrollHeight - this.clientHeight);
	this.lastY = e.touches[0].clientY;
}).on("touchmove", function(e) {
	const up = (e.touches[0].clientY > this.lastY);

	this.lastY = e.touches[0].clientY;

	if ((up && this.atTop) || (!up && this.atBottom))
		e.preventDefault();
});

$decor.add($deckElem)
	.on("load", function() { $(this).fadeIn(imgFadeTime) });

if ($decor.prop("complete"))
	$decor.show();

$showButton.click(showDescription);
$hideButton.click(hideDescription);

$descImg.click(function() {
	$cardModal.fadeIn(menuFadeTime);
});

$cardModal.click(function() {
	$cardModal.fadeOut(menuFadeTime);
});

$.getJSON("res/text.json", function(data) {
	function setStartButtonState() {
		$startButton.prop("disabled", !(deck && (subject || theme === "")));
	}

	setStartButtonState();

	$app.on("change", setStartButtonState);

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

	$startButton.text("НАЧАТЬ").click(function() {
		this.remove();
		$("#header, #menu-column-2").slideUp(openingTime);
		
		$table.fadeIn(openingTime, function() {
			showDescription();
			$deckElem.click(drawCard);
		});
		
		$("select").trigger("change.data");
		
		$descMenu.hide().click(function(e) { e.stopPropagation() });
		$app.prop("class", "");
		resetTable();

		$app.off("change")
			.change(resetTable)
			.click(function(e) {
				const
					target = e.target,
					index = $cardImgs.index(target);
					
				deselect();

				if (index >= 0) {
					target.id = "selected";
					$descImgElems.prop("src", target.src);
					updateDescription(index);
				} else
					resetDescription();
		});
	});
});
})();