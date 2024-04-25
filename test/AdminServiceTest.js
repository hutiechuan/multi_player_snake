const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const AdminService = require('../app/services/admin-service');
const ServerConfig = require('../app/configs/server-config');
const assert = chai.assert;

describe('AdminService', function() {
    let adminService, mockPlayerContainer, mockFoodService, mockNameService, mockNotificationService, mockPlayerService, mockPlayer;

    beforeEach(function() {
        mockPlayerContainer = {
            getPlayer: sinon.stub()
        };
        mockFoodService = {
            generateSingleFood: sinon.stub(),
            getFoodAmount: sinon.stub(),
            getLastFoodIdSpawned: sinon.stub(),
            removeFood: sinon.stub()
        };
        mockNameService = {
            getBotId: sinon.stub()
        };
        mockNotificationService = {
            broadcastNotification: sinon.stub()
        };
        mockPlayerService = {
            createPlayer: sinon.stub(),
            disconnectPlayer: sinon.stub()
        };
        mockPlayer = {
            id: 1,
            name: 'John Doe',
            color: 'red'
        };

        adminService = new AdminService(mockPlayerContainer, mockFoodService, mockNameService, mockNotificationService, mockPlayerService);
        mockPlayerContainer.getPlayer.returns(mockPlayer);
    });

    // changeBots

    describe('changeBots', function() {
// White box test: Checks internal logic to add a bot and ensure notifications are handled.
        it('should add a bot if INCREASE option is selected', function() {
            const botOption = ServerConfig.INCREMENT_CHANGE.INCREASE;
            adminService.changeBots(1, botOption);
            sinon.assert.calledOnce(mockNotificationService.broadcastNotification);
        });

// White box test: Ensures a bot is removed if present, verifying interaction with player service.
        it('should remove a bot if DECREASE option is selected and bots exist', function() {
            adminService.botIds = ['bot1']; // Assume there is already one bot
            const botOption = ServerConfig.INCREMENT_CHANGE.DECREASE;
            adminService.changeBots(1, botOption);
            sinon.assert.calledOnce(mockPlayerService.disconnectPlayer);
        });

// White box test: Confirms no action is taken if no bots are available to be removed.
        it('should do nothing if DECREASE option is selected but no bots exist', function() {
            const botOption = ServerConfig.INCREMENT_CHANGE.DECREASE;
            adminService.changeBots(1, botOption);
            sinon.assert.notCalled(mockPlayerService.disconnectPlayer);
        });

// White box test: Tests reset functionality to ensure bots are reset to default count.
        it('should reset bots to default if RESET option is selected', function() {
            adminService.botIds = ['bot1', 'bot2', 'bot3'];
            const botOption = ServerConfig.INCREMENT_CHANGE.RESET;
            adminService.changeBots(1, botOption);
            expect(adminService.botIds.length).to.equal(ServerConfig.DEFAULT_STARTING_BOTS);
        });

// White box test: Checks addition of bots against a maximum limit and ensures notifications are correct.
        it('should not add a bot if at maximum limit', function() {
            const botOption = ServerConfig.INCREMENT_CHANGE.INCREASE;
            adminService.botIds = new Array(ServerConfig.MAX_BOTS).fill('botId');
            mockPlayerService.createPlayer.callsFake(() => ({ id: 'newBotId', name: 'New Bot', color: 'green' }));

            adminService.changeBots(mockPlayer.id, botOption);
            expect(adminService.botIds.length).to.equal(ServerConfig.MAX_BOTS);  // Should not exceed max bots
            sinon.assert.calledWith(mockNotificationService.broadcastNotification, sinon.match.string, mockPlayer.color);
        });

    });


    //changeFood

    describe('changeFood', function() {
// White box test: Tests food addition and ensures interaction with the food service is correct.
        it('should add food if INCREASE option is selected', function() {
            const foodOption = ServerConfig.INCREMENT_CHANGE.INCREASE;
            adminService.changeFood(1, foodOption);
            sinon.assert.calledOnce(mockFoodService.generateSingleFood);
        });

// White box test: Ensures food removal logic is correctly handled when food is present.
        it('should remove food if DECREASE option is selected and food exists', function() {
            mockFoodService.getFoodAmount.returns(1); // Assume there is at least one food
            const foodOption = ServerConfig.INCREMENT_CHANGE.DECREASE;
            adminService.changeFood(1, foodOption);
            sinon.assert.calledOnce(mockFoodService.removeFood);
        });

// White box test: Handles cases where an attempt to decrease food when none exists is made.
        it('should handle attempt to decrease food when none exists', function() {
            const foodOption = ServerConfig.INCREMENT_CHANGE.DECREASE;
            mockFoodService.getFoodAmount.returns(0);  // No food available

            adminService.changeFood(mockPlayer.id, foodOption);
            sinon.assert.calledWith(mockNotificationService.broadcastNotification, `${mockPlayer.name} couldn't remove food.`, mockPlayer.color);
        });

    });
    // change speed
    describe('changeSpeed', function() {
// White box test: Verifies game speed increase within allowed limits.
        it('should increase the game speed if not at maximum FPS', function() {
            const initialSpeed = adminService.currentFPS;
            const speedOption = ServerConfig.INCREMENT_CHANGE.INCREASE;
            if (initialSpeed < ServerConfig.MAX_FPS) {
                adminService.changeSpeed(mockPlayer.id, speedOption);
                expect(adminService.currentFPS).to.equal(initialSpeed + 1);
            }
        });

// White box test: Ensures game speed does not exceed maximum settings.
        it('should not increase the game speed if at maximum FPS', function() {
            adminService.currentFPS = ServerConfig.MAX_FPS;
            const speedOption = ServerConfig.INCREMENT_CHANGE.INCREASE;
            adminService.changeSpeed(mockPlayer.id, speedOption);
            expect(adminService.currentFPS).to.equal(ServerConfig.MAX_FPS);
        });

// White box test: Checks the decrease in game speed when above the minimum.
        it('should decrease the game speed if not at minimum FPS', function() {
            const initialSpeed = adminService.currentFPS;
            const speedOption = ServerConfig.INCREMENT_CHANGE.DECREASE;
            if (initialSpeed > ServerConfig.MIN_FPS) {
                adminService.changeSpeed(mockPlayer.id, speedOption);
                expect(adminService.currentFPS).to.equal(initialSpeed - 1);
            }
        });

// White box test: Ensures speed does not fall below the minimum setting.
        it('should not decrease the game speed if at minimum FPS', function() {
            adminService.currentFPS = ServerConfig.MIN_FPS;
            const speedOption = ServerConfig.INCREMENT_CHANGE.DECREASE;
            adminService.changeSpeed(mockPlayer.id, speedOption);
            expect(adminService.currentFPS).to.equal(ServerConfig.MIN_FPS);
        });

// White box test: Resets game speed to default.
        it('should reset the game speed to default', function() {
            const speedOption = ServerConfig.INCREMENT_CHANGE.RESET;
            adminService.changeSpeed(mockPlayer.id, speedOption);
            expect(adminService.currentFPS).to.equal(ServerConfig.STARTING_FPS);
        });
    });

    describe('changeStartLength', function() {
// White box test: Tests for incrementing the start length within operational parameters.
        it('should increase the start length', function() {
            const initialLength = adminService.playerStartLength;
            const lengthOption = ServerConfig.INCREMENT_CHANGE.INCREASE;
            adminService.changeStartLength(mockPlayer.id, lengthOption);
            expect(adminService.playerStartLength).to.equal(initialLength + 1);
        });

// White box test: Ensures decrement of start length when above the minimum.
        it('should decrease the start length if not at minimum', function() {
            adminService.playerStartLength = 5; // Assume starting length is greater than 1
            const lengthOption = ServerConfig.INCREMENT_CHANGE.DECREASE;
            adminService.changeStartLength(mockPlayer.id, lengthOption);
            expect(adminService.playerStartLength).to.equal(4); // Expect to decrease by 1
        });

// White box test: Prevents start length from falling below the minimum.
        it('should not decrease the start length if at minimum', function() {
            adminService.playerStartLength = 1; // Minimum start length
            const lengthOption = ServerConfig.INCREMENT_CHANGE.DECREASE;
            adminService.changeStartLength(mockPlayer.id, lengthOption);
            expect(adminService.playerStartLength).to.equal(1); // Should remain unchanged
        });

// White box test: Resets start length to default configuration.
        it('should reset the start length to default', function() {
            adminService.playerStartLength = 10; // Some modified length
            const lengthOption = ServerConfig.INCREMENT_CHANGE.RESET;
            adminService.changeStartLength(mockPlayer.id, lengthOption);
            expect(adminService.playerStartLength).to.equal(ServerConfig.PLAYER_STARTING_LENGTH);
        });
    });
});
