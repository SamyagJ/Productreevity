import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function DELETE(request: Request) {
  try {
    // Get the user's access token from the Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Create a regular Supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    // Get the user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('Error getting user:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Server] Deleting account for user:', user.id)

    // Delete the user's profile data first (cascading delete will handle related data)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      console.error('[Server] Error deleting profile:', profileError)
      return NextResponse.json({ error: 'Failed to delete user data' }, { status: 500 })
    }

    // Delete the user from auth.users using admin client
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      
      if (deleteError) {
        console.error('[Server] Error deleting auth user:', deleteError)
        return NextResponse.json({ error: 'Failed to delete user account' }, { status: 500 })
      }
    } else {
      console.warn('[Server] Service role key not configured - user auth record not deleted')
    }

    console.log('[Server] Account deleted successfully')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Server] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}