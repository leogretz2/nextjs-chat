'use client'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { QuestionScreen } from '@/components/question-screen'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { useEffect, useState } from 'react'
import { useUIState, useAIState } from 'ai/rsc'
import { usePathname, useRouter } from 'next/navigation'
import { Message } from '@/lib/chat/actions'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { toast } from 'sonner'
import { Question, PossibleAnswers } from '@/lib/types'
import { Session } from '@auth/core/types'
import { supabase, fetchQuestions } from '../supabaseClient'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  session: Session | null
  missingKeys?: string[]
  questionText: string
  possibleAnswers?: PossibleAnswers
}

export function Chat({
  id,
  className,
  session,
  missingKeys,
  questionText,
  possibleAnswers
}: ChatProps) {
  const router = useRouter()
  const path = usePathname()
  const [input, setInput] = useState('')
  const [messages] = useUIState()
  const [aiState] = useAIState()

  const [_, setNewChatId] = useLocalStorage('newChatId', id)

  useEffect(() => {
    if (session?.user) {
      if (!path.includes('chat') && messages.length === 1) {
        window.history.replaceState({}, '', `/chat/${id}`)
      }
    }
  }, [id, path, session?.user, messages])

  useEffect(() => {
    const messagesLength = aiState.messages?.length
    if (messagesLength === 2) {
      router.refresh()
    }
  }, [aiState.messages, router])

  useEffect(() => {
    setNewChatId(id)
  })

  useEffect(() => {
    missingKeys?.map(key => {
      toast.error(`Missing ${key} environment variable!`)
    })
  }, [missingKeys])

  // This works - outputted in browser console
  // console.log('answersc', possibleAnswers)

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor()

  return (
    <div
      className="flex flex-col h-screen w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]"
      // className="group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]"
      ref={scrollRef}
    >
      <div className={cn('flex-shrink-0 pt-4 md:pt-10', className)}>
        <QuestionScreen questionText={questionText} />
      </div>
      <div
        className={cn(
          'flex-grow overflow-auto pb-[200px] pt-4 md:pt-10',
          className
        )}
        // className={cn('pb-[200px] pt-4 md:pt-10', className)}
        // className={cn('flex-grow pb-[100px] pt-4 md:pt-10', className)}
        ref={messagesRef}
      >
        {/* <QuestionScreen questionText={questionText}/> */}
        {messages.length ? (
          <ChatList messages={messages} isShared={false} session={session} />
        ) : null}
        <div className="h-px w-full" ref={visibilityRef} />
      </div>
      <ChatPanel
        id={id}
        input={input}
        setInput={setInput}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
        possibleAnswers={possibleAnswers}
      />
    </div>
  )
}
