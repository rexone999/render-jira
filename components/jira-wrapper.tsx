import { useEffect, useState, ReactNode } from 'react';

interface JiraWrapperProps {
  children: ReactNode;
}

interface JiraAPI {
  request: (options: { url: string; success: (data: string) => void; error: (error: any) => void }) => void;
}

export default function JiraWrapper({ children }: JiraWrapperProps) {
  const [jiraContext, setJiraContext] = useState<JiraAPI | null>(null);
  const [isInJira, setIsInJira] = useState(false);

  useEffect(() => {
    // Check if running inside Jira
    const urlParams = new URLSearchParams(window.location.search);
    const jwt = urlParams.get('jwt');
    
    if (jwt) {
      setIsInJira(true);
      // Load Atlassian Connect JavaScript API
      loadAtlassianConnectAPI().then(() => {
        // Initialize Jira context
        if (window.AP) {
          window.AP.require('jira', (jira: JiraAPI) => {
            setJiraContext(jira);
          });
          
          // Resize iframe to content
          window.AP.resize();
        }
      });
    }
  }, []);

  const loadAtlassianConnectAPI = () => {
    return new Promise<void>((resolve) => {
      if (window.AP) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://connect-cdn.atl-paas.net/all.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  };

  // Add Jira-specific styles when inside Jira
  useEffect(() => {
    if (isInJira) {
      document.body.style.margin = '0';
      document.body.style.padding = '20px';
      document.body.style.backgroundColor = '#f4f5f7';
    }
  }, [isInJira]);

  return (
    <div className={`app-container ${isInJira ? 'jira-context' : ''}`}>
      {children}
      {jiraContext && (
        <div className="jira-context-info">
          <p>Connected to Jira</p>
        </div>
      )}
    </div>
  );
} 