# Homie - End-to-End Property Listing and Management Platform

## Contributors
1. Seid Muhidin
2. Abdulwahid Sultan

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

## Installation and Deployment

### Prerequisites

Before getting started, ensure you have the following installed on your system:

- **Node.js** 20+ (LTS recommended)
- **Docker** 24+ and **Docker Compose** 2.0+
- **Git** for version control
- **PostgreSQL** 16+ (if running locally without Docker)
- **Redis** 7+ (if running locally without Docker)

### Quick Start (Recommended)

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/homie.git
cd homie
```

#### 2. Environment Configuration
```bash
# Copy the environment template
cp .env.example .env

# Edit the environment variables (see Environment Variables section below)
nano .env  # or use your preferred editor
```

#### 3. Deploy with Docker (Production)
```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Deploy to production
./scripts/deploy.sh production

# Or deploy to development
./scripts/deploy.sh development
```

#### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Database**: localhost:5432 (PostgreSQL)
- **Cache**: localhost:6379 (Redis)

### Development Setup

#### Option 1: Docker Development Environment
```bash
# Start development environment with hot reloading
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

#### Option 2: Local Development (Manual)

##### Backend Setup
```bash
cd backend

# Install dependencies
npm ci

# Setup environment
cp .env.example .env
# Edit .env with your local configuration

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:deploy

# Start development server
npm run dev

# Run tests
npm test

# Run with debugging
npm run dev -- --inspect=0.0.0.0:9229
```

##### Frontend Setup
```bash
cd frontend

# Install dependencies
npm ci

# Setup environment
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Production Deployment

#### Option 1: Automated Deployment Script
```bash
# Deploy to production with all safety checks
./scripts/deploy.sh production

# Deploy with specific options
./scripts/deploy.sh production --force --no-backup

# Deploy to staging
./scripts/deploy.sh staging
```

#### Option 2: Manual Docker Deployment
```bash
# Build production images
docker-compose build --no-cache

# Start production services
docker-compose up -d

# Run database migrations
docker-compose exec backend npm run db:deploy

# Check service health
docker-compose ps
curl http://localhost:3000/api/health
curl http://localhost:5000/api/health
```

#### Option 3: Cloud Deployment (AWS/Azure/GCP)

##### Using Docker Images
```bash
# Build and tag images for registry
docker build -t your-registry/homie-frontend:latest ./frontend
docker build -t your-registry/homie-backend:latest ./backend

# Push to registry
docker push your-registry/homie-frontend:latest
docker push your-registry/homie-backend:latest

# Deploy using your cloud provider's container service
```

### Environment Variables

Create environment files for different stages:

#### Production (.env.production)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@your-db-host:5432/homie_db
REDIS_URL=redis://your-redis-host:6379
JWT_SECRET=your-super-secure-jwt-secret-32-chars-minimum
FAYDA_CLIENT_ID=your-fayda-client-id
FAYDA_CLIENT_SECRET=your-fayda-client-secret
CHAPA_SECRET_KEY=your-chapa-secret-key
FRONTEND_URL=https://your-domain.com
```

#### Staging (.env.staging)
```bash
NODE_ENV=staging
DATABASE_URL=postgresql://user:password@staging-db:5432/homie_staging
# ... other staging-specific variables
```

#### Development (.env.development)
```bash
NODE_ENV=development
DATABASE_URL=postgresql://homie_user:homie_password@localhost:5432/homie_db
# ... other development variables
```

### Database Setup

#### Using Docker (Recommended)
The database is automatically set up when using Docker Compose.

#### Manual PostgreSQL Setup
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE homie_db;
CREATE USER homie_user WITH PASSWORD 'homie_password';
GRANT ALL PRIVILEGES ON DATABASE homie_db TO homie_user;

# Run migrations
cd backend
npm run db:deploy

# Seed database (optional)
npm run db:seed
```

### SSL/HTTPS Setup (Production)

#### Using Let's Encrypt with Nginx
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Configure auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Monitoring and Logs

#### View Application Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
```

#### Health Checks
```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend health
curl http://localhost:3000/api/health

# Database health
docker-compose exec postgres pg_isready -U homie_user
```

### Backup and Recovery

#### Automated Backups (Production)
```bash
# Create backup
./scripts/backup.sh

# Restore from backup
./scripts/restore.sh backup_production_20241230_120000
```

#### Manual Database Backup
```bash
# Backup
docker-compose exec postgres pg_dump -U homie_user homie_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U homie_user homie_db < backup.sql
```

### Performance Optimization

#### Frontend Optimization
- Enable image optimization in Next.js
- Use CDN for static assets
- Implement code splitting
- Enable service worker for caching

#### Backend Optimization
- Use Redis for session storage
- Enable database connection pooling
- Implement API response caching
- Use compression middleware

#### Database Optimization
- Create appropriate indexes
- Use connection pooling
- Configure PostgreSQL for production
- Regular VACUUM and ANALYZE

### Security Checklist

- [ ] Use strong, unique passwords for all services
- [ ] Enable SSL/TLS encryption
- [ ] Configure firewall rules
- [ ] Set up regular security updates
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use security headers (Helmet.js)
- [ ] Regular security audits (`npm audit`)

### Troubleshooting

#### Common Issues

**Port already in use:**
```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>
```

**Docker permission denied:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

**Database connection refused:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres
```

**Memory issues:**
```bash
# Increase Docker memory limit
# Docker Desktop: Settings > Resources > Memory

# For Linux, check available memory
free -h
```

### Maintenance

#### Regular Tasks
- Update dependencies monthly
- Monitor disk usage
- Review and rotate logs
- Update SSL certificates
- Backup verification
- Security patches

#### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Deploy updates
./scripts/deploy.sh production

# Verify deployment
curl http://localhost:3000/api/health
```

For additional support or questions, please refer to our [troubleshooting guide](docs/troubleshooting.md) or contact the development team.

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
- Seid Muhidin: [email]
- Abdulwahid Sultan: [email]

---

**Built with ❤️ in Ethiopia**
