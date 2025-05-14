# ADMIN OPEN SOURCE PROJECT

# INTRO

This project uses Supabase as the backend.

# BACKEND CALLS

To streamline token management and error handling, we created a centralized apiInstance for all Supabase interactions. The Supabase URL and API key are managed securely via environment variables.

# STYLING

For styling, we use Tailwind CSS V4 (Without tailwind.config.js) along with Material UI (MUI) to manage the theme colors consistently across the application.

# QUERIES

Some database operations and constraints are implemented using RPC (remote procedure calls). This approach is necessary because Supabase does not support client-side transaction rollbacks. To address this, we’ve written SQL scripts in the Supabase SQL Editor to handle rollbacks for most queries. However, Supabase Storage currently does not support transactional rollbacks, so we handle any necessary cleanup manually when required.
