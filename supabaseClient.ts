import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gpazmihhssffmeyfmsey.supabase.co'; // Find this in your project settings on Supabase
const supabaseAnonKey =  process.env.SUPABASE_ANON || 'null'; // Find this in your project settings on Supabase

console.log('env',process.env)
console.log('supabaser', supabaseAnonKey)

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchQuestions() {    
    const { data, error } = await supabase
        .from('MBE_Questions')
        .select('*');

    if (error) {
        console.error('Error fetching questions:', error);
        return;
    }

    return data;
}

fetchQuestions();