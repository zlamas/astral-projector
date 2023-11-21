(app => {
"use strict";
let data, deckSize, titles, meanings, readings, extraMajors, altRanks, altSuits, deckPath, isClassic, spreadName;
let drawnCards = [];
let descriptions = [];

let openingDuration = 3000;
let cardDrawDuration = 1000;
let fadeDuration = 500;
let animationOptions = { fill: "forwards", easing: "ease-in-out" };

let decor = app.querySelector("#decor");
let spreadSelect = app.querySelector("#spread-select");
let themeSelect = app.querySelector("#theme-select");
let deckSelect = app.querySelector("#deck-select");
let startButton = app.querySelector("#btn-start");
let table = app.querySelector("#table");
let cards = table.getElementsByClassName("card");
let selectedCards = table.getElementsByClassName("card-selected");
let animatedCards = table.getElementsByClassName("card-animated");
let animatedCardBase = table.removeChild(animatedCards[0]);
let deck = table.querySelector("#btn-deck");
let resetButton = table.querySelector("#btn-table-reset");
let deckLoadingIcon = table.querySelector("#deck-loading");
let detailsMenu = app.querySelector("#details");
let detailsTitle = detailsMenu.querySelector("#details-title");
let detailsContent = detailsMenu.querySelector("#details-content");
let spreadInfo = detailsMenu.querySelector("#spread-info");
let spreadDetails = detailsMenu.querySelector("#spread-details");
let positionListTitle = detailsMenu.querySelector("#position-list-title");
let positionList = detailsMenu.querySelector("#position-list");
let cardInfo = detailsMenu.querySelector("#card-info");
let detailsImage = detailsMenu.querySelector("#details-card-image");
let themeReadingTitle = detailsMenu.querySelector("#theme-reading-title");
let cardInfoElements = detailsMenu.querySelectorAll("#card-name, #card-alt-name, #general-reading, #theme-reading");
let cardModal = app.querySelector("#card-modal");
let cardModalImage = cardModal.querySelector("#card-modal-image");

let hide = el => el.style.display = "none";
let show = el => el.style.display = "";
let getOffset = el => ({ left: el.offsetLeft + "px", top: el.offsetTop + "px" });

function fadeOut(el, duration, remove) {
	el.animate(
		{ opacity: [ getComputedStyle(el).opacity, 0 ] },
		Object.assign({ duration }, animationOptions)
	)
	.addEventListener("finish", remove ?
		() => el.remove() :
		event => { event.target.cancel(); hide(el); }
	);
}

function slideUp(query, duration, callback) {
	let animation;
	app.querySelectorAll(query).forEach(el => {
		el.style.overflow = "hidden";
		animation = el.animate(
			{ height: [ el.offsetHeight + "px", 0 ] },
			Object.assign({ duration }, animationOptions)
		);
		animation.addEventListener("finish", () => hide(el));
	});
	animation.addEventListener("finish", callback);
}

function moveTo(el, target, duration, callback) {
	let animation = el.animate(
		[ getOffset(el), getOffset(target) ],
		Object.assign({ duration }, animationOptions)
	);
	animation.addEventListener("finish", callback);
	return animation;
}

function onImageLoad(el, callback) {
	el.complete ?
	callback() :
	el.addEventListener("load", callback, { once: true });
}

function startApp(event) {
	event.preventDefault();

	spreadSelect.addEventListener("change", () => {
		let spreadId = spreadSelect.value;
		table.className = table.className.replace(/sp-\w*/, "sp-" + spreadId);
		titles = data.titles[spreadId];
		spreadDetails.textContent = data.details[spreadId];
		positionList.textContent = data.positions[spreadId];

		if (spreadId == "one")
			hide(positionListTitle);
		else
			show(positionListTitle);
	});

	themeSelect.addEventListener("change", () => {
		readings = data.readings[themeSelect.value] || [];
		if (readings.length)
			show(themeReadingTitle);
		else
			hide(themeReadingTitle);
	});

	deckSelect.addEventListener("change", () => {
		let deckId = deckSelect.value;
		hide(deck);
		show(deckLoadingIcon);
		isClassic = data.classicOrder.indexOf(deckId) >= 0;
		meanings = data.meanings[deckId] || data.meanings.normal;
		altSuits = data.altSuits[deckId];
		altRanks = data.altRanks[deckId];
		extraMajors = data.extraMajors[deckId] || [];
		deckPath = "img/" + deckId + "/";
		deckSize = 78 + extraMajors.length;
		deck.src = animatedCardBase.src = deckPath + "back.jpg";
	});

	app.addEventListener("change", resetTable);
	[ spreadSelect, themeSelect, deckSelect ].forEach(
		el => el.dispatchEvent(new Event("change"))
	);

	slideUp("#header, #intro", openingDuration, () => {
		showDetails();
		app.querySelectorAll(".button-bar .hidden").forEach(show);
		deck.addEventListener("click", drawCard);
	});

	show(table);
	hide(startButton);
}

function resetTable(event) {
	drawnCards = [];
	descriptions = [];

	if (event.target != deckSelect)
		show(deck);
	hide(resetButton);
	showSpreadInfo();
	deselect();

	for (let el of animatedCards) {
		el.dispatchEvent(new Event("table-reset"));
		fadeOut(el, fadeDuration, true);
	}
	for (let el of cards) {
		el.dispatchEvent(new Event("load"));
		fadeOut(el, fadeDuration);
	}
}

function drawCard() {
	let id, classicId, name, altName;

	do classicId = id = Math.floor(Math.random() * deckSize)
	while (drawnCards.indexOf(id) >= 0);

	if (id > 21) {
		let suit = Math.floor((id - 22) / 14);
		let rank = id - 22 - 14 * suit;

		if (suit < 4) {
			let rankName = data.ranks[rank];
			let suitName = data.suits[suit];
			altName = rankName + " " + suitName;

			if (altRanks && rank > 9)
				rankName = altRanks[rank - 10];
			if (altSuits)
				suitName = altSuits[suit];
			name = rankName + " " + suitName;

			if (name == altName)
				altName = "";
		} else {
			name = extraMajors[rank];
		}
	} else {
		if ((id == 8 || id == 11) && isClassic)
			classicId = 19 - id;
		name = data.roman[classicId] + " " + data.major[id];
	}

	descriptions.push([
		name,
		altName,
		meanings[id],
		readings[id]
	]);

	let slot = drawnCards.push(id) - 1;
	let slotImg = cards[slot];
	let animatedCardInstance = table.appendChild(animatedCardBase.cloneNode());
	let animation = moveTo(
		animatedCardInstance,
		slotImg.parentNode,
		cardDrawDuration,
		() => onImageLoad(slotImg, () => {
			show(slotImg);
			fadeOut(animatedCardInstance, fadeDuration, true);
		})
	);

	slotImg.src = deckPath + classicId + ".jpg";
	animatedCardInstance.addEventListener("table-reset", () => animation.pause());

	if (slot == titles.length - 1) {
		show(resetButton);
		hide(deck);
	}
}

function showCardInfo(slot) {
	detailsTitle.textContent = titles[slot];
	descriptions[slot].forEach(
		(text, i) => cardInfoElements[i].textContent = text
	);
	detailsImage.src = cardModalImage.src = cards[slot].src;
	hide(spreadInfo);
	show(cardInfo);
}

function showSpreadInfo() {
	detailsTitle.textContent = spreadName;
	show(spreadInfo);
	hide(cardInfo);
}

function showDetails(slot) {
	show(detailsMenu);
	deselect();
	slot >= 0 ? showCardInfo(slot) : showSpreadInfo();
}

function hideDetails() {
	hide(detailsMenu);
	deselect();
}

function deselect() {
	for (let el of selectedCards)
		el.classList.remove("card-selected");
	detailsContent.scrollTop = 0;
}

fetch("res/data.json?1")
.then(response => response.json())
.then(json => {
	data = json;
	startButton.disabled = false;
	startButton.textContent = "НАЧАТЬ";
});

for (let el of app.getElementsByClassName("hidden"))
	hide(el);

onImageLoad(decor, () => show(decor));

spreadSelect.addEventListener("change", () => {
	let option = spreadSelect.selectedOptions[0];
	let theme = option.dataset.theme;

	spreadName = option.text.split(" (")[0];
	if (themeSelect.disabled = theme) {
		themeSelect.value = theme;
		themeSelect.dispatchEvent(new Event("change"));
	}
});

table.addEventListener("click", event => {
	let slot = [].indexOf.call(cards, event.target);
	if (slot >= 0) {
		showDetails(slot);
		event.target.classList.add("card-selected");
	}
});

document.forms.selection.addEventListener("submit", startApp);

app.querySelector("#btn-show-details").addEventListener("click", showDetails);
app.querySelector("#btn-hide-details").addEventListener("click", hideDetails);
resetButton.addEventListener("click", resetTable);

detailsImage.addEventListener("click", () => show(cardModal));
cardModal.addEventListener("click", () => hide(cardModal));

deck.addEventListener("load", () => {
	show(deck);
	hide(deckLoadingIcon);
});

// ios fixes
if ("standalone" in navigator) {
	// prevent double-tap to zoom
	app.addEventListener("click", () => {});
	// fix scrolling bug
	for (let el of app.getElementsByClassName("scrollable")) {
		el.addEventListener("touchstart", event => {
			el.atTop = (el.scrollTop <= 0);
			el.atBottom = (el.scrollTop >= el.scrollHeight - el.clientHeight);
			el.lastY = event.touches[0].clientY;
		});
		el.addEventListener("touchmove", event => {
			let up = (event.touches[0].clientY > el.lastY);
			if ((up && el.atTop) || (!up && el.atBottom))
				event.preventDefault();
		});
	}
}
})(document.body)
