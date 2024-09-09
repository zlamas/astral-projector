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

const openingDuration = 3000;
const cardDrawDuration = 1000;
const fadeDuration = 500;
const animationOptions = {
    fill: 'forwards',
    easing: 'ease-in-out',
};

let hide = (el) => el.classList.add('hidden');
let show = (el) => el.classList.remove('hidden');
let toArray = Function.call.bind(Array.prototype.slice);

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
let positionList = document.getElementById('position-list');
let cardInfo = document.getElementById('card-info');
let detailsImage = document.getElementById('details-card-image');
let cardModal = document.getElementById('card-modal');
let cardModalImage = document.getElementById('card-modal-image');
let cardInfoElements = detailsMenu.querySelectorAll(
    '#card-name, #card-alt-name, #general-reading, #theme-reading'
);

let cards = toArray(table.getElementsByClassName('card'));
let fallbackTitles = cards.map((_, i) => 'Карта ' + (i + 1));

let selectedCards = table.getElementsByClassName('selected');
let animatedCards = app.getElementsByClassName('card-animated');
let animatedCardBase = app.removeChild(animatedCards[0]);

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
    let els = toArray(app.querySelectorAll(query));

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

function moveFromTo(el, source, target, duration) {
    return el.animate(
        [getPosition(source), getPosition(target)],
        Object.assign({ duration }, animationOptions)
    );
}

function runOnLoad(el, callback) {
    if (el.complete) {
        callback();
    } else {
        el.addEventListener('load', callback, { once: true });
    }
}

function startApp(event) {
    event.preventDefault();

    app.addEventListener('change', resetTable);
    spreadSelect.addEventListener('change', handleSpreadChange);
    themeSelect.addEventListener('change', handleThemeChange);
    deckSelect.addEventListener('change', handleDeckChange);
    handleSpreadChange();
    handleThemeChange();
    handleDeckChange();

    slideUp('#header, #intro', openingDuration, () => {
        showSpreadInfo(true);
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
    if (theme) {
        themeSelect.value = theme;
    }
}

function handleSpreadChange(event) {
    let spreadId = spreadSelect.value;

    if (themeSelect.disabled && event) {
        handleThemeChange();
    }

    table.id = 'sp-' + spreadId;
    titles = data.titles[spreadId] || fallbackTitles;
    spreadDetails.textContent = data.details[spreadId];
    positionList.textContent = data.positions[spreadId];
}

function handleThemeChange() {
    readings = data.readings[themeSelect.value];
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
    if (extraMajors) {
        deckSize += extraMajors.length;
    }

    isClassic = 'classic' in deckSelect.selectedOptions[0].dataset;
    deckPath = 'img/' + deckId + '/';
    deck.src = animatedCardBase.src = deckPath + 'back.jpg';
}

function handleTableClick(event) {
    let slot = cards.indexOf(event.target);

    if (slot >= 0) {
        showCardInfo(slot);
        event.target.classList.add('selected');
    }
}

function resetTable(event) {
    if (event.target != deckSelect) {
        show(deck);
    }

    hide(resetButton);
    showSpreadInfo(false);
    drawnCards.length = descriptions.length = 0;

    toArray(animatedCards).forEach((el) => {
        el.dispatchEvent(new Event('table-reset'));
    });

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

            if (altRanks && rank > 9) {
                rankName = altRanks[rank - 10];
            }
            if (altSuits) {
                suitName = altSuits[suit];
            }
            name = rankName + ' ' + suitName;

            if (name == altName) {
                altName = '';
            }
        } else {
            name = extraMajors[rank];
        }
    } else {
        if ((id == 8 || id == 11) && isClassic) {
            adjustedId = 19 - id;
        }
        name = data.roman[adjustedId] + ' ' + data.major[id];
    }

    descriptions.push([name, altName, meanings[id], readings && readings[id]]);

    return adjustedId;
}

function drawCard() {
    let id;

    do {
        id = Math.floor(Math.random() * deckSize);
    } while (drawnCards.includes(id));

    let slot = drawnCards.push(id) - 1;
    let card = cards[slot];
    let adjustedId = createDescription(id);

    card.src = deckPath + adjustedId + '.jpg';

    let animatedCardInstance = app.appendChild(animatedCardBase.cloneNode());
    let animation = moveFromTo(
        animatedCardInstance,
        deck,
        card.parentNode,
        cardDrawDuration
    );
    let showCard = () => {
        card.removeEventListener('load', showCard);
        show(card);
        animation.pause();
        fadeOut(animatedCardInstance, fadeDuration, true);
    };

    animation.onfinish = () => runOnLoad(card, showCard);
    animatedCardInstance.addEventListener('table-reset', showCard);

    if (slot == titles.length - 1) {
        show(resetButton);
        hide(deck);
    }
}

function showCardInfo(slot) {
    detailsTitle.textContent = titles[slot];
    detailsImage.src = cardModalImage.src = cards[slot].src;

    descriptions[slot].forEach((text, i) => {
        cardInfoElements[i].textContent = text;
    });

    hide(spreadInfo);
    show(cardInfo);
    deselect();
    openDetails();
}

function showSpreadInfo(shouldOpenDetails) {
    detailsTitle.textContent = spreadName;

    show(spreadInfo);
    hide(cardInfo);
    deselect();

    if (shouldOpenDetails) {
        openDetails();
    }
}

function openDetails() {
    show(detailsMenu);
}

function closeDetails() {
    deselect();
    hide(detailsMenu);
}

function deselect() {
    while (selectedCards[0]) {
        selectedCards[0].classList.remove('selected');
    }
    detailsContent.scrollTop = 0;
}

fetch('res/data.json?3')
.then((response) => response.json())
.then((json) => {
    data = json;
    startButton.disabled = false;
    startButton.textContent = 'НАЧАТЬ';
});

app.onclick = () => {}; // prevent double-tap zoom on ios
runOnLoad(decor, () => show(decor));

spreadSelect.addEventListener('change', handleSpreadChangeInitial);
app.addEventListener('submit', startApp, { once: true });

table.addEventListener('click', handleTableClick);
resetButton.addEventListener('click', resetTable);

document.getElementById('btn-show-details').addEventListener('click', showSpreadInfo);
document.getElementById('btn-hide-details').addEventListener('click', closeDetails);

detailsImage.addEventListener('click', () => show(cardModal));
cardModal.addEventListener('click', () => hide(cardModal));

deck.addEventListener('load', () => {
    show(deck);
    hide(deckLoadingIcon);
});
})(document.body);
