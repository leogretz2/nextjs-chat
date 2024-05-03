import { fetchQuestions } from '../../supabaseClient';
import { auth } from '@/auth';
import { getMissingKeys } from '../actions';

export default async function loader() {
  console.log('loader');
  const fetchQuestions = (await import('../../supabaseClient')).fetchQuestions;
  const questions = await fetchQuestions();
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