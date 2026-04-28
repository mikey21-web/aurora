const JSDOM = jest.fn().mockImplementation(() => ({
  window: {
    document: {
      querySelectorAll: jest.fn().mockReturnValue({ forEach: jest.fn() }),
      body: { innerHTML: '<p>Mock content</p>' },
    },
  },
}));
module.exports = { JSDOM };
