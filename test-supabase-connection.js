// Test Supabase connection directly
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://octipyiqduroxelobtli.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jdGlweWlxZHVyb3hlbG9idGxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4Njk0NDgsImV4cCI6MjA3NjQ0NTQ0OH0.6zLDVWD7sXFT0FPGLW7rzIVYyRSSg71zTTBV08_Fn3s';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection by fetching from a table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('Data:', data);
    }
    
    // Test if we can get database info
    const { data: dbInfo, error: dbError } = await supabase
      .rpc('version');
    
    if (dbError) {
      console.error('Database info error:', dbError);
    } else {
      console.log('Database version:', dbInfo);
    }
    
  } catch (error) {
    console.error('Failed to create Supabase client:', error.message);
  }
}

testSupabaseConnection();