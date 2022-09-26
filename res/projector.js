"use strict";
{
let nextSlotId, slotCount, deckSize, deckArray, descriptions, roman, major, suitNames, rankNames, titles, meanings, readings, extraMajorNames, altRankNames, altSuitNames;

const
getById = document.getElementById.bind(document),
hide = el => el.classList.add("hidden"),
show = el => el.classList.remove("hidden"),
randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

openingDuration = 3000,
cardFlyDuration = 1000,
fadeDuration = 500,
imgPath = "img/",

app = getById("app"),
decor = getById("decor"),
selectElems = app.getElementsByTagName("select"),
[ spreadSelect, subjectSelect, deckSelect ] = selectElems,
startButton = getById("start"),
showButton = getById("details-show"),
hideButton = getById("details-hide"),
table = getById("table"),
deckElement = getById("deck"),
restartButton = getById("restart"),
deckLoading = getById("deck-loading"),
detailsMenu = getById("details"),
detailsWrapper = getById("details-wrapper"),
spreadInfo = getById("spread-info"),
spreadDetails = getById("spread-details"),
positionWrapper = getById("position-wrapper"),
positionList = getById("position-list"),
cardInfo = getById("card-info"),
modal = getById("modal"),
modalImg = modal.firstChild,
detailsImg = getById("card-img"),

cardImgs = [].slice.call(table.getElementsByClassName("slot"))
	.map(slot => slot.lastChild),
animatedCard = Object.assign(document.createElement("img"), { className: "animated-card" }),
animatedCardInstances = table.getElementsByClassName("animated-card"),

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
spreadReading = textElems[5].parentNode;

function getOffset(el) {
	const rect = el.getBoundingClientRect();
	return { left: rect.x + "px", top: rect.y + "px" };
}

function fadeOut(el, time) {
	const
	style = getComputedStyle(el),
	animation = el.animate(
		{ opacity: [ style.opacity, 0 ] },
		{ duration: time, easing: "ease-in-out" }
	);

	animation.finished.then(() => hide(el));

	return animation;
}

function slideUp(el, time) {
	el.style.overflow = "hidden";
	el.style.padding = 0;

	const animation = el.animate(
		{ height: [ el.offsetHeight + "px", 0 ] },
		{ duration: time, easing: "ease-in-out" }
	);

	animation.finished.then(() => hide(el));

	return animation;
}

function resetTable() {
	nextSlotId = 0;
	deckSize = 77 + extraMajorNames.length;
	deckArray = [];
	descriptions = [];

	hide(restartButton);
	deckElement.src = animatedCard.src = imgPath + deckSelect.value + "/back.jpg";

	for (let el of animatedCardInstances) {
		el.anim.pause();
		fadeOut(el, fadeDuration).finished.then(() => el.remove());
	}
	cardImgs.forEach(el => {
		el.onload = fadeOut(el, fadeDuration);
		el.parentNode.style.zIndex = "";
	});

	detailsTitle.textContent = "Жмите на колоду, чтобы заполнить расклад";
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
	fadeOut(showButton, fadeDuration);
	detailsWrapper.scrollTop = 0;
}

function hideDescription() {
	fadeOut(detailsMenu, fadeDuration);
	show(showButton);
	deselect();
}

function drawCard() {
	let id = randomInt(0, deckSize),
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
			name = extraMajorNames[rank];
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
	animatedCardInstance = table.appendChild(animatedCard.cloneNode());

	slotImg.src = imgPath + deckSelect.value + "/" + id + ".jpg";

	(animatedCardInstance.anim = animatedCardInstance.animate(
		[ getOffset(deckElement), getOffset(currentSlot) ],
		{
			duration: cardFlyDuration,
			fill: "forwards",
			easing: "ease-in-out"
		}
	)).finished.then(() => {
		slotImg.onload = () => {
			fadeOut(animatedCardInstance, fadeDuration).finished.then(() => animatedCardInstance.remove());
			currentSlot.style.zIndex = 1;
			show(slotImg);
		};

		if (slotImg.complete)
			slotImg.onload();
	});

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

// ios specific fixes
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

spreadSelect.addEventListener("change", () => {
	const theme = spreadSelect.selectedOptions[0].getAttribute("theme");

	if (subjectSelect.disabled = (theme != null)) {
		subjectSelect.value = theme;
		subjectSelect.dispatchEvent(new Event("change"));
	}
});

if (!decor.complete) {
	hide(decor);
	decor.addEventListener("load", () => show(decor));
}

restartButton.addEventListener("click", resetTable);
showButton.addEventListener("click", showDescription);
hideButton.addEventListener("click", hideDescription);

detailsImg.addEventListener("click", () => show(modal));
modal.addEventListener("click", () => fadeOut(modal, fadeDuration));

fetch("res/text.json?v=1")
.then(response => response.json())
.then(data => {
	function setStartButtonState() {
		if (spreadSelect.selectedIndex && deckSelect.selectedIndex)
			startButton.disabled = !(subjectSelect.selectedIndex || subjectSelect.disabled);
	}

	setStartButtonState();
	app.addEventListener("change", setStartButtonState);

	startButton.textContent = "НАЧАТЬ";
	startButton.addEventListener("click", () => {
		({ roman, major, suitNames, rankNames } = data);

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
			const deck = deckSelect.value;

			hide(deckElement);
			show(deckLoading);

			Object.assign(roman, deckSelect.selectedOptions[0].hasAttribute("classic") ?
				{8: "XI", 11: "VIII"} :
				{8: "VIII", 11: "XI"});

			meanings = data.meanings[deck] || data.meanings.normal;
			extraMajorNames = data.extraMajors[deck] || [];
			altSuitNames = data.altSuits[deck];
			altRankNames = data.altRanks[deck];
		});

		deckElement.addEventListener("load", () => {
			show(deckElement);
			hide(deckLoading);
		});

		startButton.remove();

		slideUp(getById("header"), openingDuration);
		slideUp(getById("intro"), openingDuration).finished.then(() => {
			showDescription();
			deckElement.addEventListener("click", drawCard);
		});

		app.removeEventListener("change", setStartButtonState);
		app.addEventListener("change", resetTable);
		for (let elem of selectElems)
			elem.dispatchEvent(new Event("change"));
		resetTable();

		getById("main-column").addEventListener("click", e => {
			const
			target = e.target,
			slot = cardImgs.indexOf(target);

			deselect();

			if (slot >= 0) {
				target.id = "selected";
				detailsImg.src = modalImg.src = target.src;
				updateDescription(slot);
			} else
				resetDescription();
		});
	});
});
}
