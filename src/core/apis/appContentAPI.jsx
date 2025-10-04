import { api } from "./apiInstance";
import supabase from "./supabase";

// Content types enum - must match Supabase enum exactly
export const CONTENT_TYPES = {
  FAQ: 'faq',
  ABOUT_US: 'about_us',
  PRIVACY_POLICY: 'privacy_policy',
  TERMS_AND_CONDITIONS: 'terms_and_conditions',
  COOKIES_POLICY: 'cookies_policy'  
};

// Language codes enum
export const LANGUAGE_CODES = {
  EN: 'en',
  RO: 'ro',
  FR: 'fr',
  AR: 'ar'
};

// Get active content by type and language
export const getActiveContent = async (contentType, languageCode = 'en') => {
  return await api(() => 
    supabase.rpc('get_active_content', {
      p_content_type: contentType,
      p_language_code: languageCode
    })
  );
};

// Create new content version
export const createContentVersion = async (contentType, languageCode, content, title = null) => {
  // Debug logging to verify exact parameter values
  console.log('Creating content version with params:', {
    p_content_type: contentType,
    p_language_code: languageCode,
    p_content: typeof content === 'string' ? content.substring(0, 100) + '...' : content,
    p_title: title
  });
  
  return await api(() => 
    supabase.rpc('create_content_version', {
      p_content_type: contentType,
      p_language_code: languageCode,
      p_content: content,
      p_title: title
    })
  );
};

// Get content history for a specific type and language
export const getContentHistory = async (contentType, languageCode = 'en') => {
  return await api(() => 
    supabase
      .from('app_content')
      .select('id, content_type, language_code, version, title, content, is_active, created_at')
      .eq('content_type', contentType)
      .eq('language_code', languageCode)
      .order('version', { ascending: false })
  );
};

// Get all languages that have content for a specific type
export const getAvailableLanguages = async (contentType) => {
  return await api(() => 
    supabase
      .from('app_content')
      .select('language_code')
      .eq('content_type', contentType)
      .eq('is_active', true)
  );
};