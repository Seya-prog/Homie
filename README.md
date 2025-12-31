# Homie - End-to-End Property Listing and Management Platform

## Project Synopsis

### Problem Statement
The current property rental market faces significant challenges including:

- Painful struggles and high commission fees in searching for properties
- Fragmented property listing platforms that don't integrate rental collection
- Manual and time-consuming rental payment processes for landlords
- Lack of proper tenant verification and KYC processes
- Inefficient property management workflows
- Difficulty in tracking rental payments and property maintenance
- Limited transparency between landlords and tenants

### Solution Overview
Homie is a comprehensive end-to-end property listing and rental management platform that addresses these challenges through:

1. **Property Listing & Discovery**
   - Advanced property search with filters (location, price, amenities)
   - Virtual tours and high-quality property photos
   - Detailed property information and neighborhood insights
   - Real-time availability status

2. **Digital Identity Verification (Fayda Integration)**
   - Seamless KYC process using Fayda's digital ID system
   - Secure tenant and landlord authentication
   - Verified user profiles to build trust in the platform
   - Compliance with regulatory requirements

3. **Rental Collection & Management**
   - Automated rent collection system with Chapa payment gateway
   - Multiple payment options and recurring payment scheduling
   - Digital rent receipts and payment history
   - Late payment tracking and notifications

4. **Landlord Dashboard**
   - Property portfolio management
   - Tenant screening and selection tools
   - Financial reporting and analytics
   - Maintenance request tracking
   - Document management (leases, agreements)

5. **Tenant Portal**
   - Easy rent payment interface
   - Maintenance request submission
   - Document access and storage
   - Communication tools with landlords
   - Payment history and receipts

### Expected Outcome
- **For Landlords**: Streamlined property management, automated rent collection, reduced administrative overhead, and improved tenant screening
- **For Tenants**: Simplified rental process, secure payment options, better property discovery, and transparent communication
- **For the Platform**: Reduced fraud through verified identities, increased user trust, and scalable business model
- **Market Impact**: Digital transformation of the rental market, improved efficiency, and better user experience

## Tech Stack

### Backend
- **Node.js** - Server-side JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Primary relational database
- **Prisma** - Database ORM
- **Redis** - Caching and session management
- **Socket.io** - Real-time communication

### Frontend
- **React.js** - Main frontend framework
- **Next.js** - Server-side rendering and routing
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **Redux Toolkit** - State management
- **React Query** - Server state management and caching

### Authentication & Security
- **Fayda API** - Digital ID verification and KYC integration
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing
- **Helmet.js** - Security middleware

### Payment & Financial
- **Chapa** - Payment processing and recurring payments
- **Telebirr** - Alternative payment gateway
- **Webhook handlers** - Payment status updates

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Development environment
- **Nginx** - Reverse proxy and load balancing

## Fayda Integration

### Configuration
The platform integrates with Ethiopia's Fayda digital ID system for secure identity verification:

```env
FAYDA_CLIENT_ID=crXYIYg2cJiNTaw5t-peoFzCRo-3JATNfBd5A8GU8tO
FAYDA_REDIRECT_URI=http://localhost:3000/callback
FAYDA_AUTHORIZATION_ENDPOINT=https://esignet.ida.fayda.et/authorize
FAYDA_TOKEN_ENDPOINT=https://esignet.ida.fayda.et/v1/esignet/oauth/v2/token
FAYDA_USERINFO_ENDPOINT=https://esignet.ida.fayda.et/v1/esignet/oidc/userinfo
```

### Test Credentials
For development and testing:
- **Test FIN**: 614079852391519
- **Test OTP**: 111111

### Verification Process
1. User initiates KYC verification
2. Redirected to Fayda OAuth flow
3. User authenticates with Fayda credentials
4. Platform receives verified user information
5. User profile updated with verification status

## Installation & Setup

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

### Quick Start with Docker

1. **Clone the repository**
```bash
git clone <repository-url>
cd homie
```

2. **Set up environment variables**
```bash
# Backend environment variables are already configured in backend/.env
# Frontend environment variables are already configured in frontend/.env.local
# Update the values as needed for your environment
```

3. **Start all services**
```bash
docker-compose up -d
```

4. **Set up the database**
```bash
cd backend
npm install
npx prisma migrate dev
npx prisma generate
```

5. **Start the development servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database: localhost:5432
- Redis: localhost:6379

### Manual Setup

#### Backend Setup
```bash
cd backend
npm install
# Configure environment variables in .env file
npx prisma migrate dev
npx prisma generate
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/fayda/authorize` - Initiate Fayda verification
- `POST /api/auth/fayda/callback` - Complete Fayda verification

### Property Endpoints
- `GET /api/properties` - List properties with filters
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property (Landlord only)
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Payment Endpoints
- `POST /api/payments/initialize` - Initialize payment
- `POST /api/payments/verify/:txRef` - Verify payment
- `GET /api/payments/my-payments` - Get user payments
- `GET /api/payments/analytics` - Payment analytics (Landlord)

### Rental Endpoints
- `POST /api/rentals` - Create rental agreement
- `GET /api/rentals/my-rentals` - Get user rentals

## Features

### Core Features
- ✅ User authentication and authorization
- ✅ Fayda digital ID integration
- ✅ Property listing and management
- ✅ Advanced property search and filtering
- ✅ Payment processing with Chapa
- ✅ Real-time notifications
- ✅ Rental agreement management
- ✅ Maintenance request tracking

### Security Features
- JWT-based authentication
- Rate limiting
- Input validation
- CORS protection
- Helmet security headers
- Secure password hashing

### Payment Features
- Multiple payment gateways (Chapa, Telebirr)
- Automated recurring payments
- Payment verification
- Digital receipts
- Payment analytics

## Development

### Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/homie_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
FAYDA_CLIENT_ID=your_fayda_client_id
# ... other Fayda config
CHAPA_SECRET_KEY=your_chapa_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# View database
npx prisma studio
```

## Usage

### For Landlords
1. Register as a landlord
2. Complete Fayda KYC verification
3. List properties with details and images
4. Manage rental agreements
5. Track payments and analytics
6. Handle maintenance requests

### For Tenants
1. Register as a tenant
2. Complete Fayda KYC verification
3. Search and browse properties
4. Contact landlords
5. Make rental payments
6. Submit maintenance requests
## Demonstration Video
- Demo: [https://drive.google.com/file/d/1xq-mXvJB0pWvw3A-DR6Bsc9SVn9HpyLr/view?usp=sharing]
- Live: [https://homie-cqi2-382x67sia-seids-projects-ce89d225.vercel.app/]
## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact:
- Seid Muhidin: [seidmuhidin@gmail.com](mailto:seidmuhidin@gmail.com)
