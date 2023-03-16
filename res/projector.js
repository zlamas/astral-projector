"use strict";{
let nextSlotId, slotCount, deckSize, deckArray, descriptions, roman, major, suits, ranks, titles, meanings, readings, extraMajors, altRanks, altSuits, deckPath;
const
hide = el => el.classList.add("hidden"),
show = el => el.classList.remove("hidden"),
getOffset = el => ({ left: el.offsetLeft + "px", top: el.offsetTop + "px" }),

openingDuration = 3000,
cardDrawDuration = 1000,
fadeDuration = 500,
animationOptions = { fill: "forwards", easing: "ease-in-out" },

app = document.querySelector(".app"),
table = app.querySelector(".table"),
selectElems = app.getElementsByTagName("select"),
[ spreadSelect, themeSelect, deckSelect ] = selectElems,
[ deckElement, restartButton, deckLoading, ...cardImgs ] = table.getElementsByTagName("img"),
decor = app.querySelector(".decor"),
startButton = app.querySelector(".start"),
detailsMenu = app.querySelector(".details"),
showButton = app.querySelector(".details-show"),
hideButton = detailsMenu.querySelector(".details-hide"),
detailsWrapper = detailsMenu.querySelector(".details-wrapper"),
spreadInfo = detailsMenu.querySelector(".spread-info"),
spreadDetails = spreadInfo.querySelector(".spread-details"),
positionWrapper = spreadInfo.querySelector(".position-wrapper"),
positionList = positionWrapper.querySelector(".position-list"),
cardInfo = detailsMenu.querySelector(".card-info"),
detailsImg = cardInfo.querySelector(".card-img"),
modal = app.querySelector(".modal"),
textElems = [
	detailsMenu.querySelector(".details-title"),
	cardInfo.querySelector(".card-name"),
	cardInfo.querySelector(".card-alt-name"),
	cardInfo.querySelector(".general-reading"),
	cardInfo.querySelector(".spread-reading")
],
spreadReading = textElems[4].parentNode,
animatedCard = document.createElement("img"),
animatedCardInstances = table.getElementsByClassName(animatedCard.className = "animated-card");

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
	nextSlotId = 0;
	deckSize = 78 + extraMajors.length;
	deckArray = [];
	descriptions = [];

	hide(restartButton);
	deckElement.src = animatedCard.src = deckPath + "back.jpg";

	for (let el of animatedCardInstances) {
		el.dispatchEvent(new Event("reset"));
		fadeOut(el, fadeDuration, true);
	}
	cardImgs.forEach(el => {
		el.dispatchEvent(new Event("load"));
		fadeOut(el, fadeDuration);
	});
}

function drawCard() {
	let id = Math.floor(Math.random() * deckSize);
	let name, altName;

	while (deckArray[id])
		id = deckArray[id];
	deckArray[id] = --deckSize;

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
		name = roman[id] + " " + major[id];
	}

	descriptions[nextSlotId] = [
		titles[nextSlotId],
		name,
		altName,
		meanings[id],
		readings ? readings[id] : ""
	];

	let slotImg = cardImgs[nextSlotId];
	let animatedCardInstance = table.appendChild(animatedCard.cloneNode());
	let animation = animatedCardInstance.animate(
		[ getOffset(deckElement), getOffset(slotImg.parentNode) ],
		Object.assign({ duration: cardDrawDuration }, animationOptions)
	);
	let onCardLoad = () => {
		show(slotImg);
		fadeOut(animatedCardInstance, fadeDuration, true);
	};

	slotImg.src = deckPath + id + ".jpg";
	animation.onfinish = () => slotImg.complete ?
		onCardLoad() :
		slotImg.addEventListener("load", onCardLoad, { once: true });
	animatedCardInstance.addEventListener("reset", () => animation.pause());

	if (++nextSlotId == slotCount) {
		show(restartButton);
		hide(deckElement);
	}
}

