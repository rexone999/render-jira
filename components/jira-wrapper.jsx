// components/JiraWrapper.jsx
import { useEffect, useState } from 'react';

export default function JiraWrapper({ children }) {
  const [jiraContext, setJiraContext] = useState(null);
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
          window.AP.require('jira', (jira) => {
            setJiraContext(jira);
          });
          
          // Resize iframe to content
          window.AP.resize();
        }
      });
    }
  }, []);

  const loadAtlassianConnectAPI = () => {
    return new Promise((resolve) => {
      if (window.AP) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://connect-cdn.atl-paas.net/all.js';
      script.onload = resolve;
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

// components/JiraIssuePanel.jsx - For issue panel integration
import { useEffect, useState } from 'react';

export default function JiraIssuePanel() {
  const [issueData, setIssueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.AP) {
      window.AP.require('jira', (jira) => {
        const urlParams = new URLSearchParams(window.location.search);
        const issueKey = urlParams.get('issueKey');
        
        if (issueKey) {
          // Fetch issue data using Jira REST API
          jira.request({
            url: `/rest/api/3/issue/${issueKey}`,
            success: (data) => {
              setIssueData(JSON.parse(data));
              setLoading(false);
            },
            error: (error) => {
              console.error('Failed to fetch issue:', error);
              setLoading(false);
            }
          });
        }
      });
    }
  }, []);

  if (loading) {
    return <div>Loading issue data...</div>;
  }

  if (!issueData) {
    return <div>No issue data available</div>;
  }

  return (
    <div className="jira-issue-panel">
      <h3>PO Assistant</h3>
      <div className="issue-info">
        <h4>{issueData.fields.summary}</h4>
        <p><strong>Status:</strong> {issueData.fields.status.name}</p>
        <p><strong>Type:</strong> {issueData.fields.issuetype.name}</p>
        <p><strong>Priority:</strong> {issueData.fields.priority?.name || 'None'}</p>
      </div>
      
      {/* Your PO Assist functionality here */}
      <div className="po-assist-actions">
        <button onClick={() => analyzeIssue(issueData)}>
          Analyze Story
        </button>
        <button onClick={() => suggestAcceptanceCriteria(issueData)}>
          Suggest Acceptance Criteria
        </button>
      </div>
    </div>
  );
}

function analyzeIssue(issue) {
  // Your existing PO analysis logic
  console.log('Analyzing issue:', issue.key);
}

function suggestAcceptanceCriteria(issue) {
  // Your existing AC suggestion logic
  console.log('Suggesting AC for:', issue.key);
}
