const chai = require('chai');
const sinon = require('sinon');
const expect = chai.expect;
const NotificationService = require('../app/services/notification-service');
const ServerConfig = require('../app/configs/server-config');

describe('NotificationService', () => {
  let notificationService;
  let mockSockets;
  let mockSocket;

  beforeEach(() => {
    mockSockets = {
      emit: sinon.spy(),
      connected: {}
    };
    mockSocket = {
      emit: sinon.spy()
    };
    notificationService = new NotificationService();
    notificationService.setSockets(mockSockets);
  });

  it('should broadcast kill notification', () => {
    notificationService.broadcastKill('Killer', 'Victim', 'red', 'blue', 10);
    sinon.assert.calledWith(mockSockets.emit, ServerConfig.IO.OUTGOING.NOTIFICATION.KILL, 'Killer', 'Victim', 'red', 'blue', 10);
  });

  it('should broadcast kill each other notification', () => {
    const victimSummaries = [{ name: 'Player1' }, { name: 'Player2' }];
    notificationService.broadcastKillEachOther(victimSummaries);
    sinon.assert.calledWith(mockSockets.emit, ServerConfig.IO.OUTGOING.NOTIFICATION.KILLED_EACH_OTHER, victimSummaries);
  });

  it('should broadcast new background image', () => {
    notificationService.broadcastNewBackgroundImage('backgroundImage.png');
    sinon.assert.calledWith(mockSockets.emit, ServerConfig.IO.OUTGOING.NEW_BACKGROUND_IMAGE, 'backgroundImage.png');
  });

  it('should broadcast general notification', () => {
    const consoleSpy = sinon.spy(console, 'log');
    notificationService.broadcastNotification('Game started', 'green');
    sinon.assert.calledWith(consoleSpy, 'Game started');
    sinon.assert.calledWith(mockSockets.emit, ServerConfig.IO.OUTGOING.NOTIFICATION.GENERAL, 'Game started', 'green');
    consoleSpy.restore();
  });


  describe('broadcast methods', () => {
    it('should emit a clear background image event', () => {
      notificationService.broadcastClearBackgroundImage();
      sinon.assert.calledWith(mockSockets.emit, ServerConfig.IO.OUTGOING.NEW_BACKGROUND_IMAGE);
    });

    it('should emit a new game state', () => {
      const gameState = { score: 100 };
      notificationService.broadcastGameState(gameState);
      sinon.assert.calledWith(mockSockets.emit, ServerConfig.IO.OUTGOING.NEW_STATE, gameState);
    });

  });

  describe('broadcastRanIntoWall', () => {
    it('should emit RAN_INTO_WALL to all sockets', () => {
      const playerName = 'John';
      const playerColor = 'blue';

      notificationService.broadcastRanIntoWall(playerName, playerColor);

      expect(mockSockets.emit.calledWith(ServerConfig.IO.OUTGOING.NOTIFICATION.RAN_INTO_WALL, playerName, playerColor)).to.be.true;
    });
  });

  describe('broadcastSuicide', () => {
    it('should emit SUICIDE to all sockets', () => {
      const victimName = 'Jane';
      const victimColor = 'red';

      notificationService.broadcastSuicide(victimName, victimColor);

      expect(mockSockets.emit.calledWith(ServerConfig.IO.OUTGOING.NOTIFICATION.SUICIDE, victimName, victimColor)).to.be.true;
    });
  });


  describe('player-specific notify methods', () => {
    it('should notify a player that they died', () => {
      const playerId = 'player1';
      mockSockets.connected[playerId] = mockSocket;
      
      notificationService.notifyPlayerDied(playerId);
      sinon.assert.calledWith(mockSocket.emit, ServerConfig.IO.OUTGOING.NOTIFICATION.YOU_DIED);
    });

    it('should handle player death notification when socket is not connected', () => {
      const playerId = 'player2';
      
      notificationService.notifyPlayerDied(playerId);
      expect(mockSockets.connected[playerId]).to.be.undefined;
    });

    describe('notifyPlayerDied', () => {
        it('should emit YOU_DIED to the specific player socket', () => {
          const playerId = 'player1';
          mockSockets.connected[playerId] = playerSocket;
    
          notificationService.notifyPlayerDied(playerId);
          
          expect(playerSocket.emit.calledWith(ServerConfig.IO.OUTGOING.NOTIFICATION.YOU_DIED)).to.be.true;
        });
      });
});

    describe('notifyPlayerMadeAKill', function() {
    it('should notify player when they made a kill and the socket is connected', function() {
        // Setup a mock socket for a specific player ID
        const playerId = 'player1';
        mockSockets.connected[playerId] = mockSocket;

        // Act
        notificationService.notifyPlayerMadeAKill(playerId);

        // Assert
        expect(mockSocket.emit.calledWith(ServerConfig.IO.OUTGOING.NOTIFICATION.YOU_MADE_A_KILL)).to.be.true;
    });

    it('should not throw an error if the player socket does not exist', function() {
        // Setup with no mock socket for the player ID
        const playerId = 'player2';

        // Act
        const act = () => notificationService.notifyPlayerMadeAKill(playerId);

        // Assert
        expect(act).to.not.throw();
        expect(mockSockets.emit.called).to.be.false;
    });
});

describe('notifyPlayerFoodCollected', function() {
    it('should notify player when they collect food and the socket is connected', function() {
        // Setup a mock socket for a specific player ID
        const playerId = 'player1';
        const foodText = '+1';
        const coordinate = { x: 5, y: 5 };
        const color = 'red';
        const isSwap = false;
        mockSockets.connected[playerId] = mockSocket;

        // Act
        notificationService.notifyPlayerFoodCollected(playerId, foodText, coordinate, color, isSwap);

        // Assert
        expect(mockSocket.emit.calledWith(ServerConfig.IO.OUTGOING.NOTIFICATION.FOOD_COLLECTED, foodText, coordinate, color, isSwap)).to.be.true;
    });

    it('should not throw an error if the player socket does not exist when collecting food', function() {
        // Setup with no mock socket for the player ID
        const playerId = 'player2';
        const foodText = '+1';
        const coordinate = { x: 5, y: 5 };
        const color = 'red';
        const isSwap = false;

        // Act
        const act = () => notificationService.notifyPlayerFoodCollected(playerId, foodText, coordinate, color, isSwap);

        // Assert
        expect(act).to.not.throw();
        expect(mockSockets.emit.called).to.be.false;
    });
});


});