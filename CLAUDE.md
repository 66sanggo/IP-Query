# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome browser extension for batch IP address querying. The extension allows users to input multiple IP addresses and query their geographical and ISP information through external APIs. It supports deduplication, filtering by ISP/region, and data persistence.

## Architecture

### Core Files
- `manifest.json` - Chrome extension manifest (v3) with permissions and configuration
- `popup.html` - Main UI interface for the extension popup
- `popup.js` - Main JavaScript logic handling UI interactions and API calls
- `background.js` - Service worker for background tasks (minimal implementation)
- `styles.css` - UI styling for the popup interface

### Key Components

**API Integration**: Uses Mir6 API (`https://api.mir6.com/api/ip`) for IP geolocation queries. The extension has host permissions for multiple backup APIs.

**Data Flow**:
1. User inputs IP addresses in textarea (one per line)
2. Deduplication and validation occurs client-side
3. Sequential API calls fetch location data for each IP
4. Results are displayed with filtering options
5. Data persists in Chrome storage for session continuity

**Storage**: Uses `chrome.storage.local` to persist:
- Input IP addresses (`savedIPs`)
- Query results HTML (`savedResults`) 
- Query results data (`allResultsData`)
- Filter button visibility state (`hasResults`)

**Filtering System**: Results can be filtered by:
- Foreign (non-China) IPs
- Chinese ISPs: Mobile (移动), Telecom (电信), Unicom (联通)
- Hong Kong/Macau/Taiwan regions
- Other domestic ISPs

## Development Commands

This is a client-side Chrome extension with no build process. Development involves:
- Direct file editing
- Loading unpacked extension in Chrome for testing
- No package.json, npm scripts, or build tools

## Testing the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory
4. The extension icon will appear in the toolbar
5. Click the icon to open the popup interface

## Key Functions

**popup.js:74** - Main query function that processes IP addresses and calls the Mir6 API
**popup.js:150** - Filter logic for categorizing results by ISP and region
**popup.js:185** - Result display formatting
**popup.js:232** - Data persistence loading from Chrome storage
**popup.js:257** - Data persistence saving to Chrome storage