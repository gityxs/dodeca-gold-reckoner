const greekLetters = ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ", "λ", "μ", "ν", "ξ", "ο", "π", "ρ", "σ", "τ", "υ", "φ", "χ", "ψ", "ω"]
const backgroundColors = ["#440", "#240", "#040", "#042", "#044", "#024", "#004", "#204", "#404", "#402", "#400", "#420"]
const layerUnlockCosts = ["1e25", "1e100", "1e250", "1e400", "1e550", "1e750", "1e1000", "1e1200", "1e1400", "1e1650", "1e1900"]

window.isDevVersion = window.location.href.indexOf('demonin.com') === -1

function toFixedFloor(num, decimalPlaces) {
	if (num.toFixed(decimalPlaces) == "10.00") return "9.99"
	return num.toFixed(decimalPlaces)
}

//Formatting code modified from RedShark77's version
function format(ex, acc = 0, max = 9) {
    function E(x) {
      return new Decimal(x)
    }
    ex = E(ex)
    neg = ex.lt(0) ? "-" : ""
    if (ex.mag == Infinity) return neg + 'Infinity'
    if (Number.isNaN(ex.mag)) return neg + 'NaN'
    if (ex.layer > 0 && (ex.mag % 1) > 0.9999) ex.mag = Math.ceil(ex.mag)
    if (ex.lt(0)) ex = ex.mul(-1)
    if (ex.eq(0)) return toFixedFloor(ex.toNumber(), acc)
    
    let e = ex.log10().floor()
    if (ex.log10().lt(Math.min(-acc, 0)) && acc > 1) {
      let e = ex.log10().ceil()
      let m = ex.div(e.eq(-1) ? E(0.1) : E(10).pow(e))
      let be = e.mul(-1).max(1).log10().gte(9)
      return neg + (be ? '' : toFixedFloor(m.toNumber(), 2)) + 'e' + format(e, 0, max)
    } else if (e.lt(max)) {
      let a = Math.max(Math.min(acc - e.toNumber(), acc), 0)
      return neg + (a > 0 ? toFixedFloor(ex.toNumber(), a) : toFixedFloor(ex.toNumber(), a).replace(/\B(?=(\d{3})+(?!\d))/g, ","))
    } else {
      if (ex.gte("eeee10")) {
        let slog = ex.slog()
        return (slog.gte(1e9) ? '' : toFixedFloor(E(10).pow(slog.sub(slog.floor())).toNumber(), 4)) + "F" + format(slog.floor(), 0)
      }
      let m = ex.div(E(10).pow(e))
      let be = e.gte(10000)
      return neg + (be ? '' : toFixedFloor(m.toNumber(), 2)) + 'e' + format(e, 0, max)
    }
  }

function reset() {
	game = {
        timeOfLastUpdate: Date.now(),
        gold: new Decimal(0),
        producers: [],
        producersBought: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        doublers: [new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)],
        unlocks: 1,
        layersTabUnlocked: false,
    }
    for (var i = 0; i < 12; i++) {
        game.producers.push([])
        for (var j = 0; j < 144; j++) {
            game.producers[i].push(new Decimal(0))
        }        
    }
    game.producers[12] = [new Decimal(0), new Decimal(0)]
    selectedProducer = 0
    selectedLayer = 0
    currentTab = 1
}
reset()

function save() {
    //console.log("saving")
    game.lastSave = Date.now();
    localStorage.setItem("dodecaGoldReckonerSave", JSON.stringify(game));
}

function setAutoSave() {
    if (!window.isDevVersion) setInterval(save, 5000);
    autosaveStarted = true;
}
//setInterval(save, 5000)

function exportGame() {
    save()
    navigator.clipboard.writeText(btoa(JSON.stringify(game))).then(function() {
        alert("Copied to clipboard!")
    }, function() {
        alert("Error copying to clipboard, try again...")
    });
}

