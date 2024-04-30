import { fetchQuestions } from '../../supabaseClient';
import { auth } from '@/auth';
import { getMissingKeys } from '../actions';

export default async function loader() {
  console.log('loader');
  const questions = await fetchQuestions();
  const session = await auth();
  const missingKeys = await getMissingKeys();
  return {
      questions,
      session,
      missingKeys,
  };
}