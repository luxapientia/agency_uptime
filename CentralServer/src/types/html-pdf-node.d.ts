declare module 'html-pdf-node' {
  interface GenerateOptions {
    format?: 'A3' | 'A4' | 'A5' | 'Legal' | 'Letter' | 'Tabloid';
    margin?: {
      top?: string;
      bottom?: string;
      left?: string;
      right?: string;
    };
    printBackground?: boolean;
    displayHeaderFooter?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
    landscape?: boolean;
    pageRanges?: string;
    width?: string;
    height?: string;
    preferCSSPageSize?: boolean;
  }

  interface FileInput {
    content: string;
    url?: string;
  }

  export function generatePdf(file: FileInput, options?: GenerateOptions): Promise<Buffer>;
} 