function importGame() {
    loadgame = JSON.parse(atob(prompt("Input your save here:")))
    if (loadgame && loadgame != null && loadgame != "") {
        reset()
        loadGame(loadgame)
        save()
            location.reload()
    }
    else {
        alert("Invalid input.")
    }
}

function load() {
    reset()
    //This accidentally saves to the wrong location and I can never fix it or everyone will lose their saves
    let loadgame = JSON.parse(localStorage.getItem("dodecaGoldReckonerSave"))
    if (loadgame != null) {
        loadGame(loadgame)
    }
    //mainLoop = function() {
    //    updateVisuals();
    //    requestAnimationFrame(mainLoop);
    //};
    //requestAnimationFrame(mainLoop)
}

function loadGame(loadgame) {
    //Copying all the elements from the save file (loadgame) to the game object
  let loadKeys = Object.keys(loadgame); // Get the keys from the loadgame object
  for (i = 0; i < loadKeys.length; i++) { // Iterate over each key in the loadgame object
    if (loadgame[loadKeys[i]] !== undefined) { // Only process keys with defined values
      let thisKey = loadKeys[i];
      if (typeof loadgame[thisKey] == "string" && !isNaN(parseFloat(loadgame[thisKey]))) { // If the value is a string that can be parsed as a number, convert it to a Decimal
        game[thisKey] = new Decimal(loadgame[thisKey])
      }
      else if (Array.isArray(loadgame[thisKey])) { // If the value is an array
        if (!game[loadKeys[i]]) { // If the equivalent key doesn't exist in the game object or isn't an array, initialize it as an array
          game[loadKeys[i]] = []; 
        }
        for (j = 0; j < loadgame[thisKey].length; j++) { // Iterate over each element in the array
          if (Array.isArray(loadgame[thisKey][j])) { // If the element itself is an array
            if (!game[loadKeys[i]][j]) { // If the corresponding nested array doesn't exist in the game object, initialize it as an array
              game[loadKeys[i]][j] = [];
            }
            for (k = 0; k < loadgame[thisKey][j].length; k++) { // Iterate over each element in the nested array
              if (typeof loadgame[thisKey][j][k] == "string" && !isNaN(parseFloat(loadgame[thisKey][j][k]))) { // If the sub-element is a string that can be parsed as a number, convert it to a Decimal
                game[loadKeys[i]][j][k] = new Decimal(loadgame[thisKey][j][k])
              }
              else { // Otherwise, copy the sub-element directly
                game[loadKeys[i]][j][k] = loadgame[thisKey][j][k]
              }
            }
          }
          else if (typeof loadgame[thisKey][j] == "string" && !isNaN(parseFloat(loadgame[thisKey][j]))) { // If the element is a string that can be parsed as a number, convert it to a Decimal
            game[loadKeys[i]][j] = new Decimal(loadgame[thisKey][j])
          }
          else { // Otherwise, copy the element directly
            game[loadKeys[i]][j] = loadgame[thisKey][j]
          }
        }
      }
      else { // If the value is not a string and not an array, copy it directly
        game[loadKeys[i]] = loadgame[loadKeys[i]]
      }
    }
  }

  updateCellVisuals()

    $("#doublerInfoHeader").text("You have " + format(game.doublers[0], 0) + " " + greekLetters[currentTab-1] + "-doublers")
    $("#doublerInfoText").text("Multiplying gold gain by " + format(new Decimal(2).pow(game.doublers[0])) + " - costs " + format(getDoublerPrice(currentTab)) + " gold")

    if (game.layersTabUnlocked) {
        $("#layersTabUnlockButton").css("display", "none")
        $("#layersTabButton").css("display", "block")
    }

    //Buy max button
    if (game.producersBought[0] == 144) {
        $("#maxInfoText").css("display", "none")
        $("#buyMaxButton").css("display", "block")
    }
}

