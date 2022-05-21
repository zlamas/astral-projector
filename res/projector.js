(() => {
"use strict";
let subject, deck, nextSlotId, slotCount, deckSize, deckArray, descriptions, roman, major, suitNames, rankNames, titles, meanings, readings, extraMajorNames, altRankNames, altSuitNames;

Object.assign(EventTarget.prototype, {
	on: addEventListener,
	off: removeEventListener
});

Object.assign(HTMLElement.prototype, {
	hide() {
		this.style.display = "none";
		return this;
	},
	show() {
		this.style.display = "";
		if (getComputedStyle(this).display == "none")
			this.style.display = "block";
		return this;
	},
	offset() {
		const rect = this.getBoundingClientRect();
		return { left: rect.x + "px", top: rect.y + "px" };
	},
	fadeIn(time, callback) {
		const style = getComputedStyle(this);

		if (style.display == "none")
			this.show();
		else
			time = 0;

		return this.animateAndDo(
			{ opacity: [ 0, style.opacity ] },
			{ duration: time },
			callback
		);
	},
	fadeOut(time, callback) {
		const
		style = getComputedStyle(this),
		animation = this.animateAndDo(
			{ opacity: [ style.opacity, 0 ] },
			{ duration: time },
			callback
		);

		animation.on("finish", () => this.hide());

		return animation;
	},
	slideUp(time, callback) {
		this.style.overflow = "hidden";

		const animation = this.animateAndDo(
			{ height: [ this.offsetHeight + "px", 0 ] },
			{ duration: time },
			callback
		);

		animation.on("finish", () => this.hide().style.overflow = "");

		return animation;
	},
	animateAndDo(keyframes, options, callback) {
		const animation = this.animate(
			keyframes,
			Object.assign({
				/* animation defaults */
				easing: "ease-in-out"
			}, options)
		);

		if (callback)
			animation.on("finish", callback.bind(this));

		return animation;
	}
});

const
GetById = document.getElementById.bind(document),
GetByIds = (...args) => args.map(id => GetById(id)),
Create = (tag, options) => Object.assign(document.createElement(tag), options),
Each = (list, callback) => Array.prototype.forEach.call(list, callback),
Index = (list, elem) => Array.prototype.indexOf.call(list, elem),

change = new Event("change"),
openingTime = 3000,
cardAnimTime = 1000,
menuFadeTime = 500,
imgFadeTime = 300,
imgPath = "img/",

app = GetById("app"),

selectElems = app.getElementsByTagName("select"),
[ layoutSel, subjectSel, deckSel ] = selectElems,

startButton = GetById("start"),
showButton = GetById("desc-show"),
hideButton = GetById("desc-hide"),

table = GetById("table"),
deckElem = GetById("deck-elem"),
slots = table.getElementsByClassName("slot"),
cardImgs = table.querySelectorAll(".slot img"),

animCard = Create("img", {className: "anim-card"}),
animCardInsts = table.getElementsByClassName("anim-card"),
decor = GetById("decor"),

descMenu = GetById("desc-menu").hide(),

cardModal = GetById("card-modal"),
cardModalImg = GetById("img-zoomed"),
descImg = GetById("card-img"),

textElems = GetByIds("desc-title", "pos-name", "card-name", "card-classic-name", "general-reading", "layout-reading"),
descTitle = textElems[0],
cardInfo = GetById("card-info"),

descContainer = GetById("desc-container"),
layoutInfo = GetById("layout-info"),
layoutDesc = GetById("layout-desc"),
posContainer = GetById("pos-container"),
posList = GetById("pos-list"),
readingContainers = descContainer.getElementsByClassName("card-reading");

function randomInt(min, max) {
	return Math.floor( Math.random() * (max - min + 1) ) + min;
}

function resetTable() {
	nextSlotId = 0;
	deckSize = 77 + extraMajorNames.length;
	deckArray = [];
	descriptions = [];

	deckElem.hide().src = animCard.src = imgPath + deck + "/back.jpg";

	Each(animCardInsts, elem => {
		if (elem.anim)
			elem.anim.pause();
		elem.fadeOut(imgFadeTime, () => elem.remove())
	});

	Each(cardImgs, elem => {
		elem.fadeOut(imgFadeTime);
		elem.textArray = elem.onload = null;
	});

	Each(slots, elem => elem.style.zIndex = "");

	descTitle.textContent = "Жмите на колоду, чтобы заполнить расклад";
}

function updateDescription(slot) {
	Each(descriptions[slot], (str, i) => textElems[i].textContent = str);

	readingContainers[0].show();
	if (subject)
		readingContainers[1].show();

	cardInfo.show();
	layoutInfo.hide();
	showDescription();
}

function resetDescription() {
	if (nextSlotId > 0)
		descTitle.textContent = "Нажмите на карту, чтобы увидеть её значение";

	Each(readingContainers, elem => elem.hide());
	cardInfo.hide();
	layoutInfo.show();
}

function showDescription() {
	descMenu.fadeIn(menuFadeTime);
	showButton.fadeOut(menuFadeTime);
	descContainer.scrollTop = 0;
}

function hideDescription() {
	descMenu.fadeOut(menuFadeTime);
	showButton.fadeIn(menuFadeTime);
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
		slotImg.fadeIn(imgFadeTime);
		animCardInst.fadeOut(
			imgFadeTime,
			function() { this.remove() }
		);
	};

	slotImg.src = imgPath + deck + "/" + id + ".jpg";

	animCardInst.anim = animCardInst.animateAndDo(
		[ deckElem.offset(), slotElem.offset() ],
		{ duration: cardAnimTime, fill: "forwards" },
		() => {
			if (slotImg.complete)
				displayCard();
			else
				slotImg.onload = displayCard;

			slotElem.style.zIndex = 1;
		}
	);

	if (++nextSlotId == slotCount)
		deckElem.hide().src = imgPath + "restart.svg";
}

function deselect() {
	const selected = GetById("selected");
	if (selected)
		selected.id = "";
}

function setStartButtonState() {
	startButton.disabled = !(deck && (subject != null));
}

// ios specific fixes
if ("standalone" in navigator) {
	// prevent double-tap to zoom
	app.on("click", () => {});

	// fix scrolling bug
	Each(app.getElementsByClassName("scrollable"), elem => {
		elem.on("touchstart", function(e) {
			this.atTop = (this.scrollTop <= 0);
			this.atBottom = (this.scrollTop >= this.scrollHeight - this.clientHeight);
			this.lastY = e.touches[0].clientY;
		});
		elem.on("touchmove", function(e) {
			const up = (e.touches[0].clientY > this.lastY);

			this.lastY = e.touches[0].clientY;

			if ((up && this.atTop) || (!up && this.atBottom))
				e.preventDefault();
		});
	});
}

layoutSel.on("change", function() {
	const theme = this.selectedOptions[0].getAttribute("theme");

	subjectSel.disabled = (theme != null);

	if (theme != null) {
		subjectSel.value = theme;
		subjectSel.dispatchEvent(change);
	}
});
subjectSel.on("change", function() { subject = this.value });
deckSel.on("change", function() { deck = this.value });

if (decor.complete)
	decor.show();
else
	decor.on("load", function() { this.fadeIn(imgFadeTime) });

deckElem.on("load", function() { this.fadeIn(imgFadeTime) });

showButton.on("click", showDescription);
hideButton.on("click", hideDescription);

descImg.on("click", function() { cardModal.fadeIn(menuFadeTime) });
cardModal.on("click", function() { cardModal.fadeOut(menuFadeTime) });

fetch("res/text.json")
.then(response => response.json())
.then(data => {
	setStartButtonState();
	app.on("change", setStartButtonState);

	startButton.textContent = "НАЧАТЬ";
	startButton.on("click", function() {
		({ major, suitNames, rankNames } = data);

		layoutSel.on("change", function() {
			const layout = this.value;
			table.className = layout;
			titles = data.titles[layout];
			layoutDesc.textContent = data.descriptions[layout];

			if ((slotCount = titles.length) > 1) {
				posContainer.show();
				posList.textContent = data.postext[layout];
			} else
				posContainer.hide();
		});

		subjectSel.on("change", function() { readings = data.readings[subject] });

		deckSel.on("change", function() {
			meanings = data.meanings[deck] || data.meanings.normal;

			roman = this.selectedOptions[0].hasAttribute("classic") ?
				Object.assign({8: "XI", 11: "VIII"}, data.roman) :
				data.roman;

			extraMajorNames = data.extraMajors[deck] || [];
			altSuitNames = data.altSuits[deck];
			altRankNames = data.altRanks[deck];
		});

		startButton.remove();

		GetById("header").slideUp(openingTime);
		GetById("menu-column-2").slideUp(openingTime);

		table.fadeIn(openingTime, () => {
			showDescription();
			deckElem.on("click", drawCard);
		});

		app.className = "";
		app.off("change", setStartButtonState);
		app.on("change", resetTable);
		Each(selectElems, elem => elem.dispatchEvent(change));
		resetTable();

		GetById("menu-column-1").on("click", e => {
			const
			target = e.target,
			index = Index(cardImgs, target);

			deselect();

			if (index >= 0) {
				target.id = "selected";
				descImg.src = cardModalImg.src = target.src;
				updateDescription(index);
			} else
				resetDescription();
		});
	});
});
})();
