import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Simple parser for basic markdown features
  // Note: For a production app, use 'react-markdown' or 'marked'
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    let elements: React.ReactElement[] = [];
    let listItems: React.ReactElement[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    lines.forEach((line, index) => {
      const key = `line-${index}`;

      // Code Block Handling
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          elements.push(
            <pre key={`code-${index}`} className="bg-gray-800 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto text-sm font-mono">
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          // Start of code block
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(<h1 key={key} className="text-3xl font-bold mt-8 mb-4 text-gray-900">{parseInline(line.slice(2))}</h1>);
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(<h2 key={key} className="text-2xl font-bold mt-6 mb-3 text-gray-800">{parseInline(line.slice(3))}</h2>);
        return;
      }
      if (line.startsWith('### ')) {
        elements.push(<h3 key={key} className="text-xl font-bold mt-5 mb-2 text-gray-800">{parseInline(line.slice(4))}</h3>);
        return;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={key} className="border-l-4 border-indigo-500 pl-4 py-2 my-4 italic text-gray-700 bg-gray-50 rounded-r-lg">
            {parseInline(line.slice(2))}
          </blockquote>
        );
        return;
      }

      // Lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        listItems.push(<li key={`li-${index}`} className="mb-1">{parseInline(line.slice(2))}</li>);
        return;
      } else if (listItems.length > 0) {
        // Flush list if we encounter a non-list line
        elements.push(<ul key={`ul-${index}`} className="list-disc pl-5 my-4 space-y-1">{[...listItems]}</ul>);
        listItems = [];
      }

      // Paragraphs (handling empty lines for spacing)
      if (line.trim() === '') {
        // Only add spacer if list items are empty (to avoid double spacing after list)
        if (listItems.length === 0) elements.push(<div key={key} className="h-4"></div>);
      } else {
        elements.push(<p key={key} className="mb-4 leading-relaxed text-gray-700">{parseInline(line)}</p>);
      }
    });

    // Flush any remaining list items
    if (listItems.length > 0) {
      elements.push(<ul key="ul-last" className="list-disc pl-5 my-4 space-y-1">{listItems}</ul>);
    }
    // Flush any remaining code block
    if (inCodeBlock) {
        elements.push(
            <pre key="code-last" className="bg-gray-800 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto text-sm font-mono">
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          );
    }

    return elements;
  };

  const parseInline = (text: string): React.ReactNode => {
    // Very basic inline parsing for bold, italic, links
    // Split by simple regex patterns
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-gray-100 text-red-500 px-1 py-0.5 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return <div className="markdown-body font-serif">{parseMarkdown(content)}</div>;
};

export default MarkdownRenderer;