function loadGrid() {
    var grid = document.getElementById('grid');
    var gridSize = 12;
    for (var i = 0; i < gridSize; i++) {
        for (var j = 0; j < gridSize; j++) {
            var cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.number = (i*12+j+1)
            cell.innerHTML = "<p class='cellText'>" + (i*12+j+1) + "</p>"
            //Add onmouseover and onclick
            cell.onmouseover = function() {displayCellInfo(parseInt(this.dataset.number)); if (mouseDown) {buyProducer(parseInt(this.dataset.number))}}
            cell.onclick = function() {buyProducer(parseInt(this.dataset.number))}
            grid.appendChild(cell);
        }
    }
}

loadGrid()

var canvas = document.getElementById('layersCanvas');
var ctx = canvas.getContext('2d');
function loadLayersCanvas() {
    ctx.strokeStyle = "white"
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(500, 500 - 350); // Move to the top vertex
    for (let i = 1; i <= 12; i++) {
        const angle = (i * Math.PI * 2) / 12; // Calculate the angle for each vertex
        const x = 500 + 350 * Math.sin(angle); // Calculate the x-coordinate
        const y = 500 - 350 * Math.cos(angle); // Calculate the y-coordinate
        ctx.lineTo(x, y); // Draw a line to the vertex
    }
    ctx.closePath();
    ctx.stroke();
    //Move the 12 layerButtons to the correct positions
    for (let i=0;i<12;i++) {
        let angle = ((i-3) * Math.PI * 2) / 12;
        let x = 50 + 35 * Math.sin(angle);
        let y = 50 - 35 * Math.cos(angle);
        $(".layerButton").eq(i).css("left", x + "%")
        $(".layerButton").eq(i).css("top", y + "%")
    }
}
loadLayersCanvas()

function update() {
    let timeMultiplier = Math.max(Date.now() - game.timeOfLastUpdate, 1) / 1000
    //if (timeMultiplier>10) timeMultiplier = 10

    $("#gold").html("<img src='coins1.png' style='width: 5vmin'> You have " + format(game.gold) + " gold")

    if (currentTab == 0) {
        //Spinning dodecagon
        ctx.clearRect(300, 300, 400, 400)
        ctx.beginPath();
        const startingAngle = (Date.now()/3000) % (Math.PI * 2)
        const startingX = 500 + 150 * Math.sin(startingAngle); // Calculate the x-coordinate
        const startingY = 500 - 150 * Math.cos(startingAngle);
        ctx.moveTo(startingX, startingY); // Move to the start
        for (let i = 1; i <= 12; i++) {
            const angle = (i * Math.PI * 2) / 12 + (Date.now()/3000); // Calculate the angle for each vertex
            const x = 500 + 150 * Math.sin(angle); // Calculate the x-coordinate
            const y = 500 - 150 * Math.cos(angle); // Calculate the y-coordinate
            ctx.lineTo(x, y); // Draw a line to the vertex
        }
        ctx.closePath();
        ctx.stroke();
        for (let i=0;i<12;i++) {
            if (game.unlocks < i+1) {
                $(".layerButton").eq(i).css("filter", "brightness(70%)")
                $(".lockIcon").eq(i).css("display", "block")
            }
            else {
                $(".layerButton").eq(i).css("filter", "none")
                $(".lockIcon").eq(i).css("display", "none")
            }
        }
        //Layer buy button color
        if (selectedLayer >= 2 && game.gold.gte(layerUnlockCosts[selectedLayer-2])) {
            $("#layerBuyButton").css("background-color", "#0a0")
        }
        else {
            $("#layerBuyButton").css("background-color", "rgba(0,0,0,0.5)")
        }
    }
    else {
        if (game.gold.gt(getDoublerPrice(currentTab))) {
            $("#doublerBuyButton").css("background-color", "#0a0")
        }
        else {
            $("#doublerBuyButton").css("background-color", "rgba(0,0,0,0.5)")
        }
    }

    game.gold = game.gold.add(game.producers[0][0].mul(timeMultiplier).mul(new Decimal(2).pow(game.doublers[0])))
    for (let i=0;i<game.unlocks;i++) {
        if (i==0) {game.producers[i][0] = game.producers[i][0].add(game.producers[i][1].mul(timeMultiplier).mul(game.producers[i+1][0].add(1)))}
        else {game.producers[i][0] = game.producers[i][0].add(game.producers[i][1].mul(timeMultiplier).mul(game.producers[i+1][0].add(1)).mul(new Decimal(2).pow(game.doublers[i])))}
        for (let j=1;j<143;j++) {
            if (game.producers[i][j+1].eq(0)) break;
            game.producers[i][j] = game.producers[i][j].add(game.producers[i][j+1].mul(timeMultiplier))
        }
    }

    if (selectedProducer > 0) {
        displayCellInfo(selectedProducer)
    }

    if (currentTab > 0 && game.layersTabUnlocked) {
        $("#layersTabButton").css("transform", "rotate(" + ((Date.now()/15)%360) + "deg)")
    }

    game.timeOfLastUpdate = Date.now()
}

