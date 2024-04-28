import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gpazmihhssffmeyfmsey.supabase.co'; // Find this in your project settings on Supabase
const supabaseAnonKey = process.env.SUPABASE_ANON || 'eyJhbGc'; // Find this in your project settings on Supabase

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('here: ', supabase)

export async function fetchQuestions() {
    const { data, error } = await supabase
        .from('MBE_Questions')
        .select('*');

    if (error) {
        console.error('Error fetching questions:', error);
        return;
    }

    console.log('Questions:', data);
}

fetchQuestions();