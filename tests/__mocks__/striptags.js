module.exports = jest.fn((html) => html.replace(/<[^>]*>/g, ''));
