# Homie - End-to-End Property listing and Management Platform

## Contributors
1.Seid Muhidin
2.Abdulwahid Sultan

## Project Synopsis

### Problem Statement
The current property rental market faces significant challenges including:

- painfull struggles and high comission fees in searching for properties.
- Fragmented property listing platforms that don't integrate rental collection
- Manual and time-consuming rental payment processes for landlords
- Lack of proper tenant verification and KYC processes
- Inefficient property management workflows
- Difficulty in tracking rental payments and property maintenance
- Limited transparency between landlords and tenants

### Planned Solution
We are building a comprehensive end-to-end property listing and rental management platform that will:

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
   - Automated rent collection system
   - Multiple payment gateway integrations
   - Recurring payment scheduling
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

### Fayda's Role
Fayda's digital ID system will be the cornerstone of our user authentication and verification process. By integrating Fayda's KYC capabilities, we will:
- Ensure all users (landlords and tenants) are properly verified
- Reduce fraud and build trust in the platform
- Streamline the onboarding process for new users
- Maintain compliance with regulatory requirements
- Create a secure environment for financial transactions
- Enable seamless identity verification across all platform features

## Tech Stack

### Frontend
- **React.js** - Main frontend framework for building responsive user interfaces
- **Next.js** - Server-side rendering and routing
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Redux Toolkit** - State management
- **React Query** - Server state management and caching

### Backend
- **Node.js** - Server-side JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Primary relational database
- **Redis** - Caching and session management
- **Prisma** - Database ORM

### Authentication & Security
- **Fayda API** - Digital ID verification and KYC integration
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing
- **Helmet.js** - Security middleware

### Payment & Financial
- **Chapa** - Payment processing and recurring payments
- **Telebirr** - Alternative payment gateway
- **Webhook handlers** - Payment status updates

### Cloud & Infrastructure
- **Docker** - Containerization
- **Nginx** - Reverse proxy and load balancing
- **PM2** - Process manager for Node.js

### Additional Tools
- **Socket.io** - Real-time communication
- **Multer** - File upload handling
- **Nodemailer** - Email notifications
- **Jest** - Testing framework
- **ESLint & Prettier** - Code formatting and linting
- **GitHub Actions** - CI/CD pipeline

### Third-Party Integrations
- **Google Maps API** - Property location and mapping
- **Cloudinary** - Image and video storage
- **SendGrid** - Email delivery service
- **Twilio** - SMS notifications
