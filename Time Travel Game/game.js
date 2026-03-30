// Initial Setup: grab canvas and UI elements
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreboard = document.getElementById("scoreboard");
const info = document.getElementById("info");
const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

// Load game images
const rocketImg = new Image();
rocketImg.src = "assets/rocket.png";

const asteroidImg = new Image();
asteroidImg.src = "assets/asteroid.png";

const fuelImg = new Image();
fuelImg.src = "assets/fuel.png"

// Make canvas always fill the screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Track key presses for movement and quiz input
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// Core game variables
let level = 1;
let score = 0;
let timeLeft = 30;
let roverTime = 15;

// Timers for different game mechanics
let timerInterval;
let roverInterval;
let factInterval;

// Game objects
let player;
let fallingFuels = [];
let asteroids = [];

// Quiz-related state
let quizActive = false;
let currentQuestion = 0;
let quizScore = 0;
let selectedQuiz = [];

// Game report storage
let gameReport = {
    level2SurvivalTime: 0,
    quizCorrect: 0,
    quizTotal: 5
};

// Player class controls movement and rendering
class Player {
    constructor() {
        this.size = 100;
        this.x = canvas.width/2 - this.size/2;
        this.y = canvas.height - 110;
        this.speed = 7;
    }

    // Move left/right while staying on screen
    move() {
        if(keys["ArrowLeft"] || keys["a"]) this.x -= this.speed;
        if(keys["ArrowRight"] || keys["d"]) this.x += this.speed;
        this.x = Math.max(0, Math.min(this.x, canvas.width - this.size));
    }

    // Draw player as a rocket
    draw() {
        ctx.drawImage(rocketImg, this.x, this.y, this.size, this.size);
    }
}

// Fuel class: collectible objects that increase score
class Fuel {
    constructor() {
        this.size = 120;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size - Math.random() * canvas.height;
        this.speed = 2 + Math.random() * 3;
    }

    // Move downward and respawn at top when off screen
    update() {
        this.y += this.speed;
        if(this.y > canvas.height) {
            this.y = -this.size;
            this.x = Math.random() * (canvas.width - this.size);
        }
    }

    // Draw the fuel image
    draw() {
        ctx.drawImage(fuelImg, this.x, this.y, this.size, this.size);
}
}

// Asteroid class: obstacles that the player must avoid
class Asteroid {
    constructor() {
        this.width = 60 + Math.random()*30;
        this.height = 60 + Math.random()*30;
        this.x = Math.random()*(canvas.width-this.width);
        this.y = -this.height;

        // Random speed makes movement less predictable
        this.speed = 2 + Math.random()*4;

        // Random color for visual variety
        this.color = ["#ff4444", "#ff99ff", "#33ccff", "#ffcc00", "#66ff66"]
            [Math.floor(Math.random()*5)];
    }

    // Move downward and recycle when off screen
    update() {
        this.y += this.speed;
        if(this.y > canvas.height) {
            this.y = -this.height;
            this.x = Math.random()*(canvas.width-this.width);
        }
    }

    // Draw as a colored rectangle with border
    draw() {
        ctx.drawImage(asteroidImg, this.x, this.y, this.width, this.height);
}
}

// Historical facts displayed during gameplay
let facts1960 = [
    "The first televised presidential debate took place in 1960.",
    "John F. Kennedy became president in 1961.",
    "The Berlin Wall was built in 1961.",
    "Yuri Gagarin became the first human in space in 1961.",
    "The Cuban Missile Crisis happened in 1962.",
    "The Beatles became globally popular in the 1960s.",
    "The Civil Rights Act was passed in 1964.",
    "Martin Luther King Jr. gave his 'I Have a Dream' speech in 1963.",
    "The first Super Bowl was played in 1967.",
    "Apollo 11 landed on the Moon in 1969.",
    "The Vietnam War escalated during the 1960s.",
    "Color television became more common in the 1960s.",
    "The first computer mouse was invented in 1964.",
    "The Space Race was a major part of the Cold War.",
    "NASA's Apollo program aimed to land humans on the Moon.",
    "The first human walked on the Moon in 1969.",
    "The Peace Corps was founded in 1961.",
    "The mini skirt became a popular fashion trend.",
    "Woodstock music festival took place in 1969.",
    "The first ATM was introduced in 1967."
];

let currentFact = "";

// Rotates facts every few seconds
function startFactTimer() {
    showRandomFact();
    factInterval = setInterval(showRandomFact, 8000);
}

function showRandomFact() {
    currentFact = facts1960[Math.floor(Math.random()*facts1960.length)];
}

// Quiz questions for final level
let quizQuestions = [
    { q: "Apollo 11 year?", choices:["1965","1969","1972"], answer:1 },
    { q: "First moon walker?", choices:["Aldrin","Armstrong","Gagarin"], answer:1 },
    { q: "NASA founded?", choices:["1958","1965","1970"], answer:0 },
    { q: "Sea landed?", choices:["Tranquility","Crisis","Storms"], answer:0 },
    { q: "Stayed in orbit?", choices:["Aldrin","Collins","Armstrong"], answer:1 },
    { q: "First human in space?", choices:["Gagarin","Glenn","Shepard"], answer:0 }
];

// Randomizes quiz order
function shuffle(arr){ return arr.sort(()=>Math.random()-0.5); }

// Starts quiz mode and resets counters
function startQuiz(){
    selectedQuiz = shuffle([...quizQuestions]).slice(0,5);
    quizActive = true;
    currentQuestion = 0;
    quizScore = 0;
}

