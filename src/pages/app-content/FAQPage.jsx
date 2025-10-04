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
  Divider,
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

const FAQPage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGE_CODES.EN);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getActiveContent(CONTENT_TYPES.FAQ, selectedLanguage);
      if (error) {
        console.error('Error fetching FAQ content:', error);
        setContent('');
      } else {
        setContent(data?.[0]?.content || '');
      }
    } catch (error) {
      console.error('Error fetching FAQ content:', error);
      toast.error('Failed to fetch FAQ content');
    }
    setLoading(false);
  }, [selectedLanguage]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await getContentHistory(CONTENT_TYPES.FAQ, selectedLanguage);
      if (error) {
        console.error('Error fetching content history:', error);
      } else {
        setHistory(data || []);
      }
    } catch (error) {
      console.error('Error fetching content history:', error);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Content cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await createContentVersion(
        CONTENT_TYPES.FAQ,
        selectedLanguage,
        content,
        'FAQ Content'
      );
      
      if (error) {
        console.error('Error saving FAQ content:', error);
        toast.error('Failed to save FAQ content');
      } else {
        toast.success('FAQ content saved successfully');
        fetchContent(); // Refresh content
        if (showHistory) {
          fetchHistory(); // Refresh history if visible
        }
      }
    } catch (error) {
      console.error('Error saving FAQ content:', error);
      toast.error('Failed to save FAQ content');
    }
    setSaving(false);
  };

  const parseQA = (content) => {
    if (!content) return [];
    
    const qaItems = [];
    const lines = content.split('\n');
    let currentQ = '';
    let currentA = '';
    let isAnswer = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('Q:')) {
        // Save previous Q&A if exists
        if (currentQ && currentA) {
          qaItems.push({ question: currentQ, answer: currentA });
        }
        // Start new question
        currentQ = trimmedLine.substring(2).trim();
        currentA = '';
        isAnswer = false;
      } else if (trimmedLine.startsWith('A:')) {
        currentA = trimmedLine.substring(2).trim();
        isAnswer = true;
      } else if (trimmedLine && isAnswer) {
        currentA += ' ' + trimmedLine;
      } else if (trimmedLine && !isAnswer && currentQ) {
        currentQ += ' ' + trimmedLine;
      }
    }

    // Don't forget the last Q&A
    if (currentQ && currentA) {
      qaItems.push({ question: currentQ, answer: currentA });
    }

    return qaItems;
  };

  const qaItems = parseQA(content);

  const languageLabels = {
    [LANGUAGE_CODES.EN]: 'English',
    [LANGUAGE_CODES.RO]: 'Romanian',
    [LANGUAGE_CODES.FR]: 'French',
    [LANGUAGE_CODES.AR]: 'Arabic',
  };

  return (
    <Card className="page-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography variant="h4">FAQ Management</Typography>
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
            <strong>FAQ Format Guidelines:</strong><br />
            Each question should start with &quot;Q:&quot; followed by the question text.<br />
            Each answer should start with &quot;A:&quot; followed by the answer text.<br />
            Leave blank lines between Q&A pairs for better readability.<br />
            <br />
            <strong>Example:</strong><br />
            Q: Is my device eSIM compatible?<br />
            A: As more eSIM-compatible wearables, laptops, tablets, and smartphones are introduced...
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
                  <Typography variant="body2" sx={{ mt: 1, maxHeight: 100, overflow: 'auto' }}>
                    {item.content.substring(0, 200)}...
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setContent(item.content)}
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

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Editor Section */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Edit FAQ Content ({languageLabels[selectedLanguage]})
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TextField
              fullWidth
              multiline
              rows={20}
              variant="outlined"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter FAQ content in Q&A format..."
              sx={{ mb: 2 }}
            />
          )}

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || loading}
            sx={{ mr: 2 }}
          >
            {saving ? <CircularProgress size={20} /> : 'Save FAQ'}
          </Button>
        </Box>

        {/* Preview Section */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Preview
          </Typography>
          
          <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 2, maxHeight: 500, overflow: 'auto' }}>
            {qaItems.length > 0 ? (
              qaItems.map((item, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Q: {item.question}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, ml: 2 }}>
                    A: {item.answer}
                  </Typography>
                  {index < qaItems.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">
                No FAQ content to preview. Add some Q&A content in the editor.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default FAQPage;