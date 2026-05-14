import { gql } from '@apollo/client'

export const WEEKLY_TIP_FOR_CHURCH = gql`
  query WeeklyTipForChurch($churchId: ID!) {
    weeklyTipForChurch(churchId: $churchId) {
      id
      week
      year
      body
      generatedAt
      scripture {
        id
        book
        chapter
        verse
        translation
        text
      }
      quotedPassage {
        id
        text
        citationLabel
      }
      recommendedBook {
        id
        title
        author
        subtitle
        publishedYear
      }
    }
  }
`

export type WeeklyTipForChurchResult = {
  weeklyTipForChurch: {
    id: string
    week: number
    year: number
    body: string
    generatedAt: string
    scripture: {
      id: string
      book: string
      chapter: number
      verse: number
      translation: string
      text: string
    } | null
    quotedPassage: {
      id: string
      text: string
      citationLabel: string
    } | null
    recommendedBook: {
      id: string
      title: string
      author: string
      subtitle: string | null
      publishedYear: number | null
    } | null
  } | null
}
