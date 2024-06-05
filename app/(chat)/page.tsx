import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions2'
import { auth } from '@/auth'
import { Session } from '@/lib/types'
import { getMissingKeys } from '../actions'
import { supabase, fetchQuestions } from '../../supabaseClient'
import loader from './page.server'
import { insertQuestion, insertUniqueQuestion } from '../actions'
import LogButton from '../../components/logButton'

export const metadata = {
  title: 'Juris'
}

export default async function IndexPage(/*{session}*/) {
  const { props } = await loader()
  const { questions, session } = props

  const id = nanoid()
  // const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()
  const firstQuestion = questions[0]
  const questionText = firstQuestion.questionText
  const possibleAnswers = firstQuestion.possibleAnswers
  // const initialQuestionText = firstQuestion.questionText
  // const initialPossibleAnswers = firstQuestion.possibleAnswers

  // const [questionText, setQuestionText] = useState(initialQuestionText)
  // const [possibleAnswers, setPossibleAnswers] = useState(initialPossibleAnswers)

  const handleFetchQuestions = async () => {
    // const newQuestion = await nextQuestion()
    const newQuestions = await fetchQuestions()
    if (newQuestions.length > 0) {
      // setQuestionText(newQuestion.questionText)
      // setPossibleAnswers(newQuestion.possibleAnswers)
      const questionText = newQuestions[0].questionText
      const possibleAnswers = newQuestions[0].possibleAnswers
      await submitUserMessage(questionText) // Assuming you want to send the question text
    }
  }

  // This works - question coming in from loader
  console.log('questionTextp', questions, questionText, typeof possibleAnswers)

  // const qus = await fetchQuestions()
  // console.log('pagehere', qus);

  return (
    // <AI initialAIState={{ chatId: id, messages: []}}>
    <AI>
      {/* <div>asdfk</div> */}
      <Chat
        id={id}
        session={session}
        missingKeys={missingKeys}
        possibleAnswers={possibleAnswers}
      />
      {/* <button onClick={() => fetchQuestions()}>Click</button> */}
      {/* <button onClick={() => insertQuestion()}>Clickr</button> */}
      {/* <LogButton /> */}
      {/* <div>{questions ? questions[0].content: null}</div> */}
    </AI>
  )
}
