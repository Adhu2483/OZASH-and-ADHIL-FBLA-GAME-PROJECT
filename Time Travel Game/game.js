// ================= INITIAL SETUP =================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreboard = document.getElementById("scoreboard");
const info = document.getElementById("info");
const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ================= INPUT =================
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// ================= GAME STATE =================
let level = 1;
let score = 0;
let timeLeft = 30;
let roverTime = 15;

let timerInterval;
let roverInterval;
let factInterval;

let player;
let fallingOrbs = [];
let obstacles = [];

let quizActive = false;
let currentQuestion = 0;
let quizScore = 0;
let selectedQuiz = [];

// ================= PLAYER =================
class Player {
    constructor() {
        this.size = 50;
        this.x = canvas.width/2 - this.size/2;
        this.y = canvas.height - 100;
        this.speed = 7;
    }
    move() {
        if(keys["ArrowLeft"] || keys["a"]) this.x -= this.speed;
        if(keys["ArrowRight"] || keys["d"]) this.x += this.speed;
        this.x = Math.max(0, Math.min(this.x, canvas.width - this.size));
    }
    draw() {
        ctx.save();
        ctx.translate(this.x + this.size/2, this.y + this.size/2);
        ctx.beginPath();
        ctx.moveTo(0, -this.size/2);
        ctx.lineTo(this.size/2, this.size/2);
        ctx.lineTo(-this.size/2, this.size/2);
        ctx.closePath();
        const grad = ctx.createLinearGradient(-this.size/2, -this.size/2, this.size/2, this.size/2);
        grad.addColorStop(0, "#00ffff");
        grad.addColorStop(1, "#6600ff");
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.stroke();
        ctx.restore();
    }
}

// ================= ORBS =================
class Orb {
    constructor() {
        this.size = 30;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size - Math.random() * canvas.height;
        this.speed = 2 + Math.random() * 3;
    }
    update() {
        this.y += this.speed;
        if(this.y > canvas.height) {
            this.y = -this.size;
            this.x = Math.random() * (canvas.width - this.size);
        }
    }
    draw() {
        ctx.fillStyle = "#33ccff";
        ctx.beginPath();
        ctx.arc(this.x + this.size/2, this.y + this.size/2, this.size/2, 0, Math.PI*2);
        ctx.fill();
    }
}

// ================= OBSTACLES =================
class Obstacle {
    constructor() {
        this.width = 40 + Math.random()*30;
        this.height = 40 + Math.random()*30;
        this.x = Math.random()*(canvas.width-this.width);
        this.y = -this.height;

        // ✅ RANDOM SPEED
        this.speed = 2 + Math.random()*4;

        // ✅ RANDOM COLORS
        this.color = ["#ff4444", "#ff99ff", "#33ccff", "#ffcc00", "#66ff66"]
            [Math.floor(Math.random()*5)];
    }

