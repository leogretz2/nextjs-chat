import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'
import { Question } from '@/lib/types'

const exampleMessages = [
  {
    heading: 'Explain technical concepts',
    message: `What is a "serverless function"?`
  },
  {
    heading: 'Summarize an article',
    message: 'Summarize the following article for a 2nd grader: \n'
  },
  {
    heading: 'Draft an email',
    message: `Draft an email to my boss about the following: \n`
  }
]

export function QuestionScreen({questionText}: {questionText: string}) {
  return (
    <div className="flex flex-col justify-center items-center w-full px-4 mb-4 mt-8">
    {/* <div className="flex flex-col justify-center items-center h-full w-full px-4"> */}
    {/* <div className="mx-auto max-w-2xl px-4"> */}
    {/* // <div className="mx-auto px-4"> */}
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8 w-full max-w-2x1">
      {/* <div className="flex flex-col gap-2 rounded-lg border bg-background p-8"> */}
        <h1 className="text-lg font-semibold">
          MBE Multiple Choice Question
        </h1>
        <p className="leading-normal text-muted-foreground">
          {questionText}
          {/* The state of Freedonia passes a law requiring that all school children salute the national flag each morning. A group of students who are members of a religious sect that believes such salutes are against their religious principles refuse to comply. The students are subsequently suspended from school. The students&apos; parents sue the state, arguing that the law violates the First Amendment.

          Which of the following arguments is most likely to determine the outcome of this case? */}

        </p>
      </div>
    </div>
  )
}