// Spawns collectible fuels
function spawnFuels(n=8){ 
    for(let i=0;i<n;i++) fallingFuels.push(new Fuel()); 
}

// Spawns asteroid obstacles
function spawnAsteroids(n=8){ 
    for(let i=0;i<n;i++) asteroids.push(new Asteroid()); 
}

// Basic rectangle collision detection
function collide(a,b){
    return a.x < b.x + b.width &&
           a.x + a.size > b.x &&
           a.y < b.y + b.height &&
           a.y + a.size > b.y;
}

// Level 1: collect fuels before time runs out
function drawLevel1(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    player.move(); player.draw();

    if(fallingFuels.length < 5) spawnFuels(1);

    fallingFuels.forEach((o,i)=>{
        o.update(); o.draw();

        // If player touches a fuel, gain a point
        if(player.x < o.x + o.size &&
           player.x + player.size > o.x &&
           player.y < o.y + o.size &&
           player.y + player.size > o.y){

            score++;
            fallingFuels.splice(i,1);
        }
    });

    ctx.fillStyle="#ffcc00";
    ctx.font="28px Orbitron";
    ctx.textAlign="center";
    ctx.fillText(currentFact, canvas.width/2, 60);

    scoreboard.innerText=`Level 1 — ${score}/10 | ${timeLeft}s`;

    // Move to next level once enough fuels collected
    if(score >= 10){
        clearInterval(timerInterval);
        alert("Level 1 complete! Press OK to move onto Level 2!");
        keys = {}; // reset any stuck keys
        level = 2;
        asteroids = [];
        spawnAsteroids(5);
        startRoverTimer();
    }
}

// Level 2: survive asteroid field
function drawLevel2(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    player.move(); player.draw();

    asteroids.forEach(o=>{
        o.update(); o.draw();

        // Collision ends the game immediately
        if(collide(player,o)){
            alert("You crashed! Mission failed.");
            keys = {}; // reset any stuck keys
            setTimeout(() => location.reload(), 100);
        }
    });

    ctx.fillStyle="#ffcc00";
    ctx.fillText(currentFact, canvas.width/2, 40);

    if(roverTime>0){
        scoreboard.innerText=`Level 2 — Survive: ${roverTime}s`;
    }
}

// Timer for survival level
function startRoverTimer(){
    roverInterval = setInterval(()=>{
        roverTime--;
        if(roverTime<=0){
            clearInterval(roverInterval);
            // Save Level 2 stats
            gameReport.level2SurvivalTime = 15; // full time survived
            alert("Level 2 complete! Press OK to move onto Level 3!");
            keys = {}; // reset any stuck keys
            level = 3;
            scoreboard.innerText="";
            startQuiz();
        }
    },1000);
}

// Level 3: quiz challenge
function drawLevel3(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!quizActive) return;

    let q = selectedQuiz[currentQuestion];

    ctx.fillStyle="#cc99ff";
    ctx.font="32px Orbitron";
    ctx.textAlign="center";
    ctx.fillText(q.q, canvas.width/2, 120);

    ctx.font="24px Orbitron";
    q.choices.forEach((c,i)=>{
        ctx.fillStyle="#33ccff";
        ctx.fillText(`${i+1}. ${c}`, canvas.width/2, 200+i*50);
    });

    ctx.fillStyle="#ffffff";
    ctx.font="20px Orbitron";
    ctx.fillText(`Question: ${currentQuestion + 1} / 5`, canvas.width/2, 60);

    let wrong = currentQuestion - quizScore;
    ctx.fillText(`Correct: ${quizScore}   Wrong: ${wrong}`, canvas.width/2, 420);

    ctx.fillText("Press 1, 2, or 3 to answer", canvas.width/2, 470);
}

function showReport(win){
    alert(
`=== MISSION REPORT ===

Level 1:
Score: ${score}/10
Time Used: ${timeLeft}s

Level 2:
Survival Time: ${gameReport.level2SurvivalTime}s

Level 3:
Quiz Score: ${gameReport.quizCorrect}/${gameReport.quizTotal}

Final Result:
${win ? "MISSION SUCCESS 🚀" : "MISSION FAILED"}
`
    );
    keys = {}; // reset any stuck keys

    // Ensure browser reload works
    setTimeout(() => location.reload(), 100);
}

// Handles quiz answers
document.addEventListener("keydown", e=>{
    if(level===3 && quizActive && ["1","2","3"].includes(e.key)){
        let q = selectedQuiz[currentQuestion];

        if(parseInt(e.key)-1 === q.answer){
            quizScore++;
            info.innerText = "Correct!";
        } else {
            info.innerText = "Incorrect!";
        }

        currentQuestion++;

        // End quiz after 5 questions
        if(currentQuestion >= 5){
            quizActive = false;
            // Save quiz stats
            gameReport.quizCorrect = quizScore;

            if(quizScore >= 3){
                showReport(true);
            } else {
                showReport(false);
            }
        }
    }
});

// Start button initializes everything
startBtn.addEventListener("click",()=>{
    menu.style.display="none";

    player = new Player();
    fallingFuels = [];
    spawnFuels(5);

    startFactTimer();

    timerInterval = setInterval(()=>{
        timeLeft--;
        if(timeLeft<=0){
            alert("Time ran out! You Lose.");
            setTimeout(() => location.reload(), 100);
        }
    },1000);

    gameLoop();
});

// Main loop switches between levels
function gameLoop(){
    if(level===1) drawLevel1();
    else if(level===2) drawLevel2();
    else if(level===3) drawLevel3();

    requestAnimationFrame(gameLoop);
}
