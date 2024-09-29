/**
 * @param {any} input
 * @throws {Error} if the input is not a non-empty array.
 */
function isNonEmptyArray(input) {
    return Array.isArray(input) && input.length > 0;
}

module.exports = {
    isNonEmptyArray
};
