// FoodService.test.js
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const FoodService = require('../app/services/food-service');
const ServerConfig = require('../app/configs/server-config');
const Food = require('../app/models/food');

describe('FoodService', () => {
    let foodService;
    let mockPlayerStatBoard;
    let mockBoardOccupancyService;
    let mockNameService;
    let mockNotificationService;
    let playerContainer;

    beforeEach(() => {
        mockPlayerStatBoard = { increaseScore: sinon.spy() };
        mockBoardOccupancyService = {
            getFoodsConsumed: sinon.stub().returns([]),
            getRandomUnoccupiedCoordinate: sinon.stub().returns({ x: 5, y: 5 }),
            addFoodOccupancy: sinon.spy(),
            removeFoodOccupancy: sinon.spy(),
            removePlayerOccupancy: sinon.spy(),
            addPlayerOccupancy: sinon.spy()
        };
        mockNameService = { getFoodId: sinon.stub().returns('food123'), returnFoodId: sinon.spy() };
        mockNotificationService = { notifyPlayerFoodCollected: sinon.spy(), broadcastNotification: sinon.spy() };
        foodService = new FoodService(mockPlayerStatBoard, mockBoardOccupancyService, mockNameService, mockNotificationService);
    });
    //Blackbox test, this test checks whether the reinitialize method behaves as expected
    // from an external perspective—clearing existing food and generating the default amount,
    describe('reinitialize', () => {
        it('should clear existing food and generate default amount', () => {
            foodService.reinitialize();
            expect(foodService.getFoodAmount()).to.equal(1);
            expect(mockBoardOccupancyService.addFoodOccupancy.called).to.be.true;
        });
    });

    // Black Box Testing: Focus on functionality based on external inputs and expected outputs
    describe('consumeAndRespawnFood', () => {
        it('should handle food consumption and respawn the same amount', () => {
            const mockPlayer = {
                id: 'player1', grow: sinon.spy(), getSegments: sinon.stub().returns([]),
                getHeadCoordinate: sinon.stub().returns({ x: 10, y: 10 })
            };
            playerContainer = {
                getPlayer: sinon.stub().returns(mockPlayer),
                getNumberOfPlayers: sinon.stub().returns(2),
                getAnActivePlayer: sinon.stub().returns(mockPlayer)
            };

            mockBoardOccupancyService.getFoodsConsumed.returns([{ playerId: 'player1', foodId: 'food123' }]);
            foodService.consumeAndRespawnFood(playerContainer);

            // eslint-disable-next-line no-unused-expressions
            expect(mockPlayerStatBoard.increaseScore.calledOnce).to.be.true;
            expect(mockNotificationService.notifyPlayerFoodCollected.calledOnce).to.be.true;
            expect(foodService.getFoodAmount()).to.be.at.least(1); // Check that food is respawned
        });
    });

    // Black Box Testing: Tests based on external expectations (no room left)
    describe('generateSingleFood', () => {
        it('should not generate food if there is no unoccupied coordinate', () => {
            mockBoardOccupancyService.getRandomUnoccupiedCoordinate.returns(null);
            foodService.generateSingleFood();
            expect(foodService.getFoodAmount()).to.equal(0);
            sinon.assert.calledWith(mockNotificationService.broadcastNotification,
                'Could not add more food. No room left.', 'white');
        });
    });

    // White Box Testing: Examines internal function calls and interactions
    describe('generateFood', () => {
        it('should generate food until space runs out', () => {
            // Setup coordinates for successful and unsuccessful food generation

            // Spy on generateSingleFood to track its calls
            sinon.spy(foodService, 'generateSingleFood');

            // Call the method under test
            foodService.generateFood(3);

            // Verify that generateSingleFood was called exactly twice
            sinon.assert.calledThrice(foodService.generateSingleFood);
            // Clean up the spy to not affect other tests
            foodService.generateSingleFood.restore();
        });
    });

    // White Box Testing: Checks internal state consistency and data handling
    describe('getLastFoodIdSpawned', () => {
        it('should return the last food id spawned', () => {
            // Make sure there is at least one food
            foodService.generateSingleFood();
            const lastFoodId = foodService.getLastFoodIdSpawned();
            expect(lastFoodId).to.be.a('string');
            expect(foodService.getFood()).to.have.property(lastFoodId);
        });
    });



});

