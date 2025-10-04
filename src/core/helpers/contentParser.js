// Utility function to handle different JSON formats and quote styles
export const parseContentJSON = (contentString) => {
  if (!contentString) return null;
  
  try {
    // First try standard JSON parsing
    return JSON.parse(contentString);
  } catch (e1) {
    try {
      // If standard parsing fails, try handling Python-style dictionaries
      console.log('Attempting to parse Python-style dictionary...');
      
      // More robust replacement for Python-style dictionaries
      let normalizedContent = contentString;
      
      // Replace single quotes with double quotes, but be careful about quotes inside content
      // First, temporarily replace escaped single quotes
      normalizedContent = normalizedContent.replace(/\\'/g, '___ESCAPED_QUOTE___');
      
      // Then replace single quotes that are used as string delimiters
      // This regex looks for single quotes that are likely string delimiters
      normalizedContent = normalizedContent.replace(/'([^']*?)'/g, '"$1"');
      
      // Restore escaped quotes
      normalizedContent = normalizedContent.replace(/___ESCAPED_QUOTE___/g, "\\'");
      
      // Replace Python boolean and null values
      normalizedContent = normalizedContent
        .replace(/True/g, 'true')
        .replace(/False/g, 'false')
        .replace(/None/g, 'null');
      
      console.log('Normalized content:', normalizedContent);
      
      return JSON.parse(normalizedContent);
    } catch (e2) {
      try {
        // If that fails, try a more aggressive approach for the specific case
        console.log('Attempting more aggressive parsing...');
        
        // For the specific case where we have {'key': 'value'} format with complex content
        // Let's try to extract the fields manually using more robust patterns
        
        // Extract page_title (should be simple)
        const titleMatch = contentString.match(/'page_title':\s*'([^']+)'/);
        
        // For page_content, we need to be more careful since it contains HTML with quotes
        // Look for 'page_content': ' and then find the matching closing quote before the next field or end
        let pageContent = '';
        const contentStartMatch = contentString.match(/'page_content':\s*'/);
        if (contentStartMatch) {
          const startIndex = contentStartMatch.index + contentStartMatch[0].length;
          // Look for the end - either before 'page_intro' or before the closing }
          let endIndex = contentString.indexOf("', 'page_intro'", startIndex);
          if (endIndex === -1) {
            endIndex = contentString.indexOf("'}", startIndex);
          }
          if (endIndex !== -1) {
            pageContent = contentString.substring(startIndex, endIndex);
          }
        }
        
        // Extract page_intro if it exists
        const introMatch = contentString.match(/'page_intro':\s*'([^']*)'/);
        
        if (titleMatch || pageContent) {
          const result = {
            page_title: titleMatch ? titleMatch[1] : '',
            page_content: pageContent || '',
            page_intro: introMatch ? introMatch[1] : ''
          };
          console.log('Manually extracted content:', result);
          return result;
        }
        
        console.warn('All parsing attempts failed:', e2);
        return null;
      } catch (e3) {
        console.warn('Failed to parse content as JSON:', e3);
        return null;
      }
    }
  }
};

// Helper function to safely extract content fields
export const extractContentFields = (parsedContent, defaultTitle) => {
  if (!parsedContent || typeof parsedContent !== 'object') {
    return {
      title: defaultTitle,
      intro: '',
      content: ''
    };
  }
  
  return {
    title: parsedContent.page_title || defaultTitle,
    intro: parsedContent.page_intro || '',
    content: parsedContent.page_content || ''
  };
};

// Helper function to escape content for safe JSON storage (only escape single quotes for database format)
export const escapeContentForJSON = (content) => {
  if (!content || typeof content !== 'string') return content;
  
  return content
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/'/g, "\\'");   // Escape single quotes only (double quotes remain unescaped for HTML attributes, classes, links)
};

// Helper function to unescape content from JSON storage for display
export const unescapeContentFromJSON = (content) => {
  if (!content || typeof content !== 'string') return content;
  
  return content
    .replace(/\\'/g, "'")    // Unescape single quotes only
    .replace(/\\\\/g, '\\'); // Unescape backslashes last
};

// Helper function to format content as Python dictionary string (with single quotes)
export const formatAsPythonDict = (contentData) => {
  const title = escapeContentForJSON(contentData.page_title || '');
  const intro = escapeContentForJSON(contentData.page_intro || '');
  const content = escapeContentForJSON(contentData.page_content || '');
  
  return `{'page_title': '${title}', 'page_intro': '${intro}', 'page_content': '${content}'}`;
};

// Helper function to prepare content object for API submission
export const prepareContentForSave = (contentData) => {
  // Return the Python dictionary format string instead of JSON object
  return formatAsPythonDict(contentData);
};

// Helper function to prepare content object for editing (unescape for HTML editors)
export const prepareContentForEdit = (parsedContent) => {
  if (!parsedContent || typeof parsedContent !== 'object') {
    return {
      page_title: '',
      page_intro: '',
      page_content: ''
    };
  }
  
  return {
    page_title: unescapeContentFromJSON(parsedContent.page_title || ''),
    page_intro: unescapeContentFromJSON(parsedContent.page_intro || ''),
    page_content: unescapeContentFromJSON(parsedContent.page_content || '')
  };
};

export default { 
  parseContentJSON, 
  extractContentFields, 
  escapeContentForJSON, 
  unescapeContentFromJSON,
  formatAsPythonDict,
  prepareContentForSave,
  prepareContentForEdit
};