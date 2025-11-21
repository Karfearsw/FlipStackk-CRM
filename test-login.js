// Test login functionality
const testLogin = async () => {
  const loginData = {
    username: 'testuser1763250582297',
    password: 'TestPass123!'
  };

  try {
    console.log('Testing login with data:', loginData);
    
    // First get CSRF token
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    console.log('CSRF Token:', csrfData.csrfToken);

    // Test login
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        csrfToken: csrfData.csrfToken,
        username: loginData.username,
        password: loginData.password,
        redirect: 'false',
        json: 'true'
      })
    });

    console.log('Login response status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('Login successful!');
      console.log('Response:', loginData);
      
      // Test session
      const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
      const sessionData = await sessionResponse.json();
      console.log('Session data:', sessionData);
      
    } else {
      const errorData = await loginResponse.text();
      console.log('Login failed:', errorData);
    }
    
  } catch (error) {
    console.error('Network error:', error.message);
  }
};

testLogin();