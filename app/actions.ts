'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { kv } from '@vercel/kv'

import { auth } from '@/auth'
import { type Chat } from '@/lib/types'
import { supabase } from '../supabaseClient';
import { Question } from '@/lib/types';

export async function insertUniqueQuestion(newQuestion: Question) {
  try {
    // Check if a question with the same content already exists
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('mbe_questions')
      .select('content')
      .eq('content', newQuestion)
      .single();

    if (fetchError && fetchError.message !== "No rows found") {
      return { error: fetchError };
    }
    console.error('Error fetching questions action:', fetchError);

    // If the question already exists, return some message or handle as needed
    if (existingQuestions) {
      return { message: 'Question with the same content already exists.', existingQuestion: existingQuestions };
    }

    // If the question does not exist, insert it
    const { data: insertedQuestion, error: insertError } = await supabase
      .from('MBE_Questions')
      .insert([newQuestion]);

    if (insertError) {
      console.error('Error inserting question:', insertError);
      return { error: insertError };
    }

    return { message: 'Question inserted successfully', insertedQuestion: insertedQuestion?[0] : '' };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error };
  }
}

// Add RLS back, and need to add auth
export async function insertQuestion(){
  console.log('start insert')
  // const newQuestion: Question = {
  //   content: 'What is the meaning of life?',
  //   explanation: 'The meaning of life is a deep philosophical question that has been debated for centuries. It is a question that is often asked by people who are not philosophers.',
  //   choices: ['I do not know', 'I am not sure', 'I am not sure']
  // }

  // try {
  //   const { data: insertedQuestion, error: insertError } = await supabase
  //       .from('MBE_Questions')
  //       .insert([newQuestion]);
  // } catch(e) {
  //   console.error('e: ',e)
  // }
  // console.log('database added');
}

export async function getChats(userId?: string | null) {
  if (!userId) {
    return []
  }

  try {
    const pipeline = kv.pipeline()
    const chats: string[] = await kv.zrange(`user:chat:${userId}`, 0, -1, {
      rev: true
    })

    for (const chat of chats) {
      pipeline.hgetall(chat)
    }

    const results = await pipeline.exec()

    return results as Chat[]
  } catch (error) {
    return []
  }
}

export async function getChat(id: string, userId: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || (userId && chat.userId !== userId)) {
    return null
  }

  return chat
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  //Convert uid to string for consistent comparison with session.user.id
  const uid = String(await kv.hget(`chat:${id}`, 'userId'))

  if (uid !== session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  await kv.del(`chat:${id}`)
  await kv.zrem(`user:chat:${session.user.id}`, `chat:${id}`)

  revalidatePath('/')
  return revalidatePath(path)
}

export async function clearChats() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chats: string[] = await kv.zrange(`user:chat:${session.user.id}`, 0, -1)
  if (!chats.length) {
    return redirect('/')
  }
  const pipeline = kv.pipeline()

  for (const chat of chats) {
    pipeline.del(chat)
    pipeline.zrem(`user:chat:${session.user.id}`, chat)
  }

  await pipeline.exec()

  revalidatePath('/')
  return redirect('/')
}

export async function getSharedChat(id: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || chat.userId !== session.user.id) {
    return {
      error: 'Something went wrong'
    }
  }

  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`
  }

  await kv.hmset(`chat:${chat.id}`, payload)

  return payload
}

export async function saveChat(chat: Chat) {
  const session = await auth()

  if (session && session.user) {
    const pipeline = kv.pipeline()
    pipeline.hmset(`chat:${chat.id}`, chat)
    pipeline.zadd(`user:chat:${chat.userId}`, {
      score: Date.now(),
      member: `chat:${chat.id}`
    })
    await pipeline.exec()
  } else {
    return
  }
}

export async function refreshHistory(path: string) {
  redirect(path)
}

export async function getMissingKeys() {
  console.log('processenv',process.env)
  const keysRequired = ['OPENAI_API_KEY']
  return keysRequired
    .map(key => (process.env[key] ? '' : key))
    .filter(key => key !== '')
}
