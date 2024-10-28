const emojiList = [
    '🐶', '🐱', '🦁', '🐸', '🐼', '🐵', '🐨', '🦄', '🦊', '🐰',
    '🐯', '🐷', '🐔',
]; // 13 unique emojis for 26 cards (each has 2)
const bombEmoji = '💣'; // Bomb emoji for time penalty
const cloverEmoji = '🍀'; // Clover emoji for time bonus
const fallingEmojis = ['🌟', '✨', '💫', cloverEmoji, '🍎', '🍇', '🍊','🍺'];
let cards, firstCard, secondCard, lockBoard, attempts, matches, timeRemaining, timerInterval, isGameStarted, emojiInterval;
let isFindMatchUsed = false;
let isRemoveBombUsed = false;
let isIncreaseCloverUsed = false;

function initGame() {
    cards = [...emojiList, ...emojiList]; // Create pairs of 13 unique emojis (26 cards)
    
    // Add 4 bombs to the cards array
    for (let i = 0; i < 4; i++) {
        cards.push(bombEmoji);
    }

    cards.sort(() => 0.5 - Math.random());
    gameBoard.innerHTML = '';
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    attempts = 0;
    matches = 0;
    timeRemaining = 60;
    timeDisplay.textContent = timeRemaining;
    attemptsDisplay.textContent = '0';
    clearInterval(timerInterval);
    clearInterval(emojiInterval);
    isGameStarted = false;
    gameOverDisplay.style.display = 'none';
    gameWinDisplay.style.display = 'none';

    cards.forEach(emoji => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front"></div>
                <div class="card-back">${emoji}</div>
            </div>
        `;
        card.dataset.value = emoji;
        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
    });
}

function createFallingEmojis() {
    emojiInterval = setInterval(() => {
        const emojiContainer = document.createElement('div');
        emojiContainer.classList.add('emoji');
        const isClover = Math.random() < 0.1; // 四葉草掉落率10%
        const emojiType = fallingEmojis[Math.floor(Math.random() * fallingEmojis.length)];
        emojiContainer.textContent = emojiType;

        const leftPosition = Math.random() < 0.5
            ? Math.random() * 20 + '%' // 0% to 20%
            : Math.random() * 20 + 80 + '%'; // 80% to 100%
        
        emojiContainer.style.left = leftPosition;
        emojiContainer.style.animationDuration = Math.random() * 5 + 7 + 's'; 

        emojiContainer.addEventListener('click', () => {
            if (emojiType === cloverEmoji) {
                timeRemaining += 5; // 點到旁邊的四葉草+5秒
                timeDisplay.textContent = timeRemaining;
            }
            emojiContainer.remove();

        });

        document.body.appendChild(emojiContainer);
    }, 2000); // Create a new emoji every second
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeRemaining--;
        timeDisplay.textContent = timeRemaining;
        if (timeRemaining <= 0) {
            stopTimer();
            gameOver();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function flipCard() {
    if (!isGameStarted) {
        isGameStarted = true;
        startTimer();
        if (!emojiInterval) { // 如果 emoji 掉落没有启动，启动它
            createFallingEmojis(); // 开始掉落 emoji
        }
    }

    if (lockBoard || this === firstCard) return;

    this.classList.add('flipped');

    if (this.dataset.value === bombEmoji) {
        timeRemaining -= 15; // 翻到炸弹-15秒
        handleBomb(this);
        return;
    }

    if (!firstCard) {
        firstCard = this;
        return;
    }

    secondCard = this;
    attempts++;
    attemptsDisplay.textContent = attempts;
    checkForMatch();
}



function handleBomb(card) {
    lockBoard = true;
    setTimeout(() => {
        timeRemaining = Math.max(timeRemaining - 5, 0);
        timeDisplay.textContent = timeRemaining;
        card.classList.add('hidden');
        lockBoard = false;
    }, 1000);
}

function checkForMatch() {
    if (firstCard.dataset.value === secondCard.dataset.value) {
        timeRemaining += 5; //翻對一副牌+5秒
        matches++;
        disableCards();
        if (matches === emojiList.length) {
            stopTimer();
            showWinMessage();
        }
    } else {
        unflipCards();
    }
}

function disableCards() {
    firstCard.classList.add('hidden');
    secondCard.classList.add('hidden');
    resetBoard();
}

function unflipCards() {
    lockBoard = true;
    setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        resetBoard();
    }, 1000);
}

function findAndFlipMatchingCard() {
    if (isFindMatchUsed) return; // 如果已经使用过，什么都不做
    if (!firstCard) return; // 如果没有翻开的第一张牌，什么也不做

    const allCards = document.querySelectorAll('.card');
    for (let card of allCards) {
        if (card !== firstCard && card.dataset.value === firstCard.dataset.value && !card.classList.contains('flipped')) {
            card.classList.add('flipped');
            secondCard = card;
            checkForMatch(); // 检查是否配对成功
            break;
        }
    }
    
    isFindMatchUsed = true; // 标记功能已经使用
    const findMatchButton = document.getElementById("findMatchBtn");
    findMatchButton.disabled = true; // 禁用按钮
    findMatchButton.classList.add('used-button'); // 添加变暗样式
}


function removeBombCard() {
    if (isRemoveBombUsed) return; // 如果已经使用过，什么都不做
    
    const allCards = document.querySelectorAll('.card');
    for (let card of allCards) {
        if (card.dataset.value === bombEmoji && !card.classList.contains('hidden')) {
            card.classList.add('hidden');
            break; // 移除一张炸弹卡后停止
        }
    }

    isRemoveBombUsed = true; // 标记功能已经使用
    const removeBombButton = document.getElementById("removeBombBtn");
    removeBombButton.disabled = true; // 禁用按钮
    removeBombButton.classList.add('used-button'); // 添加变暗样式
}

let increaseCloverTimeout = null; // 用来存储 setTimeout 的 ID

function increaseCloverDropRate() {
    if (isIncreaseCloverUsed) return; // 如果已经使用过，什么都不做

    clearInterval(emojiInterval); // 先停止当前掉落的逻辑
    emojiInterval = setInterval(() => {
        const emojiContainer = document.createElement('div');
        emojiContainer.classList.add('emoji');
        const isClover = Math.random() < 0.3; // 将四叶草的概率提高到30%
        const emojiType = isClover ? cloverEmoji : fallingEmojis[Math.floor(Math.random() * fallingEmojis.length)];
        emojiContainer.textContent = emojiType;

        const leftPosition = Math.random() < 0.5
            ? Math.random() * 20 + '%' 
            : Math.random() * 20 + 80 + '%'; 

        emojiContainer.style.left = leftPosition;
        emojiContainer.style.animationDuration = Math.random() * 5 + 7 + 's'; 

        emojiContainer.addEventListener('click', () => {
            if (emojiType === cloverEmoji) {
                timeRemaining += 5; // 点击四叶草加5秒
                timeDisplay.textContent = timeRemaining;
            }
            emojiContainer.remove();
        });

        document.body.appendChild(emojiContainer);
    }, 1000); // 每秒生成一个 emoji

    // 10秒后恢复正常掉落率
    increaseCloverTimeout = setTimeout(() => {
        createFallingEmojis(); // 恢复原来的掉落逻辑
    }, 10000);

    isIncreaseCloverUsed = true; // 标记功能已经使用
    const increaseCloverButton = document.getElementById("increaseCloverBtn");
    increaseCloverButton.disabled = true; // 禁用按钮
    increaseCloverButton.classList.add('used-button'); // 添加变暗样式
}

function resetBoard() {
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
}

function resetGame() {
    stopTimer();
    document.querySelectorAll('.emoji').forEach(emoji => emoji.remove()); // 移除所有掉落的 emoji
    clearInterval(emojiInterval); // 停止 emoji 掉落
    clearTimeout(increaseCloverTimeout); // 停止 increaseCloverDropRate 的 setTimeout
    emojiInterval = null; // 确保掉落被彻底停止
    initGame();

    // 重置功能按钮的状态
    isFindMatchUsed = false;
    isRemoveBombUsed = false;
    isIncreaseCloverUsed = false;

    // 重新启用功能按钮
    document.getElementById("findMatchBtn").disabled = false;
    document.getElementById("removeBombBtn").disabled = false;
    document.getElementById("increaseCloverBtn").disabled = false;

    // 移除按钮的暗色样式
    document.getElementById("findMatchBtn").classList.remove('used-button');
    document.getElementById("removeBombBtn").classList.remove('used-button');
    document.getElementById("increaseCloverBtn").classList.remove('used-button');

    // 停止 emoji 掉落直到游戏重新开始
    isGameStarted = false; // 确保游戏没有开始
}



function gameOver() {
    gameOverDisplay.style.display = 'block';
    document.querySelectorAll('.card').forEach(card => {
        card.removeEventListener('click', flipCard);
    });
}

function showWinMessage() {
    gameWinDisplay.style.display = 'block';
}

const gameBoard = document.getElementById('gameBoard');
const timeDisplay = document.getElementById('time');
const attemptsDisplay = document.getElementById('attempts');
const gameOverDisplay = document.getElementById('gameOver');
const gameWinDisplay = document.getElementById('gameWin');

initGame();