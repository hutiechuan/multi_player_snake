const assert = require('chai').assert;
const ValidationService = require('../app/services/validation-service');

describe('ValidationService', () => {
    'use strict';

    it('should allow a valid base64 data uri', done => {
        const base64DataURI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAA' +
        'gUlEQVQoU62QKxKAMAxENwKJ4UpwISwHwHIhuBIGiQjTkLZJYAZDVWZ3X/MhhMcAE0BJtnWOifEGJS2D1o8A68+SMW' +
        'YpcyFBrC3QN77hdgLDUSZKAMfghFECM5YKK+gB2gHu4ADV8A+gA3yNdB/GLPwA6uJkz1ogB5hwOHXt8itwARFkTQm4' +
        'zzzPAAAAAElFTkSuQmCC';

        const isValid = ValidationService.isValidBase64DataURI(base64DataURI);
        assert.isTrue(isValid);

        done();
    });

    it('should not allow an invalid base64 data uri', done => {
        const base64DataURI = 'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAA' +
        'gUlEQVQoU62QKxKAMAxENwKJ4UpwISwHwHIhuBIGiQjTkLZJYAZDVWZ3X/MhhMcAE0BJtnWOifEGJS2D1o8A68+SMW' +
        'YpcyFBrC3QN77hdgLDUSZKAMfghFECM5YKK+gB2gHu4ADV8A+gA3yNdB/GLPwA6uJkz1ogB5hwOHXt8itwARFkTQm4' +
        'zzzPAAAAAElFTkSuQmCC';

        const isValid = ValidationService.isValidBase64DataURI(base64DataURI);
        assert.isFalse(isValid);

        done();
    });

    describe('cleanString', () => {
        it('should clean and escape the string', () => {
            const dirtyString = " Hello! <script>alert('xss');</script> ";
            const cleaned = ValidationService.cleanString(dirtyString);
            assert.equal(cleaned, "Hello! &lt;script&gt;alert('xss');&lt;/script&gt;");
        });

        it('should return false for non-string input', () => {
            const nonStringInput = { some: 'object' };
            const cleaned = ValidationService.cleanString(nonStringInput);
            assert.isFalse(cleaned);
        });
    });

    describe('isString', () => {
        it('should return true for string input', () => {
            const stringInput = "This is a string";
            const result = ValidationService.isString(stringInput);
            assert.isTrue(result);
        });

        it('should return false for non-string input', () => {
            const nonStringInput = 12345;
            const result = ValidationService.isString(nonStringInput);
            assert.isFalse(result);
        });
    });

    describe('isValidPlayerName', () => {
        it('should return true for a valid player name', () => {
            const validName = "ValidPlayer1";
            const isValid = ValidationService.isValidPlayerName(validName);
            assert.isTrue(isValid);
        });

        it('should return false for an empty player name', () => {
            const invalidName = "";
            const isValid = ValidationService.isValidPlayerName(invalidName);
            assert.isFalse(isValid);
        });

        it('should return false for a name that is too long', () => {
            const longName = "ThisNameIsWayTooLongToBeConsideredValid";
            const isValid = ValidationService.isValidPlayerName(longName);
            assert.isFalse(isValid);
        });
    });
});
