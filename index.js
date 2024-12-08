import { getUserId, saveTime, updateLoginButton, getTopScores } from './db.js';

let cursor = document.getElementById('cursor');
let angle = 0;
let angleVel = 0;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let movementX = 0;
let movementY = 0;
let mode = 0;
let total = 0;
let slideVelX = 0.0;
let slideVelY = 0.0;
let slidePosX = window.innerWidth/2;
let slidePosY = window.innerHeight/2;
let velAverage = 0.0;
let circleCount = 10;
let screenChanged = 0;
let vel = 0;
let velHistory = [];
let clickedCircles = 0;
let oldClicked = 0;
let timeStart = Date.now();
let timeEnd = Date.now();
let tutorialMode = getCookie("tutorial");
if (tutorialMode === null || tutorialMode === true) {
    setCookie("tutorial", "true", 30);
    tutorialMode = true;
}
let tutStage = 0;
updateLeaderboard();

let disableScoreSubmission = false;

function updateCircleCountDisplay(value) {
    document.getElementById('circleCountDisplay').innerText = value;
    setCircleCount(parseInt(value, 10));
}

window.updateCircleCountDisplay = updateCircleCountDisplay;

function reset() {
    angle = 0;
    clickedCircles = 0;
    updateCircleCountDisplay(circleCount);
    document.getElementById('circleCountSlider').value = circleCount;
    enableControls();
    updateLeaderboard();
}

window.reset = reset;

function showScreenAlert(message, show = true){
    if (show) {
        if(getCookie("promptAccepted") !== "true" && !tempHide){
            document.getElementById("screenAlert").classList.remove('hidden');
            document.getElementById("message").textContent = message;
            disableScoreSubmission = true;
        }
    } else {
        document.getElementById("screenAlert").classList.add('hidden');
        disableScoreSubmission = false;
    }
}

function aspectRatioCheck(){
    if(window.innerWidth < (screen.width - 300) || window.innerHeight < (screen.height - 300)){
        showScreenAlert("Fullscreen your browser, or disable any toolbars/sidebars that make this website smaller.");
        document.getElementById('error').classList.remove('hidden');
        disableScoreSubmission = true;
    } else if(screen.width < 1280 || screen.height < 720){
        showScreenAlert("Monitors less than 720p are not supported");
        document.getElementById('error').classList.remove('hidden');
        disableScoreSubmission = true;
    } else if((screen.width / screen.height) < 1.5){
        showScreenAlert("Please use a widescreen monitor");
        document.getElementById('error').classList.remove('hidden');
        disableScoreSubmission = true;
    } else {
        showScreenAlert("", false); 
        document.getElementById('error').classList.add('hidden');
        disableScoreSubmission = false;
    }
}

function clampMousePos(inX, inHeight=false, inOffset=0){
    switch(true){
        case inX>window.innerWidth+inOffset&&inHeight==false:
            return window.innerWidth+inOffset;
        case inX>window.innerHeight+inOffset&&inHeight==true:
            return window.innerHeight+inOffset;
        case inX<10+inOffset:
            return 10+inOffset;
        default:
            return inX;
    }
}

document.addEventListener('click', (event) => {
    document.querySelectorAll('.random-circle').forEach(circle => {
        if(circle.style.backgroundColor == "blue" && !circle.classList.contains('clicked')){ // more efficient than actual collision check
            circle.classList.add('clicked');
            clickedCircles++;
        }
    });
});

document.getElementById("circleCountSlider").addEventListener('input', function(event) {
    updateCircleCountDisplay(event.target.value);
});

function setCircleCount(count) {
    circleCount = count;
    document.querySelectorAll('.random-circle').forEach(circle => circle.remove());
    createRandomCircles();
}

function createRandomCircles() {
    const margin = 50;
    for (let i = 0; i < circleCount; i++) {
        let circle = document.createElement('div');
        circle.className = 'random-circle';
        circle.style.width = '10px';
        circle.style.height = '10px';
        circle.style.backgroundColor = 'red';
        circle.style.position = 'absolute';
        circle.style.borderRadius = '50%';
        circle.style.zIndex = '1';
        circle.style.left = Math.random() * (window.innerWidth - margin * 2) + margin + 'px';
        circle.style.top = (Math.random() * (window.innerHeight - 60 - margin)) + 60 + 'px'; 
        document.body.appendChild(circle);
    }
}

