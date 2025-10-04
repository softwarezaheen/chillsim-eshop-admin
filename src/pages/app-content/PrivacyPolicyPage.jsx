import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { toast } from 'react-toastify';
import {
  getActiveContent,
  createContentVersion,
  CONTENT_TYPES,
  LANGUAGE_CODES,
  getContentHistory,
} from '../../core/apis/appContentAPI';
import { 
  parseContentJSON, 
  extractContentFields, 
  prepareContentForEdit, 
  prepareContentForSave 
} from '../../core/helpers/contentParser';
import HTMLEditor from '../../Components/shared/html-editor';

const PrivacyPolicyPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGE_CODES.EN);
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getActiveContent(CONTENT_TYPES.PRIVACY_POLICY, selectedLanguage);
      if (error) {
        console.error('Error fetching content:', error);
        setTitle('Privacy Policy');
        setIntro('');
        setContent('');
      } else {
        const contentData = data?.[0];
        if (contentData?.content) {
          const parsed = parseContentJSON(contentData.content);
          console.log('Raw content:', contentData.content);
          console.log('Parsed content:', parsed);
          
          if (parsed) {
            // Use the new function to properly unescape content for editing
            const editableContent = prepareContentForEdit(parsed);
            setTitle(editableContent.page_title || 'Privacy Policy');
            setIntro(editableContent.page_intro || '');
            setContent(editableContent.page_content || '');
          } else {
            // If JSON parsing fails completely, treat the whole content as plain text
            setTitle(contentData.title || 'Privacy Policy');
            setIntro('');
            setContent(contentData.content || '');
          }
        } else {
          setTitle('Privacy Policy');
          setIntro('');
          setContent('');
        }
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to fetch content');
    }
    setLoading(false);
  }, [selectedLanguage]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await getContentHistory(CONTENT_TYPES.PRIVACY_POLICY, selectedLanguage);
      if (error) {
        console.error('Error fetching content history:', error);
      } else {
        setHistory(data || []);
      }
    } catch (error) {
      console.error('Error fetching content history:', error);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content cannot be empty');
      return;
    }

    setSaving(true);
    try {
      // Prepare content in Python dictionary format with single quotes
      const contentData = prepareContentForSave({
        page_title: title,
        page_intro: intro,
        page_content: content
      });

      const { data, error } = await createContentVersion(
        CONTENT_TYPES.PRIVACY_POLICY,
        selectedLanguage,
        contentData,
        title
      );
      
      if (error) {
        console.error('Error saving content:', error);
        toast.error('Failed to save content');
      } else {
        toast.success('Privacy Policy saved successfully');
        fetchContent();
        if (showHistory) {
          fetchHistory();
        }
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    }
    setSaving(false);
  };

  const loadHistoryVersion = (item) => {
    const parsed = parseContentJSON(item.content);
    console.log('Loading history version:', parsed);
    
    if (parsed) {
      // Use the new function to properly unescape content for editing
      const editableContent = prepareContentForEdit(parsed);
      setTitle(editableContent.page_title || item.title || 'Privacy Policy');
      setIntro(editableContent.page_intro || '');
      setContent(editableContent.page_content || '');
    } else {
      // Fallback to treating as plain text
      setTitle(item.title || 'Privacy Policy');
      setIntro('');
      setContent(item.content || '');
    }
  };

  const languageLabels = {
    [LANGUAGE_CODES.EN]: 'English',
    [LANGUAGE_CODES.RO]: 'Romanian',
    [LANGUAGE_CODES.FR]: 'French',
    [LANGUAGE_CODES.AR]: 'Arabic',
  };

  return (
    <Card className="page-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography variant="h4">Privacy Policy</Typography>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) fetchHistory();
            }}
          >
            {showHistory ? 'Hide History' : 'Show History'}
          </Button>
          <FormControl size="small" style={{ minWidth: 120 }}>
            <InputLabel>Language</InputLabel>
            <Select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              label="Language"
            >
              {Object.entries(languageLabels).map(([code, label]) => (
                <MenuItem key={code} value={code}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      <Box sx={{ mb: 3 }}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Rich HTML Editor Features:</strong><br />
            • <strong>Page Title:</strong> The main heading displayed at the top<br />
            • <strong>Page Introduction:</strong> Rich text introduction with HTML formatting<br />
            • <strong>Page Content:</strong> Full HTML editor with formatting toolbar<br />
            <br />
            <strong>Editing Tips:</strong><br />
            • Paste directly from Word documents to preserve formatting<br />
            • Use the toolbar for headers, lists, links, bold, italic, and more<br />
            • Content is automatically escaped for safe storage and automatically versioned<br />
            • Preview shows exactly how content will appear to users
          </Typography>
        </Alert>
      </Box>

      {showHistory && (
        <Accordion sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Content History ({languageLabels[selectedLanguage]})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {history.map((item) => (
                <Box key={item.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="subtitle2">
                    Version {item.version} - {item.is_active ? '(Active)' : '(Inactive)'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Created: {new Date(item.created_at).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Title: {item.title}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => loadHistoryVersion(item)}
                    sx={{ mt: 1 }}
                  >
                    Load This Version
                  </Button>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            fullWidth
            label="Page Title"
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter page title..."
          />

          <HTMLEditor
            label="Page Introduction"
            value={intro}
            onChange={setIntro}
            placeholder="Enter a brief introduction or summary..."
            helperText="Brief introduction that appears at the top of the page. You can paste from Word documents and use rich formatting."
            height="120px"
          />

          <HTMLEditor
            label="Page Content"
            value={content}
            onChange={setContent}
            placeholder="Enter Privacy Policy content..."
            helperText="Main content of the page. You can paste from Word documents and use rich formatting including headers, lists, links, and more."
            height="400px"
          />

          <Box>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || loading}
              sx={{ mr: 2 }}
            >
              {saving ? <CircularProgress size={20} /> : 'Save Privacy Policy'}
            </Button>
          </Box>

          {/* Preview Section */}
          {(title || intro || content) && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Preview</Typography>
              <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 3, bgcolor: 'grey.50' }}>
                {title && (
                  <Typography variant="h4" sx={{ mb: 2 }}>
                    {title}
                  </Typography>
                )}
                {intro && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <div dangerouslySetInnerHTML={{ __html: intro }} />
                  </Box>
                )}
                {content && (
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Card>
  );
};

export default PrivacyPolicyPage;