(function() {
'use strict';
var drawnCards = [];
var descriptions = [];
var data;
var deckSize;
var titles;
var meanings;
var readings;
var extraMajors;
var altRanks;
var altSuits;
var deckPath;
var isClassic;
var spreadName;

var openingDuration = 3000;
var cardDrawDuration = 1000;
var fadeDuration = 500;

var $app = $('body');
var $decor = $('#decor');
var $spreadSelect = $('#spread-select');
var $themeSelect = $('#theme-select');
var $deckSelect = $('#deck-select');
var $startButton = $('#btn-start');
var $table = $('#table');
var $deck = $('#btn-deck');
var $resetButton = $('#btn-table-reset');
var $deckLoadingIcon = $('#deck-loading');
var $detailsMenu = $('#details');
var $detailsTitle = $('#details-title');
var $detailsContent = $('#details-content');
var $spreadInfo = $('#spread-info');
var $spreadDetails = $('#spread-details');
var $positionListTitle = $('#position-list-title');
var $positionList = $('#position-list');
var $cardInfo = $('#card-info');
var $detailsImage = $('#details-card-image');
var $themeReadingTitle = $('#theme-reading-title');
var $cardModal = $('#card-modal');
var $cardModalImage = $('#card-modal-image');
var $cardInfoElements = $('#card-name, #card-alt-name, #general-reading, #theme-reading');

var $cards = $('.card');
var $animatedCardBase = $('.card-animated').remove();
var fallbackTitles = $cards.map(function (i) { return 'Карта ' + (i + 1); }).get();

var $deckImageElements = $deck.add($animatedCardBase);
var $cardImageElements = $detailsImage.add($cardModalImage);

function runOnLoad(el, callback) {
	el.prop('complete') ? callback() : el.one('load', callback);
}

function startApp(event) {
	event.preventDefault();

	$('#btn-show-details').click(showDetails);
	$('#btn-hide-details').click(hideDetails);

	$table.click(handleTableClick);
	$resetButton.click(resetTable);
	$app.change(resetTable);

	$detailsImage.click(function () { $cardModal.show(); });
	$cardModal.click(function () { $cardModal.hide(); });

	$deck.on('load', function () {
		$deck.show();
		$deckLoadingIcon.hide();
	})

	$spreadSelect.on('change.data', handleSpreadChange);
	$themeSelect.on('change.data', handleThemeChange);
	$deckSelect.on('change.data', handleDeckChange);
	$('select').trigger('change.data');

	$('#header, #intro').slideUp(openingDuration).promise().done(function () {
		showDetails();
		$('.button-bar .button').show();
		$deck.click(drawCard);
	});

	$table.show();
	$startButton.hide();
}

function handleSpreadChangeInitial() {
	var $option = $(this).find(':selected');
	var theme = $option.data('theme');

	spreadName = $option.text().split(' (')[0];
	$themeSelect.prop('disabled', theme);
	if (theme) $themeSelect.val(theme).change();
}

function handleSpreadChange() {
	var spreadId = this.value;
	$app.prop('class', 'sp-' + spreadId);
	titles = data.titles[spreadId] || fallbackTitles;
	$spreadDetails.text(data.details[spreadId]);
	$positionList.text(data.positions[spreadId] || '');
	$positionListTitle.toggle(!!$positionList.text());
}

function handleThemeChange() {
	readings = data.readings[this.value];
	$themeReadingTitle.toggle(!!readings);
}

function handleDeckChange() {
	var deckId = this.value;

	$deck.hide();
	$deckLoadingIcon.show();

	meanings = data.meanings[deckId] || data.meanings.normal;
	altRanks = data.altRanks[deckId];
	altSuits = data.altSuits[deckId];
	extraMajors = data.extraMajors[deckId];

	deckSize = 78;
	if (extraMajors) deckSize += extraMajors.length;

	isClassic = $(this).find(':selected[data-classic]').length;
	deckPath = 'img/' + deckId + '/';
	$deckImageElements.prop('src', deckPath + 'back.jpg');
}

function handleTableClick(event) {
	var slot = $cards.index(event.target);

	if (slot >= 0) {
		showDetails(slot);
		$(event.target).addClass('card-selected');
	}
}

function resetTable(event) {
	drawnCards = [];
	descriptions = [];

	if (!$(event.target).is($deckSelect)) $deck.show();
	$resetButton.hide();
	showSpreadInfo();
	deselect();

	$('.card-animated')
		.stop(true)
		.fadeOut(fadeDuration, function () { $(this).remove(); });

	$cards.finish().fadeOut(fadeDuration);
}

function createDescription(id) {
	var adjustedId = id;
	var name;
	var altName;

	if (id > 21) {
		var suit = Math.floor((id - 22) / 14);
		var rank = id - 22 - 14 * suit;

		if (suit < 4) {
			var rankName = data.ranks[rank];
			var suitName = data.suits[suit];

			altName = rankName + ' ' + suitName;

			if (altRanks && rank > 9) rankName = altRanks[rank - 10];
			if (altSuits) suitName = altSuits[suit];

			name = rankName + ' ' + suitName;
			if (name == altName) altName = '';
		} else {
			name = extraMajors[rank];
		}
	} else {
		if ((id == 8 || id == 11) && isClassic) adjustedId = 19 - id;
		name = data.roman[adjustedId] + ' ' + data.major[id];
	}

	descriptions.push([name, altName, meanings[id], readings ? readings[id] : '']);

	return adjustedId;
}

function drawCard() {
	var id;

	do id = Math.floor(Math.random() * deckSize);
	while (drawnCards.indexOf(id) >= 0);

	var slot = drawnCards.push(id) - 1;
	var $slotImg = $cards.eq(slot);
	var $animatedCardInstance = $animatedCardBase.clone().appendTo($table);

	var showCard = function () {
		$slotImg.show();
		$animatedCardInstance.fadeOut(fadeDuration, function () {
			$(this).remove();
		});
	};

	id = createDescription(id);
	$slotImg.prop('src', deckPath + id + '.jpg');

	$animatedCardInstance.css($deck.position()).animate(
		$slotImg.parent().position(),
		cardDrawDuration,
		function () { runOnLoad($slotImg, showCard); }
	);

	if (slot == titles.length - 1) {
		$resetButton.show();
		$deck.hide();
	}
}

function showCardInfo(slot) {
	descriptions[slot].forEach(function (text, i) {
		$cardInfoElements.eq(i).text(text || '');
	});

	$detailsTitle.text(titles[slot]);
	$cardImageElements.prop('src', $cards.eq(slot).prop('src'));
	$cardInfo.show();
	$spreadInfo.hide();
}

function showSpreadInfo() {
	$detailsTitle.text(spreadName);
	$spreadInfo.show();
	$cardInfo.hide();
}

function showDetails(slot) {
	$detailsMenu.show();
	deselect();
	slot >= 0 ? showCardInfo(slot) : showSpreadInfo();
}

function hideDetails() {
	$detailsMenu.hide();
	deselect();
}

function deselect() {
	$('.card-selected').removeClass('card-selected');
	$detailsContent.scrollTop(0);
}

$.getJSON('res/data.json?2', function (json) {
	data = json;
	$startButton.prop('disabled', false).text('НАЧАТЬ');
});

$('.hidden').hide().removeClass('hidden');
runOnLoad($decor, function () { $decor.show(); });
$app.one('submit', startApp);
$spreadSelect.change(handleSpreadChangeInitial);

// ios fixes
if ('standalone' in navigator) {
	// prevent double-tap to zoom
	$app.click(function () {});
	// fix scrolling bug
	$app.css('overflow', 'auto');
}
})();
