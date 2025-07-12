# ReWear – Community Clothing Exchange

## Overview

ReWear is a web-based platform that enables users to exchange unused clothing through direct swaps or a point-based redemption system. The goal is to promote sustainable fashion and reduce textile waste by encouraging users to reuse wearable garments instead of discarding them.

## Features

### AI-Powered Image Verification
- Google Gemini Vision API integration
- Automatic verification of clothing images against user descriptions
- Prevents mismatched items (e.g., shirt photo with pants description)
- Confidence scoring and detailed feedback
- Batch verification for multiple images

### User Authentication
- Email/password signup and login
- Secure user account management

### Landing Page
- Platform introduction
- Calls-to-action: "Start Swapping", "Browse Items", "List an Item"
- Featured items carousel

### User Dashboard
- Profile details and points balance
- Uploaded items overview
- Ongoing and completed swaps list

### Item Detail Page
- Image gallery and full item description
- Uploader info
- Options: "Swap Request" or "Redeem via Points"
- Item availability status

### Add New Item Page
- Upload images
- Enter title, description, category, type, size, condition, and tags
- Submit to list item

### Admin Role
- Moderate and approve/reject item listings
- Remove inappropriate or spam items
- Lightweight admin panel for oversight

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Google Gemini API key

### Environment Variables
Create a `.env` file in the server directory with:
```
MONGODB_URI=mongodb://localhost:27017/rewear
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

### Getting Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `GEMINI_API_KEY`

### Installation
1. Install server dependencies: `cd server && npm install`
2. Install client dependencies: `cd client && npm install`
3. Start the server: `cd server && npm start`
4. Start the client: `cd client && npm start`

### Team:
- Arnav Kumar arnav170905@gmail.com
- Abhigyan Srivastava abhi.14gyan@gmail.com
- Yash Agarwal yash9798@gmail.com
- Raunak Kumar Tripathi raunaktripathi1202@gmail.com
