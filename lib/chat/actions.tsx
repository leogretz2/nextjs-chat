'use server'

import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  render,
  createStreamableValue
} from 'ai/rsc'
import OpenAI from 'openai'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  Stock,
  Purchase
} from '@/components/stocks'

import { z } from 'zod'
import { EventsSkeleton } from '@/components/stocks/events-skeleton'
import { Events } from '@/components/stocks/events'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'
import { Stocks } from '@/components/stocks/stocks'
import { StockSkeleton } from '@/components/stocks/stock-skeleton'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat } from '@/lib/types'
import { auth } from '@/auth'
import { fetchQuestions } from '@/supabaseClient'
import IndexPage from 'app/(chat)/page'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

export async function nextQuestion() {
  // 'use server'
  const questions = await fetchQuestions()
  const { questionText, possibleAnswers, correctAnswer, explanation } =
    questions[0]

  if (!questions) {
    console.error('No question fetched')
    return 'No question available.'
  }

  console.log('qwu', questions)
  const question = questions[0]
  return {
    questionText,
    possibleAnswers,
    correctAnswer,
    explanation
  }
}

async function submitUserMessage(
  content: string
): Promise<{ id: string; display: any }> {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  console.log('user submitted', content.slice(0, 8))

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  // Test remove
  // let textStream: undefined | ReturnType<typeof createStreamableValue<string>>;
  let textStream: undefined | ReturnType<typeof createStreamableValue>
  let textNode: undefined | React.ReactNode

  const ui: React.ReactNode = render({
    model: 'gpt-3.5-turbo',
    provider: openai,
    initial: <SpinnerMessage />,
    messages: [
      {
        role: 'system',
        content: `You are an AI bar exam specialist. You have perfect knowledge about the law and the bar exam. You grade users' answers to sample bar exam questions and help prepare them to pass the test.

              You have access to two tools. The one that is important now is nextQuestion. This is to be called whenever the user has gotten the correct answer and has no more questions so that you can move onto the next question.

            Current Question:
            The state of Freedonia passes a law requiring that all school children salute the national flag each morning. A group of students who are members of a religious sect that believes such salutes are against their religious principles refuse to comply. The students are subsequently suspended from school. The students' parents sue the state, arguing that the law violates the First Amendment. Which of the following arguments is most likely to determine the outcome of this case?
            Which of the following arguments is most likely to determine the outcome of this case?

              A. The law is justified as it promotes nationalism, which is a compelling state interest.

              B. The law is unconstitutional because it violates the students' freedom of speech.

              C. The law is unconstitutional because it violates the students' freedom of religion.

              D. The law is justified because the education of minors is a matter of state concern, not federal.

              Answer Key:
              Option C is the most correct because it directly addresses the conflict between a state-mandated action and an individual's First Amendment rights concerning religious freedom. This scenario closely parallels real-life cases, such as West Virginia State Board of Education v. Barnette (1943), where the Supreme Court held that compelling public schoolchildren to salute the flag violates the First Amendment rights of those students whose religious beliefs forbid such an act.
              Option B might seem plausible as it involves freedom of speech (also considered in the Barnette case), which includes symbolic speech (like saluting the flag). However, the primary issue here is more directly related to religious freedom, making option C more relevant.
              Option A and Option E are incorrect because the promotion of nationalism or traditional acts of patriotism cannot override fundamental First Amendment rights such as freedom of religion and speech.
              Option D is incorrect because, while education is primarily a state concern, federal constitutional rights like those in the First Amendment apply to state actions under the incorporation doctrine of the Fourteenth Amendment.

              Call the nextQuestion tool whenever the user gets the correct answer.
            `
      },
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })

        console.log('done: ', content)
      } else {
        textStream.update(delta)
      }

      return textNode
    },
    // New functions based off of old
    functions: {
      nextQuestion: {
        description:
          'Queries the database for the next question to display to the user once they have answered the current one correctly and have no more questions.',
        parameters: z.object({}),
        render: async () => {
          const questionData = await nextQuestion()
          if (typeof questionData === 'string') {
            return <BotMessage content={questionData} />
          } else {
            const {
              questionText,
              possibleAnswers,
              correctAnswer,
              explanation
            } = questionData

            // const questionText = `Next :${questionText}\nOptions:\nA.${options.A}\nB.${options.B}\nC.${options.C}\nD. ${options.D}`;
            // Reset AI and UI state for the new question
            aiState.update({
              ...aiState.get(),
              messages: [
                {
                  id: nanoid(),
                  role: 'system',
                  content: `You are an AI bar exam specialist. You have perfect knowledge about the law and the bar exam. You grade users' answers to sample bar exam questions and help prepare them to pass the test.

                    You have access to two tools. The one that is important now is nextQuestion. This is to be called whenever the user has gotten the correct answer and has no more questions so that you can move onto the next question.

                    Call the nextQuestion tool whenever the user gets the correct answer.

                    Current Question:
                    ${questionText}

                    A. ${possibleAnswers.A}
                    B. ${possibleAnswers.B}
                    C. ${possibleAnswers.C}
                    D. ${possibleAnswers.D}

                    Correct Answer:
                    ${correctAnswer}

                    Explanation:
                    ${explanation}
                    `
                }
              ]
            })

            return <BotMessage content={questionText} />
          }
        }
      }
    }
  })

  return {
    id: nanoid(),
    display: ui
  }
}

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  id: string
  name?: string
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    nextQuestion
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  unstable_onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  unstable_onSetAIState: async ({
    state,
    done
  }: {
    state: any
    done: boolean
  }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const title = messages[0].content.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIStateOld = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'function' ? (
          message.name === 'listStocks' ? (
            <BotCard>
              <Stocks props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'showStockPrice' ? (
            <BotCard>
              <Stock props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'showStockPurchase' ? (
            <BotCard>
              <Purchase props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'getEvents' ? (
            <BotCard>
              <Events props={JSON.parse(message.content)} />
            </BotCard>
          ) : null
        ) : message.role === 'user' ? (
          <UserMessage>{message.content}</UserMessage>
        ) : (
          <BotMessage content={message.content} />
        )
    }))
}

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'function' ? (
          message.name === 'nextQuestion' ? (
            <BotMessage content={message.content} />
          ) : null
        ) : message.role === 'user' ? (
          <UserMessage>{message.content}</UserMessage>
        ) : (
          <BotMessage content={message.content} />
        )
    }))
}
