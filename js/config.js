export const supabaseUrl = 'https://yfmstwhnqxrucbxjmmsd.supabase.co';
export const supabaseKey = 'sb_publishable_PD9suAY61uPmtavkjkPIJQ_aIos3uxL';

export const supabaseClient = (supabaseUrl && supabaseKey) ? supabase.createClient(supabaseUrl, supabaseKey) : null;
