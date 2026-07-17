/**
 * Unit Tests for the custom validators (utils/validators.js).
 * These guard account creation rules: valid emails, well-formed usernames,
 * and password strength.
 */

const { isValidEmail, isValidUsername, isStrongPassword } = require('../../utils/validators');

describe('validators', () => {
    describe('isValidEmail', () => {
        test.each([
            'user@example.com',
            'first.last@sub.domain.co',
            'name+tag@gmail.com',
            'a@b.cd'
        ])('accepts a valid email: %s', (email) => {
            expect(isValidEmail(email)).toBe(true);
        });

        test.each([
            '',
            'plainaddress',
            'no-at-sign.com',
            'missing@domain',
            'space in@email.com',
            'two@@at.com',
            '@no-local.com'
        ])('rejects an invalid email: %s', (email) => {
            expect(isValidEmail(email)).toBe(false);
        });
    });

    describe('isValidUsername', () => {
        test.each(['abc', 'user_name', 'user-name', 'User123', 'a'.repeat(50)])(
            'accepts a valid username: %s',
            (username) => {
                expect(isValidUsername(username)).toBe(true);
            }
        );

        test('rejects usernames shorter than 3 characters', () => {
            expect(isValidUsername('ab')).toBe(false);
        });

        test('rejects usernames longer than 50 characters', () => {
            expect(isValidUsername('a'.repeat(51))).toBe(false);
        });

        test.each(['bad name', 'bad@name', 'emoji🙂', 'has.dot', ''])(
            'rejects a username with illegal characters: %s',
            (username) => {
                expect(isValidUsername(username)).toBe(false);
            }
        );
    });

    describe('isStrongPassword', () => {
        test('accepts a password with length >= 8, upper, lower, and a digit', () => {
            expect(isStrongPassword('Abcdef12')).toBe(true);
            expect(isStrongPassword('StrongPass9')).toBe(true);
        });

        test('rejects a password shorter than 8 characters', () => {
            expect(isStrongPassword('Ab1cd')).toBe(false);
        });

        test('rejects a password missing an uppercase letter', () => {
            expect(isStrongPassword('abcdef12')).toBe(false);
        });

        test('rejects a password missing a lowercase letter', () => {
            expect(isStrongPassword('ABCDEF12')).toBe(false);
        });

        test('rejects a password missing a digit', () => {
            expect(isStrongPassword('Abcdefgh')).toBe(false);
        });
    });
});