function isColliding(circle, collisionPointX, collisionPointY, widthFactor = 3, heightFactor = 3) {
    const circleRect = circle.getBoundingClientRect();
    return !(circleRect.right < collisionPointX - widthFactor ||
             circleRect.left > collisionPointX + widthFactor ||
             circleRect.bottom < collisionPointY - heightFactor ||
             circleRect.top > collisionPointY + heightFactor);
}

function checkCollisions() {
    const collisionPoint = document.getElementById('collision-point');
    const collisionRect = collisionPoint.getBoundingClientRect();
    const collisionPointX = collisionRect.left + collisionRect.width / 2;
    const collisionPointY = collisionRect.top + collisionRect.height / 2;
    const widthFactor = collisionRect.width / 2;
    const heightFactor = collisionRect.height / 2;
    const circles = document.querySelectorAll('.random-circle');
    circles.forEach(circle => {
        if (isColliding(circle, collisionPointX, collisionPointY, widthFactor, heightFactor)) {
            circle.style.backgroundColor = 'blue';
        } else {
            circle.style.backgroundColor = 'red';
        }
    });
}

function disableControls() {
    document.getElementById('circleCountSlider').disabled = true;
    document.querySelectorAll('.modeSel').forEach(button => button.disabled = true);
    document.getElementById('leaderboard').classList.add('hidden');
}

function enableControls() {
    document.getElementById('circleCountSlider').disabled = false;
    document.querySelectorAll('.modeSel').forEach(button => button.disabled = false);
    document.getElementById('leaderboard').classList.remove('hidden');
}

function displayLeaderboard(scores) {
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.innerHTML = '';
    scores.forEach((score, index) => {
        const scoreElement = document.createElement('div');
        scoreElement.textContent = `${index + 1}. ${score.username}: ${score.score}`;
        leaderboard.appendChild(scoreElement);
    });
}

function updateLeaderboard() {
    getTopScores(mode).then(displayLeaderboard).catch((error) => {
        console.error("Error fetching leaderboard:", error);
    });
}

window.updateLeaderboard = updateLeaderboard;

