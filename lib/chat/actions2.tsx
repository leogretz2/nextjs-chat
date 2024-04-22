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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

export const AI = createAI({
  initialAIState: { chatId: nanoid(), messages: [] },
  initialUIState: [], // Initialize the UI state as an empty array
  actions: {
    submitUserMessage: async (content) => {
      'use server';

      const aiState = getMutableAIState(); // Access mutable state

      // Append user message to state first
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
      });

      try {
        const textResponse = await render({
          model: 'gpt-3.5-turbo',
          provider: openai,
          messages: [{role: 'system', content: `You are an AI bar exam specialist. You have perfect knowledge about the law and the bar exam. You grade users' answers to sample bar exam questions and help prepare them to pass the test.

          Current Question:
          The state of Freedonia passes a law requiring that all school children salute the national flag each morning. A group of students who are members of a religious sect that believes such salutes are against their religious principles refuse to comply. The students are subsequently suspended from school. The students' parents sue the state, arguing that the law violates the First Amendment. Which of the following arguments is most likely to determine the outcome of this case?
          
         `}, {role: 'user', content: ${content}}]
        });

        if (textResponse && textResponse.choices && textResponse.choices.length > 0) {
          aiState.update({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: textResponse.choices[0].text
              }
            ]
          });
        } else {
          throw new Error("Invalid response from the AI.");
        }
      } catch (error) {
        console.error("Error during rendering:", error);
        aiState.update({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'system',
              content: "An error occurred while processing your message."
            }
          ]
        });
      }

      return aiState.get();
    }
  }
});


// export const AI = createAI({
//   initialAIState: { chatId: nanoid(), messages: [] },
//   initialUIState: [], // Initialize the UI state as an empty array
//   actions: {
//     submitUserMessage: async (content) => {
//       'use server'

//       const aiState = getMutableAIState(); // Ensure you are retrieving state correctly

//       try {
//         // Assuming render here is adapted for your custom usage
//         const textResponse = await render({
//           model: 'gpt-3.5-turbo',
//           provider: openai,
//           prompt: `You are an AI bar exam specialist. You have perfect knowledge about the law and the bar exam. You grade users' answers to sample bar exam questions and help prepare them to pass the test.

//           Current Question:
//           The state of Freedonia passes a law requiring that all school children salute the national flag each morning. A group of students who are members of a religious sect that believes such salutes are against their religious principles refuse to comply. The students are subsequently suspended from school. The students' parents sue the state, arguing that the law violates the First Amendment. Which of the following arguments is most likely to determine the outcome of this case?
          
//           User's response: ${content}`
//         });

//         if (textResponse && textResponse.choices && textResponse.choices.length > 0) {
//           aiState.update({
//             ...aiState.get(),
//             messages: [
//               ...aiState.get().messages,
//               {
//                 id: nanoid(),
//                 role: 'assistant',
//                 content: textResponse.choices[0].text
//               }
//             ]
//           });
//         } else {
//           throw new Error("Invalid response from the AI.");
//         }
//       } catch (error) {
//         console.error("Error during rendering:", error);
//         aiState.update({
//           ...aiState.get(),
//           messages: [
//             ...aiState.get().messages,
//             {
//               id: nanoid(),
//               role: 'system',
//               content: "An error occurred while processing your message."
//             }
//           ]
//         });
//       }

//       return aiState.get();

//       const textResponse = await render({
//         model: 'gpt-3.5-turbo',
//         provider: openai,
//         // initial: <SpinnerMessage />,
//         messages: [
//           {
//             role: 'system',
//             content: `You are an ai bar exam specialist. You have perfect knowledge about the law and the bar exam. You grade users answers to sample bar exam questions and help prepare them to pass the test.

//             Current Question:
//             The state of Freedonia passes a law requiring that all school children salute the national flag each morning. A group of students who are members of a religious sect that believes such salutes are against their religious principles refuse to comply. The students are subsequently suspended from school. The students' parents sue the state, arguing that the law violates the First Amendment. Which of the following arguments is most likely to determine the outcome of this case?
            
//             User's response: ${content}`
//           },
//           // ...aiState.get().messages.map((message: any) => ({
//           //   role: message.role,
//           //   content: message.content,
//           //   name: message.name
//           // }))
//         ],
//         // max_tokens: 150,
//       });

//       aiState.messages.push({
//         id: nanoid(),
//         role: 'assistant',
//         content: textResponse?.choices[0].text
//       });

//       return aiState;
//     }
//   }
// });

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  id: string
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages.map((message, index) => ({
    id: `${aiState.chatId}-${index}`,
    display: message.content
  }));
}
