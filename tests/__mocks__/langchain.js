const mockInvoke = jest.fn().mockResolvedValue({});
const mockPipe = jest.fn().mockReturnValue({ invoke: mockInvoke });
const mockWithStructuredOutput = jest.fn().mockReturnValue({ invoke: mockInvoke });

const ChatOpenAI = jest.fn().mockImplementation(() => ({
  withStructuredOutput: mockWithStructuredOutput,
  bindTools: jest.fn().mockReturnValue({ invoke: mockInvoke }),
}));

const DallEAPIWrapper = jest.fn().mockImplementation(() => ({
  invoke: jest.fn().mockResolvedValue('https://mock-image.url/image.png'),
}));

const ChatPromptTemplate = {
  fromTemplate: jest.fn().mockReturnValue({ pipe: mockPipe }),
};

const StateGraph = jest.fn().mockImplementation(() => ({
  addNode: jest.fn().mockReturnThis(),
  addEdge: jest.fn().mockReturnThis(),
  addConditionalEdges: jest.fn().mockReturnThis(),
  compile: jest.fn().mockReturnValue({
    invoke: jest.fn().mockResolvedValue({}),
    streamEvents: jest.fn().mockReturnValue([]),
  }),
}));

const HumanMessage = jest.fn().mockImplementation((content) => ({ content }));
const ToolMessage = jest.fn().mockImplementation((content) => ({ content }));
const BaseMessage = jest.fn();
const END = 'END';
const START = 'START';
const ToolNode = jest.fn().mockImplementation(() => ({}));
const TavilySearch = jest.fn().mockImplementation(() => ({}));

module.exports = {
  ChatOpenAI,
  DallEAPIWrapper,
  ChatPromptTemplate,
  StateGraph,
  HumanMessage,
  ToolMessage,
  BaseMessage,
  END,
  START,
  ToolNode,
  TavilySearch,
};