setInterval(update, 1000/60)

function skipTime(x) {
    game.timeOfLastUpdate -= (x*1000)
}

function updateCellVisuals() {
    if (currentTab == 0) return
    let color = "#000"
    for (let i=0;i<144;i++) {
        if (game.producers[currentTab-1][i].gt(0)) {
            color = "#0a0"
        }
        else if (game.gold.gte(getProducerPrice(currentTab, i+1))) {
            color = "#aa0"
        }
        else {
            let progressToBuy = game.gold.add(1).log10().div(getProducerPrice(currentTab, i+1).add(1).log10())
            let progressHex = Math.floor(progressToBuy*160).toString(16).padStart(2, "0")
            let progressHex2 = Math.floor(progressToBuy*80).toString(16).padStart(2, "0")
            color = "#" + (progressHex) + (progressHex2) + "00"
        }
        $(".cell").eq(i).css("background-color", color)
    }
}

setInterval(updateCellVisuals, 250)
updateCellVisuals()

function displayCellInfo(x) {
    if (currentTab == 0) return
    selectedProducer = x
    $("#cellInfoHeader").text("Producer " + greekLetters[currentTab-1] + "-" + x)
    if (game.producersBought[currentTab-1] < x) {
        $("#cellInfoText").text("Unbought - costs " + format(getProducerPrice(currentTab, x)) + " gold")
        $("#cellBuyButton").css("display", "block")
        if (game.producersBought[currentTab-1] == x-1) {
            $("#cellBuyButton").text("Buy")
        }
        else {
            $("#cellBuyButton").text("Requires an earlier producer first!")
        }
    }
    else {
        if (x==1) {
            if (currentTab==1) {$("#cellInfoText").text("You have " + format(game.producers[currentTab-1][0], 1) + ", producing " + format(game.producers[currentTab-1][0].mul(new Decimal(2).pow(game.doublers[currentTab-1])), 1) + " gold per second")}
            else {$("#cellInfoText").text("You have " + format(game.producers[currentTab-1][0], 1) + ", multiplying  " + greekLetters[currentTab-2] + "-1 gain by " + format(game.producers[currentTab-1][0].add(1), 1))}
        }
        else if (x==2) {
            if (currentTab==1) {$("#cellInfoText").text("You have " + format(game.producers[currentTab-1][1], 1) + ", producing " + format(game.producers[currentTab-1][1].mul(game.producers[currentTab][0].add(1)), 1) + " " + greekLetters[currentTab-1] + "-" + (x-1) + " per second")}
            else {$("#cellInfoText").text("You have " + format(game.producers[currentTab-1][1], 1) + ", producing " + format(game.producers[currentTab-1][1].mul(game.producers[currentTab][0].add(1)).mul(new Decimal(2).pow(game.doublers[currentTab-1])), 1) + " " + greekLetters[currentTab-1] + "-" + (x-1) + " per second")}
        }
        else {$("#cellInfoText").text("You have " + format(game.producers[currentTab-1][x-1], 1) + ", producing " + format(game.producers[currentTab-1][x-1], 1) + " " + greekLetters[currentTab-1] + "-" + (x-1) + " per second")}
        $("#cellBuyButton").css("display", "none")
    }
}

