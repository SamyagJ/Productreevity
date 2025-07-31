import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, username } = body

    console.log('[Server] Signup attempt for:', email)

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Server] Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    console.log('[Server] Supabase URL:', supabaseUrl)

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Attempt signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (error) {
      console.error('[Server] Supabase signup error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Check if user was actually created
    // Supabase returns a user object even for duplicates, but identities will be empty
    if (!data?.user || (data.user.identities && data.user.identities.length === 0)) {
      console.log('[Server] No user created - duplicate email detected')
      console.log('[Server] User data:', JSON.stringify(data?.user, null, 2))
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 400 }
      )
    }

    console.log('[Server] Signup successful:', data?.user?.email)
    console.log('[Server] User identities:', data?.user?.identities?.length)
    
    return NextResponse.json({
      success: true,
      user: data?.user,
    })
  } catch (error) {
    console.error('[Server] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}