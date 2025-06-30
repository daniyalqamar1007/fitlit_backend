#!/bin/bash

echo "🚀 FitLit Backend & Frontend Setup Guide"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 16+
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 16 ]; then
            print_error "Node.js version 16+ required. Current: $NODE_VERSION"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi
}

# Check if MongoDB is running
check_mongodb() {
    if command -v mongod &> /dev/null; then
        print_status "MongoDB is installed"
        
        # Try to connect to MongoDB
        if mongo --eval "db.runCommand('ping').ok" localhost/test &> /dev/null; then
            print_status "MongoDB is running"
        else
            print_warning "MongoDB is installed but not running"
            print_info "Start MongoDB with: mongod or brew services start mongodb-community"
        fi
    else
        print_warning "MongoDB not found locally"
        print_info "You can use MongoDB Atlas (cloud) or install MongoDB locally"
    fi
}

# Setup backend
setup_backend() {
    echo ""
    echo "🔧 Setting up Backend..."
    echo "----------------------"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the backend directory?"
        exit 1
    fi
    
    # Install dependencies
    print_info "Installing backend dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_status "Backend dependencies installed"
    else
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    
    # Check for .env file
    if [ ! -f ".env" ]; then
        print_warning ".env file not found"
        print_info "Creating .env template..."
        
        cat > .env << EOF
# Database
MONGODB_URI=mongodb://localhost:27017/fitlit

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=1d

# Server
PORT=3099

# AWS S3 (Optional)
AWS_BUCKET_REGION=us-east-1
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
S3_BUCKET_NAME=your_bucket_name

# Image Processing APIs (Optional)
REPLICATE_API_TOKEN=your_replicate_token
REMOVE_BG_API_KEY=your_remove_bg_key

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@fitlit.com
EOF
        
        print_status ".env template created"
        print_warning "Please edit .env with your actual values"
    else
        print_status ".env file exists"
    fi
    
    # Try to build the project
    print_info "Building backend..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_status "Backend build successful"
    else
        print_warning "Backend build failed - check for TypeScript errors"
    fi
}

# Setup frontend (if exists)
setup_frontend() {
    echo ""
    echo "🎨 Setting up Frontend..."
    echo "------------------------"
    
    # Look for frontend directory
    FRONTEND_DIRS=("../frontend" "../client" "../app" "../web")
    FRONTEND_DIR=""
    
    for dir in "${FRONTEND_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            FRONTEND_DIR="$dir"
            break
        fi
    done
    
    if [ -z "$FRONTEND_DIR" ]; then
        print_warning "Frontend directory not found"
        print_info "Common locations: ../frontend, ../client, ../app"
        print_info "You can set up frontend manually"
        return
    fi
    
    print_status "Frontend found at: $FRONTEND_DIR"
    
    # Navigate to frontend directory
    cd "$FRONTEND_DIR"
    
    # Check for package.json
    if [ ! -f "package.json" ]; then
        print_error "Frontend package.json not found"
        cd - > /dev/null
        return
    fi
    
    # Install frontend dependencies
    print_info "Installing frontend dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_status "Frontend dependencies installed"
    else
        print_error "Failed to install frontend dependencies"
        cd - > /dev/null
        return
    fi
    
    # Create frontend .env if needed
    if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
        print_info "Creating frontend environment file..."
        
        cat > .env.local << EOF
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3099
REACT_APP_API_URL=http://localhost:3099

# Other frontend environment variables
NEXT_PUBLIC_APP_NAME=FitLit
EOF
        
        print_status "Frontend .env.local created"
    fi
    
    # Return to backend directory
    cd - > /dev/null
}

# Run backend
run_backend() {
    echo ""
    echo "🚀 Starting Backend..."
    echo "--------------------"
    
    print_info "Starting backend in development mode..."
    print_info "Backend will be available at: http://localhost:3099"
    print_info "API endpoints: http://localhost:3099/api"
    print_info "Health check: http://localhost:3099/health"
    print_info ""
    print_info "Press Ctrl+C to stop the backend"
    print_info ""
    
    npm run start:dev
}

# Run frontend in separate terminal
run_frontend() {
    if [ -n "$FRONTEND_DIR" ]; then
        echo ""
        echo "🎨 To start the frontend, open a new terminal and run:"
        echo "cd $FRONTEND_DIR"
        echo "npm run dev"
        echo ""
        echo "Frontend will be available at: http://localhost:3000"
    fi
}

# Main execution
main() {
    echo "Starting FitLit setup process..."
    echo ""
    
    # System checks
    check_node
    check_mongodb
    
    # Setup
    setup_backend
    setup_frontend
    
    # Instructions for running
    echo ""
    echo "🎯 Setup Complete!"
    echo "=================="
    echo ""
    echo "To run the application:"
    echo ""
    echo "1. Backend (this terminal):"
    echo "   npm run start:dev"
    echo ""
    echo "2. Frontend (new terminal):"
    if [ -n "$FRONTEND_DIR" ]; then
        echo "   cd $FRONTEND_DIR"
    else
        echo "   cd ../frontend  # or your frontend directory"
    fi
    echo "   npm run dev"
    echo ""
    echo "3. Access the application:"
    echo "   Backend API: http://localhost:3099"
    echo "   Frontend: http://localhost:3000"
    echo ""
    
    # Ask if user wants to start backend now
    read -p "Start backend now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_backend
    else
        echo "Run 'npm run start:dev' when ready to start the backend"
    fi
}

# Run main function
main
