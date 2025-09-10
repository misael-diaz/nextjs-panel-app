// Utility to send client-side logs to server
export const serverLog = async (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        level,
        timestamp: new Date().toISOString()
      })
    })
  } catch (error) {
    // Fallback to console if server logging fails
    console.error('Failed to send log to server:', error)
  }
}
