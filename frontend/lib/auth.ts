import { supabase } from './supabase'

export async function checkUserExists(email: string): Promise<boolean> {
  try {
    // Try to sign in with the email and a dummy password
    // If the email exists, we'll get a specific error
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'dummy_password_to_check_existence'
    })

    if (error) {
      // If we get "Invalid login credentials" it means the email exists
      if (error.message === 'Invalid login credentials') {
        return true
      }
      // If we get "Email not confirmed" it means the email exists but not verified
      if (error.message.includes('Email not confirmed')) {
        return true
      }
      // For any other error, assume the email doesn't exist
      return false
    }

    // If no error (unlikely with dummy password), email exists
    return true
  } catch (error) {
    console.error('Error checking user existence:', error)
    return false
  }
}