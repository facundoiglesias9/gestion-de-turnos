import { supabase } from './supabase';

export const logError = async (
    message: string,
    context: string,
    error?: any,
    user?: { id: string; businessName: string } | null
) => {
    console.error(`[${context}] ${message}`, error);

    try {
        await supabase.from('app_logs').insert({
            user_id: user?.id || null,
            business_name: user?.businessName || 'Anónimo',
            error_message: message + (error?.message ? `: ${error.message}` : ''),
            error_stack: error?.stack || JSON.stringify(error),
            context: context,
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'
        });
    } catch (logError) {
        console.error('Failed to send log to Supabase:', logError);
    }
};
