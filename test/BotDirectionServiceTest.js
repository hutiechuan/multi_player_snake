const assert = require('chai').assert;
const Coordinate = require('../app/models/coordinate');
const Direction = require('../app/models/direction');
const Player = require('../app/models/player');
const BoardOccupancyService = require('../app/services/board-occupancy-service');
const BotDirectionService = require('../app/services/bot-direction-service');
const sinon = require('sinon');
const GameControlsService = require('../app/services/game-controls-service');

describe('BotDirectionService', () => {


    'use strict';

    let bot;
    let boardOccupancyService;
    let botDirectionService;

    beforeEach(() => {
        bot = new Player();
        bot._segments = [new Coordinate(10, 10)];
        bot.changeDirection(Direction.RIGHT);
        boardOccupancyService = new BoardOccupancyService();
        botDirectionService = new BotDirectionService(boardOccupancyService);
    });

    //Restore all methods that have been Sinon stub or mocked.
    afterEach(() => {
        sinon.restore();
    });

    // White box test: Tests that no direction change occurs when no danger is present.
    it('should not change direction if no immediate danger is detected', done => {
        sinon.stub(botDirectionService, 'isBotInDanger').returns(false);  // No danger at all
        const initialDirection = bot.direction;

        botDirectionService.changeDirectionIfInDanger(bot);

        // Assert the direction did not change
        assert.equal(bot.direction, initialDirection);
        done();
    });

    // White box test: Ensures no direction change when safe two spaces ahead.
    it('should not change direction if it is safe two spaces ahead', done => {
        botDirectionService.changeDirectionIfInDanger(bot);
        assert.equal(bot.direction, Direction.RIGHT);
        done();
    });

    // White box test: Verifies direction change when one space ahead is occupied.
    it('should change direction if it one space ahead is occupied', done => {
        boardOccupancyService.addPlayerOccupancy('player2', [new Coordinate(11, 10)]);
        botDirectionService.changeDirectionIfInDanger(bot);
        assert.isTrue(bot.direction === Direction.UP || bot.direction === Direction.DOWN);
        done();
    });

    // White box test: Checks for a direction change when two spaces ahead are occupied.
    it('should change direction if it two spaces ahead is occupied', done => {
        boardOccupancyService.addPlayerOccupancy('player2', [new Coordinate(12, 10)]);
        botDirectionService.changeDirectionIfInDanger(bot);
        assert.isTrue(bot.direction === Direction.UP || bot.direction === Direction.DOWN);
        done();
    });



    /**  3
     *
     * 111 2
     *
     */
    // White box test: Evaluates direction changes based on complex spatial threats.
    it('should change direction if it two spaces ahead is occupied and left two spaces ahead is occupied', done => {
        boardOccupancyService.addPlayerOccupancy('player2', [new Coordinate(12, 10)]);
        boardOccupancyService.addPlayerOccupancy('player3', [new Coordinate(10, 8)]);
        botDirectionService.changeDirectionIfInDanger(bot);
        assert.equal(bot.direction, Direction.DOWN);
        done();
    });

    /**  3
     *
     * 1112
     *
     */
    // White box test: Ensures direction change logic handles adjacent threats properly.
    it('should change direction if space ahead is occupied and left two spaces ahead is occupied', done => {
        boardOccupancyService.addPlayerOccupancy('player2', [new Coordinate(11, 10)]);
        boardOccupancyService.addPlayerOccupancy('player3', [new Coordinate(10, 8)]);
        botDirectionService.changeDirectionIfInDanger(bot);
        assert.equal(bot.direction, Direction.DOWN);
        done();
    });

    /**  3
     * 1112
     *
     */
    // White box test: Tests immediate and adjacent threat handling for direction changes.
    it('should change direction if space ahead is occupied and left space is occupied', done => {
        boardOccupancyService.addPlayerOccupancy('player2', [new Coordinate(11, 10)]);
        boardOccupancyService.addPlayerOccupancy('player3', [new Coordinate(10, 9)]);
        botDirectionService.changeDirectionIfInDanger(bot);
        assert.equal(bot.direction, Direction.DOWN);
        done();
    });

    /**
     * 111 2
     *
     *   3
     */
    // White box test: Assesses response to threats from multiple directions.
    it('should change direction if it two spaces ahead is occupied and right two spaces ahead is occupied', done => {
        boardOccupancyService.addPlayerOccupancy('player2', [new Coordinate(12, 10)]);
        boardOccupancyService.addPlayerOccupancy('player3', [new Coordinate(10, 12)]);
        botDirectionService.changeDirectionIfInDanger(bot);
        assert.equal(bot.direction, Direction.UP);
        done();
    });

    /**
     * 111 2
     *   3
     */
    // White box test: Confirms direction change when facing sequential threats on one side.
    it('should change direction if it two spaces ahead is occupied and right space is occupied', done => {
        boardOccupancyService.addPlayerOccupancy('player2', [new Coordinate(12, 10)]);
        boardOccupancyService.addPlayerOccupancy('player3', [new Coordinate(10, 11)]);
        botDirectionService.changeDirectionIfInDanger(bot);
        assert.equal(bot.direction, Direction.UP);
        done();
    });

    /**
     * 1112
     *   3
     */
    // White box test: Verifies navigation adjustment to immediate and nearby threats.
    it('should change direction if space ahead is occupied and right space is occupied', done => {
        boardOccupancyService.addPlayerOccupancy('player2', [new Coordinate(11, 10)]);
        boardOccupancyService.addPlayerOccupancy('player3', [new Coordinate(10, 11)]);
        botDirectionService.changeDirectionIfInDanger(bot);
        assert.equal(bot.direction, Direction.UP);
        done();
    });

    // White box test: Tests thoroughness in evaluating all safe direction alternatives under blockade.
    it('should exhaust all direction alternatives when each direction is blocked', done => {
        // Assume the bot is initially moving RIGHT
        sinon.stub(botDirectionService, 'isBotInDanger')
             .onCall(0).returns(true)  // Danger two spaces ahead in the current direction (RIGHT)
             .onCall(1).returns(true)  // Danger in the first alternative (UP)
             .onCall(2).returns(true)  // Danger in the second alternative (DOWN)
             .onCall(3).returns(false) // Finally no danger when checking one space ahead (RIGHT again)
             .onCall(4).returns(false); // No danger in the final fallback (DOWN)

        sinon.stub(GameControlsService, 'getValidNextMove').returns(['UP', 'DOWN']);
        sinon.stub(botDirectionService, '_getRandomIntegerInRange').returns(0);  // Choose first option initially

        botDirectionService.changeDirectionIfInDanger(bot);
        assert.notEqual(bot.direction, Direction.RIGHT); // Expect the direction to change from the initial
        done();
    });

    // Black box test: Tests random direction change functionality based on available valid moves.
    it('should correctly execute changeToRandomDirection', done => {
        // Setting up return values for the direction choices
        sinon.stub(GameControlsService, 'getValidNextMove').returns(['UP', 'LEFT']);
        sinon.stub(botDirectionService, '_getRandomIntegerInRange').returns(1);  // Force selection of 'LEFT'

        botDirectionService.changeToRandomDirection(bot);
        assert.equal(bot.direction, 'LEFT'); // Expect the direction to be randomly set to 'LEFT'
        done();
    });

    // Black box test: Ensures that all potential directional outcomes are considered.
    it('should cover all branches in changeToRandomDirection', () => {
        const validDirections = ['UP', 'DOWN'];
        sinon.stub(GameControlsService, 'getValidNextMove').returns(validDirections);

        // First possible outcome
        sinon.stub(botDirectionService, '_getRandomIntegerInRange').returns(0);
        botDirectionService.changeToRandomDirection(bot);
        assert.equal(bot.direction, 'UP');

        // Second possible outcome
        botDirectionService._getRandomIntegerInRange.returns(1);
        botDirectionService.changeToRandomDirection(bot);
        assert.equal(bot.direction, 'DOWN');

        // Cleanup stubs if necessary
        botDirectionService._getRandomIntegerInRange.restore();
    });

    // White box test: Ensures accurate detection of out-of-bounds scenarios for safety assessments.
    it('should cover all branches in isBotInDanger - out-of-bounds scenario', () => {
        const headCoordinate = new Coordinate(0, 0);
        const direction = Direction.UP;

        sinon.stub(boardOccupancyService, 'isOutOfBounds').returns(true);

        const result = botDirectionService.isBotInDanger(headCoordinate, direction, 2);
        assert.isTrue(result, 'Bot should be in danger if next space is out-of-bounds');
    });

    // White box test: Tests safety checks for occupied spaces affecting bot navigation.
    it('should cover all branches in isBotInDanger - space not safe scenario', () => {
        const headCoordinate = new Coordinate(5, 5);
        const direction = Direction.DOWN;

        sinon.stub(boardOccupancyService, 'isOutOfBounds').returns(false);
        sinon.stub(boardOccupancyService, 'isSafe').returns(false);

        const result = botDirectionService.isBotInDanger(headCoordinate, direction, 2);
        assert.isTrue(result, 'Bot should be in danger if next space is occupied');
    });

// White box test: Verifies that all logical paths in the changeToRandomDirection method are exercised, ensuring each potential
// random outcome is tested.
    it('should cover all branches in changeToRandomDirection', () => {
        const validDirections = ['UP', 'DOWN'];
        sinon.stub(GameControlsService, 'getValidNextMove').returns(validDirections);

        // First possible outcome
        sinon.stub(botDirectionService, '_getRandomIntegerInRange').returns(0);
        botDirectionService.changeToRandomDirection(bot);
        assert.equal(bot.direction, 'UP');

        // Second possible outcome
        botDirectionService._getRandomIntegerInRange.returns(1);
        botDirectionService.changeToRandomDirection(bot);
        assert.equal(bot.direction, 'DOWN');

        // Cleanup stubs if necessary
        botDirectionService._getRandomIntegerInRange.restore();
    });


});





