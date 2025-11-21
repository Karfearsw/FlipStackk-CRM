// Simple test script for registration endpoint
const testRegistration = async () => {
  const testData = {
    username: 'testuser' + Date.now(),
    password: 'TestPass123!',
    email: 'test' + Date.now() + '@example.com',
    role: 'admin'
  };

  try {
    console.log('Testing registration with data:', testData);
    
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.text();
    console.log('Response body:', responseData);
    
    if (!response.ok) {
      console.error('Registration failed with status:', response.status);
    } else {
      console.log('Registration successful!');
    }
    
  } catch (error) {
    console.error('Network error:', error.message);
  }
};

// Test duplicate email scenario
const testDuplicateEmail = async () => {
  const testData = {
    username: 'duplicateuser',
    password: 'TestPass123!',
    email: 'duplicate@example.com',
    role: 'admin'
  };

  console.log('\n--- Testing duplicate email scenario ---');
  
  // First registration
  await fetch('http://localhost:3000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  });

  // Second registration with same email
  testData.username = 'differentuser';
  const response = await fetch('http://localhost:3000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  });

  console.log('Duplicate email test - Status:', response.status);
  const responseData = await response.text();
  console.log('Duplicate email response:', responseData);
};

// Run tests
testRegistration().then(() => testDuplicateEmail());