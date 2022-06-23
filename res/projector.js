"use strict";
{
let nextSlotId, slotCount, deckSize, deckArray, descriptions, roman, major, suitNames, rankNames, titles, meanings, readings, extraMajorNames, altRankNames, altSuitNames;

const
getById = document.getElementById.bind(document),
getByIds = (...args) => args.map(id => getById(id)),
create = (tag, options) => Object.assign(document.createElement(tag), options),
each = (list, callback) => Array.prototype.forEach.call(list, callback),
index = (list, el) => Array.prototype.indexOf.call(list, el),

randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
hide = el => el.classList.add("hidden"),
show = el => el.classList.remove("hidden"),

change = new Event("change"),
openingTime = 3000,
cardAnimTime = 1000,
menuFadeTime = 500,
imgFadeTime = 300,
imgPath = "img/",

app = getById("app"),

selectElems = app.getElementsByTagName("select"),
[ layoutSel, subjectSel, deckSel ] = selectElems,

startButton = getById("start"),
showButton = getById("desc-show"),
hideButton = getById("desc-hide"),

table = getById("table"),
deckElem = getById("deck-elem"),
slots = table.getElementsByClassName("slot"),
cardImgs = table.querySelectorAll(".slot img"),

animCard = create("img", {className: "anim-card"}),
animCardInsts = table.getElementsByClassName("anim-card"),
decor = getById("decor"),

descMenu = getById("desc-menu"),

cardModal = getById("card-modal"),
cardModalImg = getById("img-zoomed"),
descImg = getById("card-img"),

textElems = getByIds("desc-title", "pos-name", "card-name", "card-classic-name", "general-reading", "layout-reading"),
descTitle = textElems[0],
cardInfo = getById("card-info"),

descContainer = getById("desc-container"),
layoutInfo = getById("layout-info"),
layoutDesc = getById("layout-desc"),
posContainer = getById("pos-container"),
posList = getById("pos-list"),
readingContainers = descContainer.getElementsByClassName("card-reading");

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

	const animation = el.animate(
		{ height: [ el.offsetHeight + "px", 0 ] },
		{ duration: time, easing: "ease-in-out" }
	);

	animation.finished.then(() => {
		hide(el);
		el.style.overflow = "";
	});

	return animation;
}

function resetTable() {
	nextSlotId = 0;
	deckSize = 77 + extraMajorNames.length;
	deckArray = [];
	descriptions = [];

	hide(deckElem);
	deckElem.src = animCard.src = imgPath + deckSel.value + "/back.jpg";

	each(animCardInsts, el => {
		if (el.anim)
			el.anim.pause();
		fadeOut(el, imgFadeTime).finished
			.then(() => el.remove());
	});

	each(cardImgs, el => {
		fadeOut(el, imgFadeTime);
		el.onload = null;
	});

	each(slots, el => el.style.zIndex = "");

	descTitle.textContent = "Жмите на колоду, чтобы заполнить расклад";
}

function updateDescription(slot) {
	each(descriptions[slot], (str, i) => textElems[i].textContent = str);

	show(readingContainers[0]);
	if (subjectSel.value)
		show(readingContainers[1]);

	show(cardInfo);
	hide(layoutInfo);
	showDescription();
}

function resetDescription() {
	if (nextSlotId > 0)
		descTitle.textContent = "Нажмите на карту, чтобы увидеть её значение";

	each(readingContainers, elem => hide(elem));
	hide(cardInfo);
	show(layoutInfo);
}

function showDescription() {
	show(descMenu);
	fadeOut(showButton, menuFadeTime);
	descContainer.scrollTop = 0;
}

