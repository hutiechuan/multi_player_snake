const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const ImageService = require('../app/services/image-service');
const ValidationService = require('../app/services/validation-service');

describe('ImageService', function() {
    let imageService, mockPlayerContainer, mockPlayerStatBoard, mockNotificationService, mockPlayer;

    // Set up mocks and the instance of ImageService before each test
    beforeEach(function() {
        mockPlayerContainer = {
            getPlayer: sinon.stub()
        };
        mockPlayerStatBoard = {
            clearPlayerImage: sinon.stub()
        };
        mockNotificationService = {
            broadcastClearBackgroundImage: sinon.stub(),
            broadcastNotification: sinon.stub(),
            broadcastNewBackgroundImage: sinon.stub()
        };
        mockPlayer = {
            name: 'John Doe',
            color: 'red',
            setBase64Image: sinon.stub()
        };
        mockPlayerContainer.getPlayer.returns(mockPlayer);

        imageService = new ImageService(mockPlayerContainer, mockPlayerStatBoard, mockNotificationService);
    });

    // Test to verify if the constructor initializes with expected default values
    describe('constructor', function() {
        it('should initialize with expected default values', function() {
            expect(imageService.backgroundImage).to.be.false;
        });
    });

    // Test cases for clearPlayerImage method
    describe('clearPlayerImage', function() {
        // Test if the player image is cleared and a notification is broadcast
        it('should clear the player image and broadcast notification if player exists', function() {
            const playerId = 1;  // Assuming this ID is valid
            const player = { id: playerId, name: "John Doe", color: "blue", base64Image: "someImageData" };
            mockPlayerContainer.getPlayer.returns(player);
    
            imageService.clearPlayerImage(playerId);
    
            expect(player.base64Image).to.be.undefined;
            sinon.assert.calledWith(mockNotificationService.broadcastNotification, `${player.name} has removed their image.`, player.color);
        });

        // Test handling of the method when the player does not exist
        it('should handle scenario where player does not exist', function() {
            mockPlayerContainer.getPlayer.returns(null); // Simulate player not found
            imageService.backgroundImage = true; // Assume background image is set
    
            imageService.clearBackgroundImage(999); // Using an ID likely to be invalid
    
            expect(imageService.backgroundImage).to.be.false;
            sinon.assert.notCalled(mockNotificationService.broadcastNotification);
        });
    });

    // Test cases for resetBackgroundImage method
    describe('resetBackgroundImage', function() {
        it('should reset the background image from true to false', function() {
            imageService.backgroundImage = "SomeImage";
            imageService.resetBackgroundImage();
            expect(imageService.backgroundImage).to.be.false;
        });
    });

    // Test cases for updatePlayerImage method
    describe('updatePlayerImage', function() {
        it('should not perform any action if the player is not found', function() {
            mockPlayerContainer.getPlayer.returns(null); // No player found
            const base64Image = 'data:image/png;base64,VALIDBASE64';
    
            imageService.updatePlayerImage(999, base64Image); // Nonexistent player ID
    
            sinon.assert.notCalled(mockPlayer.setBase64Image);
            sinon.assert.notCalled(mockNotificationService.broadcastNotification);
        });
    });

    // Test cases for clearBackgroundImage method
    describe('clearBackgroundImage', function() {
        it('should clear the background image if it is set', function() {
            imageService.backgroundImage = true; // Simulate background image is set
            imageService.clearBackgroundImage(1);
            expect(imageService.backgroundImage).to.be.false;
            sinon.assert.calledOnce(mockNotificationService.broadcastClearBackgroundImage);
            sinon.assert.calledWith(mockNotificationService.broadcastNotification, `${mockPlayer.name} has clear the background image.`, mockPlayer.color);
        });

        it('should do nothing if no background image is set', function() {
            imageService.backgroundImage = false; // Ensure no background image
            imageService.clearBackgroundImage(1);
            expect(mockNotificationService.broadcastClearBackgroundImage.notCalled).to.be.true;
        });
    });

    // Test cases for updateBackgroundImage method
    describe('updateBackgroundImage', function() {
        it('should update the background image and notify when player is found and image is valid', function() {
            const base64Image = 'data:image/png;base64,VALIDBASE64';
            imageService.updateBackgroundImage(mockPlayer.id, base64Image);
            expect(imageService.getBackgroundImage()).to.equal(base64Image);
            sinon.assert.calledOnce(mockNotificationService.broadcastNewBackgroundImage);
            sinon.assert.calledWith(mockNotificationService.broadcastNotification, `${mockPlayer.name} has updated the background image.`, mockPlayer.color);
        });

        it('should not update the background image or notify when player is found and image is invalid', function() {
            const invalidBase64Image = 'INVALIDBASE64';
            mockPlayerContainer.getPlayer.returns(mockPlayer);
            imageService.updateBackgroundImage(mockPlayer.id, invalidBase64Image);
            expect(imageService.getBackgroundImage()).to.not.equal(invalidBase64Image);
            sinon.assert.notCalled(mockNotificationService.broadcastNewBackgroundImage);
            sinon.assert.notCalled(mockNotificationService.broadcastNotification);
        });
    });
});
