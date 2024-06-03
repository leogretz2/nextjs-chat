'use client'

import { useState, useEffect } from 'react'
import { nanoid } from '@/lib/utils'
import Chat from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { fetchQuestions } from '../supabaseClient'

export default function IndexPageClient({ questions, session, missingKeys }) {
  const firstQuestion = questions[0]
  const initialQuestionText = firstQuestion.questionText
  const initialPossibleAnswers = firstQuestion.possibleAnswers

  const [questionText, setQuestionText] = useState(initialQuestionText)
  const [possibleAnswers, setPossibleAnswers] = useState(initialPossibleAnswers)

  const handleFetchQuestions = async () => {
    const newQuestionArr = await fetchQuestions()
    const newQuestion = newQuestionArr[0]
    setQuestionText(newQuestion.questionText)
    setPossibleAnswers(newQuestion.possibleAnswers)
  }

  return (
    <AI initialAIState={{ chatId: nanoid(), messages: [] }} initialUIState={[]}>
      <Chat
        id={nanoid()}
        session={session}
        missingKeys={missingKeys}
        questionText={questionText}
        possibleAnswers={possibleAnswers}
        onFetchNewQuestion={handleFetchQuestions}
      />
      <button onClick={handleFetchQuestions}>Fetch New Question</button>
    </AI>
  )
}
