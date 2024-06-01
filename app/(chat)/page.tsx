import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { auth } from '@/auth'
import { Session } from '@/lib/types'
import { getMissingKeys } from '../actions'
import { supabase, fetchQuestions } from '../../supabaseClient'
import loader from './page.server'
import { insertQuestion, insertUniqueQuestion } from '../actions';
import LogButton from '../../components/logButton'

export const metadata = {
  title: 'Juris'
}

// Runs on the server before page component runs
// export async function loader() {
//   console.log('loader')
//   const questions = await fetchQuestions();
//   const session = await auth() as Session;
//   const missingKeys = await getMissingKeys();
//   return {
//     questions, session, missingKeys // These props will be passed to the default export component
//   };
// }

export default async function IndexPage(/*{session}*/) {

  const {props} = await loader()
  const {questions, session} = props;
  
  const id = nanoid()
  // const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()
  const firstQuestion = questions[0]
  const questionText = firstQuestion.question
  const answers = firstQuestion.answers
  
  const handleFetchQuestions = async () => {
    const newQuestions = await fetchQuestions();
    if (newQuestions.length > 0) {
      const questionText = newQuestions[0].question;
      await submitUserMessage(questionText); // Assuming you want to send the question text
    }
  }; 

  // This works - question coming in from loader
  console.log('questionTextp', questions, questionText)

  // const qus = await fetchQuestions()
  // console.log('pagehere', qus);

  return (
    <AI initialAIState={{ chatId: id, messages: [] }}>
      {/* <div>asdfk</div> */}
      <Chat id={id} session={session} missingKeys={missingKeys} questionText={questionText} answers={answers} />
      {/* <button onClick={() => fetchQuestions()}>Click</button> */}
      {/* <button onClick={() => insertQuestion()}>Clickr</button> */}
      {/* <LogButton /> */}
      {/* <div>{questions ? questions[0].content: null}</div> */}
    </AI>
  )
}
