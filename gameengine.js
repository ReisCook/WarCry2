window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

class Timer {
    constructor() {
        this.gameTime = 0;
        this.maxStep = 0.05;
        this.wallLastTimestamp = 0;
        this.ticks = [];
    }

    tick() {
        var wallCurrent = performance.now();
        var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
        this.wallLastTimestamp = wallCurrent;

        var gameDelta = Math.min(wallDelta, this.maxStep);
        this.gameTime += gameDelta;

        this.ticks.push(wallDelta);

        let index = this.ticks.length - 1;
        let sum = 0;
        while (sum <= 1 && index >= 0) {
            sum += this.ticks[index--];
        }
        index++;

        this.ticks.splice(0, index);

        return gameDelta;
    }
}

class GameEngine {
    constructor() {
        this.entities = [];
        this.graphs = [];
        this.ctx = null;
        this.surfaceWidth = null;
        this.surfaceHeight = null;
    }

    init(ctx) {
        this.ctx = ctx;
        this.surfaceWidth = this.ctx.canvas.width;
        this.surfaceHeight = this.ctx.canvas.height;
        this.timer = new Timer();
    }

    reset() {
        // Clear all entities and graphs
        this.entities = [];
        this.graphs = [];
        
        // Clear any existing managers
        this.bandManager = null;
        this.combatManager = null;
        this.board = null;

        // Create fresh automata which will set up new simulation
        new Automata();
    }

    start() {
        console.log("starting game");
        var that = this;
        (function gameLoop() {
            that.loop();
            requestAnimFrame(gameLoop, that.ctx.canvas);
        })();
    }

    startInput() {
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    addGraph(graph) {
        this.graphs.push(graph);
    }

    draw() {
        // Clear and draw entities
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        for (var i = 0; i < this.entities.length; i++) {
            this.entities[i].draw(this.ctx);
        }

        // Draw combat and band info
        this.combatManager.draw(this.ctx);
        this.bandManager.draw(this.ctx);

        // Draw graphs
        if (document.getElementById("graphs").checked) {
            for (var i = 0; i < this.graphs.length; i++) {
                this.graphs[i].draw(this.ctx);
            }
        }
    }

    update() {
        var entitiesCount = this.entities.length;

        for (var i = 0; i < entitiesCount; i++) {
            var entity = this.entities[i];

            if (!entity.removeFromWorld) {
                entity.update();
            }
        }
        this.combatManager.update();
        this.bandManager.update();
        
        for (var i = this.entities.length - 1; i >= 0; --i) {
            if (this.entities[i].removeFromWorld) {
                this.entities.splice(i, 1);
            }
        }
    }

    loop() {
        this.clockTick = this.timer.tick();
        var loops = PARAMS.updatesPerDraw;
        while (loops-- > 0) this.update();
        this.draw();
    }
}