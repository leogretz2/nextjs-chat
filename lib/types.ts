import { Message } from 'ai'

export interface Question {
  id?: string;
  documentTitle: string;
  documentDate: string;
  publisher: string;
  question_type: 'MBE' | 'MEE' | 'MPT';
  question: string; // Change this to questionText
  answers?: AnswerChoices; // Change this to possibleAnswers
  correctAnswer: string;
  answerOrigin: string;
  explanation?: string;
  explanationOrigin: 'Generated' | 'Document';
  difficultyLevel?: number;
  lawCategoryTags: string[];
  topic?: string[];
  createdAt: string; // TODO: find right type for timestamp
}

export interface AnswerChoices {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface AnswerChoice {
  heading: string;
  message: string;
}

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>

export interface Session {
  user: {
    id: string
    email: string
  }
}

export interface AuthResult {
  type: string
  message: string
}

export interface User extends Record<string, any> {
  id: string
  email: string
  password: string
  salt: string
}
