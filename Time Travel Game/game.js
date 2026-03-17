const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const info = document.getElementById("info");

let player = {
    x:100,
    y:100,
    size:30,
    speed:5
};

let score = 0;
let level = 1;
let timer = 60;

let keys = {};

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

let items = [];

function spawnItems(){
    items = [];

    for(let i=0;i<5;i++){
        items.push({
            x:Math.random()*750,
            y:Math.random()*450,
            size:20
        });
    }
}

spawnItems();

function movePlayer(){

    if(keys["ArrowUp"]) player.y -= player.speed;
    if(keys["ArrowDown"]) player.y += player.speed;
    if(keys["ArrowLeft"]) player.x -= player.speed;
    if(keys["ArrowRight"]) player.x += player.speed;

}

function drawPlayer(){
    ctx.fillStyle="cyan";
    ctx.fillRect(player.x,player.y,player.size,player.size);

    ctx.strokeStyle="white";
    ctx.strokeRect(player.x,player.y,player.size,player.size);
}

function drawItems(){

    ctx.fillStyle="red";

    items.forEach(item=>{
        ctx.fillRect(item.x,item.y,item.size,item.size);
    });

}

function checkCollision(){

    items.forEach((item,index)=>{

        if(
            player.x < item.x + item.size &&
            player.x + player.size > item.x &&
            player.y < item.y + item.size &&
            player.y + player.size > item.y
        ){

            score += 10;
            items.splice(index,1);

            showFact();

        }

    });

}

function showFact(){

    const facts = [
        "Apollo 11 landed on the moon in 1969.",
        "Neil Armstrong was the first human on the moon.",
        "The Space Race occurred during the 1960s.",
        "NASA was founded in 1958.",
        "Buzz Aldrin walked on the moon during Apollo 11."
    ];

    let fact = facts[Math.floor(Math.random()*facts.length)];

    info.innerText = fact;

}

function drawUI(){

    ctx.fillStyle="white";
    ctx.font="20px Arial";

    ctx.fillText("Score: "+score,10,20);
    ctx.fillText("Level: "+level,10,45);
    ctx.fillText("Time: "+timer,10,70);

}

function nextLevel(){

    if(score >= 50 && level === 1){

        level = 2;
        spawnItems();
        player.x = 100;
        player.y = 100;

        info.innerText = "Level 2: Moon Landing Mission!";

    }

}

function checkWin(){

    if(score >= 100 && level === 2){

        alert("Mission Complete! You saved history!");
        document.location.reload();

    }

}

function checkLose(){

    if(timer <= 0){

        alert("Mission Failed! Time ran out.");
        document.location.reload();

    }

}

function gameLoop(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    movePlayer();

    drawPlayer();

    drawItems();

    checkCollision();

    drawUI();

    nextLevel();

    checkWin();

    checkLose();

    requestAnimationFrame(gameLoop);

}

gameLoop();

setInterval(()=>{
    timer--;
},1000);
