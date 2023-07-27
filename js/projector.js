"use strict";
{
let deckSize, drawnCards, descriptions, roman, major, suits, ranks, titles, meanings, readings, extraMajors, altRanks, altSuits, deckPath, isClassic,
hide = el => el.style.display = "none",
show = el => el.style.display = "",
getOffset = el => ({ left: el.offsetLeft + "px", top: el.offsetTop + "px" }),

openingDuration = 3000,
cardDrawDuration = 1000,
fadeDuration = 500,
animationOptions = { fill: "forwards", easing: "ease-in-out" },

app = document.querySelector(".app"),
table = app.querySelector(".table"),
[ deck, resetButton, deckLoadingIcon ] = table.getElementsByClassName("table-button"),
[ spreadSelect, themeSelect, deckSelect ] = app.getElementsByTagName("select"),
cards = table.getElementsByClassName("card"),
selectedCards = table.getElementsByClassName("card-selected"),
animatedCardBase = document.createElement("img"),
animatedCards = table.getElementsByClassName(animatedCardBase.className = "card-animated"),
decor = app.querySelector(".decor"),
startButton = app.querySelector(".button-start"),
detailsMenu = app.querySelector(".details"),
detailsTitle = detailsMenu.querySelector(".details-title"),
detailsWrapper = detailsMenu.querySelector(".details-wrapper"),
spreadInfo = detailsMenu.querySelector(".spread-info"),
spreadDetails = detailsMenu.querySelector(".spread-details"),
positionWrapper = detailsMenu.querySelector(".position-wrapper"),
positionList = detailsMenu.querySelector(".position-list"),
cardInfo = detailsMenu.querySelector(".card-info"),
detailsImage = detailsMenu.querySelector(".card-image"),
cardInfoElements = detailsMenu.querySelectorAll(".card-name, .card-alt-name, .text-container>span"),
spreadReading = detailsMenu.querySelector(".spread-reading"),
modal = app.querySelector(".modal"),
modalImage = modal.querySelector(".modal-image");

function fadeOut(el, duration, remove) {
	el.animate(
		{ opacity: [ getComputedStyle(el).opacity, 0 ] },
		Object.assign({ duration }, animationOptions)
	).onfinish = remove ?
		() => el.remove() :
		e => { e.target.cancel(); hide(el); };
}

function slideUp(el, duration, callback) {
	el.style.overflow = "hidden";
	el.style.padding = 0;
	el.animate(
		{ height: [ el.offsetHeight + "px", 0 ] },
		Object.assign({ duration }, animationOptions)
	).onfinish = () => { hide(el); if (callback) callback(); };
}

function resetTable() {
	drawnCards = [];
	descriptions = [];
	deck.src = animatedCardBase.src = deckPath + "back.jpg";
	hide(resetButton);

	for (let el of animatedCards) {
		el.dispatchEvent(new Event("reset"));
		fadeOut(el, fadeDuration, true);
	}
	for (let el of cards) {
		el.dispatchEvent(new Event("load"));
		fadeOut(el, fadeDuration);
	}
}

function drawCard() {
	let id, classicId, slot, name, altName;

	do id = Math.floor(Math.random() * deckSize)
	while (drawnCards.indexOf(id) >= 0);
	slot = drawnCards.push(id) - 1;

	if (id > 21) {
		let suit = Math.floor((id - 22) / 14);
		let rank = id - 22 - 14 * suit;

		if (suit < 4) {
			let rankName = ranks[rank];
			let suitName = suits[suit];
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
		name = roman[classicId || id] + " " + major[id];
	}

	descriptions.push([
		name,
		altName,
		meanings[id],
		readings ? readings[id] : ""
	]);

	let slotImg = cards[slot];
	let animatedCardInstance = table.appendChild(animatedCardBase.cloneNode());
	let animation = animatedCardInstance.animate(
		[ getOffset(deck), getOffset(slotImg.parentNode) ],
		Object.assign({ duration: cardDrawDuration }, animationOptions)
	);
	let onCardLoad = () => {
		show(slotImg);
		fadeOut(animatedCardInstance, fadeDuration, true);
	};

	slotImg.src = deckPath + (classicId || id) + ".jpg";
	animation.onfinish = () => slotImg.complete ?
		onCardLoad() :
		slotImg.addEventListener("load", onCardLoad, { once: true });
	animatedCardInstance.addEventListener("reset", () => animation.pause());

	if (slot == titles.length - 1) {
		show(resetButton);
		hide(deck);
	}
}

function showCardInfo(slot) {
	detailsTitle.textContent = titles[slot];
	descriptions[slot].forEach((text, i) => cardInfoElements[i].textContent = text);
	detailsImage.src = modalImage.src = cards[slot].src;
	hide(spreadInfo);
	show(cardInfo);
}

function showSpreadInfo() {
	detailsTitle.textContent = spreadSelect.dataset.displayName;
	show(spreadInfo);
	hide(cardInfo);
}

function showDetails() {
	show(detailsMenu);
	detailsWrapper.scrollTop = 0;
}

function hideDetails() {
	hide(detailsMenu);
	deselect();
}

function deselect() {
	for (let el of selectedCards)
		el.classList.remove("card-selected");
}

function setStartButtonState() {
	if (spreadSelect.selectedIndex && deckSelect.selectedIndex)
		startButton.disabled = !(themeSelect.selectedIndex || themeSelect.disabled);
}

for (let el of app.getElementsByClassName("hidden"))
	hide(el);

decor.complete ?
	show(decor) :
	decor.addEventListener("load", () => show(decor));

spreadSelect.addEventListener("change", () => {
	let option = spreadSelect.selectedOptions[0];
	let theme = option.dataset.theme;

	spreadSelect.dataset.displayName = option.text.replace(/ \(.*/, "");
	if (themeSelect.disabled = theme) {
		themeSelect.value = theme;
		themeSelect.dispatchEvent(new Event("change"));
	}
});

resetButton.addEventListener("click", resetTable);
app.querySelector(".button-show-details").addEventListener("click", showDetails);
app.querySelector(".button-hide-details").addEventListener("click", hideDetails);
detailsImage.addEventListener("click", () => show(modal));
modal.addEventListener("click", () => hide(modal));
deck.addEventListener("load", () => {
	show(deck);
	hide(deckLoadingIcon);
});

fetch("res/data.json?1")
.then(response => response.json())
.then(data => {
	({ roman, major, suits, ranks } = data);
	setStartButtonState();
	app.addEventListener("change", setStartButtonState);
	startButton.textContent = "НАЧАТЬ";

	startButton.addEventListener("click", () => {
		spreadSelect.addEventListener("change", () => {
			let spreadName = spreadSelect.value;
			table.className = table.className.replace(/sp-\w*/, "sp-" + spreadName);
			titles = data.titles[spreadName];
			spreadDetails.textContent = data.details[spreadName];
			positionList.textContent = data.positions[spreadName];

			if (spreadName == "one")
				hide(positionWrapper);
			else
				show(positionWrapper);
		});

		themeSelect.addEventListener("change", () => {
			if (readings = data.readings[themeSelect.value])
				show(spreadReading);
			else
				hide(spreadReading);
		});

		deckSelect.addEventListener("change", () => {
			let deckName = deckSelect.value;
			hide(deck);
			show(deckLoadingIcon);
			isClassic = data.classicOrder.indexOf(deckName) >= 0;
			meanings = data.meanings[deckName] || data.meanings.normal;
			altSuits = data.altSuits[deckName];
			altRanks = data.altRanks[deckName];
			extraMajors = data.extraMajors[deckName] || [];
			deckPath = "img/" + deckName + "/";
			deckSize = 78 + extraMajors.length;
		});

		app.querySelector(".main").addEventListener("click", e => {
			deselect();

			let slot = [].indexOf.call(cards, e.target);
			if (slot >= 0) {
				e.target.classList.add("card-selected");
				showCardInfo(slot);
				showDetails();
			} else {
				showSpreadInfo();
			}
		});

		app.removeEventListener("change", setStartButtonState);
		app.addEventListener("change", resetTable);
		[spreadSelect, themeSelect, deckSelect].forEach(
			el => el.dispatchEvent(new Event("change"))
		);

		slideUp(app.querySelector(".header"), openingDuration);
		slideUp(app.querySelector(".intro"), openingDuration, () => {
			show(detailsMenu);
			app.querySelectorAll(".button-wrapper>button").forEach(el => show(el));
			deck.addEventListener("click", drawCard);
		});

		show(table);
		hide(startButton);
		resetTable();
	});
});

// ios fixes
if ("standalone" in navigator) {
	// prevent double-tap to zoom
	app.addEventListener("click", () => {});
	// fix scrolling bug
	for (let el of app.getElementsByClassName("scrollable")) {
		el.addEventListener("touchstart", e => {
			el.atTop = (el.scrollTop <= 0);
			el.atBottom = (el.scrollTop >= el.scrollHeight - el.clientHeight);
			el.lastY = e.touches[0].clientY;
		});
		el.addEventListener("touchmove", e => {
			let up = (e.touches[0].clientY > el.lastY);
			if ((up && el.atTop) || (!up && el.atBottom))
				e.preventDefault();
		});
	}
}
}
