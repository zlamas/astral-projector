"use strict";
{
let nextSlotId, slotCount, deckSize, deckArray, descriptions, roman, major, suits, ranks, titles, meanings, readings, extraMajors, altRanks, altSuits, animatedCard;
const
getById = document.getElementById.bind(document),
hide = el => el.classList.add("hidden"),
show = el => el.classList.remove("hidden"),

openingDuration = 3000,
cardDrawDuration = 1000,
fadeDuration = 500,
imgPath = "img/",
animationOptions = { fill: "forwards", easing: "ease-in-out" },

app = getById("app"),
selectElems = app.getElementsByTagName("select"),
table = getById("table"),
[ spreadSelect, subjectSelect, deckSelect ] = selectElems,
[ deckElement, restartButton, deckLoading ] = table.getElementsByClassName("deck-img"),
cardImgs = table.querySelectorAll(".slot > img"),
decor = getById("decor"),
startButton = getById("start"),
detailsMenu = getById("details"),
showButton = getById("details-show"),
hideButton = getById("details-hide"),
detailsWrapper = getById("details-wrapper"),
spreadInfo = getById("spread-info"),
spreadDetails = getById("spread-details"),
positionWrapper = getById("position-wrapper"),
positionList = getById("position-list"),
cardInfo = getById("card-info"),
detailsImg = getById("card-img"),
modal = getById("modal"),
textElems = [
	getById("details-title"),
	getById("position-name"),
	getById("card-name"),
	getById("card-alt-name"),
	getById("general-reading"),
	getById("spread-reading")
],
detailsTitle = textElems[0],
positionName = textElems[1],
spreadReading = textElems[5].parentNode,
animatedCardInstances = table.getElementsByClassName("animated-card");
(animatedCard = document.createElement("img")).className = "animated-card";

function getOffset(el) {
	const rect = el.getBoundingClientRect();
	return { left: rect.x + "px", top: rect.y + "px" };
}

function fadeOut(el, time, remove) {
	const anim = el.animate(
		{ opacity: [ getComputedStyle(el).opacity, 0 ] },
		{ duration: time, ...animationOptions }
	);
	anim.onfinish = () => {
		anim.cancel();
		remove ? el.remove() : hide(el);
	};
}

function slideUp(el, time, callback = () => {}) {
	el.style.overflow = "hidden";
	el.style.padding = 0;
	el.animate(
		{ height: [ el.offsetHeight + "px", 0 ] },
		{ duration: time, ...animationOptions }
	).onfinish = () => { hide(el); callback() };
}

function resetTable() {
	nextSlotId = 0;
	deckSize = 77 + extraMajors.length;
	deckArray = [];
	descriptions = [];

	hide(restartButton);
	deckElement.src = animatedCard.src = imgPath + deckSelect.value + "/back.jpg";
	detailsTitle.textContent = "Жмите на колоду, чтобы заполнить расклад";

	for (let el of animatedCardInstances) {
		el.dispatchEvent(new Event("reset"));
		fadeOut(el, fadeDuration, true);
	}
	cardImgs.forEach(el => {
		el.dispatchEvent(new Event("load"));
		fadeOut(el, fadeDuration);
		el.parentNode.style = "";
	});
}

function updateDescription(slot) {
	descriptions[slot].forEach((str, i) => textElems[i].textContent = str);
	if (subjectSelect.value)
		show(spreadReading);
	show(cardInfo);
	hide(spreadInfo);
	showDescription();
}

function resetDescription() {
	if (nextSlotId > 0)
		detailsTitle.textContent = "Нажмите на карту, чтобы увидеть её значение";
	positionName.textContent = "";
	hide(spreadReading);
	hide(cardInfo);
	show(spreadInfo);
}

function showDescription() {
	show(detailsMenu);
	detailsWrapper.scrollTop = 0;
}

function hideDescription() {
	fadeOut(detailsMenu, fadeDuration);
	deselect();
}

function drawCard() {
	let id = Math.floor(Math.random() * (deckSize + 1)),
		name = "",
		altName = "";

	while (deckArray[id])
		id = deckArray[id];
	deckArray[id] = deckSize--;

	if (id > 21) {
		const
		suit = Math.floor((id - 22) / 14),
		rank = id - 22 - 14 * suit;

		if (suit < 4) {
			if (altRanks && rank > 9) {
				name += altRanks[rank - 10] + " ";
				altName += ranks[rank] + " ";
			} else
				name += ranks[rank] + " ";

			if (altSuits) {
				name += altSuits[suit];
				altName += suits[suit];
			} else
				name += suits[suit];
		} else
			name = extraMajors[rank];
//	} else if (altMajors[deck]) {
//		altName = major[id];
//		name = roman[id] + " " + altMajors[deck][id];
	} else
		name = roman[id] + " " + major[id];

	descriptions[nextSlotId] = [
		slotCount > 1 ? "Позиция " + (nextSlotId + 1) : "",
		titles[nextSlotId],
		name,
		altName ? " / " + altName : "",
		meanings[id],
		readings ? readings[id] : ""
	];

	const
	slotImg = cardImgs[nextSlotId],
	currentSlot = slotImg.parentNode,
	animatedCardInstance = table.appendChild(animatedCard.cloneNode()),
	animation = animatedCardInstance.animate(
		[ getOffset(deckElement), getOffset(currentSlot) ],
		{ duration: cardDrawDuration, ...animationOptions }
	),
	onCardLoad = () => {
		show(slotImg);
		currentSlot.style.zIndex = 1;
		fadeOut(animatedCardInstance, fadeDuration, true);
	};

	slotImg.src = imgPath + deckSelect.value + "/" + id + ".jpg";
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
modal.addEventListener("click", () => fadeOut(modal, fadeDuration));

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
			} else
				hide(positionWrapper);
		});

		subjectSelect.addEventListener("change", () =>
			readings = data.readings[subjectSelect.value]
		);

		deckSelect.addEventListener("change", () => {
			hide(deckElement);
			show(deckLoading);

			Object.assign(roman, deckSelect.selectedOptions[0].hasAttribute("classic") ?
				{8: "XI", 11: "VIII"} :
				{8: "VIII", 11: "XI"});

			const deck = deckSelect.value;
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
			const
			target = e.target,
			slot = [].indexOf.call(cardImgs, target);

			deselect();

			if (slot >= 0) {
				target.id = "selected";
				detailsImg.src = modal.firstChild.src = target.src;
				updateDescription(slot);
			} else
				resetDescription();
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
		elem.addEventListener("touchstart", function(e) {
			elem.atTop = (elem.scrollTop <= 0);
			elem.atBottom = (elem.scrollTop >= elem.scrollHeight - elem.clientHeight);
			elem.lastY = e.touches[0].clientY;
		});
		elem.addEventListener("touchmove", function(e) {
			const up = (e.touches[0].clientY > elem.lastY);
			if ((up && elem.atTop) || (!up && elem.atBottom))
				e.preventDefault();
		});
	}
}
}
