import { fetchQuestions } from '../../supabaseClient';
import { auth } from '@/auth';
import { getMissingKeys } from '../actions';

// loads next question and passes to client and server
export default async function loader() {
  const fetchQuestions = (await import('../../supabaseClient')).fetchQuestions;
  const questions = await fetchQuestions();
  console.log('loader');
  const session = await auth();
  const missingKeys = await getMissingKeys();
  return {
    props: {
      questions,
      session,
      missingKeys,
    },
    revalidate: 10
  };
}