// In its own file to avoid circular dependencies
export const FILE_EDIT_TOOL_NAME = 'Edit'

// Permission pattern for granting session-level access to the project's .opensin/ folder
export const OPENSIN_FOLDER_PERMISSION_PATTERN = '/.opensin/**'

// Permission pattern for granting session-level access to the global ~/.opensin/ folder
export const GLOBAL_OPENSIN_FOLDER_PERMISSION_PATTERN = '~/.opensin/**'

export const FILE_UNEXPECTEDLY_MODIFIED_ERROR =
  'File has been unexpectedly modified. Read it again before attempting to write it.'
