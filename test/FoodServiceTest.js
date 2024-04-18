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

    describe('reinitialize', () => {
        it('should clear existing food and generate default amount', () => {
            foodService.reinitialize();
            expect(foodService.getFoodAmount()).to.equal(ServerConfig.FOOD.DEFAULT_AMOUNT);
            expect(mockBoardOccupancyService.addFoodOccupancy.called).to.be.true;
        });
    });

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

    describe('generateSingleFood', () => {
        it('should not generate food if there is no unoccupied coordinate', () => {
            mockBoardOccupancyService.getRandomUnoccupiedCoordinate.returns(null);
            foodService.generateSingleFood();
            expect(foodService.getFoodAmount()).to.equal(0);
            sinon.assert.calledWith(mockNotificationService.broadcastNotification,
                'Could not add more food. No room left.', 'white');
        });

        it('should not generate food if no unoccupied coordinate is available', () => {
            mockBoardOccupancyService.getRandomUnoccupiedCoordinate.returns(null);
            foodService.generateSingleFood();
            // eslint-disable-next-line max-len
            expect(mockNotificationService.broadcastNotification.calledWith('Could not add more food.  No room left.', 'white')).to.be.true;
        });
    });

    describe('generateFood', () => {
        it('should generate the specified amount of food', () => {
            const amountToGenerate = 3;
            foodService.generateFood(amountToGenerate);
            expect(Object.keys(foodService.getFood()).length).to.equal(ServerConfig.FOOD.DEFAULT_AMOUNT + amountToGenerate);
        });
    });

    describe('getLastFoodIdSpawned', () => {
        it('should return the last food id spawned', () => {
            // Make sure there is at least one food
            foodService.generateSingleFood();
            const lastFoodId = foodService.getLastFoodIdSpawned();
            expect(lastFoodId).to.be.a('string');
            expect(foodService.getFood()).to.have.property(lastFoodId);
        });
    });

    describe('consumeAndRespawnFood', () => {
        it('should handle food swap if SWAP food is consumed and more than one player exists', () => {
            // Setup for SWAP food consumption
            const mockPlayer1 = { id: 'player1', grow: sinon.spy() };
            const mockPlayer2 = { id: 'player2', grow: sinon.spy() };
            playerContainer = {
                getPlayer: sinon.stub(),
                getNumberOfPlayers: sinon.stub().returns(2),
                getAnActivePlayer: sinon.stub().returns(mockPlayer2)
            };

            // Stub getPlayer to return different players based on id
            playerContainer.getPlayer.withArgs('player1').returns(mockPlayer1);
            playerContainer.getPlayer.withArgs('player2').returns(mockPlayer2);

            // Setup food consumed as SWAP food
            const foodsConsumed = [{ playerId: 'player1', foodId: 'food123' }];
            const swapFood = new Food('food123', { x: 5, y: 5 }, ServerConfig.FOOD.SWAP.TYPE, ServerConfig.FOOD.SWAP.COLOR);
            foodService.food = { 'food123': swapFood };

            mockBoardOccupancyService.getFoodsConsumed.returns(foodsConsumed);
            
            foodService.consumeAndRespawnFood(playerContainer);

            // Assert swap happened
            sinon.assert.calledWith(mockNotificationService.notifyPlayerFoodCollected, 'player1', 'Swap!', sinon.match.any, sinon.match.any, true);
            sinon.assert.calledWith(mockNotificationService.notifyPlayerFoodCollected, 'player2', 'Swap!', sinon.match.any, sinon.match.any, true);
        });
    });

    
});

