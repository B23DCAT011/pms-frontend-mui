import { useEffect } from 'react'

const SUFFIX = 'KIAI PMS'

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : SUFFIX
  }, [title])
}
