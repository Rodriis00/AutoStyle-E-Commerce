import test from 'node:test';
import assert from 'node:assert/strict';
import { luhn, cardBrand } from '../src/util.js';
test('Luhn válido/ inválido', () => { assert.ok(luhn('4242424242424242')); assert.ok(!luhn('4242424242424241')); assert.ok(luhn('378282246310005')); });
test('Marca de tarjeta', () => { assert.equal(cardBrand('4242424242424242'), 'VISA'); assert.equal(cardBrand('5555555555554444'), 'Mastercard'); assert.equal(cardBrand('378282246310005'), 'AMEX'); assert.equal(cardBrand('6011111111111117'), null); });
