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

// async function confirmPurchase(symbol: string, price: number, amount: number) {
//   'use server'

//   const aiState = getMutableAIState<typeof AI>()

//   const purchasing = createStreamableUI(
//     <div className="inline-flex items-start gap-1 md:items-center">
//       {spinner}
//       <p className="mb-2">
//         Purchasing {amount} ${symbol}...
//       </p>
//     </div>
//   )

//   const systemMessage = createStreamableUI(null)

//   runAsyncFnWithoutBlocking(async () => {
//     await sleep(1000)

//     purchasing.update(
//       <div className="inline-flex items-start gap-1 md:items-center">
//         {spinner}
//         <p className="mb-2">
//           Purchasing {amount} ${symbol}... working on it...
//         </p>
//       </div>
//     )

//     await sleep(1000)

//     purchasing.done(
//       <div>
//         <p className="mb-2">
//           You have successfully purchased {amount} ${symbol}. Total cost:{' '}
//           {formatNumber(amount * price)}
//         </p>
//       </div>
//     )

//     systemMessage.done(
//       <SystemMessage>
//         You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
//         {formatNumber(amount * price)}.
//       </SystemMessage>
//     )

//     aiState.done({
//       ...aiState.get(),
//       messages: [
//         ...aiState.get().messages.slice(0, -1),
//         {
//           id: nanoid(),
//           role: 'function',
//           name: 'showStockPurchase',
//           content: JSON.stringify({
//             symbol,
//             price,
//             defaultAmount: amount,
//             status: 'completed'
//           })
//         },
//         {
//           id: nanoid(),
//           role: 'system',
//           content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
//             amount * price
//           }]`
//         }
//       ]
//     })
//   })

//   return {
//     purchasingUI: purchasing.value,
//     newMessage: {
//       id: nanoid(),
//       display: systemMessage.value
//     }
//   }
// }

export async function nextQuestion(){
  // 'use server'
  const questions = await fetchQuestions()

  if (!questions) {
    console.error('No question fetched');
    return 'No question available.';
  }

  console.log('qwu',questions)
  return questions
}

