import '@testing-library/jest-dom'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}

  observe() {
    return null
  }

  disconnect() {
    return null
  }

  unobserve() {
    return null
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb
  }
  observe() {
    return null
  }
  unobserve() {
    return null
  }
  disconnect() {
    return null
  }
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isLocaleDomain: true,
      isReady: true,
      defaultLocale: 'en',
      domainLocales: [],
      isPreview: false,
    }
  },
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_API_URL: 'http://localhost:5000/api',
  NEXT_PUBLIC_FRONTEND_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SOCKET_URL: 'http://localhost:5000',
}

// Add global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'TENANT',
    isVerified: true,
  }),
  
  createMockProperty: () => ({
    id: '1',
    title: 'Test Property',
    description: 'A test property',
    price: 1000,
    location: 'Test Location',
    bedrooms: 2,
    bathrooms: 1,
    area: 100,
    type: 'APARTMENT',
    status: 'AVAILABLE',
  }),
}