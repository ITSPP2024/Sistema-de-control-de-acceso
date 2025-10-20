# Sistema de Seguridad y Control

## Overview
A security and access control system built with React, TypeScript, Vite, and Tailwind CSS v4. The application provides a comprehensive dashboard for managing users, access logs, security zones, alerts, and reports for a security agency.

## Project Information
- **Name**: Sistema de Seguridad y Control
- **Version**: 0.1.0
- **Original Design**: [Figma Design](https://www.figma.com/design/UzwMTVsKsNvK5QpxwChJ1L/Sistema-de-Seguridad-y-Control)
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: Tailwind CSS v4.1.14
- **UI Components**: Radix UI primitives with custom components

## Tech Stack
- **Frontend**: React + TypeScript
- **Build Tool**: Vite with SWC plugin
- **Styling**: Tailwind CSS v4 with PostCSS
- **UI Library**: Radix UI components
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form

## Project Structure
```
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components (buttons, cards, inputs, etc.)
│   │   ├── figma/           # Figma-specific components
│   │   ├── Dashboard.tsx    # Main dashboard view
│   │   ├── UserManagement.tsx
│   │   ├── AccessLog.tsx
│   │   ├── ZoneConfig.tsx
│   │   ├── SecurityAlerts.tsx
│   │   ├── AccessReports.tsx
│   │   ├── CompanyProfile.tsx
│   │   └── Login.tsx        # Authentication screen
│   ├── styles/
│   │   └── globals.css
│   ├── index.css            # Tailwind CSS imports
│   ├── App.tsx              # Main application component
│   └── main.tsx             # Application entry point
├── index.html
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── postcss.config.js        # PostCSS configuration
```

## Recent Changes
- **2025-10-20**: Initial Replit setup
  - Configured Vite for Replit environment (port 5000, host 0.0.0.0)
  - Added TypeScript configuration files
  - Set up Tailwind CSS v4 with @tailwindcss/postcss
  - Created ImageWithFallback component for the Figma integration
  - Configured deployment settings for autoscale
  - Added module type to package.json

## Development Setup

### Running Locally
The app runs on port 5000 with hot module replacement enabled:
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Key Configuration
- **Vite**: Configured to run on 0.0.0.0:5000 for Replit compatibility
- **Tailwind CSS**: Using v4 with @tailwindcss/postcss plugin
- **TypeScript**: Strict mode enabled with path aliases (@/* → src/*)
- **PostCSS**: Using @tailwindcss/postcss for Tailwind v4 compatibility

## Features
1. **Dashboard**: Overview with key metrics and statistics
2. **User Management**: Add, edit, and manage system users
3. **Access Logs**: Track and monitor access events
4. **Zone Configuration**: Configure security zones
5. **Security Alerts**: Monitor and respond to security incidents
6. **Access Reports**: Generate and view access reports
7. **Company Profile**: Manage company information and branding

## Demo Credentials
- Email: admin@empresa.com
- Password: admin123

## Known Issues
- LSP diagnostics showing React scope warnings (false positives with react-jsx transform)
- WebSocket connection warnings in browser console (expected in Replit environment)

## Deployment
The project is configured for Replit Autoscale deployment:
- Build command: `npm run build`
- Run command: `npx vite preview --host 0.0.0.0 --port`
- Deployment target: autoscale (stateless)
