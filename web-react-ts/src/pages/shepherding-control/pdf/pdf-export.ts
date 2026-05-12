import { ApolloClient } from '@apollo/client'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { SHEPHERDING_SCOPE_CHECK } from '../ShepherdingControlQueries'
import {
  ChildSummary,
  SlideData,
  SlideNode,
} from '../shepherding-control-types'
import {
  childRelationshipFor,
  nextLevelFor,
  QUERY_FOR_LEVEL,
  RESULT_KEY_FOR_LEVEL,
} from '../shepherding-control-utils'

export const fetchSlide = async (
  client: ApolloClient<object>,
  node: SlideNode
): Promise<SlideData | null> => {
  const query = QUERY_FOR_LEVEL[node.type]
  // network-only so the exported PDF reflects the same data the live
  // session is showing, not whatever happens to be in the cache from a
  // prior visit.
  const result = await client.query({
    query,
    variables: { id: node.id },
    fetchPolicy: 'network-only',
  })
  const data = result.data?.[RESULT_KEY_FOR_LEVEL[node.type]]?.[0]
  if (!data) return null

  const childKey = childRelationshipFor[node.type]
  const rawChildren: ChildSummary[] = childKey ? data[childKey] ?? [] : []
  const children = [...rawChildren].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )

  return {
    id: data.id,
    name: data.name,
    level: node.type,
    leader: data.leader
      ? {
          id: data.leader.id,
          pictureUrl: data.leader.pictureUrl ?? null,
          nameWithTitle: data.leader.nameWithTitle ?? null,
          firstName: data.leader.firstName ?? null,
          lastName: data.leader.lastName ?? null,
        }
      : null,
    memberCount: data.memberCount ?? null,
    bacentaCount: data.bacentaCount ?? null,
    aggregateServiceRecords: data.aggregateServiceRecords ?? [],
    aggregateBussingRecords: data.aggregateBussingRecords ?? [],
    children,
  }
}

export const checkScope = async (
  client: ApolloClient<object>,
  node: SlideNode
): Promise<boolean> => {
  const result = await client.query({
    query: SHEPHERDING_SCOPE_CHECK,
    variables: { level: node.type, id: node.id },
    fetchPolicy: 'network-only',
  })
  return Boolean(result.data?.shepherdingScopeCheck)
}

export type DepthChoice = 'this-level' | 'one-level-deeper' | 'full-subtree'

// Traverses the subtree depth-first. Children at each step are fetched only
// when needed; the loop yields one SlideNode + parent context at a time so
// the caller can render and snapshot a single slide before moving on.
export async function* walkSubtree(
  client: ApolloClient<object>,
  root: SlideNode,
  depth: DepthChoice,
  isCancelled: () => boolean
): AsyncGenerator<SlideData> {
  if (isCancelled()) return

  const rootSlide = await fetchSlide(client, root)
  if (!rootSlide) return
  yield rootSlide
  if (depth === 'this-level') return
  if (isCancelled()) return

  const childLevel = nextLevelFor(root.type)
  if (!childLevel) return

  for (const child of rootSlide.children) {
    if (isCancelled()) return
    const childNode: SlideNode = {
      type: childLevel,
      id: child.id,
      name: child.name,
    }

    if (depth === 'one-level-deeper') {
      const slide = await fetchSlide(client, childNode)
      if (slide) yield slide
      continue
    }

    yield* walkSubtree(client, childNode, depth, isCancelled)
  }
}

const A4_LANDSCAPE_W = 297 // mm
const A4_LANDSCAPE_H = 210

export type RenderArgs = {
  client: ApolloClient<object>
  root: SlideNode
  depth: DepthChoice
  contextHeader: string
  fileName: string
  onProgress: (rendered: number) => void
  isCancelled: () => boolean
  // The caller mounts a hidden DOM container shaped like a single slide and
  // returns it via this getter — each slide is rendered into the same
  // element and serialised with html2canvas, so memory stays bounded.
  renderSlide: (slide: SlideData) => Promise<HTMLElement>
}

export const renderDeckToPdf = async ({
  client,
  root,
  depth,
  contextHeader,
  fileName,
  onProgress,
  isCancelled,
  renderSlide,
}: RenderArgs): Promise<void> => {
  const allowed = await checkScope(client, root)
  if (!allowed) {
    throw new Error('Out of scope: you can only export your own subtree.')
  }

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  let rendered = 0
  let isFirst = true

  for await (const slide of walkSubtree(client, root, depth, isCancelled)) {
    if (isCancelled()) return

    const element = await renderSlide(slide)
    const canvas = await html2canvas(element, {
      backgroundColor: '#0a0a0a',
      useCORS: true,
      logging: false,
      scale: 1,
    })
    const imgData = canvas.toDataURL('image/png')

    if (!isFirst) pdf.addPage('a4', 'landscape')
    isFirst = false

    rendered += 1
    pdf.setFontSize(10)
    pdf.setTextColor(120)
    pdf.text(contextHeader, 10, 8)
    pdf.text(`${rendered}`, A4_LANDSCAPE_W - 10, 8, { align: 'right' })

    const imgY = 12
    const imgH = A4_LANDSCAPE_H - imgY - 6
    pdf.addImage(imgData, 'PNG', 6, imgY, A4_LANDSCAPE_W - 12, imgH)
    onProgress(rendered)
  }

  if (rendered === 0) {
    throw new Error('Nothing to export at this depth.')
  }

  if (!isCancelled()) {
    pdf.save(fileName)
  }
}
