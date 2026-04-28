module.exports = jest.fn().mockImplementation(() => ({
  parseURL: jest.fn().mockResolvedValue({ items: [] }),
}));
