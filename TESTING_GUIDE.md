# MVP Testing Guide

This guide provides step-by-step instructions for testing the FlipStackk CRM MVP to ensure all core functionality works correctly.

## Pre-Testing Setup

1. **Environment Setup**
   - Ensure database is running and accessible
   - Verify environment variables are configured
   - Start the development server: `npm run dev`

2. **Test User Creation**
   - Navigate to `/auth`
   - Register a new user with role "admin"
   - Log in with the created credentials

## Core Functionality Tests

### 1. Authentication Flow

**Registration Test:**
- [ ] Navigate to `/auth`
- [ ] Click "Register" tab
- [ ] Fill in all required fields (name, username, email, password, role)
- [ ] Submit registration form
- [ ] Verify successful registration message
- [ ] Check automatic redirect to dashboard

**Login Test:**
- [ ] Navigate to `/auth`
- [ ] Enter valid username and password
- [ ] Click "Sign In"
- [ ] Verify successful login message
- [ ] Check redirect to dashboard

**Session Persistence:**
- [ ] Log in successfully
- [ ] Refresh the page
- [ ] Verify user remains logged in
- [ ] Check user data persists in session

### 2. Dashboard Functionality

**KPI Cards:**
- [ ] Navigate to `/dashboard`
- [ ] Verify all KPI cards display data (Total Leads, Today's Calls, Qualified Leads, Conversion Rate)
- [ ] Check that metrics update when new data is added
- [ ] Verify percentage changes display correctly

**Quick Actions:**
- [ ] Click "Add New Lead" button
- [ ] Verify navigation to leads page
- [ ] Return to dashboard
- [ ] Click "Log a Call" button
- [ ] Verify navigation to calls page

**Activity Feed:**
- [ ] Check recent activity displays correctly
- [ ] Verify timestamps are formatted properly
- [ ] Test that new activities appear in feed

### 3. Lead Management

**Create Lead:**
- [ ] Navigate to `/leads`
- [ ] Click "Add Lead" button
- [ ] Fill in all required fields
- [ ] Submit form
- [ ] Verify lead appears in list

**Search Functionality:**
- [ ] Use search bar to find leads by address
- [ ] Search by owner name
- [ ] Search by phone number
- [ ] Verify results update in real-time

**Filter Functionality:**
- [ ] Click "Filters" button
- [ ] Filter by status
- [ ] Filter by assigned user
- [ ] Filter by creation date
- [ ] Verify filtered results display correctly

**Pagination:**
- [ ] Test page size selector (10, 25, 50)
- [ ] Navigate between pages using Previous/Next buttons
- [ ] Verify correct number of items per page

**CSV Import/Export:**
- [ ] Click "Import CSV" button
- [ ] Upload valid CSV file
- [ ] Verify leads are imported correctly
- [ ] Click "Export" button
- [ ] Verify CSV file downloads with correct data

### 4. Call Management

**Schedule Call:**
- [ ] Navigate to `/calls`
- [ ] Click "Schedule Call" button
- [ ] Select a lead from dropdown
- [ ] Choose date and time
- [ ] Add optional notes
- [ ] Submit form
- [ ] Verify call appears in "Upcoming Calls" tab

**Log Call:**
- [ ] Click "Log Call" button
- [ ] Select a lead from dropdown
- [ ] Enter call duration
- [ ] Select call outcome
- [ ] Add optional notes
- [ ] Submit form
- [ ] Verify call appears in "Call History" tab

**Call History:**
- [ ] Check call details display correctly
- [ ] Verify duration and outcome are shown
- [ ] Test that calls are sorted chronologically

### 5. Analytics Dashboard

**Metrics Calculation:**
- [ ] Navigate to `/analytics`
- [ ] Verify lead conversion rate calculates correctly
- [ ] Check deal conversion rate displays properly
- [ ] Verify average deal size shows accurate data
- [ ] Check sales velocity calculation

**Data Visualization:**
- [ ] Verify progress bars render correctly
- [ ] Check property type distribution displays accurately
- [ ] Verify all percentages and numbers are correct

**Data Consistency:**
- [ ] Compare analytics data with dashboard data
- [ ] Verify metrics match across different pages
- [ ] Check that calculations are mathematically correct

### 6. Documentation & Training

**Page Load:**
- [ ] Navigate to `/documentation`
- [ ] Verify all sections load correctly
- [ ] Check navigation menu functions properly

**Search Functionality:**
- [ ] Search for "analytics"
- [ ] Search for "tutorial"
- [ ] Search for "API"
- [ ] Verify results filter correctly

**Interactive Demos:**
- [ ] Click "Interact" button on progress demo
- [ ] Use filter inputs in demo section
- [ ] Verify demo elements respond to user input

**Tutorials:**
- [ ] Click "Start" button on tutorials
- [ ] Verify tutorial steps display correctly
- [ ] Check that tutorial content is helpful and accurate

**API Documentation:**
- [ ] Verify API endpoints display correctly
- [ ] Check code samples are properly formatted
- [ ] Verify WhatsApp API example shows correct usage

**Analytics Tracking:**
- [ ] Open browser developer tools
- [ ] Check network tab for analytics requests
- [ ] Verify tracking events are sent on user interactions

### 7. Settings

**Profile Update:**
- [ ] Navigate to `/settings`
- [ ] Update name field
- [ ] Update email field
- [ ] Update phone field
- [ ] Submit changes
- [ ] Verify success message displays
- [ ] Check changes persist after page refresh

**Password Change:**
- [ ] Click "Security" tab
- [ ] Enter current password
- [ ] Enter new password (minimum 8 characters)
- [ ] Confirm new password
- [ ] Submit form
- [ ] Verify success message
- [ ] Test login with new password

**Avatar Upload:**
- [ ] Click "Choose File" button
- [ ] Select valid image file (JPG, PNG)
- [ ] Click "Upload" button
- [ ] Verify success message
- [ ] Check avatar displays correctly
- [ ] Refresh page and verify avatar persists

## Error Handling Tests

### 1. Authentication Errors
- [ ] Try to login with invalid credentials
- [ ] Verify appropriate error message displays
- [ ] Try to register with existing username
- [ ] Check validation errors appear for missing fields

### 2. API Errors
- [ ] Test network disconnection scenarios
- [ ] Verify error messages display for failed requests
- [ ] Check that forms handle validation errors properly

### 3. Data Validation
- [ ] Submit forms with invalid data
- [ ] Verify field-level validation messages
- [ ] Test edge cases (empty fields, special characters)

## Performance Tests

### 1. Load Times
- [ ] Measure page load times for each major page
- [ ] Verify acceptable performance (< 3 seconds)
- [ ] Check that loading states display properly

### 2. Data Loading
- [ ] Test with large datasets (100+ leads)
- [ ] Verify pagination works efficiently
- [ ] Check that search responds quickly

### 3. Form Performance
- [ ] Test form submission response times
- [ ] Verify loading states during submissions
- [ ] Check that UI remains responsive

## Cross-Browser Testing

### 1. Chrome
- [ ] Test all functionality in latest Chrome
- [ ] Verify responsive design works correctly
- [ ] Check console for JavaScript errors

### 2. Firefox
- [ ] Test core functionality in Firefox
- [ ] Verify UI elements render correctly
- [ ] Check for any browser-specific issues

### 3. Safari
- [ ] Test basic functionality in Safari
- [ ] Verify CSS compatibility
- [ ] Check for any rendering issues

## Mobile Responsiveness

### 1. Mobile Devices
- [ ] Test on mobile device or emulator
- [ ] Verify navigation works with mobile menu
- [ ] Check that forms are mobile-friendly
- [ ] Test touch interactions work properly

### 2. Tablet Devices
- [ ] Test on tablet device or emulator
- [ ] Verify layout adapts correctly
- [ ] Check that all functionality remains accessible

## Accessibility Testing

### 1. Keyboard Navigation
- [ ] Navigate entire application using only keyboard
- [ ] Verify tab order is logical
- [ ] Check that all interactive elements are accessible

### 2. Screen Reader
- [ ] Test with screen reader software
- [ ] Verify ARIA labels are present and accurate
- [ ] Check that content is properly announced

### 3. Color Contrast
- [ ] Verify sufficient color contrast ratios
- [ ] Test with high contrast mode enabled
- [ ] Check that color is not the only indicator

## Post-Testing Actions

### 1. Bug Documentation
- Document any bugs found with:
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - Screenshots if applicable
  - Browser/device information

### 2. Performance Metrics
- Record performance measurements
- Note any slow-loading pages or features
- Document memory usage if applicable

### 3. User Experience Notes
- Note any confusing UI elements
- Document suggestions for improvements
- Record positive user experience moments

## Sign-Off Criteria

The MVP is ready for deployment when:
- [ ] All core functionality tests pass
- [ ] No critical bugs remain
- [ ] Performance meets acceptable standards
- [ ] Security measures are verified
- [ ] Documentation is complete and accurate
- [ ] Cross-browser compatibility is confirmed
- [ ] Mobile responsiveness is verified
- [ ] Accessibility standards are met

## Contact Information

For questions or issues during testing, contact the development team through the appropriate channels.