//Variable that turns on/off when user holds the mouse button
let mouseDown = false
//Event listener for mouseup and mousedown
document.addEventListener('mousedown', function() {
    mouseDown = true
})
document.addEventListener('mouseup', function() {
    mouseDown = false
})

function buyProducer(x) {
    if (game.producersBought[currentTab-1] != x-1 || game.gold.lt(getProducerPrice(currentTab, x))) return
    game.producersBought[currentTab-1] = x
    game.gold = game.gold.sub(getProducerPrice(currentTab, x))
    game.producers[currentTab-1][x-1] = new Decimal(1)
    $(".cell").eq(x-1).css("background-color", "#0a0")
    displayCellInfo(selectedProducer)
    //Buy max button
    if (currentTab == 1 && x==144) {
        $("#maxInfoText").css("display", "none")
        $("#buyMaxButton").css("display", "block")
    }
}

function buyMaxProducers() {
    if (currentTab == 0 || game.producersBought[0] < 144) return
    let x = game.producersBought[currentTab-1]
    while (game.gold.gte(getProducerPrice(currentTab, x+1)) && x<144) {
        x++
        selectedProducer = x
        game.producersBought[currentTab-1] = x
        game.gold = game.gold.sub(getProducerPrice(currentTab, x))
        game.producers[currentTab-1][x-1] = new Decimal(1)
        $(".cell").eq(x-1).css("background-color", "#0a0")
    }
    displayCellInfo(selectedProducer)
}

function getProducerPrice(layer, x) {
    switch (layer) {
        case 1:
            return new Decimal(100).pow(x).div(1000).floor()
            break
        case 2:
            return new Decimal(1e5).pow(x).mul(1e20).floor()
            break
        case 3:
            return new Decimal(1e8).pow(x).mul(1e92).floor()
            break
        case 4:
            return new Decimal(1e12).pow(x).mul(1e238).floor()
            break
        case 5:
            return new Decimal(1e15).pow(x).mul("1e385").floor()
            break
        case 6:
            return new Decimal(1e18).pow(x).mul("1e532").floor()
            break
        case 7:
            return new Decimal(1e22).pow(x).mul("1e728").floor()
            break
        case 8:
            return new Decimal(1e25).pow(x).mul("1e975").floor()
            break
        case 9:
            return new Decimal(1e28).pow(x).mul("1e1172").floor()
            break
        case 10:
            return new Decimal(1e31).pow(x).mul("1e1369").floor()
            break
        case 11:
            return new Decimal(1e34).pow(x).mul("1e1616").floor()
            break
        case 12:
            return new Decimal(1e36).pow(x).mul("1e1864").floor()
            break
        default:
            return 0
            break
    }
}

function buyDoubler() {
    if (game.gold.lt(getDoublerPrice(currentTab))) return
    game.gold = game.gold.sub(getDoublerPrice(currentTab))
    game.doublers[currentTab-1] = game.doublers[currentTab-1].add(1)
    $("#doublerInfoHeader").text("You have " + format(game.doublers[currentTab-1], 0) + " " + greekLetters[currentTab-1] + "-doublers")
    if (currentTab == 1) {$("#doublerInfoText").text("Multiplying gold gain by " + format(new Decimal(2).pow(game.doublers[currentTab-1])) + " - costs " + format(getDoublerPrice(currentTab)) + " gold")}
    else {$("#doublerInfoText").text("Multiplying " + greekLetters[currentTab-1] + "-1 gain by " + format(new Decimal(2).pow(game.doublers[currentTab-1])) + " - costs " + format(getDoublerPrice(currentTab)) + " gold")}
}