    update() {
        this.y += this.speed;
        if(this.y > canvas.height) {
            this.y = -this.height;
            this.x = Math.random()*(canvas.width-this.width);
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.strokeStyle = "white";
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

// ================= FACTS =================
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

function startFactTimer() {
    showRandomFact();
    factInterval = setInterval(showRandomFact, 8000);
}
function showRandomFact() {
    currentFact = facts1960[Math.floor(Math.random()*facts1960.length)];
}

// ================= QUIZ =================
let quizQuestions = [
    { q: "Apollo 11 year?", choices:["1965","1969","1972"], answer:1 },
    { q: "First moon walker?", choices:["Aldrin","Armstrong","Gagarin"], answer:1 },
    { q: "NASA founded?", choices:["1958","1965","1970"], answer:0 },
    { q: "Sea landed?", choices:["Tranquility","Crisis","Storms"], answer:0 },
    { q: "Stayed in orbit?", choices:["Aldrin","Collins","Armstrong"], answer:1 },
    { q: "First human in space?", choices:["Gagarin","Glenn","Shepard"], answer:0 }
];

function shuffle(arr){ return arr.sort(()=>Math.random()-0.5); }

function startQuiz(){
    selectedQuiz = shuffle([...quizQuestions]).slice(0,5);
    quizActive = true;
    currentQuestion = 0;
    quizScore = 0;
}

// ================= HELPERS =================
function spawnOrbs(n=8){ for(let i=0;i<n;i++) fallingOrbs.push(new Orb()); }
function spawnObstacles(n=8){ for(let i=0;i<n;i++) obstacles.push(new Obstacle()); }

function collide(a,b){
    return a.x < b.x + b.width &&
           a.x + a.size > b.x &&
           a.y < b.y + b.height &&
           a.y + a.size > b.y;
}

// ================= LEVELS =================
function drawLevel1(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    player.move(); player.draw();

    // 👇 THIS LINE FIXES YOUR PROBLEM
    if(fallingOrbs.length < 5) spawnOrbs(1);

    fallingOrbs.forEach((o,i)=>{
        o.update(); o.draw();

        if(player.x < o.x + o.size &&
           player.x + player.size > o.x &&
           player.y < o.y + o.size &&
           player.y + player.size > o.y){

            score++;
            fallingOrbs.splice(i,1);
        }
    });

    ctx.fillStyle="#ffcc00";
    ctx.font="28px Orbitron";
    ctx.textAlign="center";
    ctx.fillText(currentFact, canvas.width/2, 60);

    scoreboard.innerText=`Level 1 — ${score}/10 | ${timeLeft}s`;

    if(score >= 10){
        clearInterval(timerInterval);
        alert("Level 1 complete! Press OK to move onto Level 2!");
        level = 2;
        obstacles = [];
        spawnObstacles(5);
        startRoverTimer();
    }
}

function drawLevel2(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    player.move(); player.draw();

    obstacles.forEach(o=>{
        o.update(); o.draw();
        if(collide(player,o)){
            alert("You crashed! Mission failed.");
            location.reload();
        }
    });

    ctx.fillStyle="#ffcc00";
    ctx.fillText(currentFact, canvas.width/2, 40);

    if(roverTime>0){
        scoreboard.innerText=`Level 2 — Survive: ${roverTime}s`;
    }
}

function startRoverTimer(){
    roverInterval = setInterval(()=>{
        roverTime--;
        if(roverTime<=0){
            clearInterval(roverInterval);
            alert("Level 2 complete! Press OK to move onto Level 3!");
            level = 3;
            scoreboard.innerText="";
            startQuiz();
        }
    },1000);
}

function drawLevel3(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!quizActive) return;

    let q = selectedQuiz[currentQuestion];

    // Question text
    ctx.fillStyle="#cc99ff";
    ctx.font="32px Orbitron";
    ctx.textAlign="center";
    ctx.fillText(q.q, canvas.width/2, 120);

    // Choices
    ctx.font="24px Orbitron";
    q.choices.forEach((c,i)=>{
        ctx.fillStyle="#33ccff";
        ctx.fillText(`${i+1}. ${c}`, canvas.width/2, 200+i*50);
    });

    // ================= COUNTERS =================

    // Question counter
    ctx.fillStyle="#ffffff";
    ctx.font="20px Orbitron";
    ctx.fillText(`Question: ${currentQuestion + 1} / 5`, canvas.width/2, 60);

    // Accuracy counter
    let wrong = currentQuestion - quizScore;

    ctx.fillText(`Correct: ${quizScore}   Wrong: ${wrong}`, canvas.width/2, 420);

    // Instruction
    ctx.fillText("Press 1, 2, or 3 to answer", canvas.width/2, 470);
}

// ================= QUIZ INPUT =================
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

        if(currentQuestion >= 5){
            quizActive = false;

            if(quizScore >= 3){
                alert(`🎉 You Win! Mission Successful! (${quizScore}/5 correct) You are a true time traveler!`);
            } else {
                alert(`Mission failed. You got ${quizScore}/5 correct.`);
            }

            location.reload();
        }
    }
});

// ================= START =================
startBtn.addEventListener("click",()=>{
    menu.style.display="none";

    player = new Player();
    fallingOrbs = [];
    spawnOrbs(5);

    startFactTimer();

    timerInterval = setInterval(()=>{
        timeLeft--;
        if(timeLeft<=0){
            alert("Time ran out! You Lose.");
            location.reload();
        }
    },1000);

    gameLoop();
});

// ================= LOOP =================
function gameLoop(){
    if(level===1) drawLevel1();
    else if(level===2) drawLevel2();
    else if(level===3) drawLevel3();

    requestAnimationFrame(gameLoop);
}