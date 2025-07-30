#!/bin/bash

# =============================================================================
# HOMIE DEPLOYMENT SCRIPT
# =============================================================================
# This script handles deployment to different environments with safety checks
# Usage: ./scripts/deploy.sh [environment] [options]
# Examples:
#   ./scripts/deploy.sh development
#   ./scripts/deploy.sh staging --no-backup
#   ./scripts/deploy.sh production --force

set -e  # Exit on any error

# =============================================================================
# CONFIGURATION
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENVIRONMENT="${1:-development}"
BACKUP_DIR="$PROJECT_ROOT/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_${ENVIRONMENT}_${DATE}"

# =============================================================================
# COLORS AND FORMATTING
# =============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# FUNCTIONS
# =============================================================================

print_banner() {
    echo -e "${BLUE}"
    echo "======================================="
    echo "  HOMIE DEPLOYMENT SCRIPT"
    echo "======================================="
    echo "Environment: $ENVIRONMENT"
    echo "Date: $(date)"
    echo -e "=======================================${NC}"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    log_success "All dependencies are available"
}

validate_environment() {
    log_info "Validating environment: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        development|staging|production)
            log_success "Valid environment: $ENVIRONMENT"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_error "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
}

check_environment_file() {
    local env_file=""
    
    case $ENVIRONMENT in
        development)
            env_file=".env.development"
            ;;
        staging)
            env_file=".env.staging"
            ;;
        production)
            env_file=".env.production"
            ;;
    esac
    
    if [[ -f "$PROJECT_ROOT/$env_file" ]]; then
        log_info "Using environment file: $env_file"
        cp "$PROJECT_ROOT/$env_file" "$PROJECT_ROOT/.env"
    elif [[ -f "$PROJECT_ROOT/.env.example" ]]; then
        log_warning "Environment file $env_file not found, using .env.example"
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    else
        log_error "No environment file found!"
        exit 1
    fi
}

create_backup() {
    if [[ "$*" == *"--no-backup"* ]]; then
        log_info "Skipping backup (--no-backup flag provided)"
        return
    fi
    
    log_info "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if docker-compose ps postgres | grep -q "Up"; then
        log_info "Backing up database..."
        docker-compose exec -T postgres pg_dump -U homie_user homie_db > "$BACKUP_DIR/${BACKUP_NAME}_database.sql"
        log_success "Database backup created: ${BACKUP_NAME}_database.sql"
    fi
    
    # Backup uploaded files
    if [[ -d "$PROJECT_ROOT/backend/uploads" ]]; then
        log_info "Backing up uploaded files..."
        tar -czf "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" -C "$PROJECT_ROOT/backend" uploads/
        log_success "Upload files backup created: ${BACKUP_NAME}_uploads.tar.gz"
    fi
    
    log_success "Backup completed"
}

build_images() {
    log_info "Building Docker images..."
    
    case $ENVIRONMENT in
        development)
            docker-compose -f docker-compose.dev.yml build --no-cache
            ;;
        *)
            docker-compose build --no-cache
            ;;
    esac
    
    log_success "Docker images built successfully"
}

run_tests() {
    log_info "Running tests..."
    
    # Run frontend tests
    log_info "Running frontend tests..."
    cd "$PROJECT_ROOT/frontend"
    npm ci
    npm run test:coverage
    cd "$PROJECT_ROOT"
    
    # Run backend tests
    log_info "Running backend tests..."
    cd "$PROJECT_ROOT/backend"
    npm ci
    npm run test:coverage
    cd "$PROJECT_ROOT"
    
    log_success "All tests passed"
}

deploy_services() {
    log_info "Deploying services..."
    
    case $ENVIRONMENT in
        development)
            docker-compose -f docker-compose.dev.yml up -d
            ;;
        *)
            docker-compose up -d
            ;;
    esac
    
    log_success "Services deployed"
}

run_migrations() {
    log_info "Running database migrations..."
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10
    
    # Run migrations
    docker-compose exec backend npm run db:deploy
    
    log_success "Database migrations completed"
}

health_check() {
    log_info "Performing health checks..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "Health check attempt $attempt/$max_attempts"
        
        # Check frontend
        if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
            log_success "Frontend is healthy"
            break
        fi
        
        # Check backend
        if curl -f -s http://localhost:5000/api/health > /dev/null 2>&1; then
            log_success "Backend is healthy"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Health check failed after $max_attempts attempts"
            exit 1
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_success "All services are healthy"
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."
    
    docker image prune -f
    docker volume prune -f
    
    log_success "Cleanup completed"
}

post_deployment_tasks() {
    log_info "Running post-deployment tasks..."
    
    # Clear application cache if needed
    if [[ $ENVIRONMENT == "production" ]]; then
        docker-compose exec backend npm run cache:clear || true
        docker-compose exec frontend npm run cache:clear || true
    fi
    
    log_success "Post-deployment tasks completed"
}

print_status() {
    echo ""
    log_success "Deployment completed successfully!"
    echo ""
    echo -e "${BLUE}Services Status:${NC}"
    docker-compose ps
    echo ""
    echo -e "${BLUE}URLs:${NC}"
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:5000/api"
    echo "Database: localhost:5432"
    echo ""
}

# =============================================================================
# MAIN DEPLOYMENT FLOW
# =============================================================================

main() {
    print_banner
    
    # Pre-deployment checks
    check_dependencies
    validate_environment
    check_environment_file
    
    # Ask for confirmation in production
    if [[ $ENVIRONMENT == "production" && "$*" != *"--force"* ]]; then
        echo -e "${YELLOW}WARNING: You are about to deploy to PRODUCTION!${NC}"
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    # Backup (if not skipped)
    create_backup "$@"
    
    # Stop existing services
    log_info "Stopping existing services..."
    docker-compose down
    
    # Build and test
    if [[ "$*" != *"--skip-tests"* ]]; then
        run_tests
    fi
    
    build_images
    
    # Deploy
    deploy_services
    run_migrations
    
    # Verify deployment
    health_check
    
    # Cleanup and finalize
    cleanup_old_images
    post_deployment_tasks
    
    # Show status
    print_status
}

# =============================================================================
# ERROR HANDLING
# =============================================================================

cleanup_on_error() {
    log_error "Deployment failed! Cleaning up..."
    docker-compose down
    exit 1
}

trap cleanup_on_error ERR

# =============================================================================
# SCRIPT EXECUTION
# =============================================================================

# Change to project root
cd "$PROJECT_ROOT"

# Run main deployment
main "$@"