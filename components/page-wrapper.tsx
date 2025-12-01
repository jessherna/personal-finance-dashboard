"use client"

import { PageCustomizer } from "./page-customizer"

interface PageWrapperProps {
  children: React.ReactNode
}

export function PageWrapper({ children }: PageWrapperProps) {
  return (
    <>
      {children}
      <PageCustomizer />
    </>
  )
}

