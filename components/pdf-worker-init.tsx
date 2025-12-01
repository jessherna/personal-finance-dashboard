"use client"

import { useEffect } from "react"

/**
 * Initialize PDF.js worker on client-side
 * This must run before any PDF operations
 */
export function PDFWorkerInit() {
  useEffect(() => {
    const initWorker = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist")
        // Set worker source to local file
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
        console.log("PDF.js worker initialized:", pdfjsLib.GlobalWorkerOptions.workerSrc)
      } catch (error) {
        console.error("Failed to initialize PDF.js worker:", error)
      }
    }
    
    initWorker()
  }, [])

  return null
}

