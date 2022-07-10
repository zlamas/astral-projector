"use strict";
{
let nextSlotId, slotCount, deckSize, deckArray, descriptions, roman, major, suitNames, rankNames, titles, meanings, readings, extraMajorNames, altRankNames, altSuitNames;

const
getById = document.getElementById.bind(document),
hide = el => el.classList.add("hidden"),
show = el => el.classList.remove("hidden"),
randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

openingTime = 3000,
cardFlyTime = 1000,
fadeTime = 500,
imgPath = "img/",

app = getById("app"),
decor = getById("decor"),

selectElems = app.getElementsByTagName("select"),
[ layoutSel, subjectSel, deckSel ] = selectElems,
startButton = getById("start"),
showButton = getById("desc-show"),
hideButton = getById("desc-hide"),

table = getById("table"),
deckElem = getById("deck"),
restartButton = getById("restart"),
deckLoading = getById("deck-loading"),
cardImgs = [].slice.call(table.getElementsByClassName("slot"))
	.map(slot => slot.lastChild),
animCard = Object.assign(document.createElement("img"), { className: "anim-card" }),
animCardInsts = table.getElementsByClassName("anim-card"),

descMenu = getById("desc-menu"),
descContainer = getById("desc-container"),
layoutInfo = getById("layout-info"),
layoutDesc = getById("layout-desc"),
posContainer = getById("pos-container"),
posList = getById("pos-list"),
cardInfo = getById("card-info"),

textElems = ["desc-title", "pos-name", "card-name", "card-alt-name", "general-reading", "layout-reading"]
	.map(id => getById(id)),
descTitle = textElems[0],
posName = textElems[1],
layoutReading = textElems[5].parentNode,

cardModal = getById("card-modal"),
cardModalImg = getById("img-zoomed"),
descImg = getById("card-img");

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
	deckElem.src = animCard.src = imgPath + deckSel.value + "/back.jpg";

	for (let el of animCardInsts) {
		el.anim.pause();
		fadeOut(el, fadeTime).finished.then(() => el.remove());
	}
	cardImgs.forEach(el => {
		el.onload = fadeOut(el, fadeTime);
		el.parentNode.style.zIndex = "";
	});

	descTitle.textContent = "Жмите на колоду, чтобы заполнить расклад";
}

function updateDescription(slot) {
	descriptions[slot].forEach((str, i) => textElems[i].textContent = str);

	if (subjectSel.value)
		show(layoutReading);
	show(cardInfo);
	hide(layoutInfo);
	showDescription();
}

function resetDescription() {
	if (nextSlotId > 0)
		descTitle.textContent = "Нажмите на карту, чтобы увидеть её значение";
	posName.textContent = "";

	hide(layoutReading);
	hide(cardInfo);
	show(layoutInfo);
}

function showDescription() {
	show(descMenu);
	fadeOut(showButton, fadeTime);
	descContainer.scrollTop = 0;
}

function hideDescription() {
	fadeOut(descMenu, fadeTime);
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
	// } else if (altMajors[deck]) {
	// 	altName = major[id];
	// 	name = roman[id] + " " + altMajors[deck][id];
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
	slotElem = slotImg.parentNode,
	animCardInst = table.appendChild(animCard.cloneNode());

	slotImg.src = imgPath + deckSel.value + "/" + id + ".jpg";

	(animCardInst.anim = animCardInst.animate(
		[ getOffset(deckElem), getOffset(slotElem) ],
		{
			duration: cardFlyTime,
			fill: "forwards",
			easing: "ease-in-out"
		}
	)).finished.then(() => {
		slotImg.onload = () => {
			fadeOut(animCardInst, fadeTime).finished.then(() => animCardInst.remove());
			slotElem.style.zIndex = 1;
			show(slotImg);
		};

		if (slotImg.complete)
			slotImg.onload();
	});

	if (++nextSlotId == slotCount) {
		show(restartButton);
		hide(deckElem);
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

layoutSel.addEventListener("change", () => {
	const theme = layoutSel.selectedOptions[0].getAttribute("theme");

	if (subjectSel.disabled = (theme != null)) {
		subjectSel.value = theme;
		subjectSel.dispatchEvent(new Event("change"));
	}
});

if (!decor.complete) {
	hide(decor);
	decor.addEventListener("load", () => show(decor));
}

restartButton.addEventListener("click", resetTable);
showButton.addEventListener("click", showDescription);
hideButton.addEventListener("click", hideDescription);

descImg.addEventListener("click", () => show(cardModal));
cardModal.addEventListener("click", () => fadeOut(cardModal, fadeTime));

fetch("res/text.json")
.then(response => response.json())
.then(data => {
	function setStartButtonState() {
		if (layoutSel.selectedIndex && deckSel.selectedIndex)
			startButton.disabled = !(subjectSel.selectedIndex || subjectSel.disabled);
	}

	setStartButtonState();
	app.addEventListener("change", setStartButtonState);

	startButton.textContent = "НАЧАТЬ";
	startButton.addEventListener("click", () => {
		({ major, suitNames, rankNames } = data);

		layoutSel.addEventListener("change", () => {
			const layout = layoutSel.value;
			table.className = layout;
			titles = data.titles[layout];
			layoutDesc.textContent = data.descriptions[layout];

			if ((slotCount = titles.length) > 1) {
				show(posContainer);
				posList.textContent = data.postext[layout];
			} else
				hide(posContainer);
		});

		subjectSel.addEventListener("change", () =>
			readings = data.readings[subjectSel.value]
		);

		deckSel.addEventListener("change", () => {
			const deck = deckSel.value;
			
			hide(deckElem);
			show(deckLoading);

			roman = deckSel.selectedOptions[0].hasAttribute("classic") ?
				Object.assign({8: "XI", 11: "VIII"}, data.roman) :
				data.roman;

			meanings = data.meanings[deck] || data.meanings.normal;
			extraMajorNames = data.extraMajors[deck] || [];
			altSuitNames = data.altSuits[deck];
			altRankNames = data.altRanks[deck];
		});

		deckElem.addEventListener("load", () => {
			show(deckElem);
			hide(deckLoading);
		});

		startButton.remove();

		slideUp(getById("header"), openingTime);
		slideUp(getById("intro"), openingTime).finished.then(() => {
			showDescription();
			deckElem.addEventListener("click", drawCard);
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
				descImg.src = cardModalImg.src = target.src;
				updateDescription(slot);
			} else
				resetDescription();
		});
	});
});
}
