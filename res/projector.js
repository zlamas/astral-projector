"use strict";{
let nextSlotId, slotCount, deckSize, deckArray, descriptions, roman, major, suits, ranks, titles, meanings, readings, extraMajors, altRanks, altSuits, deckPath;
const
getById = document.getElementById.bind(document),
extend = Object.assign,
hide = el => el.classList.add("hidden"),
show = el => el.classList.remove("hidden"),
getOffset = el => ({ left: el.offsetLeft + "px", top: el.offsetTop + "px" }),

openingDuration = 3000,
cardDrawDuration = 1000,
fadeDuration = 500,
animationOptions = { fill: "forwards", easing: "ease-in-out" },

app = getById("app"),
selectElems = app.getElementsByTagName("select"),
table = getById("table"),
[ spreadSelect, subjectSelect, deckSelect ] = selectElems,
[ deckElement, restartButton, deckLoading ] = table.getElementsByClassName("deck-img"),
cardImgs = table.querySelectorAll(".slot>img"),
decor = getById("decor"),
startButton = getById("start"),
detailsMenu = getById("details"),
showButton = getById("details-show"),
hideButton = getById("details-hide"),
detailsWrapper = getById("details-wrapper"),
detailsTitle = getById("details-title"),
spreadInfo = getById("spread-info"),
spreadDetails = getById("spread-details"),
positionWrapper = getById("position-wrapper"),
positionList = getById("position-list"),
cardInfo = getById("card-info"),
detailsImg = getById("card-img"),
modal = getById("modal"),
textElems = [
	getById("position-name"),
	getById("card-name"),
	getById("card-alt-name"),
	getById("general-reading"),
	getById("spread-reading")
],
spreadReading = textElems[4].parentNode,
animatedCard = document.createElement("img"),
animatedCardInstances = table.getElementsByClassName(animatedCard.className = "animated-card");

function fadeOut(el, time, remove) {
	const anim = el.animate(
		{ opacity: [ getComputedStyle(el).opacity, 0 ] },
		extend({ duration: time }, animationOptions));
	anim.onfinish = () => remove ? el.remove() : ( anim.cancel(), hide(el) );
}

function slideUp(el, time, callback = () => {}) {
	el.style.overflow = "hidden";
	el.style.padding = 0;
	el.animate(
		{ height: [ el.offsetHeight + "px", 0 ] },
		extend({ duration: time }, animationOptions))
	.onfinish = () => { hide(el); callback() };
}

function resetTable() {
	nextSlotId = 0;
	deckSize = 78 + extraMajors.length;
	deckArray = [];
	descriptions = [];

	hide(restartButton);
	deckElement.src = animatedCard.src = deckPath + "back.jpg";
	detailsTitle.textContent = "Жмите на колоду, чтобы заполнить расклад";

	for (let el of animatedCardInstances) {
		el.dispatchEvent(new Event("reset"));
		fadeOut(el, fadeDuration, true);
	}
	for (let el of cardImgs) {
		el.dispatchEvent(new Event("load"));
		fadeOut(el, fadeDuration);
	}
}

function updateDescription(slot) {
	descriptions[slot].forEach((str, i) => textElems[i].textContent = str);
	detailsTitle.textContent = "Позиция " + (slot + 1);
	if (subjectSelect.value)
		show(spreadReading);
	show(cardInfo);
	hide(spreadInfo);
	showDescription();
}

function resetDescription() {
	if (nextSlotId > 0)
		detailsTitle.textContent = "Нажмите на карту, чтобы увидеть её значение";
	textElems[0].textContent = "";
	hide(spreadReading);
	hide(cardInfo);
	show(spreadInfo);
}

function showDescription() {
	show(detailsMenu);
	detailsWrapper.scrollTop = 0;
}

function hideDescription() {
	hide(detailsMenu);
	deselect();
}

function drawCard() {
	let id = Math.floor(Math.random() * deckSize);
	let name, altName;

	while (deckArray[id])
		id = deckArray[id];
	deckArray[id] = --deckSize;

	if (id > 21) {
		const suit = Math.floor((id - 22) / 14);
		const rank = id - 22 - 14 * suit;

		if (suit < 4) {
			let rankName = ranks[rank];
			let suitName = suits[suit];
			name = rankName + " " + suitName;

			if (altRanks && rank > 9)
				rankName = altRanks[rank - 10];
			if (altSuits)
				suitName = altSuits[suit];
			altName = (rankName + " " + suitName).replace(name, "");
		} else {
			name = extraMajors[rank];
		}
	} else {
		name = roman[id] + " " + major[id];
	}

	descriptions[nextSlotId] = [
		titles[nextSlotId],
		altName || name,
		altName ? name : "",
		meanings[id],
		readings ? readings[id] : ""
	];

	const slotImg = cardImgs[nextSlotId];
	const animatedCardInstance = table.appendChild(animatedCard.cloneNode());
	const animation = animatedCardInstance.animate(
		[ getOffset(deckElement), getOffset(slotImg.parentNode) ],
		extend({ duration: cardDrawDuration }, animationOptions)
	);
	const onCardLoad = () => {
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

function deselect() {
	const selected = getById("selected");
	if (selected)
		selected.id = "";
}

function setStartButtonState() {
	if (spreadSelect.selectedIndex && deckSelect.selectedIndex)
		startButton.disabled = !(subjectSelect.selectedIndex || subjectSelect.disabled);
}

decor.complete ?
	show(decor) :
	decor.addEventListener("load", () => show(decor));

spreadSelect.addEventListener("change", () => {
	const theme = spreadSelect.selectedOptions[0].getAttribute("theme");

	if (subjectSelect.disabled = (theme != null)) {
		subjectSelect.value = theme;
		subjectSelect.dispatchEvent(new Event("change"));
	}
});

restartButton.addEventListener("click", resetTable);
showButton.addEventListener("click", showDescription);
hideButton.addEventListener("click", hideDescription);
detailsImg.addEventListener("click", () => show(modal));
modal.addEventListener("click", () => hide(modal));

fetch("res/data.json")
.then(response => response.json())
.then(data => {
	setStartButtonState();
	app.addEventListener("change", setStartButtonState);
	startButton.textContent = "НАЧАТЬ";

	startButton.addEventListener("click", () => {
		({ roman, major, suits, ranks } = data);

		spreadSelect.addEventListener("change", () => {
			const spread = spreadSelect.value;
			table.className = spread;
			titles = data.titles[spread];
			spreadDetails.textContent = data.details[spread];

			if ((slotCount = titles.length) > 1) {
				show(positionWrapper);
				positionList.textContent = data.positions[spread];
			} else {
				hide(positionWrapper);
			}
		});

		subjectSelect.addEventListener("change", () =>
			readings = data.readings[subjectSelect.value]);

		deckSelect.addEventListener("change", () => {
			const deck = deckSelect.value;
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

		deckElement.addEventListener("load", () => {
			show(deckElement);
			hide(deckLoading);
		});

		getById("main").addEventListener("click", e => {
			const target = e.target;
			const slot = [].indexOf.call(cardImgs, target);

			deselect();

			if (slot >= 0) {
				target.id = "selected";
				detailsImg.src = modal.firstChild.src = target.src;
				updateDescription(slot);
			} else {
				resetDescription();
			}
		});

		slideUp(getById("header"), openingDuration);
		slideUp(getById("intro"), openingDuration, () => {
			showDescription();
			show(showButton);
			deckElement.addEventListener("click", drawCard);
		});

		app.removeEventListener("change", setStartButtonState);
		app.addEventListener("change", resetTable);
		for (let elem of selectElems)
			elem.dispatchEvent(new Event("change"));

		startButton.remove();
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
			const up = (e.touches[0].clientY > elem.lastY);
			if ((up && elem.atTop) || (!up && elem.atBottom))
				e.preventDefault();
		});
	}
}
}
