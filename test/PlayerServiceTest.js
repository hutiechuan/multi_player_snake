const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const PlayerService = require('../app/services/player-service');
const PlayerContainer = require('../app/models/player-container');
const PlayerStatBoard = require('../app/models/player-stat-board');
const NotificationService = require('../app/services/notification-service');

describe('PlayerService', function () {
    let playerService, playerContainer, playerStatBoard, notificationService, mockSocket;

    beforeEach(function () {
        playerContainer = sinon.createStubInstance(PlayerContainer);
        playerStatBoard = sinon.createStubInstance(PlayerStatBoard);
        notificationService = sinon.createStubInstance(NotificationService);
        mockSocket = { id: 'socket1', emit: sinon.spy() };

        playerService = new PlayerService(playerContainer, playerStatBoard, notificationService);

        playerService.init(() => 3); // Example starting length
    });

    describe('addPlayer', function () {
        it('should add a player and start game cycle if first player', function () {
            playerContainer.getNumberOfPlayers.returns(0);
            playerService.addPlayer(mockSocket);

            expect(playerService.runGameCycle.calledOnce).to.be.true;
            expect(mockSocket.emit.calledWith('startGame')).to.be.true;
            expect(notificationService.broadcastNotification.called).to.be.true;
        });

        it('should add a player but not start game cycle if not the first player', function () {
            playerContainer.getNumberOfPlayers.returns(1);
            playerService.addPlayer(mockSocket);

            expect(playerService.runGameCycle.notCalled).to.be.true;
            expect(mockSocket.emit.calledWith('joinGame')).to.be.true;
            expect(notificationService.broadcastNotification.called).to.be.true;
        });
    });

    describe('changeColor', function () {
        it('should change player color and broadcast it', function () {
            const player = { id: 'player1', color: 'red' };
            playerContainer.getPlayer.returns(player);
            playerService.changeColor(mockSocket, 'blue');

            expect(player.color).to.equal('blue');
            expect(mockSocket.emit.calledWith('colorChanged', 'blue')).to.be.true;
            expect(notificationService.broadcastNotification.calledWith(`${player.id} has changed colors to blue`)).to.be.true;
        });
    });

    describe('disconnectPlayer', function () {
        it('should remove a disconnected player and update the game state', function () {
            const playerId = 'player1';
            const player = { id: playerId, name: 'Player1', color: 'red' };
            playerContainer.getPlayer.returns(player);

            playerService.disconnectPlayer(playerId);

            expect(notificationService.broadcastNotification.calledWith(`${player.name} has left.`, player.color)).to.be.true;
            expect(playerContainer.removePlayer.calledWith(playerId)).to.be.true;
        });
        it('should handle the disconnection of a non-existent player', function () {
            const playerId = 'nonExistingPlayerId';
            playerContainer.getPlayer.returns(undefined);
      
            playerService.disconnectPlayer(playerId);
      
            expect(playerContainer.getPlayer.calledWith(playerId)).to.be.true;
            expect(notificationService.broadcastNotification.notCalled).to.be.true;
          });
    });

    describe('changePlayerName', function () {
        // Test case: Attempt to change the player name to an invalid one
        it('should not change the name if the new name is invalid', function () {
          const socket = { id: 'socket1', emit: sinon.spy() };
          const invalidName = '***Invalid###'; // Assuming this is invalid
          sinon.stub(ValidationService, 'isValidPlayerName').returns(false);
          
          playerService.changePlayerName(socket, invalidName);
          
          expect(ValidationService.isValidPlayerName.calledOnce).to.be.true;
          expect(ValidationService.isValidPlayerName.returned(false)).to.be.true;
          expect(socket.emit.notCalled).to.be.true;
        });
        
        // ... (other test cases)
      });

    

        describe('handlePlayerCollisions', function () {

            it('should handle single kill collision correctly', function () {
                const killReports = [{
                  isSingleKill: () => true,
                  victimId: 'player1',
                  killerId: 'player1'
                }];
                sinon.stub(boardOccupancyService, 'getKillReports').returns(killReports);
                const player = { name: 'Player1', color: 'red', id: 'player1' };
                playerContainer.getPlayer.returns(player);
          
                playerService.handlePlayerCollisions();
          
                // Check if the notification for suicide is broadcasted
                expect(notificationService.broadcastSuicide.calledWith(player.name, player.color)).to.be.true;
              });

            // Test case: A suicide case where the victim is also the killer
            it('should handle suicide correctly', function () {
                const killReport = {
                    isSingleKill: () => true,
                    victimId: 'player1',
                    killerId: 'player1'
                };
                const player = { id: 'player1', name: 'Victim', color: 'blue', getSegments: sinon.stub().returns([/* segment data */]) };
                sinon.stub(boardOccupancyService, 'getKillReports').returns([killReport]);
                playerContainer.getPlayer.withArgs('player1').returns(player);
    
                playerService.handlePlayerCollisions();
    
                // Verify suicide broadcast
                expect(notificationService.broadcastSuicide.calledWith(player.name, player.color)).to.be.true;
                // Verify that the player is marked for respawn
                expect(playerContainer.addPlayerIdToRespawn.calledWith(player.id)).to.be.true;
            });
    
            // Test case: A single kill with different killer and victim
            it('should handle a single kill correctly', function () {
                const killReport = {
                    isSingleKill: () => true,
                    victimId: 'player1',
                    killerId: 'player2'
                };
                const victim = { id: 'player1', name: 'Victim', color: 'blue', getSegments: sinon.stub().returns([/* segment data */]), clearAllSegments: sinon.spy() };
                const killer = { id: 'player2', name: 'Killer', color: 'red', grow: sinon.spy() };
                sinon.stub(boardOccupancyService, 'getKillReports').returns([killReport]);
                playerContainer.getPlayer.withArgs('player1').returns(victim);
                playerContainer.getPlayer.withArgs('player2').returns(killer);
    
                playerService.handlePlayerCollisions();
    
                // Verify scoring updates and kill broadcast
                expect(playerStatBoard.addKill.calledWith(killer.id)).to.be.true;
                expect(playerStatBoard.increaseScore.calledWith(killer.id)).to.be.true;
                expect(killer.grow.calledOnce).to.be.true;
                expect(notificationService.broadcastKill.called).to.be.true;
                // Verify that the victim is marked for respawn
                expect(playerContainer.addPlayerIdToRespawn.calledWith(victim.id)).to.be.true;
            });
    
            // Test case: A collision with multiple victims
            it('should handle collisions with multiple victims correctly', function () {
                const killReport = {
                    isSingleKill: () => false,
                    getVictimIds: () => ['player1', 'player2']
                };
                const victim1 = { id: 'player1', name: 'Victim1', color: 'blue', getSegments: sinon.stub().returns([/* segment data */]), clearAllSegments: sinon.spy() };
                const victim2 = { id: 'player2', name: 'Victim2', color: 'green', getSegments: sinon.stub().returns([/* segment data */]), clearAllSegments: sinon.spy() };
                sinon.stub(boardOccupancyService, 'getKillReports').returns([killReport]);
                playerContainer.getPlayer.withArgs('player1').returns(victim1);
                playerContainer.getPlayer.withArgs('player2').returns(victim2);
    
                playerService.handlePlayerCollisions();
    
                // Verify that all victims are processed
                expect(playerContainer.addPlayerIdToRespawn.calledWith(victim1.id)).to.be.true;
                expect(playerContainer.addPlayerIdToRespawn.calledWith(victim2.id)).to.be.true;
                expect(notificationService.notifyPlayerDied.calledTwice).to.be.true;
                expect(notificationService.broadcastKillEachOther.calledOnce).to.be.true;
            });
    
            // ... (other test cases if there are more scenarios)
        });
    
      


      describe('movePlayers', function () {
        // Test case: Move a player out of bounds
        it('should handle player moving out of bounds', function () {
          const players = [{ id: 'player1', getHeadCoordinate: sinon.stub(), clearAllSegments: sinon.stub() }];
          playerContainer.getPlayers.returns(players);
          sinon.stub(boardOccupancyService, 'isOutOfBounds').returns(true);
    
          playerService.movePlayers();
    
          // Check if the player is marked for respawn
          expect(playerContainer.addPlayerIdToRespawn.calledWith(players[0].id)).to.be.true;
          // Check if the death notification is sent
          expect(notificationService.broadcastRanIntoWall.called).to.be.true;
        });
    
        // ... (other test cases)
      });


      describe('playerJoinGame', function () {
        // Test case: A player successfully joins the game
        it('should handle a player joining the game', function () {
            const socket = { id: 'socket1', emit: sinon.spy() };
            playerService.playerJoinGame(socket);
    
            // Assuming the playerJoinGame method adds the player to the game
            // and emits a gameJoined event
            expect(playerContainer.addPlayer.calledWithMatch(socket.id)).to.be.true;
            expect(socket.emit.calledWith('gameJoined')).to.be.true;
        });
    
        // ... (additional test cases as necessary)
    });
    
    describe('playerSpectateGame', function () {
        // Test case: A player starts spectating the game
        it('should handle a player starting to spectate', function () {
            const socket = { id: 'socket1', emit: sinon.spy() };
            playerService.playerSpectateGame(socket);
    
            // Assuming the playerSpectateGame method updates player status to spectating
            // and emits a gameSpectating event
            expect(playerContainer.updatePlayerStatusToSpectating.calledWithMatch(socket.id)).to.be.true;
            expect(socket.emit.calledWith('gameSpectating')).to.be.true;
        });
    
        // ... (additional test cases as necessary)
    });
    
    describe('respawnPlayer', function () {
        // Test case: A player is respawned
        it('should respawn a single player', function () {
            const playerId = 'player1';
            playerService.respawnPlayer(playerId);
    
            // Assuming the respawnPlayer method resets the player's state and emits a playerRespawned event
            expect(playerContainer.resetPlayerState.calledWithMatch(playerId)).to.be.true;
            expect(notificationService.broadcastNotification.calledWithMatch(`Player ${playerId} has respawned`)).to.be.true;
        });
    
        // ... (additional test cases as necessary)
    });
    
    describe('respawnPlayers', function () {
        // Test case: Multiple players are respawned
        it('should respawn all players marked for respawn', function () {
            const playersToRespawn = ['player1', 'player2'];
            playerContainer.getPlayersMarkedForRespawn.returns(playersToRespawn);
            
            playerService.respawnPlayers();
    
            // Assuming the respawnPlayers method goes through all players marked for respawn
            playersToRespawn.forEach(playerId => {
                expect(playerContainer.resetPlayerState.calledWith(playerId)).to.be.true;
            });
            expect(notificationService.broadcastNotification.calledTwice).to.be.true;
        });

    });
    


});
