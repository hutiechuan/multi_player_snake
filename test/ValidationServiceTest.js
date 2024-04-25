const assert = require('chai').assert;
const ValidationService = require('../app/services/validation-service');


// Describe a block of tests for the ValidationService
describe('ValidationService', () => {
    'use strict';

    // Test case to check if the function correctly identifies a valid Base64 Data URI

    it('should allow a valid base64 data uri', done => {
        const base64DataURI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAA' +
        'gUlEQVQoU62QKxKAMAxENwKJ4UpwISwHwHIhuBIGiQjTkLZJYAZDVWZ3X/MhhMcAE0BJtnWOifEGJS2D1o8A68+SMW' +
        'YpcyFBrC3QN77hdgLDUSZKAMfghFECM5YKK+gB2gHu4ADV8A+gA3yNdB/GLPwA6uJkz1ogB5hwOHXt8itwARFkTQm4' +
        'zzzPAAAAAElFTkSuQmCC';
        // Verify the URI is considered valid
        const isValid = ValidationService.isValidBase64DataURI(base64DataURI);
        assert.isTrue(isValid);

        done();
    });

    // Test case to check the function correctly identifies an invalid Base64 Data URI
    it('should not allow an invalid base64 data uri', done => {
        const base64DataURI = 'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAA' +
        'gUlEQVQoU62QKxKAMAxENwKJ4UpwISwHwHIhuBIGiQjTkLZJYAZDVWZ3X/MhhMcAE0BJtnWOifEGJS2D1o8A68+SMW' +
        'YpcyFBrC3QN77hdgLDUSZKAMfghFECM5YKK+gB2gHu4ADV8A+gA3yNdB/GLPwA6uJkz1ogB5hwOHXt8itwARFkTQm4' +
        'zzzPAAAAAElFTkSuQmCC';

        const isValid = ValidationService.isValidBase64DataURI(base64DataURI);
        assert.isFalse(isValid);

        done();
    });

     // Nested describe block to group tests related to string cleaning
    describe('cleanString', () => {
        // Test cleaning and escaping of HTML special characters to prevent XSS
        it('should clean and escape the string', () => {
            const dirtyString = " Hello! <script>alert('xss');</script> ";
            const cleaned = ValidationService.cleanString(dirtyString);
            assert.equal(cleaned, "Hello! &lt;script&gt;alert('xss');&lt;/script&gt;");
        });
        // Test handling of non-string inputs, which should return false
        it('should return false for non-string input', () => {
            const nonStringInput = { some: 'object' };
            const cleaned = ValidationService.cleanString(nonStringInput);
            assert.isFalse(cleaned);
        });
    });

    // Tests to verify the function that checks if input is a string
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

    // Tests for validating player names with specific conditions
    describe('isValidPlayerName', () => {
        it('should return true for a valid player name', () => {
            const validName = "ValidPlayer1";
            const isValid = ValidationService.isValidPlayerName(validName);
            assert.isTrue(isValid);
        });

        it('should return false for an empty player name', () => {
            const isValid = ValidationService.isValidPlayerName("");
            assert.isFalse(isValid); 
        });

        it('should return false for a name that is too long', () => {
            const longName = "ThisNameIsWayTooLongToBeConsideredValid";
            const isValid = ValidationService.isValidPlayerName(longName);
            assert.isFalse(isValid);
        });
    });
});