function getDoublerPrice(layer) {
    const multipliers = [2, 40, 125, 300, 450, 600, 850, 1100, 1300, 1500, 1750, 2000];
    return new Decimal(10).pow(new Decimal(2).pow(game.doublers[layer-1]).mul(multipliers[layer-1]));
}

function unlockLayersTab() {
    if (game.gold.lt(1e10)) return
    game.gold = game.gold.sub(1e10)
    game.layersTabUnlocked = true
    $("#layersTabUnlockButton").css("display", "none")
    $("#layersTabButton").css("display", "block")
    $("#layersTabButton").css("transform", "rotate(" + ((Date.now()/15)%360) + "deg)")
}

function exitLayer() {
    if (!game.layersTabUnlocked) return
    currentTab = 0
    selectedLayer = 0
    $("#goldTab").css("display", "none")
    $("#layerInfoText").html("Click on an unlocked layer to enter it.<br>Click on a locked layer to learn about it.<br>Each first producer (β-1, γ-1, etc.) multiplies the gain of the previous first producer!")
    $("#layerBuyButton").css("display", "none")
    for (let i=0;i<12;i++) {
        if (game.producersBought[i] == 144) {
            $(".layerButton").eq(i).css("border", "0.2vmin solid #fd4")
        }
    }
}

function selectTab(x) {
    if (!game.layersTabUnlocked) return
    if (game.unlocks >= x) {
        currentTab = x
        $("#goldTab").css("display", "block")
        $("#goldTab").css("backgroundColor", backgroundColors[x-1])
        $("#doublerInfoHeader").text("You have " + format(game.doublers[x-1], 0) + " " + greekLetters[currentTab-1] + "-doublers")
        if (currentTab == 1) {$("#doublerInfoText").text("Multiplying gold gain by " + format(new Decimal(2).pow(game.doublers[currentTab-1])) + " - costs " + format(getDoublerPrice(currentTab)) + " gold")}
        else {$("#doublerInfoText").text("Multiplying " + greekLetters[currentTab-1] + "-1 gain by " + format(new Decimal(2).pow(game.doublers[currentTab-1])) + " - costs " + format(getDoublerPrice(currentTab)) + " gold")}
        updateCellVisuals()
    }
    else if (currentTab == 0) {
        selectedLayer = x
        $("#layerInfoText").html("<b>Layer " + greekLetters[x-1] + "</b><br>Costs " + layerUnlockCosts[x-2] + " gold")
        $("#layerBuyButton").css("display", "block")
        //Layer buy button color
        if (selectedLayer >= 2 && game.gold.gte(layerUnlockCosts[selectedLayer-2])) {
            $("#layerBuyButton").css("background-color", "#0a0")
        }
        else {
            $("#layerBuyButton").css("background-color", "rgba(0,0,0,0.5)")
        }
    }
}

function buyLayer(x) {
    if (x==0 || game.gold.lt(layerUnlockCosts[x-2])) return
    game.gold = game.gold.sub(layerUnlockCosts[x-2])
    game.unlocks = x
    $("#layerInfoText").html("Click on an unlocked layer to enter it.<br>Click on a locked layer to learn about it.<br>Each first producer (β-1, γ-1, etc.) multiplies the gain of the previous first producer!")
    $("#layerBuyButton").css("display", "none")
}

//Hotkeys for switching tabs
document.addEventListener('keydown', function(event) {
    if (event.key == "1") {selectTab(1)}
    if (event.key == "2") {selectTab(2)}
    if (event.key == "3") {selectTab(3)}
    if (event.key == "4") {selectTab(4)}
    if (event.key == "5") {selectTab(5)}
    if (event.key == "6") {selectTab(6)}
    if (event.key == "7") {selectTab(7)}
    if (event.key == "8") {selectTab(8)}
    if (event.key == "9") {selectTab(9)}
    if (event.key == "0") {selectTab(10)}
    if (event.key == "-") {selectTab(11)}
    if (event.key == "=") {selectTab(12)}
    if (event.key == "m") {buyMaxProducers()}
    if (event.key == "Escape") {exitLayer()}
})