function hideDescription() {
	fadeOut(descMenu, menuFadeTime);
	show(showButton);
	deselect();
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
	slotElem = slotImg.parentElement,
	animCardInst = table.appendChild(animCard.cloneNode()),
	displayCard = () => {
		show(slotImg);
		fadeOut(animCardInst, imgFadeTime).finished
			.then(() => animCardInst.remove());
	};

	slotImg.src = imgPath + deckSel.value + "/" + id + ".jpg";

	(animCardInst.anim = animCardInst.animate(
		[ getOffset(deckElem), getOffset(slotElem) ],
		{
			duration: cardAnimTime,
			fill: "forwards",
			easing: "ease-in-out"
		}
	)).finished.then(() => {
		if (slotImg.complete)
			displayCard();
		else
			slotImg.onload = displayCard;

		slotElem.style.zIndex = 1;
	});

	if (++nextSlotId == slotCount) {
		hide(deckElem);
		deckElem.src = imgPath + "restart.svg";
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
	each(app.getElementsByClassName("scrollable"), elem => {
		elem.addEventListener("touchstart", function(e) {
			this.atTop = (this.scrollTop <= 0);
			this.atBottom = (this.scrollTop >= this.scrollHeight - this.clientHeight);
			this.lastY = e.touches[0].clientY;
		});
		elem.addEventListener("touchmove", function(e) {
			const up = (e.touches[0].clientY > this.lastY);

			this.lastY = e.touches[0].clientY;

			if ((up && this.atTop) || (!up && this.atBottom))
				e.preventDefault();
		});
	});
}

layoutSel.addEventListener("change", function() {
	const theme = this.selectedOptions[0].getAttribute("theme");

	subjectSel.disabled = (theme != null);

	if (theme != null) {
		subjectSel.value = theme;
		subjectSel.dispatchEvent(change);
	}
});

if (!decor.complete) {
	hide(decor);
	decor.addEventListener("load", function() { show(this) });
}

showButton.addEventListener("click", showDescription);
hideButton.addEventListener("click", hideDescription);

descImg.addEventListener("click", () => {
	show(cardModal);
});
cardModal.addEventListener("click", () => {
	fadeOut(cardModal, menuFadeTime);
});

fetch("res/text.json")
.then(response => response.json())
.then(data => {
	function setStartButtonState() {
		if (deckSel.selectedIndex)
			startButton.disabled = !(subjectSel.selectedIndex || subjectSel.disabled);
	}

	setStartButtonState();
	app.addEventListener("change", setStartButtonState);

	startButton.textContent = "НАЧАТЬ";
	startButton.addEventListener("click", function() {
		({ major, suitNames, rankNames } = data);

		layoutSel.addEventListener("change", function() {
			const layout = this.value;
			table.className = layout;
			titles = data.titles[layout];
			layoutDesc.textContent = data.descriptions[layout];

			if ((slotCount = titles.length) > 1) {
				show(posContainer);
				posList.textContent = data.postext[layout];
			} else
				hide(posContainer);
		});

		subjectSel.addEventListener("change", function() {
			readings = data.readings[this.value];
		});

		deckSel.addEventListener("change", function() {
			const deck = this.value;
			
			roman = this.selectedOptions[0].hasAttribute("classic") ?
				Object.assign({8: "XI", 11: "VIII"}, data.roman) :
				data.roman;

			meanings = data.meanings[deck] || data.meanings.normal;
			extraMajorNames = data.extraMajors[deck] || [];
			altSuitNames = data.altSuits[deck];
			altRankNames = data.altRanks[deck];
		});

		deckElem.addEventListener("load", function() {
			show(this);
		});

		startButton.remove();

		slideUp(getById("header"), openingTime);
		slideUp(getById("menu-column-2"), openingTime).finished
		.then(() => {
			showDescription();
			deckElem.addEventListener("click", drawCard);
		});

		app.removeEventListener("change", setStartButtonState);
		app.addEventListener("change", resetTable);
		each(selectElems, elem => elem.dispatchEvent(change));
		resetTable();

		getById("menu-column-1").addEventListener("click", e => {
			const
			target = e.target,
			slot = index(cardImgs, target);

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
