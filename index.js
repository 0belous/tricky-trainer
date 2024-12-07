let cursor = document.getElementById('cursor');
let angle = 0;
let angleVel = 0;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let movementX = 0;
let movementY = 0;
let mode = 3;
let total = 0;
let slideVelX = 0.0;
let slideVelY = 0.0;
let slidePosX = 0.0;
let slidePosY = 0.0;
let velAverage = 0.0;
let circleCount = 10;
let screenChanged = 0;
let velHistory = [];

function showScreenAlert(message, show = true){
    if (show) {
        if(getCookie("promptAccepted") !== "true" && !tempHide){
            document.getElementById("screenAlert").classList.remove('hidden');
            document.getElementById("message").textContent = message;
        }
    } else {
        document.getElementById("screenAlert").classList.add('hidden');
    }
}

function aspectRatioCheck(){
    if(window.innerWidth < (screen.width - 300) || window.innerHeight < (screen.height - 300)){
        showScreenAlert("Fullscreen your browser, or disable any toolbars/sidebars that make this website smaller.");
    } else if(screen.width < 1280 || screen.height < 720){
        showScreenAlert("Monitors less than 720p are not supported");
    } else if((screen.width / screen.height) < 1.5){
        showScreenAlert("Please use a widescreen monitor");
    } else {
        showScreenAlert("", false); 
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

document.getElementById("circleCountSlider").addEventListener('input', function(event) {
    updateCircleCountDisplay(event.target.value);
});

function updateCircleCountDisplay(value) {
    document.getElementById('circleCountDisplay').innerText = value;
    setCircleCount(value);
}

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
        circle.style.top = (Math.random() * (window.innerHeight - 60 - margin)) + 60 + 'px'; // offset for navbar and margin
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
        if (mouseX && mouseY>50) {
            vel = movementX+movementY;
            if(velHistory.length<10){
                velHistory.push(vel);
                velAverage = vel;
            } else{ 
                velHistory.shift();
                velHistory.push(vel);
                total = 0;
                for(let i=0; i<10; i++){
                    total += velHistory[i];
                }
                velAverage = total/10;
            }
            switch(mode){
                case 0:
                    mouseX = clampMousePos(mouseX);
                    mouseY = clampMousePos(mouseY, true, 50);
                    cursor.style.left = mouseX + 'px';
                    cursor.style.top = mouseY + 'px';
                    break;
                case 1:
                    mouseX = clampMousePos(mouseX);
                    mouseY = clampMousePos(mouseY, true, 50);
                    angle = Math.min(Math.max(velAverage*20 ,-90), 90);
                    cursor.style.left = mouseX + 'px';
                    cursor.style.top = mouseY + 'px';
                    break;
                case 2:
                    mouseX = clampMousePos(mouseX);
                    mouseY = clampMousePos(mouseY, true, 50);
                    angle = mouseX+mouseY;
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

        if(screenChanged !== window.innerHeight+window.innerWidth){
            document.querySelectorAll('.random-circle').forEach(circle => circle.remove());
            createRandomCircles();
        }
        screenChanged = window.innerWidth+window.innerHeight;
        checkCollisions();
        aspectRatioCheck();
        requestAnimationFrame(update);
    }
})();

function setMode(modeIn){
    mode = modeIn;
    mouseX = window.innerWidth/2;
    mouseY = window.innerHeight/2;
}