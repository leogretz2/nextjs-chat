import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { auth } from '@/auth'
import { Session } from '@/lib/types'
import { getMissingKeys } from '../actions'
import { supabase, fetchQuestions } from '../../supabaseClient'
import loader from './page.server'

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

export default async function IndexPage({session}) {

  const props = await loader()
  const {questions} = props;
  // console.log('questions1',props.questions)
  console.log('questions',questions)
  
  const id = nanoid()
  // const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()

  // const qus = await fetchQuestions()
  // console.log('pagehere', qus)

  return (
    <AI initialAIState={{ chatId: id, messages: [] }}>
      <div>asdfk</div>
      <Chat id={id} session={session} missingKeys={missingKeys} />
      {/* <button onClick={() => fetchQuestions()}>Click</button> */}
      <div>{questions ? questions[0].content: null}</div>
    </AI>
  )
}
