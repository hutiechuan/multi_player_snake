const assert = require('chai').assert;
const NameService = require('../app/services/name-service');

describe('NameService', () => {
    'use strict';

    const NUMBER_OF_NAMES_TO_TEST = 500;

    let nameService;

    beforeEach(() => {
        nameService = new NameService();
    });

    it('should clear all used names on reinitialize', () => {
        nameService.usePlayerName('Player1');
        nameService.usePlayerName('Player2');
        assert.isTrue(nameService.doesPlayerNameExist('Player1'));
        assert.isTrue(nameService.doesPlayerNameExist('Player2'));
        nameService.reinitialize();
        assert.isFalse(nameService.doesPlayerNameExist('Player1'));
        assert.isFalse(nameService.doesPlayerNameExist('Player2'));
    });

    it('should clear all used food IDs on reinitialize', () => {
        const foodId1 = nameService.getFoodId();
        const foodId2 = nameService.getFoodId();
        // The assumption is that getFoodId will store the IDs internally.
        nameService.reinitialize();
        // Use indirect testing by ensuring that the same ID can be generated again, assuming a low chance of collision.
        const newFoodId = nameService.getFoodId();
        assert.oneOf(newFoodId, [foodId1, foodId2]); // This is a probabilistic test.
    });

    it('should generate unique bot IDs', () => {
        const botId1 = nameService.getBotId();
        nameService.usePlayerName('Player1'); // Pretend 'Player1' might collide with a bot name.
        const botId2 = nameService.getBotId();
        assert.notEqual(botId1, botId2);
        assert.isFalse(nameService.doesPlayerNameExist(botId1));
        assert.isTrue(nameService.doesPlayerNameExist(botId2));
    });

    

    it('should generate a new unused player name', done => {
        const nameService = new NameService();
        const usedNames = new Set();
        for (let i = 0; i < NUMBER_OF_NAMES_TO_TEST; i++) {
            usedNames.add(nameService.getPlayerName());
        }
        assert.equal(usedNames.size, NUMBER_OF_NAMES_TO_TEST);

        done();
    });
});
