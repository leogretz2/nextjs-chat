import { createClient } from '@supabase/supabase-js'
import { Question } from '@/lib/types'
import { random } from 'nanoid'

const supabaseUrl =
    process.env.SUPABASE_URL || 'https://gpazmihhssffmeyfmsey.supabase.co' // This is in project settings on Supabase
const supabaseAnonKey =
    process.env.SUPABASE_ANON ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwYXptaWhoc3NmZm1leWZtc2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM1MDIzMjEsImV4cCI6MjAyOTA3ODMyMX0.a8nrDdTF5pVh_LKmSAZNCcq83CjIMIf7gO0dH1nMnj0' // This is in project settings on Supabase

// console.log('env',process.env)
// console.log('supabaser', supabaseAnonKey)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const dynamic = 'force-dynamic'

// Function to convert snake_case to camelCase
function snakeToCamel(snakeCaseString: string) {
    return snakeCaseString.replace(/_([a-z])/g, g => g[1].toUpperCase())
}

// Function to map data to the Question interface
function mapToQuestion(data: Record<string, any>): Question {
    return {
        questionId: data.question_id,
        documentTitle: data.document_title,
        documentDate: data.document_date,
        publisher: data.publisher,
        questionType: data.question_type,
        questionText: data.question_text,
        possibleAnswers: data.possible_answers,
        correctAnswer: data.correct_answer,
        answerOrigin: data.answer_origin,
        explanation: data.explanation,
        explanationOrigin: data.explanation_origin,
        difficultyLevel: data.difficulty_level,
        lawCategoryTags: data.law_category_tags,
        topic: data.topic,
        createdAt: data.created_at
    }
}

export async function fetchQuestions(): Promise<Question[]> {
    console.log('fetcher')
    // const { data, error } = await supabase
    //     .from('questions')
    //     .select('*')
    //     // .order('question_id', { ascending: true })
    //     // .order('RANDOM()')
    //     .limit(1)

    const { data, error } = await supabase
    .rpc('get_random_question')  // Call the PostgreSQL function

    if (error) {
        console.error('Error fetching questions:', error)
        return []
    } else {
        console.log('datar', data[0])
    }

    const questions = data.map(mapToQuestion)

    return questions
}
