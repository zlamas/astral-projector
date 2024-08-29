((app) => {
'use strict';
let drawnCards = [];
let descriptions = [];
let data;
let deckSize;
let titles;
let meanings;
let readings;
let extraMajors;
let altRanks;
let altSuits;
let deckPath;
let isClassic;
let spreadName;

let openingDuration = 3000;
let cardDrawDuration = 1000;
let fadeDuration = 500;
let animationOptions = {
    fill: 'forwards',
    easing: 'ease-in-out',
};

let decor = document.getElementById('decor');
let spreadSelect = document.getElementById('spread-select');
let themeSelect = document.getElementById('theme-select');
let deckSelect = document.getElementById('deck-select');
let startButton = document.getElementById('btn-start');
let table = document.getElementById('table');
let deck = document.getElementById('btn-deck');
let resetButton = document.getElementById('btn-table-reset');
let deckLoadingIcon = document.getElementById('deck-loading');
let detailsMenu = document.getElementById('details');
let detailsTitle = document.getElementById('details-title');
let detailsContent = document.getElementById('details-content');
let spreadInfo = document.getElementById('spread-info');
let spreadDetails = document.getElementById('spread-details');
let positionListTitle = document.getElementById('position-list-title');
let positionList = document.getElementById('position-list');
let cardInfo = document.getElementById('card-info');
let detailsImage = document.getElementById('details-card-image');
let themeReadingTitle = document.getElementById('theme-reading-title');
let cardModal = document.getElementById('card-modal');
let cardModalImage = document.getElementById('card-modal-image');
let cardInfoElements = detailsMenu.querySelectorAll(
    '#card-name, #card-alt-name, #general-reading, #theme-reading'
);

let cards = Array.prototype.slice.call(table.getElementsByClassName('card'));
let selectedCards = table.getElementsByClassName('card-selected');
let animatedCards = app.getElementsByClassName('card-animated');
let animatedCardBase = table.removeChild(animatedCards[0]);
let fallbackTitles = cards.map((_, i) => 'Карта ' + (i + 1));

let hide = (el) => el.classList.add('hidden');
let show = (el) => el.classList.remove('hidden');
let toggle = (el, condition) => el.classList.toggle('hidden', !condition);

function getPosition(el) {
    let rect = el.getBoundingClientRect();
    return { left: rect.x + 'px', top: rect.y + 'px' };
}

function fadeOut(el, duration, remove) {
    el.animate(
        { opacity: [getComputedStyle(el).opacity, 0] },
        Object.assign({ duration }, animationOptions)
    ).onfinish = (event) => {
        if (remove) {
            el.remove();
        } else {
            event.target.cancel();
            hide(el);
        }
    };
}

function slideUp(query, duration, callback) {
    let els = Array.prototype.slice.call(app.querySelectorAll(query));
    Promise.all(
        els.map((el) =>
            new Promise((resolve) => {
                let compStyle = getComputedStyle(el);
                let keyframes = {
                    height: [el.offsetHeight + 'px', 0],
                    paddingTop: [compStyle.paddingTop, 0],
                    paddingBottom: [compStyle.paddingBottom, 0]
                };
                el.animate(
                    keyframes,
                    Object.assign({ duration }, animationOptions)
                ).onfinish = () => {
                    el.remove();
                    resolve();
                };
            })
        )
    ).then(callback);
    els.forEach((el) => el.style.overflow = 'hidden');
}

function moveTo(el, source, target, duration, callback) {
    let animation = el.animate(
        [getPosition(source), getPosition(target)],
        Object.assign({ duration }, animationOptions)
    );

    animation.onfinish = callback;
    return animation;
}

function runOnLoad(el, callback) {
    el.complete ? callback() : el.addEventListener('load', callback, { once: true });
}

function startApp(event) {
    event.preventDefault();

    document.getElementById('btn-show-details').addEventListener('click', showDetails);
    document.getElementById('btn-hide-details').addEventListener('click', hideDetails);

    table.addEventListener('click', handleTableClick);
    resetButton.addEventListener('click', resetTable);
    app.addEventListener('change', resetTable);

    detailsImage.addEventListener('click', () => show(cardModal));
    cardModal.addEventListener('click', () => hide(cardModal));

    deck.addEventListener('load', () => {
        show(deck);
        hide(deckLoadingIcon);
    });

    spreadSelect.addEventListener('change', handleSpreadChange);
    themeSelect.addEventListener('change', handleThemeChange);
    deckSelect.addEventListener('change', handleDeckChange);
    handleSpreadChange();
    handleThemeChange();
    handleDeckChange();

    slideUp('#header, #intro', openingDuration, () => {
        showDetails();
        app.querySelectorAll('.button-bar .button').forEach(show);
        deck.addEventListener('click', drawCard);
    });

    show(table);
    hide(startButton);
}

function handleSpreadChangeInitial() {
    let option = spreadSelect.selectedOptions[0];
    let theme = option.dataset.theme;

    spreadName = option.text.split(' (')[0];
    themeSelect.disabled = theme;
    if (theme) themeSelect.value = theme;
}

function handleSpreadChange(event) {
    let spreadId = spreadSelect.value;

    if (themeSelect.disabled && event) handleThemeChange();

    app.className = 'sp-' + spreadId;
    titles = data.titles[spreadId] || fallbackTitles;
    spreadDetails.textContent = data.details[spreadId];
    positionList.textContent = data.positions[spreadId];
    toggle(positionListTitle, positionList.textContent);
}

function handleThemeChange() {
    readings = data.readings[themeSelect.value];
    toggle(themeReadingTitle, readings);
}

function handleDeckChange() {
    let deckId = deckSelect.value;

    hide(deck);
    show(deckLoadingIcon);

    meanings = data.meanings[deckId] || data.meanings.normal;
    altSuits = data.altSuits[deckId];
    altRanks = data.altRanks[deckId];
    extraMajors = data.extraMajors[deckId];

    deckSize = 78;
    if (extraMajors) deckSize += extraMajors.length;

    isClassic = deckSelect.selectedOptions[0].hasAttribute('data-classic');
    deckPath = 'img/' + deckId + '/';
    deck.src = animatedCardBase.src = deckPath + 'back.jpg';
}

function handleTableClick(event) {
    let slot = cards.indexOf(event.target);

    if (slot >= 0) {
        showDetails(slot);
        event.target.classList.add('card-selected');
    }
}

function resetTable(event) {
    drawnCards = [];
    descriptions = [];

    if (event.target != deckSelect) show(deck);
    hide(resetButton);
    showSpreadInfo();
    deselect();

    for (let el of animatedCards) el.dispatchEvent(new Event('table-reset'));
    cards.forEach((el) => fadeOut(el, fadeDuration));
}

function createDescription(id) {
    let adjustedId = id;
    let name;
    let altName;

    if (id > 21) {
        let suit = Math.floor((id - 22) / 14);
        let rank = id - 22 - 14 * suit;

        if (suit < 4) {
            let rankName = data.ranks[rank];
            let suitName = data.suits[suit];

            altName = rankName + ' ' + suitName;

            if (altRanks && rank > 9) rankName = altRanks[rank - 10];
            if (altSuits) suitName = altSuits[suit];

            name = rankName + ' ' + suitName;
            if (name == altName) altName = '';
        } else {
            name = extraMajors[rank];
        }
    } else {
        if ((id == 8 || id == 11) && isClassic) adjustedId = 19 - id;
        name = data.roman[adjustedId] + ' ' + data.major[id];
    }

    descriptions.push([name, altName, meanings[id], readings ? readings[id] : '']);

    return adjustedId;
}

function drawCard() {
    let id;

    do id = Math.floor(Math.random() * deckSize);
    while (drawnCards.includes(id));

    let slot = drawnCards.push(id) - 1;
    let slotImg = cards[slot];
    let animatedCardInstance = app.appendChild(animatedCardBase.cloneNode());

    let animation = moveTo(
        animatedCardInstance,
        deck,
        slotImg.parentNode,
        cardDrawDuration,
        () => runOnLoad(slotImg, showCard)
    );

    let showCard = () => {
        slotImg.removeEventListener('load', showCard);
        show(slotImg);
        animation.pause();
        fadeOut(animatedCardInstance, fadeDuration, true);
    };

    id = createDescription(id);
    slotImg.src = deckPath + id + '.jpg';
    animatedCardInstance.addEventListener('table-reset', showCard);

    if (slot == titles.length - 1) {
        show(resetButton);
        hide(deck);
    }
}

function showCardInfo(slot) {
    detailsTitle.textContent = titles[slot];
    descriptions[slot].forEach((text, i) => cardInfoElements[i].textContent = text);
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
    for (let el of selectedCards) el.classList.remove('card-selected');
    detailsContent.scrollTop = 0;
}

fetch('res/data.json?3')
.then((response) => response.json())
.then((json) => {
    data = json;
    startButton.disabled = false;
    startButton.textContent = 'НАЧАТЬ';
});

runOnLoad(decor, () => show(decor));
app.addEventListener('submit', startApp, { once: true });
spreadSelect.addEventListener('change', handleSpreadChangeInitial);
app.onclick = () => {}; // prevent double-tap zoom on ios
})(document.body);