async function submitUserMessage(content: string): Promise<{ id: string, display: any}>{
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  console.log('user submitted', content.slice(0,8))

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

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const ui = render({
    model: 'gpt-3.5-turbo',
    provider: openai,
    initial: <SpinnerMessage />,
    messages: [
      {
        role: 'system',
        content:
            `You are an AI bar exam specialist. You have perfect knowledge about the law and the bar exam. You grade users' answers to sample bar exam questions and help prepare them to pass the test.

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
        description: 'Queries the database for the next question to display to the user once they have answered the current one correctly and have no more questions.',
        parameters: z.object({}),
        render: async () => {
          const questions = await nextQuestion();
          console.log('in function call', questions)
          return <BotMessage content={`Next Question: ${questions[0].question}`} />;
        },
      }
    }

    //   function: {
    //     name: "insert_mbe_question",
    //     description:
    //       "Insert MBE question into the database. The input parameter object has a question attribute that contains all the relevant case context preceding the final question 'stem'",
    //     parameters: {
    //       type: "object",
    //       properties: {
    //         Document_title: { type: "string" },
    //         Doc_Lines_to_Delete: { type: "array", items: { type: "integer" } },
    //         Document_Date: { type: "string" },
    //         Publisher: { type: "string" },
    //         question_type: { type: "string", const: "MBE" },
    //         question: {
    //           type: "string",
    //           description:
    //             "The entire question from the document to be inserted (may include multiple paragraphs in the root of the question)",
    //         },
    //         answers: {
    //           type: "object",
    //           properties: {
    //             A: { type: "string" },
    //             B: { type: "string" },
    //             C: { type: "string" },
    //             D: { type: "string" },
    //           },
    //         },
    //         correct_answer: { type: "string" },
    //         answer_origin: { type: "string" },
    //         explanation: { type: "string" },
    //         explanation_origin: { type: "string" },
    //         difficulty_level: { type: "integer" },
    //         law_category_tags: { type: "array", items: { type: "string" } },
    //         topic: { type: "array", items: { type: "string" } },
    //       },
    //       required: [
    //         "Document_title",
    //         "Doc_Lines_to_Delete",
    //         "Document_Date",
    //         "Publisher",
    //         "question_type",
    //         "question",
    //         "answers",
    //         "correct_answer",
    //         "answer_origin",
    //         "explanation",
    //         "explanation_origin",
    //         "difficulty_level",
    //         "law_category_tags",
    //         "topic",
    //       ],
    //     },
    //   }
    // }
    // functions: {
    //   listStocks: {
    //     description: 'List three imaginary stocks that are trending.',
    //     parameters: z.object({
    //       stocks: z.array(
    //         z.object({
    //           symbol: z.string().describe('The symbol of the stock'),
    //           price: z.number().describe('The price of the stock'),
    //           delta: z.number().describe('The change in price of the stock')
    //         })
    //       )
    //     }),
    //     render: async function* ({ stocks }) {
    //       yield (
    //         <BotCard>
    //           <StocksSkeleton />
    //         </BotCard>
    //       )

    //       await sleep(1000)

    //       aiState.done({
    //         ...aiState.get(),
    //         messages: [
    //           ...aiState.get().messages,
    //           {
    //             id: nanoid(),
    //             role: 'function',
    //             name: 'listStocks',
    //             content: JSON.stringify(stocks)
    //           }
    //         ]
    //       })

    //       return (
    //         <BotCard>
    //           <Stocks props={stocks} />
    //         </BotCard>
    //       )
    //     }
    //   },
    //   showStockPrice: {
    //     description:
    //       'Get the current stock price of a given stock or currency. Use this to show the price to the user.',
    //     parameters: z.object({
    //       symbol: z
    //         .string()
    //         .describe(
    //           'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
    //         ),
    //       price: z.number().describe('The price of the stock.'),
    //       delta: z.number().describe('The change in price of the stock')
    //     }),
    //     render: async function* ({ symbol, price, delta }) {
    //       yield (
    //         <BotCard>
    //           <StockSkeleton />
    //         </BotCard>
    //       )

    //       await sleep(1000)

    //       aiState.done({
    //         ...aiState.get(),
    //         messages: [
    //           ...aiState.get().messages,
    //           {
    //             id: nanoid(),
    //             role: 'function',
    //             name: 'showStockPrice',
    //             content: JSON.stringify({ symbol, price, delta })
    //           }
    //         ]
    //       })

    //       return (
    //         <BotCard>
    //           <Stock props={{ symbol, price, delta }} />
    //         </BotCard>
    //       )
    //     }
    //   },
    //   showStockPurchase: {
    //     description:
    //       'Show price and the UI to purchase a stock or currency. Use this if the user wants to purchase a stock or currency.',
    //     parameters: z.object({
    //       symbol: z
    //         .string()
    //         .describe(
    //           'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
    //         ),
    //       price: z.number().describe('The price of the stock.'),
    //       numberOfShares: z
    //         .number()
    //         .describe(
    //           'The **number of shares** for a stock or currency to purchase. Can be optional if the user did not specify it.'
    //         )
    //     }),
    //     render: async function* ({ symbol, price, numberOfShares = 100 }) {
    //       if (numberOfShares <= 0 || numberOfShares > 1000) {
    //         aiState.done({
    //           ...aiState.get(),
    //           messages: [
    //             ...aiState.get().messages,
    //             {
    //               id: nanoid(),
    //               role: 'system',
    //               content: `[User has selected an invalid amount]`
    //             }
    //           ]
    //         })

    //         return <BotMessage content={'Invalid amount'} />
    //       }

    //       aiState.done({
    //         ...aiState.get(),
    //         messages: [
    //           ...aiState.get().messages,
    //           {
    //             id: nanoid(),
    //             role: 'function',
    //             name: 'showStockPurchase',
    //             content: JSON.stringify({
    //               symbol,
    //               price,
    //               numberOfShares
    //             })
    //           }
    //         ]
    //       })

    //       return (
    //         <BotCard>
    //           <Purchase
    //             props={{
    //               numberOfShares,
    //               symbol,
    //               price: +price,
    //               status: 'requires_action'
    //             }}
    //           />
    //         </BotCard>
    //       )
    //     }
    //   },
    //   getEvents: {
    //     description:
    //       'List funny imaginary events between user highlighted dates that describe stock activity.',
    //     parameters: z.object({
    //       events: z.array(
    //         z.object({
    //           date: z
    //             .string()
    //             .describe('The date of the event, in ISO-8601 format'),
    //           headline: z.string().describe('The headline of the event'),
    //           description: z.string().describe('The description of the event')
    //         })
    //       )
    //     }),
    //     render: async function* ({ events }) {
    //       yield (
    //         <BotCard>
    //           <EventsSkeleton />
    //         </BotCard>
    //       )

    //       await sleep(1000)

    //       aiState.done({
    //         ...aiState.get(),
    //         messages: [
    //           ...aiState.get().messages,
    //           {
    //             id: nanoid(),
    //             role: 'function',
    //             name: 'getEvents',
    //             content: JSON.stringify(events)
    //           }
    //         ]
    //       })

    //       return (
    //         <BotCard>
    //           <Events props={events} />
    //         </BotCard>
    //       )
    //     }
    //   }
    // }
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
    nextQuestion,
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
  unstable_onSetAIState: async ({ state, done }: {state: any, done: boolean}) => {
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

export const getUIStateFromAIState = (aiState: Chat) => {
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