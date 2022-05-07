(() => {
"use strict";
let theme, layout, subject, deck, nextSlotId, deckArray, descriptions, titles, slotCount, readings, extraMajors, altRankNames, altSuitNames, deckSize, meanings;

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
			Object.assign({}, animationDefaults, options)
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

roman = ["0","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI"],
justice8 = ["78doors","botticelli","durer","casanova","wild","klimt"],
major = ["Дурак","Маг","Верховная Жрица","Императрица","Император","Иерофант","Влюблённые","Колесница","Сила","Отшельник","Колесо Фортуны","Правосудие","Повешенный","Смерть","Умеренность","Дьявол","Башня","Звезда","Луна","Солнце","Суд","Мир"],
suitNames = ["Пентаклей","Кубков","Жезлов","Мечей"],
rankNames = ["Туз","Двойка","Тройка","Четвёрка","Пятёрка","Шестёрка","Семёрка","Восьмёрка","Девятка","Десятка","Паж","Рыцарь","Королева","Король"],

themes = {
	disorder: "lifegoal",
	station: "relship",
	swing: "relship",
	choice: "",
	marry: "relship",
	one: ""
},
altSuits = {
	"alice": ["Устриц","Шляп","Перцемолок","Фламинго"]
},
altRanks = {
	"wild": ["Дочь","Сын","Мать","Отец"]
},
// altMajors = { },
extraMajorNames = {
	"quantum": ["Феникс","Вселенная"]
},
animationDefaults = {
	easing: "ease-in-out"
},
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

descMenu = GetById("desc-menu"),
descTitle = GetById("desc-title"),
descContainer = GetById("desc-container"),

layoutInfo = GetById("layout-info"),
layoutDesc = GetById("layout-desc"),

posContainer = GetById("pos-container"),
posList = GetById("pos-list"),

textElems = GetByIds("pos-name", "card-name", "card-classic-name", "general-reading", "layout-reading"),
cardInfo = GetById("card-info"),
readingContainers = descContainer.getElementsByClassName("card-reading"),

cardModal = GetById("card-modal"),
cardModalImg = GetById("img-zoomed"),
descImg = GetById("card-img"),
decor = GetById("decor");

function randomInt(min, max) {
	return Math.floor( Math.random() * (max - min + 1) ) + min;
}

function updateDescription(id) {
	const data = descriptions[id];

	descTitle.textContent = slotCount > 1 ? "Позиция " + (id + 1) : "";

	Each(data, (text, i) => textElems[i].textContent = text);

	if (data[3] || data[4])
		Each(readingContainers, elem => elem.show());

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

function resetTable() {
	nextSlotId = 0;
	deckArray = [];
	deckSize = 77 + extraMajors.length;
	descriptions = [];

	deckElem.hide().src = animCard.src = imgPath + deck + "/back.jpg";

	Each(animCardInsts, elem => {
		if (elem.anim)
			elem.anim.pause();
		elem.fadeOut(imgFadeTime, () => elem.remove())
	});

	Each(cardImgs, elem => {
		elem.fadeOut(imgFadeTime);
		elem.onload = null;
	});

	Each(slots, elem => elem.style.zIndex = "");

	descTitle.textContent = "Жмите на колоду, чтобы заполнить расклад";
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
			name = extraMajors[rank];
	// } else if (altMajors[deck]) {
	// 	altName = major[id];
	// 	name = roman[id] + " " + altMajors[deck][id];
	} else
		name = roman[id] + " " + major[id];

	descriptions[nextSlotId] = [
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
	layout = this.value;
	theme = themes[layout];
	table.className = layout;

	if (theme == null) {
		subjectSel.disabled = false;
		if (!subject)
			subjectSel.selectedIndex = 0;
	} else {
		subjectSel.disabled = true;
		subjectSel.value = theme;
		subjectSel.dispatchEvent(new Event("change"));
	}
});

subjectSel.on("change", function() { subject = this.value }),

deckSel.on("change", function() {
	deck = this.value;

	Object.assign(roman,
		Index(justice8, deck) >= 0 ?
		{8: "XI", 11: "VIII"} :
		{8: "VIII", 11: "XI"}
	);

	extraMajors = extraMajorNames[deck] || [];
	altRankNames = altRanks[deck];
	altSuitNames = altSuits[deck];
});

if (decor.complete)
	decor.show();
else
	decor.on("load", function() { this.fadeIn(imgFadeTime) });

deckElem.on("load", function() { this.fadeIn(imgFadeTime) });

showButton.on("click", showDescription);
hideButton.on("click", hideDescription);

descImg.on("click", function() {
	cardModal.fadeIn(menuFadeTime);
});

cardModal.on("click", function() {
	cardModal.fadeOut(menuFadeTime);
});

fetch("res/text.json")
	.then(response => response.json())
	.then(data => {
	function setStartButtonState() {
		startButton.disabled = !(deck && (subject || theme === ""));
	}

	setStartButtonState();

	app.on("change", setStartButtonState);

	layoutSel.on("change", () => {
		titles = data.titles[layout];
		layoutDesc.textContent = data.descriptions[layout];

		if ((slotCount = titles.length) > 1) {
			posContainer.show();
			posList.textContent = data.postext[layout];
		} else
			posContainer.hide();
	});

	subjectSel.on("change", () => {
		readings = data.readings[subject];
	});

	deckSel.on("change", () => {
		meanings = data.meanings[deck] || data.meanings.normal;
	});

	startButton.textContent = "НАЧАТЬ";

	startButton.on("click", function() {
		this.remove();

		GetById("header").slideUp(openingTime);
		GetById("menu-column-2").slideUp(openingTime);

		table.fadeIn(openingTime, () => {
			showDescription();
			deckElem.on("click", drawCard);
		});

		Each(selectElems, elem => elem.dispatchEvent(new Event("change")));

		descMenu.hide().on("click", e => e.stopPropagation());
		app.className = "";
		resetTable();

		app.off("change", setStartButtonState);

		app.on("change", resetTable);

		app.on("click", e => {
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
