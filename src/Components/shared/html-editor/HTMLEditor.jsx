import React, { useCallback, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Box, FormLabel, FormHelperText } from '@mui/material';
import './HTMLEditor.scss';

const HTMLEditor = ({ 
  label, 
  value = '', 
  onChange, 
  placeholder = 'Enter your content...', 
  helperText = '', 
  error = false,
  height = '200px',
  ...props 
}) => {
  // Enhanced toolbar with more formatting options
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],
      ['clean']
    ],
    clipboard: {
      // Enable rich paste from Word documents
      matchVisual: false,
    }
  }), []);

  const formats = useMemo(() => [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'link', 'image', 'video',
    'blockquote', 'code-block'
  ], []);

  const handleChange = useCallback((content, delta, source, editor) => {
    // Get the HTML content
    const htmlContent = editor.getHTML();
    onChange(htmlContent);
  }, [onChange]);

  return (
    <Box className="html-editor-container" sx={{ mb: 2 }}>
      {label && (
        <FormLabel 
          component="legend" 
          sx={{ 
            mb: 1, 
            display: 'block', 
            fontWeight: 600,
            color: error ? 'error.main' : 'text.primary'
          }}
        >
          {label}
        </FormLabel>
      )}
      
      <Box 
        className={`html-editor-wrapper ${error ? 'error' : ''}`}
        sx={{
          border: error ? '2px solid' : '1px solid',
          borderColor: error ? 'error.main' : 'divider',
          borderRadius: 1,
          '& .ql-editor': {
            minHeight: height,
            fontSize: '14px',
            lineHeight: 1.6,
          },
          '& .ql-toolbar': {
            borderBottom: '1px solid',
            borderBottomColor: 'divider',
          }
        }}
      >
        <ReactQuill
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          theme="snow"
          {...props}
        />
      </Box>
      
      {helperText && (
        <FormHelperText 
          sx={{ 
            mt: 0.5, 
            color: error ? 'error.main' : 'text.secondary' 
          }}
        >
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

export default HTMLEditor;