(function() {
    var lastTime = performance.now();

    createRandomCircles();

    document.onmousemove = handleMouseMove;
    requestAnimationFrame(update);

    function handleMouseMove(event) {
        movementX = event.movementX;
        movementY = event.movementY;

        if (Math.abs(movementX) > 80 || Math.abs(movementY) > 80) {
            return;
        }

        movementX = Math.max(-100, Math.min(movementX, 100));
        movementY = Math.max(-100, Math.min(movementY, 100));

        mouseX += movementX;
        mouseY += movementY;
    }

    function update() {
        var currentTime = performance.now();
        lastTime = currentTime;
        if (mouseX && mouseY > 50) {
            vel = movementX + movementY;
            if (velHistory.length < 10) {
                velHistory.push(vel);
                velAverage = vel;
            } else {
                velHistory.shift();
                velHistory.push(vel);
                total = 0;
                for (let i = 0; i < 10; i++) {
                    total += velHistory[i];
                }
                velAverage = total / 10;
            }
            switch (mode) {
                case 0:
                    mouseX = clampMousePos(mouseX);
                    mouseY = clampMousePos(mouseY, true, 50);
                    cursor.style.left = mouseX + 'px';
                    cursor.style.top = mouseY + 'px';
                    break;
                case 1:
                    mouseX = clampMousePos(mouseX);
                    mouseY = clampMousePos(mouseY, true, 50);
                    angle = Math.min(Math.max(velAverage * 20, -90), 90);
                    cursor.style.left = mouseX + 'px';
                    cursor.style.top = mouseY + 'px';
                    break;
                case 2:
                    mouseX = clampMousePos(mouseX);
                    mouseY = clampMousePos(mouseY, true, 50);
                    angle = mouseX + mouseY;
                    cursor.style.left = mouseX + 'px';
                    cursor.style.top = mouseY + 'px';
                    break;
                case 3:
                    if (Math.abs(movementX) > 80 || Math.abs(movementY) > 80) {
                        break;
                    }
                    slideVelX += movementX * 0.01;
                    slideVelY += movementY * 0.01;
                    slidePosX += slideVelX;
                    slidePosY += slideVelY;
                    slideVelX *= 0.99;
                    slideVelY *= 0.99;
                    if (Math.abs(slideVelX) < 0.01) slideVelX = 0;
                    if (Math.abs(slideVelY) < 0.01) slideVelY = 0;
                    slidePosX = clampMousePos(slidePosX);
                    slidePosY = clampMousePos(slidePosY, true, 50);
                    cursor.style.left = slidePosX + 'px';
                    cursor.style.top = slidePosY + 'px';
                    break;
            }
        }
        cursor.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

        if (screenChanged !== window.innerHeight + window.innerWidth) {
            document.querySelectorAll('.random-circle').forEach(circle => circle.remove());
            createRandomCircles();
        }

        if (clickedCircles == 1 && oldClicked == 0) {
            timeStart = Date.now();
            document.getElementById("timer").classList.remove('hidden');
            disableControls();
        } else if (clickedCircles >= circleCount) {
            timeEnd = Date.now();
            const timeTaken = (timeEnd - timeStart) / 1000;
            document.getElementById('timer').textContent = timeTaken;
            const userId = getUserId();
            if (userId && !disableScoreSubmission) {
                saveTime(userId, mode, timeTaken);
            }
            reset();
            enableControls();
        } else if (clickedCircles < circleCount) {
            document.getElementById('timer').textContent = (Date.now() - timeStart) / 1000;
        } if (clickedCircles == 0) {
            document.getElementById('timer').textContent = (timeEnd - timeStart) / 1000;
        }
        oldClicked = clickedCircles;

        screenChanged = window.innerWidth + window.innerHeight;
        if (tutorialMode == true) {
            hidePrompts();
            switch (tutStage) {
                case 0:
                    document.getElementById('topbar').classList.add('hidden');
                    updateCircleCountDisplay(3);
                    document.getElementById('circleCountSlider').value = 3;
                    tutStage = 1;
                    break;
                case 1:
                    document.getElementById('tut1').classList.remove('hidden');
                    mode = 0;
                    if (clickedCircles == 3) {
                        tutStage = 2;
                        clickedCircles = 0;
                    }
                    break;
                case 2:
                    document.getElementById('topbar').classList.remove('hidden')
                    document.querySelectorAll('.modeSel').forEach(mode => mode.classList.add('hidden'));
                    document.getElementById('tut2').classList.remove('hidden');
                    if (circleCount == 5) {
                        tutStage = 3;
                    }
                    break;
                case 3:
                    if (circleCount != 5) {
                        updateCircleCountDisplay(5)
                        document.getElementById('circleCountSlider').value = 5;
                    }
                    document.getElementById('tut3').classList.remove('hidden');
                    if (clickedCircles == 5) {
                        tutStage = 4;
                    }
                    break;
                case 4:
                    document.getElementById('tut4').classList.remove('hidden');
                    document.querySelectorAll('.modeSel').forEach(mode => mode.classList.remove('hidden'));
                    if (mode == 2) {
                        tutStage = 5;
                    }
                    break;
                case 5:
                    if (clickedCircles == 5) {
                        updateCircleCountDisplay(5)
                        document.getElementById('circleCountSlider').value = 5;
                        clickedCircles++;
                    }
                    document.getElementById('tut5').classList.remove('hidden');
                    if (clickedCircles == 11) {
                        document.getElementById('tut5').classList.add('hidden');
                        tutorialMode = false;
                        clickedCircles = 0;
                        setCookie("tutorial", "false", 30);
                    }
                    break;

            }
        } else {
            aspectRatioCheck();
        }
        checkCollisions();
        requestAnimationFrame(update);
    }
})();

function hidePrompts(){
    document.querySelectorAll('.tutPrompt').forEach(tutorial => tutorial.classList.add('hidden'));
}

function setMode(modeIn){
    angle = 0;
    mode = modeIn;
    mouseX = window.innerWidth/2;
    mouseY = window.innerHeight/2;
    updateLeaderboard();
}

window.setMode = setMode;