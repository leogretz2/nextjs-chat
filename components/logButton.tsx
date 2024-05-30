'use client'

import React from 'react';
import { insertQuestion } from '@/app/actions';
import { supabase } from '../supabaseClient';
import { Question } from '@/lib/types'

const LogButton = () => {
  const handleClick = () => {
    console.log('Button clicked!');
  };

  const handleClicker = async () => {
    console.log('start insert')

    const newQuestion: Question = {
      question_id: 6,
      exam_id: '',
      content: 'What is the meaning of life?',
      explanation: 'The meaning of life is a deep philosophical question that has been debated for centuries. It is a question that is often asked by people who are not philosophers.',
      law_area: 'Tricep',
      options: ['I do not know', 'I am not sure', 'I am not sure'],
      difficulty: 3,
      topic: 'Topical'
    }

    try {
      // Look in Network tab for database interaction result
      const { data: insertedQuestion, error: insertError } = await supabase
          .from('MBE_Questions')
          .insert([newQuestion]);
    } catch(e) {
      console.error('e: ',e)
    }
    console.log('database added');
  }

  return (
    <button onClick={handleClicker}>Insárt</button>
    );
  };

export default LogButton;