function showCardInfo(slot) {
	descriptions[slot].forEach((text, i) => textElems[i].textContent = text);
	detailsImg.src = modal.firstChild.src = cardImgs[slot].src;
	hide(spreadInfo);
	show(cardInfo);
}

function showSpreadInfo() {
	textElems[0].textContent = option.text.replace(/ \(.*/, "");
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
	let selected = document.getElementById("selected");
	if (selected)
		selected.id = "";
}

function setStartButtonState() {
	if (spreadSelect.selectedIndex && deckSelect.selectedIndex)
		startButton.disabled = !(themeSelect.selectedIndex || themeSelect.disabled);
}

decor.complete ?
	show(decor) :
	decor.addEventListener("load", () => show(decor));

spreadSelect.addEventListener("change", () => {
	let option = spreadSelect.selectedOptions[0];
	let theme = option.getAttribute("theme");

	if (themeSelect.disabled = theme) {
		themeSelect.value = theme;
		themeSelect.dispatchEvent(new Event("change"));
	}
});

restartButton.addEventListener("click", resetTable);
showButton.addEventListener("click", showDetails);
hideButton.addEventListener("click", hideDetails);
detailsImg.addEventListener("click", () => show(modal));
modal.addEventListener("click", () => hide(modal));
deckElement.addEventListener("load", () => {
	show(deckElement);
	hide(deckLoading);
});

fetch("res/data.json")
.then(response => response.json())
.then(data => {
	({ roman, major, suits, ranks } = data);
	setStartButtonState();
	app.addEventListener("change", setStartButtonState);
	startButton.textContent = "НАЧАТЬ";

	startButton.addEventListener("click", () => {
		spreadSelect.addEventListener("change", () => {
			let spread = spreadSelect.value;
			table.id = spread;
			titles = data.titles[spread];
			spreadDetails.textContent = data.details[spread];
			positionList.textContent = data.positions[spread];

			if ((slotCount = titles.length) > 1)
				show(positionWrapper);
			else
				hide(positionWrapper);
		});

		themeSelect.addEventListener("change", () => {
			if (readings = data.readings[themeSelect.value])
				show(spreadReading);
			else
				hide(spreadReading);
		});

		deckSelect.addEventListener("change", () => {
			let deck = deckSelect.value;
			hide(deckElement);
			show(deckLoading);

			extend(roman, deckSelect.selectedOptions[0].hasAttribute("classic") ?
				{8: "XI", 11: "VIII"} :
				{8: "VIII", 11: "XI"});

			deckPath = "img/" + deck + "/";
			meanings = data.meanings[deck] || data.meanings.normal;
			extraMajors = data.extraMajors[deck] || [];
			altSuits = data.altSuits[deck];
			altRanks = data.altRanks[deck];
		});

		app.querySelector(".main").addEventListener("click", e => {
			deselect();

			let slot = cardImgs.indexOf(e.target);
			if (slot >= 0) {
				e.target.id = "selected";
				showCardInfo(slot);
				showDetails();
			} else {
				showSpreadInfo();
			}
		});

		app.removeEventListener("change", setStartButtonState);
		app.addEventListener("change", resetTable);
		for (let elem of selectElems)
			elem.dispatchEvent(new Event("change"));

		slideUp(app.querySelector(".header"), openingDuration);
		slideUp(app.querySelector(".intro"), openingDuration, () => {
			show(detailsMenu);
			show(showButton);
			deckElement.addEventListener("click", drawCard);
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
	for (let elem of app.getElementsByClassName("scrollable")) {
		elem.addEventListener("touchstart", e => {
			elem.atTop = (elem.scrollTop <= 0);
			elem.atBottom = (elem.scrollTop >= elem.scrollHeight - elem.clientHeight);
			elem.lastY = e.touches[0].clientY;
		});
		elem.addEventListener("touchmove", e => {
			let up = (e.touches[0].clientY > elem.lastY);
			if ((up && elem.atTop) || (!up && elem.atBottom))
				e.preventDefault();
		});
	}
}
}
