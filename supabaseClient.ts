import { createClient } from '@supabase/supabase-js';
import { Question } from '@/lib/types';

const supabaseUrl = process.env.SUPABASE_URL || 'https://gpazmihhssffmeyfmsey.supabase.co'; // This is in project settings on Supabase
const supabaseAnonKey =  process.env.SUPABASE_ANON || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwYXptaWhoc3NmZm1leWZtc2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM1MDIzMjEsImV4cCI6MjAyOTA3ODMyMX0.a8nrDdTF5pVh_LKmSAZNCcq83CjIMIf7gO0dH1nMnj0'; // This is in project settings on Supabase

// console.log('env',process.env)
// console.log('supabaser', supabaseAnonKey)

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const dynamic = 'force-dynamic'

export async function fetchQuestions(): Promise<Question[]> {
    console.log('fetcher')    
    const { data, error } = await supabase
        .from('MBE_Questions')
        .select('explanation');

    if (error) {
        console.error('Error fetching questions:', error);
        return {};
    } else {
        console.log('datar',data)
    }

    return data;
}
