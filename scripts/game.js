var app;
var infoText, gameWinText;
var tileStartX = 180;
var tileStartY = 100;
var tileWidth = 70; //64 tile width + 6px gap
var numCols = 4;
var positions = [];
var numTiles = 16;
var tiles = [];
var currentPosition = [];

var startTile, endTile;

window.onload = function () {
    console.log('onload');
    app = new PIXI.Application(window.innerWidth, window.innerHeight, { backgroundColor: 0xf1f3f4 });
    document.body.appendChild(app.view);

    var infostyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 18,
        fill: ['#222222', '#444444'] ,// gradient,
        align: 'center'
    });

    infoText = new PIXI.Text("Rotate the Blue gear on the Top. \n\n(A pixi.js demo inspired by COGS game by Monster Brain Games (monsterbraininc.com)", infostyle);
    infoText.x = window.innerWidth / 2;
    infoText.y = 440;
    // center the text's anchor point
    infoText.anchor.set(0.5);

    app.stage.addChild(infoText);
    
    var newStyle = infostyle.clone();
    newStyle.fontSize = 24;
    gameWinText = new PIXI.Text("Game Won !", newStyle);
    gameWinText.x = window.innerWidth / 2;
    gameWinText.y =40;
    // center the text's anchor point
    gameWinText.anchor.set(0.5);

    gameWinText.visible = false;

    app.stage.addChild(gameWinText);

    // create a new Sprite from an image path
    var tile = PIXI.Sprite.fromImage('assets/tile.png');

    var startPositions = [12,0,3,10,2,8,11,15,5,14,13,7,9,1,4,6];
    var gearShowArray = [
        0, 0, 0, 1,
        0, 0, 0, 1,
        0, 0, 1, 1,
        1, 1, 1, 0];

    var isTileMoving = false;
    var blankTileIndex = 15;
    var tileTweenTime = 15;

    var isGameWon = false;

    tileStartX = window.innerWidth / 2 - numCols / 2 * tileWidth;
    tileStartY = 100;

    function debugTextLog(text) {
        // document.getElementById("debug").innerHTML = text;
    }

    function onTileClick() {
        if (isTileMoving || isGameWon)
            return;

        //debugTextLog("Clicked on tile "+this.index +" "+currentPosition[0]);
        var tileIndex = this.index;

        if(tiles[tileIndex].isFixed){
            console.log('is fixed. No Moving');
            // just a shake anim to show it's fixed
            var initX = tiles[tileIndex].x;
            var tween1 = new Tween(tiles[tileIndex], "position.x", tiles[tileIndex].x+2.5, 10, false);
            var tween2 = new Tween(tiles[tileIndex], "position.x", tiles[tileIndex].x-2.5, 10, false);
            var tween3 = new Tween(tiles[tileIndex], "position.x", tiles[tileIndex].x+2.5, 10, false);
            tween3.onComplete = ()=>{tiles[tileIndex].x= initX;}
            new ChainedTween([tween1, tween2, tween3]);
            return;
        }

        var currentTilePos = currentPosition[tileIndex];
        var blankTilePos = currentPosition[blankTileIndex];

        var tileRowCol = [parseInt(currentTilePos / numCols), currentTilePos % numCols];
        var blankRowCol = [parseInt(blankTilePos / numCols), blankTilePos % numCols];

        console.log({ tileRowCol, blankRowCol });

        // same row
        if (tileRowCol[0] == blankRowCol[0]) {
            var numMoveTiles = tileRowCol[1] - blankRowCol[1];
            console.log('numMoveTiles' + numMoveTiles);
            var left = -1, right = 1;
            let dir = numMoveTiles < 0 ? right : left;

            let moveTiles = [];
            if (dir == right) {
                console.log('push right');
                numMoveTiles = -numMoveTiles;
                for (let i = 0; i < numMoveTiles; i++) {
                    let tileObj = getTileAtPos(i + currentTilePos);
                    moveTiles.push(tileObj);
                    var tweenWithCallback1 = new Tween(tileObj.tile, "position.x", positions[i + currentTilePos + 1].x, tileTweenTime, true);
                    tweenWithCallback1.easing = Tween.outCubic;
                    if (i == 0)
                        tweenWithCallback1.onComplete = onTweenComplete;
                }

                let blankTilePosTemp;
                for (let i = 0; i < moveTiles.length; i++) {
                    const tile = moveTiles[i];
                    if (i == 0) { blankTilePosTemp = currentPosition[tile.index]; } // first tile will be blank at last
                    currentPosition[tile.index] += 1;
                }
                currentPosition[blankTileIndex] = blankTilePosTemp;
            } else {
                console.log('push left');
                for (let i = numMoveTiles; i > 0; i--) {
                    let tileObj = getTileAtPos(i + blankTilePos);
                    moveTiles.push(tileObj);
                    var tweenWithCallback1 = new Tween(tileObj.tile, "position.x", positions[i + blankTilePos - 1].x, tileTweenTime, true);
                    tweenWithCallback1.easing = Tween.outCubic;
                    if (i == numMoveTiles)
                        tweenWithCallback1.onComplete = onTweenComplete;
                }

                let blankTilePosTemp;
                for (let i = 0; i < moveTiles.length; i++) {
                    const tile = moveTiles[i];
                    if (i == 0) { blankTilePosTemp = currentPosition[tile.index]; } // first tile will be blank at last
                    currentPosition[tile.index] -= 1;
                }
                currentPosition[blankTileIndex] = blankTilePosTemp;
            }
        }

        // same column
        if (tileRowCol[1] == blankRowCol[1]) {
            var numMoveTiles = tileRowCol[0] - blankRowCol[0];
            console.log('col numMoveTiles' + numMoveTiles);
            var pushup = -1, pushdown = 1;
            let dir = numMoveTiles < 0 ? pushdown : pushup;

            let moveTiles = [];
            if (dir == pushdown) {
                console.log('push down');
                numMoveTiles = -numMoveTiles;
                for (let i = 0; i < numMoveTiles; i++) {
                    let tileObj = getTileAtPos(i * numCols + currentTilePos);
                    moveTiles.push(tileObj);
                    var tweenWithCallback1 = new Tween(tileObj.tile, "position.y", positions[i * numCols + currentTilePos + numCols].y, tileTweenTime, true);
                    tweenWithCallback1.easing = Tween.outCubic;
                    if (i == 0)
                        tweenWithCallback1.onComplete = onTweenComplete;
                }

                let blankTilePosTemp;
                for (let i = 0; i < moveTiles.length; i++) {
                    const tile = moveTiles[i];
                    if (i == 0) { blankTilePosTemp = currentPosition[tile.index]; } // first tile will be blank at last
                    currentPosition[tile.index] += numCols;
                }
                currentPosition[blankTileIndex] = blankTilePosTemp;
            } else {
                console.log('push up');
                for (let i = numMoveTiles; i > 0; i--) {
                    let tileObj = getTileAtPos(i * numCols + blankTilePos);
                    moveTiles.push(tileObj);
                    var tweenWithCallback1 = new Tween(tileObj.tile, "position.y", positions[i * numCols + blankTilePos - numCols].y, tileTweenTime, true);
                    tweenWithCallback1.easing = Tween.outCubic;
                    if (i == numMoveTiles)
                        tweenWithCallback1.onComplete = onTweenComplete;
                }

                let blankTilePosTemp;
                for (let i = 0; i < moveTiles.length; i++) {
                    const tile = moveTiles[i];
                    if (i == 0) { blankTilePosTemp = currentPosition[tile.index]; } // first tile will be blank at last
                    currentPosition[tile.index] -= numCols;
                }
                currentPosition[blankTileIndex] = blankTilePosTemp;
            }
        }
    }

    function getTileAtPos(index) {
        for (let i = 0; i < numTiles; i++) {
            if (currentPosition[i] == index) {
                return { tile: tiles[i], index: i };
            }
        }
    }

    function onTweenComplete(param) {
        isTileMoving = false;

        console.log('onTweenComplete');
        for (var i = 0; i < numTiles; i++) {
            tiles[i].gear.isRotating = false;
        }
        // turn off all gears

        // first check the row 3 col 0 - next to starting gear
        for (let row = numCols-1; row >= 0; row--) {
            for (let i = 0; i < numCols; i++) {
                var index = row * numCols + i;
                var tileObj = getTileAtPos(index);
                if (gearShowArray[tileObj.index] == 1) {
                    // has gear
                    console.log('has gear at ' + index);
                    if (i == 0 && row == 3) {
                        //first tile in contact with start gear
                        tileObj.tile.gear.isRotating = true;
                    } else {
                        let isSideTileRotating = false;
                        // check if left is rotating / top / right / bottom is rotating
                        if(index%numCols!=0){
                            isSideTileRotating = getTileAtPos(index-1).tile.gear.isRotating;
                        }
                        // check if top is rotating
                        if(!isSideTileRotating && index>(numCols-1)){
                            isSideTileRotating = getTileAtPos(index-numCols).tile.gear.isRotating;
                        }
                        // check if right is rotating
                        if(!isSideTileRotating && (index+1)%numCols!=0){
                            isSideTileRotating = getTileAtPos(index+1).tile.gear.isRotating;
                        }
                        // check if bottom is rotating
                        if(!isSideTileRotating && (index)<(numTiles-numCols)){
                            isSideTileRotating = getTileAtPos(index+numCols).tile.gear.isRotating;
                        }
                        tileObj.tile.gear.isRotating = isSideTileRotating;
                    }
                }
            }
        }

        if(getTileAtPos(3).tile.gear.isRotating){
            endTile.isRotating = true;
            console.log("game won");
            isGameWon = true;
            gameWinText.visible = true;
            // debugTextLog("Game Won. Cool");
        } else{
            endTile.isRotating = false;
        }
        
        

        //To Generate First Random Array
        // var logText="";
        // for(var i=0; i<currentPosition.length;i++)
        //     logText += currentPosition[i]+",";
        // console.log(logText);
    }

    function Point(x, y) {
        this.x = x;
        this.y = y;
    }

    debugTextLog("Game Start. Arrange the Tiles in Order.");

    // create tiles
    for (var i = 0; i < numTiles; i++) {
        var tileHolder = new PIXI.Container();
        tileHolder.index = i;
        var newtile = PIXI.Sprite.fromImage('assets/tile.png');
        tile.anchor.set(0.5);

        var gearSprite = PIXI.Sprite.fromImage('assets/gear.png');
        gearSprite.anchor.set(0.5);
        gearSprite.x = 32;
        gearSprite.y = 32;
        gearSprite.isRotating = false;

        var row = Math.floor(i / numCols);
        var col = Math.floor(i % numCols);
        tileHolder.x = tileStartX + col * tileWidth;
        tileHolder.y = tileStartY + row * tileWidth;

        var pt = new Point(tileHolder.x, tileHolder.y);
        positions.push(pt);

        currentPosition[i] = i;

        tileHolder.interactive = true;
        tileHolder.buttonMode = true;

        if (gearShowArray[i] == 0) {
            gearSprite.visible = false;
        }

        tileHolder.on('pointerdown', onTileClick);

        tileHolder.addChild(newtile);
        tileHolder.addChild(gearSprite);

        tileHolder.gear = gearSprite;
        tileHolder.tile = newtile;
        tileHolder.isFixed = false;

        tiles.push(tileHolder);

        if (i == (numTiles - 1)) {
            tileHolder.visible = false;
        }

        app.stage.addChild(tileHolder);
    }

    // start tile create
    startTile = new PIXI.Container();
    var newtile = PIXI.Sprite.fromImage('assets/tile.png');
    tile.anchor.set(0.5);
    var gearSprite = PIXI.Sprite.fromImage('assets/startgear.png');
    gearSprite.anchor.set(0.5);
    gearSprite.x = 32;
    gearSprite.y = 32;

    var row = 3;
    var col = -1;
    startTile.x = tileStartX + col * tileWidth;
    startTile.y = tileStartY + row * tileWidth;

    startTile.addChild(newtile);
    startTile.addChild(gearSprite);
    startTile.gear = gearSprite;
    app.stage.addChild(startTile);
    // ~ start tile create

    // end tile create
    endTile = new PIXI.Container();
    var newtile = PIXI.Sprite.fromImage('assets/tile.png');
    tile.anchor.set(0.5);
    var gearSprite = PIXI.Sprite.fromImage('assets/startgear.png');
    gearSprite.anchor.set(0.5);
    gearSprite.x = 32;
    gearSprite.y = 32;

    var row = 0;
    var col = 4;
    endTile.x = tileStartX + col * tileWidth;
    endTile.y = tileStartY + row * tileWidth;

    endTile.addChild(newtile);
    endTile.addChild(gearSprite);
    endTile.gear = gearSprite;
    app.stage.addChild(endTile);
    endTile.isRotating = false;
    // ~ end tile create

    //Set Initial Random Setup
    for (var i = 0; i < numTiles; i++) {
        currentPosition[i] = startPositions[i];

        var tilePos = startPositions[i];
        tiles[i].x = positions[tilePos].x;
        tiles[i].y = positions[tilePos].y;
    }

    var fixedTileIndex = 5;
    var fixedTileSprite = PIXI.Sprite.fromImage('assets/tile_fixed.png');
    // fixedTileSprite.anchor.set(0.5);
    var tileObj = getTileAtPos(fixedTileIndex).tile;
    tileObj.removeChild(tileObj.tile);
    tileObj.addChild(fixedTileSprite);
    tileObj.tile = fixedTileSprite;
    tileObj.isFixed = true;

    var gameTimer = 0;
    // Listen for animate update
    app.ticker.add(function (delta) {
        Tween.runTweens();
        gameTimer += delta;

        if (gameTimer > 0.5) {
            gameTimer = 0;
            startTile.gear.rotation += 0.025;
            if(endTile.isRotating){
                endTile.gear.rotation += 0.025;
            }
            for (var i = 0; i < numTiles; i++) {
                if (tiles[i].gear.isRotating)
                    tiles[i].gear.rotation += 0.025;
            }
        }
    });
};

// pixi fullscreen resize : ref
// https://codepen.io/iamnotsam/pen/RgeOrK
window.addEventListener("resize", function () {
    console.log('resize');
    app.renderer.resize(window.outerWidth, window.innerHeight);
    infoText.x = window.innerWidth / 2;
    infoText.y = window.innerHeight - 40;


    tileStartX = window.innerWidth / 2 - numCols / 2 * tileWidth;
    // set new positions
    for (var i = 0; i < numTiles; i++) {
        var row = Math.floor(i / numCols);
        var col = Math.floor(i % numCols);

        positions[i].x = tileStartX + col * tileWidth;
        positions[i].y = tileStartY + row * tileWidth;
    }

    for (var i = 0; i < numTiles; i++) {
        var tilePos = currentPosition[i];
        tiles[i].x = positions[tilePos].x;
        tiles[i].y = positions[tilePos].y;
    }

    var row = 3, col = -1;
    startTile.x = tileStartX + col * tileWidth;
    startTile.y = tileStartY + row * tileWidth;

    row = 0;
    col = 4;
    endTile.x = tileStartX + col * tileWidth;
    endTile.y = tileStartY + row * tileWidth;
});