import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
    try {
        const { userId, adminEmail } = await request.json();

        // Security check: Only allow the specific admin to perform this action
        if (adminEmail !== 'facundo@example.com') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Initialize Supabase Admin client (Service Role)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 1. Delete user from auth.users (this usually cascades to other tables if set up, 
        // but we'll manually ensure profile is gone too)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error('Error deleting user:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        // 2. Delete from profiles (just in case cascade didn't catch it)
        await supabaseAdmin.from('profiles').delete().eq('id', userId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
